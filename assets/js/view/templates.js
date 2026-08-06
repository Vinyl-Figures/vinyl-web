// Monta os pedaços de HTML repetidos, seguindo a mesma estrutura
// que já existe nas páginas para o CSS continuar valendo.
//
// Tudo é criado com createElement e textContent (nunca innerHTML),
// porque título, descrição e nome de artista vêm do servidor.

import { formatarBRL, formatarData } from './ui.js';

function criar(tag, texto) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// Card do catálogo. Mesma estrutura do catalogo.html:
// <li><article><img><h3><p><button>
export function cardVinil(vinil) {
  const item = criar('li');
  const artigo = criar('article');
  artigo.dataset.vinilId = vinil.id;

  // imageUrl é opcional na API; sem ele não adianta gerar uma <img> quebrada.
  if (vinil.imageUrl) {
    const imagem = criar('img');
    imagem.src = vinil.imageUrl;
    imagem.alt = `Capa do álbum ${vinil.title}`;
    imagem.loading = 'lazy';
    artigo.append(imagem);
  }

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

// Linha da tabela do carrinho.
// Sem coluna de quantidade nem subtotal: a API não guarda quantidade,
// então cada vinil aparece uma vez só.
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

// Linha do histórico de pedidos em conta.html.
// OrderResp não tem status; ele vem do pagamento associado, quando existe.
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

// Item da lista de endereços.
// A API guarda só número, complemento e CEP.
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

// A API guarda o CEP com 8 dígitos, sem traço.
export function formatarCep(cep) {
  const digitos = String(cep || '').replace(/\D/g, '');
  return digitos.length === 8 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

// Troca todo o conteúdo de um container pela lista de elementos.
export function preencher(container, elementos) {
  if (!container) return;
  container.replaceChildren(...elementos);
}
