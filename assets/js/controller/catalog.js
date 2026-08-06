// Catálogo.
//
// A API só filtra por genreId ou artistId. Busca por texto, faixa de preço,
// ordenação e paginação não existem no servidor e são feitas aqui, em cima
// da lista já carregada.

import { vinis, generos, carrinho } from '../model/store.js';
import { cardVinil, preencher } from '../view/templates.js';
import { avisar, mostrarErro, alternar, ocupado, travarBotao } from '../view/ui.js';
import { exigirLogin } from './app.js';

const POR_PAGINA = 8;

// --- Elementos da página ---
// Encontrados pela estrutura que já existe, sem precisar editar o HTML.

const listaProdutos = [...document.querySelectorAll('main ul')].find((ul) =>
  ul.querySelector('li > article')
);

const secaoResultados = listaProdutos?.closest('section');
const contador = secaoResultados?.querySelector('p');
const navPaginacao = document.querySelector('nav[aria-label="Paginação"]');

const secaoVazia = [...document.querySelectorAll('main section')].find((secao) =>
  secao.querySelector('h2')?.textContent.trim().startsWith('Nenhum disco')
);

const formBusca = document.querySelector('form[role="search"]');
const campoBusca = document.querySelector('#busca');
const formFiltros = document.querySelector('#ordenar')?.form;
const campoOrdenar = document.querySelector('#ordenar');
const campoPrecoMin = document.querySelector('#preco-min');
const campoPrecoMax = document.querySelector('#preco-max');

const fieldsetGenero = [...document.querySelectorAll('fieldset')].find(
  (f) => f.querySelector('legend')?.textContent.trim() === 'Gênero'
);

// --- Estado ---

let carregados = [];
let visiveis = [];
let pagina = 1;

// --- Gêneros ---
// O HTML traz rock/pop/indie/eletronica fixos, mas os gêneros vêm do banco
// com id próprio. A lista é trocada pela real assim que chega.

async function carregarGeneros() {
  if (!fieldsetGenero) return;

  const lista = await generos.listar();
  const legenda = fieldsetGenero.querySelector('legend');

  const rotulos = lista.map((genero) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'genero';
    input.value = genero.id;
    label.append(input, document.createTextNode(' ' + genero.name));
    return label;
  });

  fieldsetGenero.replaceChildren(legenda, ...rotulos);
}

function generosSelecionados() {
  return [...document.querySelectorAll('input[name="genero"]:checked')].map((i) => i.value);
}

// --- Carregamento ---

async function carregarVinis() {
  ocupado(secaoResultados, true);

  try {
    const ids = generosSelecionados();

    if (ids.length === 0) {
      carregados = await vinis.listar();
    } else {
      // A API aceita um gênero por vez; várias seleções viram várias
      // chamadas, unidas depois sem repetir o mesmo disco.
      const respostas = await Promise.all(ids.map((genreId) => vinis.listar({ genreId })));
      const porId = new Map();
      for (const lista of respostas) {
        for (const vinil of lista) porId.set(vinil.id, vinil);
      }
      carregados = [...porId.values()];
    }

    pagina = 1;
    aplicarFiltros();
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    ocupado(secaoResultados, false);
  }
}

// --- Filtros locais ---

function aplicarFiltros() {
  const termo = (campoBusca?.value || '').trim().toLowerCase();
  const minimo = Number(campoPrecoMin?.value) || 0;
  const maximo = Number(campoPrecoMax?.value) || Infinity;

  visiveis = carregados.filter((vinil) => {
    const texto = `${vinil.title} ${vinil.description || ''}`.toLowerCase();
    const preco = Number(vinil.price);
    return texto.includes(termo) && preco >= minimo && preco <= maximo;
  });

  ordenar();
  renderizar();
}

