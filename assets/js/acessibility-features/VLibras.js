// Integração sob demanda do VLibras. O script externo só é baixado quando a
// pessoa ativa a preferência, evitando peso extra para o restante da loja.

const URL_APP = 'https://vlibras.gov.br/app';
const URL_SCRIPT = `${URL_APP}/vlibras-plugin.js`;
const ID_SCRIPT = 'vinyl-vlibras-script';
const ID_WIDGET = 'vinyl-vlibras-widget';
const ID_RETRY = 'vinyl-vlibras-retry';
const URL_CSS = new URL('../../css/vlibras.css', import.meta.url).href;

let ativo = false;
let inicializado = false;
let carregamento = null;

function criarEstilo() {
  if (document.querySelector('link[data-vinyl-vlibras]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = URL_CSS;
  link.dataset.vinylVlibras = 'true';
  document.head.append(link);
}

function widget() {
  return document.getElementById(ID_WIDGET);
}

function criarWidget() {
  const existente = widget();
  if (existente) return existente;

  const raiz = document.createElement('div');
  raiz.id = ID_WIDGET;
  raiz.className = 'enabled';
  raiz.setAttribute('vw', '');
  raiz.hidden = true;

  const acesso = document.createElement('div');
  acesso.className = 'active';
  acesso.setAttribute('vw-access-button', '');

  const plugin = document.createElement('div');
  plugin.setAttribute('vw-plugin-wrapper', '');
  const topo = document.createElement('div');
  topo.className = 'vw-plugin-top-wrapper';

  plugin.append(topo);
  raiz.append(acesso, plugin);
  document.body.append(raiz);
  return raiz;
}

function carregarScript() {
  if (window.VLibras?.Widget) return Promise.resolve();
  if (carregamento) return carregamento;

  carregamento = new Promise((resolve, reject) => {
    let script = document.getElementById(ID_SCRIPT);
    const novo = !script;
    const limite = window.setTimeout(() => concluir(new Error('Tempo esgotado ao carregar VLibras.')), 15000);

    function limpar() {
      window.clearTimeout(limite);
      script?.removeEventListener('load', carregado);
      script?.removeEventListener('error', falhou);
    }

    function concluir(erro) {
      limpar();
      if (erro) reject(erro);
      else resolve();
    }

    function carregado() {
      concluir(window.VLibras?.Widget ? null : new Error('O VLibras não foi inicializado.'));
    }

    function falhou() {
      concluir(new Error('Não foi possível carregar o VLibras.'));
    }

    if (novo) {
      script = document.createElement('script');
      script.id = ID_SCRIPT;
      script.src = URL_SCRIPT;
      script.async = true;
      script.referrerPolicy = 'strict-origin-when-cross-origin';
    }

    script.addEventListener('load', carregado, { once: true });
    script.addEventListener('error', falhou, { once: true });
    if (novo) document.head.append(script);
  }).catch((erro) => {
    carregamento = null;
    throw erro;
  });

  return carregamento;
}

function removerTentativa() {
  document.getElementById(ID_RETRY)?.remove();
}

function oferecerTentativa() {
  if (!ativo || document.getElementById(ID_RETRY)) return;

  const area = document.createElement('div');
  area.id = ID_RETRY;
  area.className = 'vlibras-tentativa';

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = 'Tentar Libras novamente';
  botao.addEventListener('click', () => ativar());

  const texto = document.createElement('span');
  texto.setAttribute('role', 'status');
  texto.textContent = 'O tradutor de Libras não pôde ser carregado. Tente novamente mais tarde.';

  area.append(botao, texto);
  document.body.append(area);
}

async function ativar() {
  if (!ativo) return;

  criarEstilo();
  removerTentativa();
  const raiz = criarWidget();

  try {
    await carregarScript();
    if (!ativo) return;

    if (!inicializado) {
      new window.VLibras.Widget(URL_APP);
      inicializado = true;
    }

    raiz.hidden = false;
  } catch (erro) {
    raiz.hidden = true;
    console.warn('Não foi possível inicializar o VLibras.', erro);
    oferecerTentativa();
  }
}

function desativar() {
  removerTentativa();
  const raiz = widget();
  if (raiz) raiz.hidden = true;
}

export default {
  slug: 'vlibras',
  rotulo: 'Tradução em Libras (VLibras)',
  apelidos: ['vlibras', 'libras'],

  aplicar(deveAtivar) {
    ativo = deveAtivar;
    if (ativo) void ativar();
    else desativar();
  },
};
