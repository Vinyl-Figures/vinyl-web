// O carrinho da API não tem quantidade: cada disco aparece uma vez só.

import { ROTAS, METODOS_PAGAMENTO } from '../config.js';
import { carrinho, pedidos, pagamentos } from '../model/store.js';
import { linhaCarrinho, preencher } from '../view/templates.js';
import {
  alertar,
  avisar,
  confirmar,
  escolher,
  formatarBRL,
  mostrarErro,
  alternar,
  ocupado,
  travarBotao,
} from '../view/ui.js';
import { exigirLogin } from './app.js';

// --- Elementos ---

const tabela = document.querySelector('main table');
const corpo = tabela?.tBodies[0];
const formCarrinho = tabela?.closest('form');
const totalRodape = tabela?.tFoot?.querySelector('td');

function secaoPorTitulo(inicio) {
  return [...document.querySelectorAll('main section')].find((secao) =>
    secao.querySelector('h2')?.textContent.trim().startsWith(inicio)
  );
}

const secaoVazia = secaoPorTitulo('Carrinho vazio');
const secaoResumo = secaoPorTitulo('Resumo');
const secaoCupom = secaoPorTitulo('Cupom');
const secaoFrete = secaoPorTitulo('Frete');

const botaoFinalizar = formCarrinho?.querySelector('button[type="submit"]');

let itens = [];

// --- Cupom e frete ---
// Não existem na API: os campos ficam desligados com o motivo à vista.

function desligarSecaoSemApi(secao, motivo) {
  if (!secao) return;

  for (const campo of secao.querySelectorAll('input, button, select')) {
    campo.disabled = true;
  }

  const aviso = document.createElement('p');
  aviso.textContent = motivo;
  secao.append(aviso);
}

desligarSecaoSemApi(secaoCupom, 'Indisponível: a API ainda não tem cupom de desconto.');
desligarSecaoSemApi(secaoFrete, 'Indisponível: a API ainda não calcula frete.');

// --- Carregamento ---

async function carregar() {
  ocupado(tabela, true);

  try {
    itens = await carrinho.listar();
    renderizar();
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    ocupado(tabela, false);
  }
}

function totalDoCarrinho() {
  return itens.reduce((soma, item) => soma + Number(item.vinyl?.price || 0), 0);
}

function renderizar() {
  if (corpo) preencher(corpo, itens.map(linhaCarrinho));

  const total = totalDoCarrinho();
  if (totalRodape) totalRodape.textContent = formatarBRL(total);

  // Sem API de frete, o frete é zero e o total é o subtotal.
  const valores = secaoResumo?.querySelectorAll('dd');
  if (valores?.length >= 3) {
    valores[0].textContent = formatarBRL(total);
    valores[1].textContent = formatarBRL(0);
    valores[2].textContent = formatarBRL(total);
  }

  const temItens = itens.length > 0;
  alternar(formCarrinho, temItens);
  alternar(secaoVazia, !temItens);
}

// --- Remover item ---

corpo?.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-acao="remover-item"]');
  if (!botao) return;

  travarBotao(botao, true, 'Removendo…');

  try {
    await carrinho.remover(Number(botao.dataset.vinilId));
    await carregar();
    avisar('Item removido do carrinho.');
  } catch (erro) {
    travarBotao(botao, false);
    mostrarErro(erro);
  }
});

// --- Checkout ---

function nomeDoMetodo(valor) {
  const nomes = {
    DEBITO: 'Cartão de débito',
    CREDITO: 'Cartão de crédito',
    PIX: 'PIX',
    BOLETO: 'Boleto bancário',
    TED: 'TED',
  };
  return nomes[valor] || valor;
}

formCarrinho?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  if (itens.length === 0) return;

  const total = totalDoCarrinho();

  // Perguntado antes do pedido: se fosse depois e o usuário desistisse,
  // sobraria um pedido criado sem pagamento.
  const metodo = await escolher({
    titulo: 'Finalizar compra',
    mensagem: `Total: ${formatarBRL(total)}`,
    rotuloCampo: 'Forma de pagamento',
    opcoes: METODOS_PAGAMENTO.map((valor) => ({ valor, rotulo: nomeDoMetodo(valor) })),
  });

  if (!metodo) return;

  travarBotao(botaoFinalizar, true, 'Finalizando…');

  try {
    const pedido = await pedidos.finalizar();

    await pagamentos.criar({
      orderId: pedido.id,
      value: pedido.totalPrice,
      paymentMethod: metodo,
      status: 'PENDENTE',
    });

    await alertar({
      titulo: 'Pedido realizado com sucesso',
      mensagem: [
        `Pedido #${String(pedido.id).padStart(6, '0')}`,
        `Total: ${formatarBRL(pedido.totalPrice)}`,
        `Pagamento em ${nomeDoMetodo(metodo)}, aguardando confirmação.`,
      ],
    });

    location.href = ROTAS.conta;
  } catch (erro) {
    travarBotao(botaoFinalizar, false);
    mostrarErro(erro);
    // O pedido pode ter sido criado mesmo com o pagamento falhando.
    carregar();
  }
});

// --- Esvaziar carrinho ---

document.querySelector('[data-acao="esvaziar-carrinho"]')?.addEventListener('click', async () => {
  const confirmado = await confirmar({
    titulo: 'Esvaziar o carrinho?',
    mensagem: 'Todos os discos serão removidos.',
    textoConfirmar: 'Esvaziar',
  });
  if (!confirmado) return;

  try {
    await carrinho.esvaziar();
    await carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
});

if (exigirLogin()) carregar();
