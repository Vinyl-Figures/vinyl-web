import { vinis, carrinho } from '../model/store.js';
import { fonteDaImagem } from '../view/templates.js';
import { avisar, mostrarErro, alternar, ocupado, travarBotao, formatarBRL } from '../view/ui.js';
import { exigirLogin } from './app.js';

const artigo = document.querySelector('main > article');
const secaoNaoEncontrado = [...document.querySelectorAll('main section')].find((secao) =>
  secao.querySelector('h2')?.textContent.trim() === 'Disco não encontrado'
);

const crumbAtual = document.querySelector('main > nav[aria-label="Você está aqui"] ol li[aria-current="page"]');
const titulo = artigo?.querySelector('h1');
const capa = artigo?.querySelector('.disco-capa');
const elArtistas = artigo?.querySelector('.disco-artistas');
const elPreco = artigo?.querySelector('.disco-preco');
const elGeneros = artigo?.querySelector('.disco-generos');
const elDescricao = artigo?.querySelector('.disco-descricao');
const elLancamento = artigo?.querySelector('.disco-lancamento');

const campoQtd = document.querySelector('#qtd-disco');
const botaoAdicionar = document.querySelector('[data-acao="adicionar-carrinho-disco"]');

const id = new URLSearchParams(location.search).get('id');

function mostrarNaoEncontrado() {
  alternar(artigo, false);
  alternar(secaoNaoEncontrado, true);
}

function renderizar(vinil) {
  document.title = `${vinil.title} | Vinyl Figures Store`;
  if (crumbAtual) crumbAtual.textContent = vinil.title;
  if (titulo) titulo.textContent = vinil.title;

  const src = fonteDaImagem(vinil.imageUrl);
  if (capa) {
    capa.replaceChildren();
    if (src) {
      const imagem = document.createElement('img');
      imagem.src = src;
      imagem.alt = `Capa do álbum ${vinil.title}`;
      imagem.addEventListener('error', () => imagem.remove(), { once: true });
      capa.append(imagem);
    }
  }

  if (elArtistas) {
    const nomes = (vinil.artists || []).map((artista) => artista.name).join(', ');
    elArtistas.textContent = nomes || 'Artista não informado';
  }

  if (elPreco) {
    elPreco.dataset.numero = '';
    elPreco.textContent = formatarBRL(vinil.price);
  }

  if (elGeneros) {
    elGeneros.replaceChildren(
      ...(vinil.genres || []).map((genero) => {
        const item = document.createElement('li');
        item.textContent = genero.name;
        return item;
      })
    );
  }

  if (elDescricao) elDescricao.textContent = vinil.description || 'Sem descrição.';
  if (elLancamento) {
    elLancamento.replaceChildren();
    if (vinil.releasedAt) {
      const ano = document.createElement('span');
      ano.dataset.numero = '';
      ano.textContent = vinil.releasedAt;
      elLancamento.append('Lançado em ', ano);
    }
  }

  if (botaoAdicionar) botaoAdicionar.dataset.vinilId = vinil.id;
}

async function carregar() {
  if (!id) {
    mostrarNaoEncontrado();
    return;
  }

  ocupado(artigo, true);

  try {
    const vinil = await vinis.buscar(id, 'genres,artists');
    renderizar(vinil);
  } catch {
    mostrarNaoEncontrado();
  } finally {
    ocupado(artigo, false);
  }
}

// Mesma lógica local-only do stepper no card do catálogo — a quantidade
// só é enviada quando "Adicionar ao carrinho" é clicado.
document.querySelector('.linha-acao-catalogo')?.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-acao="qtd-disco-menos"], [data-acao="qtd-disco-mais"]');
  if (!botao || !campoQtd) return;

  const atual = Number(campoQtd.value) || 1;
  const diferenca = botao.dataset.acao === 'qtd-disco-mais' ? 1 : -1;
  campoQtd.value = String(Math.max(1, atual + diferenca));
});

botaoAdicionar?.addEventListener('click', async () => {
  const vinylId = Number(botaoAdicionar.dataset.vinilId);
  if (!vinylId) return;

  const quantidade = Math.max(1, Number(campoQtd?.value) || 1);

  travarBotao(botaoAdicionar, true, 'Adicionando…');

  try {
    await carrinho.adicionar(Array(quantidade).fill(vinylId));
    avisar(quantidade > 1 ? `${quantidade} unidades adicionadas ao carrinho.` : 'Adicionado ao carrinho.');
    if (campoQtd) campoQtd.value = '1';
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    travarBotao(botaoAdicionar, false);
  }
});

if (exigirLogin()) carregar();
