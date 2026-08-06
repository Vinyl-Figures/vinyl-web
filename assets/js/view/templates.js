// Sempre createElement + textContent, nunca innerHTML: o conteúdo vem do servidor.

import { IMAGEM_PLACEHOLDER } from '../config.js';
import { formatarBRL, formatarData } from './ui.js';

function criar(tag, texto) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// imageUrl guarda o PNG em base64, sem o prefixo data:, mas também
// aceita URL ou caminho.
export function fonteDaImagem(valor) {
  const bruto = String(valor || '').trim();
  if (!bruto) return IMAGEM_PLACEHOLDER;

  if (/^data:image\//i.test(bruto)) return bruto;
  if (/^https?:\/\//i.test(bruto)) return bruto;

  const semEspacos = bruto.replace(/\s/g, '');
  const pareceBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(semEspacos) && semEspacos.length > 100;

  // Todo PNG em base64 começa com iVBORw0KGgo.
  if (semEspacos.startsWith('iVBORw0KGgo') || pareceBase64) {
    return `data:image/png;base64,${semEspacos}`;
  }

  if (bruto.includes('/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(bruto)) return bruto;

  return IMAGEM_PLACEHOLDER;
}

// <li><article><img><h3><p><button>, igual ao catalogo.html
export function cardVinil(vinil) {
  const item = criar('li');
  const artigo = criar('article');
  artigo.dataset.vinilId = vinil.id;

  const imagem = criar('img');
  imagem.src = fonteDaImagem(vinil.imageUrl);
  imagem.alt = `Capa do álbum ${vinil.title}`;
  imagem.loading = 'lazy';
  // once evita laço se o próprio placeholder falhar
  imagem.addEventListener('error', () => { imagem.src = IMAGEM_PLACEHOLDER; }, { once: true });
  artigo.append(imagem);

  artigo.append(criar('h3', vinil.title));
  artigo.append(criar('p', formatarBRL(vinil.price)));

  if (vinil.description) artigo.append(criar('p', vinil.description));

  const botao = criar('button', 'Adicionar ao carrinho');
  botao.type = 'button';
  botao.dataset.acao = 'adicionar-carrinho';
  botao.dataset.vinilId = vinil.id;
  artigo.append(botao);

  item.append(artigo);
  return item;
}

// Sem quantidade nem subtotal: cada vinil aparece uma vez só.
export function linhaCarrinho(item) {
  const vinil = item.vinyl || {};
  const linha = criar('tr');
  linha.dataset.vinilId = item.vinylId;

  const produto = criar('th');
  produto.scope = 'row';
  produto.append(criar('span', vinil.title || `Vinil ${item.vinylId}`));

  const preco = criar('td', formatarBRL(vinil.price));

  const acao = criar('td');
  const remover = criar('button', 'Remover');
  remover.type = 'button';
  remover.dataset.acao = 'remover-item';
  remover.dataset.vinilId = item.vinylId;
  acao.append(remover);

  linha.append(produto, preco, acao);
  return linha;
}

// OrderResp não tem status: ele vem do pagamento associado.
export function linhaPedido(pedido, statusPagamento = '—') {
  const linha = criar('tr');
  linha.dataset.pedidoId = pedido.id;

  const identificador = criar('th', `#${String(pedido.id).padStart(6, '0')}`);
  identificador.scope = 'row';

  linha.append(
    identificador,
    criar('td', formatarData(pedido.createdAt)),
    criar('td', statusPagamento),
    criar('td', formatarBRL(pedido.totalPrice))
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
