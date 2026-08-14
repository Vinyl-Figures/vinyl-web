import { ROTAS, METODOS_PAGAMENTO } from '../config.js';
import { carrinho, cupons, frete, pedidos, pagamentos } from '../model/store.js';
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
import { aplicarMascara, mascararCep } from '../view/mascaras.js';
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

const campoCupom = document.querySelector('#cupom');
const campoCep = document.querySelector('#cep');
aplicarMascara(campoCep, mascararCep);

const botaoFinalizar = formCarrinho?.querySelector('button[type="submit"]');

let itens = [];
let cupomAplicado = null; // { code, discountPercent }
let freteCalculado = null; // { zipCode, distanceKm, price }

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

function subtotalDoCarrinho() {
  return itens.reduce((soma, item) => soma + Number(item.vinyl?.price || 0) * (item.quantity || 1), 0);
}

// Mesma fórmula do OrderService.checkout no backend: (subtotal + frete)
// com desconto percentual aplicado por cima. Se divergir daqui, o resumo
// mostra um total que o checkout não vai cobrar.
function totalDoCarrinho() {
  const subtotal = subtotalDoCarrinho();
  const valorFrete = freteCalculado?.price || 0;
  const desconto = cupomAplicado?.discountPercent || 0;
  const bruto = subtotal + valorFrete;
  return bruto * (1 - desconto / 100);
}

function renderizar() {
  if (corpo) preencher(corpo, itens.map(linhaCarrinho));

  const total = totalDoCarrinho();
  if (totalRodape) totalRodape.textContent = formatarBRL(total);

  const subtotal = subtotalDoCarrinho();
  const valorFrete = freteCalculado?.price || 0;
  const valorDesconto = (subtotal + valorFrete) - total;

  const valores = secaoResumo?.querySelectorAll('dd');
  if (valores?.length >= 4) {
    valores[0].textContent = formatarBRL(subtotal);
    valores[1].textContent = formatarBRL(valorFrete);
    valores[2].textContent = formatarBRL(valorDesconto);
    valores[3].textContent = formatarBRL(total);
  }

  const temItens = itens.length > 0;
  alternar(formCarrinho, temItens);
  alternar(secaoVazia, !temItens);
}

// --- Quantidade ---

corpo?.addEventListener('change', async (evento) => {
  const input = evento.target.closest('[data-acao="atualizar-quantidade"]');
  if (!input) return;

  const vinylId = Number(input.dataset.vinilId);
  const atual = Number(input.dataset.qtdAtual);
  const nova = Number(input.value);

  if (!Number.isInteger(nova) || nova <= 0 || nova === atual) {
    input.value = String(atual);
    return;
  }

  input.disabled = true;

  try {
    await carrinho.atualizar(vinylId, nova);
    await carregar();
    avisar('Quantidade atualizada.');
  } catch (erro) {
    input.value = String(atual);
    input.disabled = false;
    mostrarErro(erro);
  }
});

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

// --- Cupom ---

document.querySelector('[data-acao="aplicar-cupom"]')?.addEventListener('click', async (evento) => {
  const botao = evento.target;
  const codigo = campoCupom?.value.trim();
  if (!codigo) return;

  travarBotao(botao, true, 'Aplicando…');

  try {
    const cupom = await cupons.buscar(codigo);
    cupomAplicado = { code: cupom.code, discountPercent: Number(cupom.discountPercent) };
    renderizar();
    avisar(`Cupom ${cupom.code} aplicado.`);
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    travarBotao(botao, false);
  }
});

// --- Frete ---

document.querySelector('[data-acao="calcular-frete"]')?.addEventListener('click', async (evento) => {
  const botao = evento.target;
  const cep = campoCep?.value.replace(/\D/g, '');
  if (!cep || cep.length !== 8) {
    avisar('O CEP precisa ter 8 dígitos.', 'erro');
    return;
  }

  travarBotao(botao, true, 'Calculando…');

  try {
    const resultado = await frete.calcular(cep);
    freteCalculado = { zipCode: cep, distanceKm: resultado.distanceKm, price: Number(resultado.price) };
    renderizar();
    avisar('Frete calculado.');
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    travarBotao(botao, false);
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
    const pedido = await pedidos.finalizar({
      zipCode: freteCalculado?.zipCode,
      couponCode: cupomAplicado?.code,
    });

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

    location.href = ROTAS.catalogo;
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
    cupomAplicado = null;
    freteCalculado = null;
    await carregar();
  } catch (erro) {
    mostrarErro(erro);
  }
});

if (exigirLogin()) carregar();
