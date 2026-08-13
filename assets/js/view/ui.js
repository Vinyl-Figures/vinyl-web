// Único arquivo que escreve CSS, e só para os popups.

import { mensagemDoErro } from './erros.js';

const PREFIXO = 'vinyl-ui';

let estilosInjetados = false;

function injetarEstilos() {
  if (estilosInjetados) return;
  estilosInjetados = true;

  const estilo = document.createElement('style');
  estilo.dataset.origem = PREFIXO;
  estilo.textContent = `
    [data-${PREFIXO}="dialogo"] {
      color-scheme: light dark;
      border: 1px solid CanvasText;
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      max-width: 28rem;
      background: Canvas;
      color: CanvasText;
    }
    [data-${PREFIXO}="dialogo"]::backdrop {
      background: rgb(0 0 0 / 0.5);
    }
    [data-${PREFIXO}="dialogo"] h2 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
    }
    [data-${PREFIXO}="dialogo"] ul {
      margin: 0 0 1rem;
      padding-left: 1.25rem;
    }
    [data-${PREFIXO}="dialogo"] p {
      margin: 0 0 1rem;
    }
    [data-${PREFIXO}="acoes"] {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    [data-${PREFIXO}="avisos"] {
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      pointer-events: none;
    }
    [data-${PREFIXO}="aviso"] {
      color-scheme: light dark;
      background: Canvas;
      color: CanvasText;
      border: 1px solid CanvasText;
      border-radius: 6px;
      padding: 0.6rem 1rem;
      max-width: 90vw;
    }
    [data-${PREFIXO}-tipo="erro"] {
      border-width: 2px;
    }
  `;
  document.head.append(estilo);
}

// --- Formatação ---

export function formatarBRL(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
}

// --- Estados de elemento ---

export function alternar(elemento, visivel) {
  if (elemento) elemento.hidden = !visivel;
}

// <progress> sem "value" é indeterminado: todo navegador já anima sozinho,
// sem precisar de CSS. Fica antes do elemento (irmão, não filho) porque
// alguns dos elementos marcados como ocupados são <table>, que não aceita
// filho arbitrário.
export function ocupado(elemento, carregando) {
  if (!elemento) return;

  elemento.setAttribute('aria-busy', String(Boolean(carregando)));

  const anterior = elemento.previousElementSibling;
  const spinner = anterior?.matches(`progress[data-${PREFIXO}="spinner"]`) ? anterior : null;

  if (carregando) {
    if (!spinner) {
      const novo = document.createElement('progress');
      novo.setAttribute('data-' + PREFIXO, 'spinner');
      novo.setAttribute('aria-label', 'Carregando…');
      elemento.before(novo);
    }
  } else {
    spinner?.remove();
  }
}

export function travarBotao(botao, travado, textoOcupado = 'Aguarde…') {
  if (!botao) return;
  if (travado) {
    botao.dataset.textoOriginal = botao.textContent;
    botao.textContent = textoOcupado;
    botao.disabled = true;
  } else {
    if (botao.dataset.textoOriginal) botao.textContent = botao.dataset.textoOriginal;
    botao.disabled = false;
  }
}

// --- Popups ---

function criar(tag, texto) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function criarDialogo() {
  injetarEstilos();
  const dialogo = document.createElement('dialog');
  dialogo.setAttribute('data-' + PREFIXO, 'dialogo');
  return dialogo;
}

function criarAcoes() {
  const acoes = document.createElement('div');
  acoes.setAttribute('data-' + PREFIXO, 'acoes');
  return acoes;
}

function listaDeMensagens(mensagens) {
  if (mensagens.length === 1) return criar('p', mensagens[0]);

  const ul = document.createElement('ul');
  for (const mensagem of mensagens) ul.append(criar('li', mensagem));
  return ul;
}

export function alertar({ titulo, mensagem = '', tipo = 'sucesso', textoBotao = 'OK' }) {
  const mensagens = Array.isArray(mensagem) ? mensagem : mensagem ? [mensagem] : [];

  const dialogo = criarDialogo();
  dialogo.setAttribute('data-' + PREFIXO + '-tipo', tipo);

  const botao = criar('button', textoBotao);
  botao.type = 'button';
  botao.addEventListener('click', () => dialogo.close());

  const acoes = criarAcoes();
  acoes.append(botao);

  dialogo.append(criar('h2', titulo));
  if (mensagens.length) dialogo.append(listaDeMensagens(mensagens));
  dialogo.append(acoes);
  document.body.append(dialogo);

  return new Promise((resolver) => {
    dialogo.addEventListener('close', () => {
      dialogo.remove();
      resolver();
    });
    dialogo.showModal();
    botao.focus();
  });
}

