


import { vinis, generos, carrinho } from '../model/store.js';
import { cardVinil, preencher } from '../view/templates.js';
import { avisarComLink, mostrarErro, alternar, travarBotao } from '../view/ui.js';
import { ROTAS } from '../config.js';
import { exigirLogin } from './app.js';

const POR_PAGINA = 8;




const secaoResultados = [...document.querySelectorAll('main section')].find((secao) =>
  secao.querySelector('h2')?.textContent.trim() === 'Todos os discos'
);
const listaProdutos = secaoResultados?.querySelector('ul');
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
const opcoesGenero = fieldsetGenero?.querySelector('[data-generos-opcoes]');
const resumoGenero = fieldsetGenero?.querySelector('[data-generos-resumo]');



let carregados = [];
let visiveis = [];
let pagina = 1;

function numeroFormatado(valor) {
  const elemento = document.createElement('span');
  elemento.dataset.numero = '';
  elemento.textContent = String(valor);
  return elemento;
}




async function carregarGeneros() {
  if (!opcoesGenero) return;

  const lista = await generos.listar();

  const rotulos = lista.map((genero) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'genero';
    input.value = genero.id;
    label.append(input, document.createTextNode(' ' + genero.name));
    return label;
  });

  opcoesGenero.replaceChildren(...rotulos);
  atualizarResumoGeneros();
}

function generosSelecionados() {
  return [...document.querySelectorAll('input[name="genero"]:checked')].map((i) => i.value);
}

function atualizarResumoGeneros() {
  if (!resumoGenero) return;

  const quantidade = generosSelecionados().length;
  resumoGenero.textContent = quantidade
    ? `${quantidade} ${quantidade === 1 ? 'gênero selecionado' : 'gêneros selecionados'}`
    : 'Todos os gêneros';
}

fieldsetGenero?.addEventListener('change', (evento) => {
  if (evento.target.matches('input[name="genero"]')) atualizarResumoGeneros();
});



function mostrarCarregamento() {
  if (!contador) return;

  const spinner = document.createElement('span');
  spinner.className = 'catalog-spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const texto = document.createElement('span');
  texto.className = 'catalog-status-text';
  texto.textContent = 'Carregando discos…';

  contador.classList.add('esta-carregando');
  contador.replaceChildren(spinner, texto);
}

function mostrarFalhaNoCarregamento() {
  if (!contador) return;

  contador.classList.remove('esta-carregando');
  contador.textContent = 'Não foi possível carregar os discos. Tente novamente.';
}

async function carregarVinis() {
  secaoResultados?.setAttribute('aria-busy', 'true');
  alternar(secaoResultados, true);
  alternar(secaoVazia, false);
  mostrarCarregamento();

  try {
    const ids = generosSelecionados();

    if (ids.length === 0) {
      carregados = await vinis.listar();
    } else {


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
    mostrarFalhaNoCarregamento();
    mostrarErro(erro);
  } finally {
    secaoResultados?.setAttribute('aria-busy', 'false');
  }
}



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

    recentes: (a, b) => Number(b.releasedAt || 0) - Number(a.releasedAt || 0),
  };

  visiveis.sort(comparadores[criterio] || comparadores.recentes);
}



function renderizar() {
  if (!listaProdutos) return;

  const totalPaginas = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  pagina = Math.min(pagina, totalPaginas);

  const inicio = (pagina - 1) * POR_PAGINA;
  const daPagina = visiveis.slice(inicio, inicio + POR_PAGINA);

  preencher(listaProdutos, daPagina.map(cardVinil));

  if (contador) {
    contador.classList.remove('esta-carregando');
    if (visiveis.length) {
      contador.replaceChildren(
        'Mostrando ',
        numeroFormatado(daPagina.length),
        ' de ',
        numeroFormatado(visiveis.length),
        ' discos'
      );
    } else {
      contador.textContent = 'Nenhum disco para mostrar';
    }
  }

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
    link.dataset.numero = '';
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



navPaginacao?.addEventListener('click', (evento) => {
  const link = evento.target.closest('a[data-pagina]');
  if (!link) return;

  evento.preventDefault();
  pagina = Number(link.dataset.pagina);
  renderizar();
  secaoResultados?.scrollIntoView({ behavior: 'smooth' });


  navPaginacao.querySelector('a[aria-current="page"]')?.focus();
});

formBusca?.addEventListener('submit', (evento) => {
  evento.preventDefault();
  pagina = 1;
  aplicarFiltros();
});

formFiltros?.addEventListener('submit', (evento) => {
  evento.preventDefault();

  carregarVinis();
});

formFiltros?.addEventListener('reset', () => {

  setTimeout(() => {
    if (campoBusca) campoBusca.value = '';
    atualizarResumoGeneros();
    carregarVinis();
  });
});

campoOrdenar?.addEventListener('change', () => {
  ordenar();
  renderizar();
});




listaProdutos?.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-acao="qtd-catalogo-menos"], [data-acao="qtd-catalogo-mais"]');
  if (!botao) return;

  const campoQtd = botao.closest('.stepper-qtd')?.querySelector('input');
  if (!campoQtd) return;

  const atual = Number(campoQtd.value) || 1;
  const diferenca = botao.dataset.acao === 'qtd-catalogo-mais' ? 1 : -1;
  campoQtd.value = String(Math.max(1, atual + diferenca));
});

listaProdutos?.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-acao="adicionar-carrinho"]');
  if (!botao) return;

  const vinylId = Number(botao.dataset.vinilId);
  const campoQtd = botao.closest('article')?.querySelector(`[data-qtd-vinil="${vinylId}"]`);
  const quantidade = Math.max(1, Number(campoQtd?.value) || 1);

  travarBotao(botao, true, 'Adicionando…');

  try {


    await carrinho.adicionar(Array(quantidade).fill(vinylId));
    avisarComLink({
      antes: quantidade > 1 ? `${quantidade} unidades adicionadas ao ` : 'Adicionado ao ',
      textoLink: 'carrinho',
      href: ROTAS.carrinho,
      depois: '.',
    });
    if (campoQtd) campoQtd.value = '1';
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    travarBotao(botao, false);
  }
});

if (exigirLogin()) {
  carregarGeneros()
    .catch(() => {})
    .then(carregarVinis);
}
