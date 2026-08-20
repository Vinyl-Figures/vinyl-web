// Sempre createElement + textContent, nunca innerHTML: o conteúdo vem do servidor.

import { formatarBRL, formatarData } from './ui.js';
import { ROTAS } from '../config.js';

const LIMITE_RESUMO_DESCRICAO = 140;

function criar(tag, texto) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function criarNumero(tag, texto) {
  const elemento = criar(tag, texto);
  elemento.dataset.numero = '';
  return elemento;
}

function resumirDescricao(descricao) {
  const texto = String(descricao || '').trim();
  if (texto.length <= LIMITE_RESUMO_DESCRICAO) return texto;

  const trecho = texto.slice(0, LIMITE_RESUMO_DESCRICAO);
  const ultimoEspaco = trecho.lastIndexOf(' ');
  return `${ultimoEspaco > 0 ? trecho.slice(0, ultimoEspaco) : trecho}...`;
}

// imageUrl guarda base64 puro, sem o prefixo data: — mas às vezes já vem
// com o prefixo completo, daí é só usar direto. A API real manda JPEG,
// mas o dataload local usa PNG (assinatura diferente) — em vez de fixar
// um MIME e torcer pro navegador ignorar (data: URI não tem sniffing
// garantido como recurso buscado por HTTP), lê os primeiros bytes.
function mimeDoBase64(base64) {
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('R0lGOD')) return 'image/gif';
  if (base64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

export function fonteDaImagem(valor) {
  const base64 = String(valor || '').trim();
  if (!base64) return null;
  if (base64.startsWith('data:image/')) return base64;
  return `data:${mimeDoBase64(base64)};base64,${base64}`;
}

// <li><article><img?><h3><p><button>, igual ao catalogo.html
export function cardVinil(vinil) {
  const item = criar('li');
  const artigo = criar('article');
  artigo.dataset.vinilId = vinil.id;

  // A área informativa leva ao detalhe. Os controles ficam fora do link
  // para não misturar navegação com quantidade e compra.
  const link = criar('a');
  link.href = `${ROTAS.disco}?id=${vinil.id}`;

  const src = fonteDaImagem(vinil.imageUrl);
  if (src) {
    const imagem = criar('img');
    imagem.src = src;
    imagem.alt = `Capa do álbum ${vinil.title}`;
    imagem.loading = 'lazy';
    imagem.addEventListener('error', () => imagem.remove(), { once: true });
    link.append(imagem);
  }

  link.append(criar('h3', vinil.title));
  link.append(criarNumero('p', formatarBRL(vinil.price)));

  if (vinil.description) link.append(criar('p', resumirDescricao(vinil.description)));

  artigo.append(link);

  // Stepper (−/input/+) e "Adicionar ao carrinho" lado a lado. O input
  // não tem <label> visível (cada card já mostra o título; um rótulo por
  // card no grid ficaria repetitivo) — leva aria-label direto.
  const linha = document.createElement('div');
  linha.className = 'linha-acao-catalogo';

  const stepper = document.createElement('div');
  stepper.className = 'stepper-qtd';

  const menos = criar('button', '−');
  menos.type = 'button';
  menos.dataset.acao = 'qtd-catalogo-menos';
  menos.dataset.vinilId = vinil.id;
  menos.setAttribute('aria-label', `Diminuir quantidade de ${vinil.title}`);

  const qtdInput = document.createElement('input');
  qtdInput.type = 'number';
  qtdInput.min = '1';
  qtdInput.value = '1';
  qtdInput.dataset.qtdVinil = vinil.id;
  qtdInput.dataset.numero = '';
  qtdInput.setAttribute('aria-label', `Quantidade de ${vinil.title}`);

  const mais = criar('button', '+');
  mais.type = 'button';
  mais.dataset.acao = 'qtd-catalogo-mais';
  mais.dataset.vinilId = vinil.id;
  mais.setAttribute('aria-label', `Aumentar quantidade de ${vinil.title}`);

  stepper.append(menos, qtdInput, mais);

  const botao = criar('button', 'Adicionar ao carrinho');
  botao.type = 'button';
  botao.dataset.acao = 'adicionar-carrinho';
  botao.dataset.vinilId = vinil.id;

  linha.append(stepper, botao);
  artigo.append(linha);

  item.append(artigo);
  return item;
}

// Aumentar quantidade soma no backend (POST repetido); diminuir não tem
// endpoint — só remover a linha inteira. Por isso o input tem min = atual.
export function linhaCarrinho(item) {
  const vinil = item.vinyl || {};
  const quantidade = item.quantity || 1;
  const linha = criar('tr');
  linha.dataset.vinilId = item.vinylId;

  const produto = criar('th');
  produto.scope = 'row';
  produto.append(criar('span', vinil.title || `Vinil ${item.vinylId}`));

  const preco = criarNumero('td', formatarBRL(vinil.price));

  const qtdId = `qtd-${item.vinylId}`;
  const qtdCelula = criar('td');
  const qtdRotulo = criar('label', `Quantidade de ${vinil.title || `vinil ${item.vinylId}`}`);
  qtdRotulo.htmlFor = qtdId;
  const qtdInput = document.createElement('input');
  qtdInput.type = 'number';
  qtdInput.id = qtdId;
  qtdInput.min = '1';
  qtdInput.value = String(quantidade);
  qtdInput.dataset.acao = 'atualizar-quantidade';
  qtdInput.dataset.numero = '';
  qtdInput.dataset.vinilId = item.vinylId;
  qtdInput.dataset.qtdAtual = String(quantidade);
  qtdCelula.append(qtdRotulo, qtdInput);

  const subtotal = criarNumero('td', formatarBRL(Number(vinil.price || 0) * quantidade));

  const acao = criar('td');
  const remover = criar('button', 'Remover');
  remover.type = 'button';
  remover.dataset.acao = 'remover-item';
  remover.dataset.vinilId = item.vinylId;
  acao.append(remover);

  linha.append(produto, preco, qtdCelula, subtotal, acao);
  return linha;
}

// OrderResp não tem status: ele vem do pagamento associado.
export function linhaPedido(pedido, statusPagamento = '—') {
  const linha = criar('tr');
  linha.dataset.pedidoId = pedido.id;

  const identificador = criarNumero('th', `#${String(pedido.id).padStart(6, '0')}`);
  identificador.scope = 'row';

  linha.append(
    identificador,
    criarNumero('td', formatarData(pedido.createdAt)),
    criar('td', statusPagamento),
    criarNumero('td', formatarBRL(pedido.shippingPrice || 0)),
    criarNumero('td', formatarBRL(pedido.totalPrice))
  );
  return linha;
}

export function itemEndereco(endereco) {
  const item = criar('li');
  item.dataset.enderecoId = endereco.id;

  const bloco = criar('address');
  bloco.append(document.createTextNode(`Nº ${endereco.number}`));
  if (endereco.complement) {
    bloco.append(criar('br'), document.createTextNode(endereco.complement));
  }
  bloco.append(criar('br'), document.createTextNode(formatarCep(endereco.zipCode)));

  const remover = criar('button', 'Remover');
  remover.type = 'button';
  remover.dataset.acao = 'remover-endereco';
  remover.dataset.enderecoId = endereco.id;

  item.append(bloco, remover);
  return item;
}

export function formatarCep(cep) {
  const digitos = String(cep || '').replace(/\D/g, '');
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

export function preencher(container, elementos) {
  if (!container) return;
  container.replaceChildren(...elementos);
}