export function confirmar({
  titulo,
  mensagem = '',
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  focarConfirmar = false,
}) {
  const dialogo = criarDialogo();

  const cancelar = criar('button', textoCancelar);
  cancelar.type = 'button';
  cancelar.addEventListener('click', () => dialogo.close('nao'));

  const confirmarBotao = criar('button', textoConfirmar);
  confirmarBotao.type = 'button';
  confirmarBotao.addEventListener('click', () => dialogo.close('sim'));

  const acoes = criarAcoes();
  acoes.append(cancelar, confirmarBotao);

  dialogo.append(criar('h2', titulo));
  if (mensagem) dialogo.append(listaDeMensagens([mensagem]));
  dialogo.append(acoes);
  document.body.append(dialogo);

  return new Promise((resolver) => {
    dialogo.addEventListener('close', () => {
      const resposta = dialogo.returnValue === 'sim';
      dialogo.remove();
      resolver(resposta);
    });
    dialogo.showModal();
    (focarConfirmar ? confirmarBotao : cancelar).focus();
  });
}

export function escolher({ titulo, mensagem = '', opcoes, rotuloCampo = 'Opção' }) {
  const dialogo = criarDialogo();

  const campoId = 'vinyl-ui-escolha';
  const rotulo = criar('label', rotuloCampo);
  rotulo.htmlFor = campoId;

  const select = document.createElement('select');
  select.id = campoId;
  for (const opcao of opcoes) {
    const item = criar('option', opcao.rotulo);
    item.value = opcao.valor;
    select.append(item);
  }

  const cancelar = criar('button', 'Cancelar');
  cancelar.type = 'button';
  cancelar.addEventListener('click', () => dialogo.close(''));

  const confirmarBotao = criar('button', 'Confirmar');
  confirmarBotao.type = 'button';
  confirmarBotao.addEventListener('click', () => dialogo.close(select.value));

  const acoes = criarAcoes();
  acoes.append(cancelar, confirmarBotao);

  dialogo.append(criar('h2', titulo));
  if (mensagem) dialogo.append(listaDeMensagens([mensagem]));
  dialogo.append(rotulo, select, acoes);
  document.body.append(dialogo);

  return new Promise((resolver) => {
    dialogo.addEventListener('close', () => {
      const valor = dialogo.returnValue || null;
      dialogo.remove();
      resolver(valor);
    });
    dialogo.showModal();
    select.focus();
  });
}

// Como <dialog> só devolve string em close(), o valor de cada checkbox é
// lido do DOM na hora do 'close', não carregado no returnValue.
export function escolherVarios({
  titulo,
  mensagem = '',
  opcoes,
  selecionados = [],
  textoConfirmar = 'Salvar',
  textoCancelar = 'Cancelar',
  focarConfirmar = false,
}) {
  const dialogo = criarDialogo();
  const ativos = new Set(selecionados);

  const fieldset = document.createElement('fieldset');
  fieldset.append(criar('legend', 'Recursos'));

  const checkboxes = opcoes.map((opcao) => {
    const label = criar('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = opcao.valor;
    input.checked = ativos.has(opcao.valor);
    label.append(input, document.createTextNode(' ' + opcao.rotulo));
    fieldset.append(label);
    return input;
  });

  const cancelar = criar('button', textoCancelar);
  cancelar.type = 'button';
  cancelar.addEventListener('click', () => dialogo.close('nao'));

  const confirmarBotao = criar('button', textoConfirmar);
  confirmarBotao.type = 'button';
  confirmarBotao.addEventListener('click', () => dialogo.close('sim'));

  const acoes = criarAcoes();
  acoes.append(cancelar, confirmarBotao);

  dialogo.append(criar('h2', titulo));
  if (mensagem) dialogo.append(listaDeMensagens([mensagem]));
  dialogo.append(fieldset, acoes);
  document.body.append(dialogo);

  return new Promise((resolver) => {
    dialogo.addEventListener('close', () => {
      const confirmado = dialogo.returnValue === 'sim';
      const valor = confirmado ? checkboxes.filter((c) => c.checked).map((c) => c.value) : null;
      dialogo.remove();
      resolver(valor);
    });
    dialogo.showModal();
    (focarConfirmar ? confirmarBotao : checkboxes[0])?.focus();
  });
}

export function avisar(mensagem, tipo = 'sucesso') {
  injetarEstilos();

  let area = document.querySelector(`[data-${PREFIXO}="avisos"]`);
  if (!area) {
    area = document.createElement('div');
    area.setAttribute('data-' + PREFIXO, 'avisos');
    area.setAttribute('role', 'status');
    area.setAttribute('aria-live', 'polite');
    document.body.append(area);
  }

  const aviso = criar('p', mensagem);
  aviso.setAttribute('data-' + PREFIXO, 'aviso');
  aviso.setAttribute('data-' + PREFIXO + '-tipo', tipo);
  area.append(aviso);

  setTimeout(() => aviso.remove(), 4000);
}

export function mostrarErro(erro, contextoAlternativo) {
  const alvo = contextoAlternativo ? { ...erro, contexto: contextoAlternativo } : erro;
  return alertar({ titulo: mensagemDoErro(alvo), tipo: 'erro' });
}

export function avisarErro(erro, contextoAlternativo) {
  const alvo = contextoAlternativo ? { ...erro, contexto: contextoAlternativo } : erro;
  avisar(mensagemDoErro(alvo), 'erro');
}