function ordenar() {
  const criterio = campoOrdenar?.value || 'recentes';

  const comparadores = {
    'menor-preco': (a, b) => Number(a.price) - Number(b.price),
    'maior-preco': (a, b) => Number(b.price) - Number(a.price),
    az: (a, b) => a.title.localeCompare(b.title, 'pt-BR'),
    // releasedAt é uma string de 4 dígitos; comparar como número basta.
    recentes: (a, b) => Number(b.releasedAt || 0) - Number(a.releasedAt || 0),
  };

  visiveis.sort(comparadores[criterio] || comparadores.recentes);
}

// --- Desenho ---

function renderizar() {
  if (!listaProdutos) return;

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  pagina = Math.min(pagina, totalPaginas);

  const inicio = (pagina - 1) * POR_PAGINA;
  const daPagina = visiveis.slice(inicio, inicio + POR_PAGINA);

  preencher(listaProdutos, daPagina.map(cardVinil));

  if (contador) {
    contador.textContent = visiveis.length
      ? `Mostrando ${daPagina.length} de ${visiveis.length} discos`
      : 'Nenhum disco para mostrar';
  }

  // Os dois estados já existem no HTML; aqui só se decide qual aparece.
  alternar(secaoResultados, visiveis.length > 0);
  alternar(secaoVazia, visiveis.length === 0);

  desenharPaginacao(totalPaginas);
}

function desenharPaginacao(totalPaginas) {
  if (!navPaginacao) return;

  const lista = navPaginacao.querySelector('ul');
  if (!lista) return;

  alternar(navPaginacao, totalPaginas > 1);
  if (totalPaginas <= 1) return;

  const itens = [];

  for (let numero = 1; numero <= totalPaginas; numero++) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#pagina-${numero}`;
    link.textContent = String(numero);
    link.dataset.pagina = numero;
    if (numero === pagina) link.setAttribute('aria-current', 'page');
    item.append(link);
    itens.push(item);
  }

  if (pagina < totalPaginas) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#pagina-${pagina + 1}`;
    link.textContent = 'Próxima';
    link.dataset.pagina = pagina + 1;
    item.append(link);
    itens.push(item);
  }

  lista.replaceChildren(...itens);
}

// --- Eventos ---

navPaginacao?.addEventListener('click', (evento) => {
  const link = evento.target.closest('a[data-pagina]');
  if (!link) return;

  evento.preventDefault();
  pagina = Number(link.dataset.pagina);
  renderizar();
  secaoResultados?.scrollIntoView({ behavior: 'smooth' });
});

formBusca?.addEventListener('submit', (evento) => {
  // O action manda para catalogo.html?q=... e recarregaria a página à toa.
  evento.preventDefault();
  pagina = 1;
  aplicarFiltros();
});

formFiltros?.addEventListener('submit', (evento) => {
  evento.preventDefault();
  // Gênero é filtro do servidor, então recarrega; o resto é local.
  carregarVinis();
});

formFiltros?.addEventListener('reset', () => {
  // O reset limpa os campos depois deste evento; por isso o setTimeout.
  setTimeout(() => {
    if (campoBusca) campoBusca.value = '';
    carregarVinis();
  });
});

campoOrdenar?.addEventListener('change', () => {
  ordenar();
  renderizar();
});

listaProdutos?.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-acao="adicionar-carrinho"]');
  if (!botao) return;

  const vinylId = Number(botao.dataset.vinilId);
  travarBotao(botao, true, 'Adicionando…');

  try {
    const resposta = await carrinho.adicionar([vinylId]);

    // A API devolve em skipped o que não entrou, com o motivo.
    // O caso comum é o disco já estar no carrinho.
    const motivo = resposta?.skipped?.[vinylId];
    if (motivo) {
      avisar('Este disco já está no seu carrinho.', 'info');
    } else {
      avisar('Adicionado ao carrinho.');
    }
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    travarBotao(botao, false);
  }
});

// --- Início ---
// A API exige token até para listar o catálogo, então visitante anônimo
// não passa daqui.

if (exigirLogin()) {
  carregarGeneros()
    .catch(() => {}) // sem gêneros o catálogo ainda funciona
    .then(carregarVinis);
}
