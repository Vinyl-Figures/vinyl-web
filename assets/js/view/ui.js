


import { mensagemDoErro } from './erros.js';
import { aplicarMascara } from './mascaras.js';

const PREFIXO = 'vinyl-ui';
const DURACAO_MINIMA_CARREGAMENTO = 500;



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



export function alternar(elemento, visivel) {
  if (elemento) elemento.hidden = !visivel;
}





export function ocupado(elemento, carregando, rotulo = 'Carregando…') {
  if (!elemento) return;

  elemento.setAttribute('aria-busy', String(Boolean(carregando)));

  const anterior = elemento.previousElementSibling;
  const spinner = anterior?.matches(`progress[data-${PREFIXO}="spinner"]`) ? anterior : null;

  if (carregando) {
    if (!spinner) {
      const novo = document.createElement('progress');
      novo.setAttribute('data-' + PREFIXO, 'spinner');
      novo.setAttribute('aria-label', rotulo);
      elemento.before(novo);
    }
  } else {
    spinner?.remove();
  }
}

export async function travarBotao(botao, travado, textoOcupado = 'Aguarde…') {
  if (!botao) return;
  if (travado) {
    if (botao.dataset.textoOriginal === undefined) {
      botao.dataset.textoOriginal = botao.textContent;
      botao.dataset.minWidthOriginal = botao.style.minWidth;
      botao.dataset.htmlOriginal = botao.innerHTML;
      botao.dataset.minHeightOriginal = botao.style.minHeight;




      const { width, height } = botao.getBoundingClientRect();
      botao.style.minWidth = `${width}px`;
      botao.style.minHeight = `${height}px`;
      botao.dataset.carregandoDesde = String(Date.now());
    }

    const spinner = document.createElement('span');
    spinner.setAttribute('data-' + PREFIXO, 'spinner');
    spinner.setAttribute('aria-hidden', 'true');

    botao.replaceChildren(spinner, document.createTextNode(' ' + textoOcupado));
    botao.disabled = true;
  } else {
    if (botao.dataset.textoOriginal !== undefined) {
      const inicio = Number(botao.dataset.carregandoDesde) || Date.now();
      const restante = Math.max(0, DURACAO_MINIMA_CARREGAMENTO - (Date.now() - inicio));
      if (restante) await new Promise((resolver) => setTimeout(resolver, restante));

      botao.innerHTML = botao.dataset.htmlOriginal;
      delete botao.dataset.textoOriginal;
      delete botao.dataset.htmlOriginal;
      botao.style.minWidth = botao.dataset.minWidthOriginal;
      botao.style.minHeight = botao.dataset.minHeightOriginal;
      delete botao.dataset.minWidthOriginal;
      delete botao.dataset.minHeightOriginal;
      delete botao.dataset.carregandoDesde;
    }
    botao.disabled = false;
  }
}



function criar(tag, texto) {
  const elemento = document.createElement(tag);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function criarDialogo() {
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
  const invocador = document.activeElement;

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


      invocador?.focus?.();
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
  const invocador = document.activeElement;

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
      invocador?.focus?.();
      resolver(resposta);
    });
    dialogo.showModal();
    (focarConfirmar ? confirmarBotao : cancelar).focus();
  });
}

export function escolher({ titulo, mensagem = '', opcoes, rotuloCampo = 'Opção' }) {
  const dialogo = criarDialogo();
  const invocador = document.activeElement;

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
      invocador?.focus?.();
      resolver(valor);
    });
    dialogo.showModal();
    select.focus();
  });
}



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
  const invocador = document.activeElement;
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
      invocador?.focus?.();
      resolver(valor);
    });
    dialogo.showModal();
    (focarConfirmar ? confirmarBotao : checkboxes[0])?.focus();
  });
}






export function pedirCampos({ titulo, mensagem = '', campos, textoConfirmar = 'Salvar', textoCancelar = 'Cancelar' }) {
  const dialogo = criarDialogo();
  const invocador = document.activeElement;

  const inputs = campos.map((campo) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `vinyl-ui-campo-${campo.id}`;
    if (campo.obrigatorio) input.required = true;
    if (campo.maxlength) input.maxLength = campo.maxlength;
    if (campo.inputmode) input.inputMode = campo.inputmode;
    if (campo.mascara) aplicarMascara(input, campo.mascara);
    input.dataset.campoId = campo.id;
    return input;
  });

  const linhas = campos.map((campo, indice) => {
    const rotulo = criar('label', campo.rotulo);
    rotulo.htmlFor = inputs[indice].id;

    const linha = document.createElement('div');
    linha.setAttribute('data-' + PREFIXO, 'campo');
    linha.append(rotulo, inputs[indice]);
    return linha;
  });

  const cancelar = criar('button', textoCancelar);
  cancelar.type = 'button';
  cancelar.addEventListener('click', () => dialogo.close('nao'));

  const confirmarBotao = criar('button', textoConfirmar);
  confirmarBotao.type = 'button';
  confirmarBotao.addEventListener('click', () => {
    for (const input of inputs) {
      if (!input.reportValidity()) return;
    }
    dialogo.close('sim');
  });

  const acoes = criarAcoes();
  acoes.append(cancelar, confirmarBotao);

  dialogo.append(criar('h2', titulo));
  if (mensagem) dialogo.append(listaDeMensagens([mensagem]));
  dialogo.append(...linhas, acoes);
  document.body.append(dialogo);

  return new Promise((resolver) => {
    dialogo.addEventListener('close', () => {
      const confirmado = dialogo.returnValue === 'sim';
      const valores = confirmado
        ? Object.fromEntries(inputs.map((input) => [input.dataset.campoId, input.value.trim()]))
        : null;
      dialogo.remove();
      invocador?.focus?.();
      resolver(valores);
    });
    dialogo.showModal();
    inputs[0]?.focus();
  });
}

export function avisar(mensagem, tipo = 'sucesso') {
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

export function avisarComLink({ antes = '', textoLink, href, depois = '', tipo = 'sucesso' }) {
  let area = document.querySelector(`[data-${PREFIXO}="avisos"]`);
  if (!area) {
    area = document.createElement('div');
    area.setAttribute('data-' + PREFIXO, 'avisos');
    area.setAttribute('role', 'status');
    area.setAttribute('aria-live', 'polite');
    document.body.append(area);
  }

  const aviso = criar('p');
  aviso.setAttribute('data-' + PREFIXO, 'aviso');
  aviso.setAttribute('data-' + PREFIXO + '-tipo', tipo);

  const link = criar('a', textoLink);
  link.href = href;
  link.setAttribute('aria-label', `Abrir ${textoLink}`);
  aviso.append(antes, link, depois);
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
