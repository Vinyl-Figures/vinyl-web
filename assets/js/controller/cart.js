import { ROTAS, METODOS_PAGAMENTO } from '../config.js';
import { carrinho, cupons, enderecos, pedidos, pagamentos } from '../model/store.js';
import { getUserId } from '../model/session.js';
import { linhaCarrinho, preencher } from '../view/templates.js';
import {
  alertar,
  avisar,
  confirmar,
  escolher,
  pedirCampos,
  formatarBRL,
  mostrarErro,
  alternar,
  ocupado,
  travarBotao,
} from '../view/ui.js';
import { apenasDigitos, mascararCep } from '../view/mascaras.js';
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
const secaoFrete = secaoPorTitulo('Frete');

const campoCupom = document.querySelector('#cupom');
const campoEnderecoSalvo = document.querySelector('#endereco-salvo');

const botaoFinalizar = formCarrinho?.querySelector('button[type="submit"]');

let itens = [];
let cupomAplicado = null; // { code, discountPercent }
let freteCalculado = null; // { zipCode, distanceKm, price }

// Estes são os mesmos valores padrão da API. A conta e a consulta de CEP
// acontecem no navegador; o checkout continua recalculando no servidor como
// validação do valor final.
const CEP_ORIGEM = '04285000';
const PRECO_BASE_FRETE = 10;
const PRECO_POR_KM = 2.5;
const RAIO_TERRA_KM = 6371;
const coordenadasPorCep = new Map();

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
  if (totalRodape) {
    totalRodape.dataset.numero = '';
    totalRodape.textContent = formatarBRL(total);
  }

  const subtotal = subtotalDoCarrinho();
  const valorFrete = freteCalculado?.price || 0;
  const valorDesconto = (subtotal + valorFrete) - total;

  const valores = secaoResumo?.querySelectorAll('dd');
  if (valores?.length >= 4) {
    valores.forEach((valor) => { valor.dataset.numero = ''; });
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
    // carregar() reconstrói a tabela inteira — o input que tinha foco não
    // existe mais; sem isso, quem navega por teclado cai fora da tabela.
    corpo.querySelector(`[data-acao="atualizar-quantidade"][data-vinil-id="${vinylId}"]`)?.focus();
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

function arredondar(valor, casas) {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

function distanciaEmKm(origem, destino) {
  const paraRadianos = (graus) => (graus * Math.PI) / 180;
  const diferencaLatitude = paraRadianos(destino.latitude - origem.latitude);
  const diferencaLongitude = paraRadianos(destino.longitude - origem.longitude);

  const a = Math.sin(diferencaLatitude / 2) ** 2
    + Math.cos(paraRadianos(origem.latitude))
      * Math.cos(paraRadianos(destino.latitude))
      * Math.sin(diferencaLongitude / 2) ** 2;

  return RAIO_TERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function coordenadasDoCep(cep) {
  const emCache = coordenadasPorCep.get(cep);
  if (emCache) return emCache;

  const resposta = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
  if (!resposta.ok) throw new Error('CEP não encontrado.');

  const dados = await resposta.json();
  const latitude = Number(dados?.location?.coordinates?.latitude);
  const longitude = Number(dados?.location?.coordinates?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Este CEP não possui coordenadas disponíveis.');
  }

  const coordenadas = { latitude, longitude };
  coordenadasPorCep.set(cep, coordenadas);
  return coordenadas;
}

async function calcularFreteNoNavegador(cep) {
  const [origem, destino] = await Promise.all([
    coordenadasDoCep(CEP_ORIGEM),
    coordenadasDoCep(cep),
  ]);

  const distanceKm = arredondar(distanciaEmKm(origem, destino), 1);
  const price = arredondar(PRECO_BASE_FRETE + PRECO_POR_KM * distanceKm, 2);
  return { zipCode: cep, distanceKm, price };
}

async function carregarEnderecosSalvos() {
  if (!campoEnderecoSalvo) return;

  const opcaoPadrao = campoEnderecoSalvo.querySelector('option');
  // Reseta pro só-placeholder antes de recarregar — a função é chamada de
  // novo depois de cadastrar um endereço, senão as opções duplicariam.
  campoEnderecoSalvo.replaceChildren(opcaoPadrao);

  try {
    const lista = await enderecos.listar(getUserId());

    if (lista.length === 0) {
      opcaoPadrao.textContent = 'Nenhum endereço registrado, registre um.';
      return;
    }

    opcaoPadrao.textContent = 'Selecione um endereço';
    const opcoes = lista.map((endereco) => {
      const opcao = document.createElement('option');
      opcao.value = endereco.zipCode;
      opcao.textContent = `Nº ${endereco.number} — ${mascararCep(endereco.zipCode)}`;
      return opcao;
    });
    campoEnderecoSalvo.append(...opcoes);
  } catch {
    opcaoPadrao.textContent = 'Nenhum endereço registrado, registre um.';
  }
}

// Modal de cadastro em vez de mandar pra tela de conta — quem tá no
// checkout não perde o carrinho pra ir cadastrar endereço em outra página.
document.querySelector('[data-acao="cadastrar-endereco"]')?.addEventListener('click', async () => {
  const valores = await pedirCampos({
    titulo: 'Cadastrar endereço',
    campos: [
      { id: 'numero', rotulo: 'Número', obrigatorio: true, maxlength: 12 },
      { id: 'complemento', rotulo: 'Complemento' },
      { id: 'cep', rotulo: 'CEP', obrigatorio: true, inputmode: 'numeric', maxlength: 9, mascara: mascararCep },
    ],
    textoConfirmar: 'Salvar',
  });

  if (!valores) return;

  try {
    await enderecos.criar(getUserId(), {
      number: valores.numero,
      complement: valores.complemento,
      zipCode: apenasDigitos(valores.cep),
    });
    avisar('Endereço cadastrado.');
    await carregarEnderecosSalvos();
  } catch (erro) {
    mostrarErro(erro);
  }
});

async function calcularFreteComCep(cep) {
  if (!cep || cep.length !== 8) return;

  if (campoEnderecoSalvo) campoEnderecoSalvo.disabled = true;
  ocupado(secaoFrete, true, 'Calculando frete…');

  try {
    freteCalculado = await calcularFreteNoNavegador(cep);
    renderizar();
    avisar('Frete calculado.');
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    if (campoEnderecoSalvo) campoEnderecoSalvo.disabled = false;
    ocupado(secaoFrete, false);
  }
}

// Selecionar o endereço já calcula o frete na hora — não tem mais campo de
// CEP solto, o endereço vem só da lista (ou do cadastro pelo modal).
campoEnderecoSalvo?.addEventListener('change', () => {
  calcularFreteComCep(campoEnderecoSalvo.value);
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

if (exigirLogin()) {
  carregar();
  carregarEnderecosSalvos();
}
