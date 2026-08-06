// Utilidades de tela: formatação, estados e os popups de feedback.
//
// ATENÇÃO — este é o único arquivo do projeto que escreve CSS, e o estilo
// aqui vale só para os popups (autorizado). Ele usa cores de sistema
// (Canvas / CanvasText) justamente para não brigar com o CSS da loja e
// funcionar em tema claro e escuro sem configuração.
// Nenhum outro módulo mexe em aparência: estado visual sai por atributo
// (hidden, data-a11y-*, aria-*).

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

// A API devolve o ano como string de 4 dígitos.
export function formatarData(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
}

// --- Estados de elemento ---
// Usa atributos nativos, nunca style nem classe de aparência.

export function mostrar(elemento) {
  if (elemento) elemento.hidden = false;
}

export function esconder(elemento) {
  if (elemento) elemento.hidden = true;
}

export function alternar(elemento, visivel) {
  if (elemento) elemento.hidden = !visivel;
}

// Marca a região como ocupada para leitores de tela enquanto carrega.
export function ocupado(elemento, carregando) {
  if (elemento) elemento.setAttribute('aria-busy', String(Boolean(carregando)));
}

// Desabilita o botão durante o envio para evitar clique duplo.
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

function listaDeMensagens(mensagens) {
  if (mensagens.length === 1) {
    const p = document.createElement('p');
    p.textContent = mensagens[0];
    return p;
  }
  const ul = document.createElement('ul');
  for (const mensagem of mensagens) {
    const li = document.createElement('li');
    li.textContent = mensagem;
    ul.append(li);
  }
  return ul;
}

// Popup com um botão. Resolve quando o usuário fecha.
// Ex.: alertar({ titulo: 'Cadastro realizado com sucesso' })
export function alertar({ titulo, mensagem = '', tipo = 'sucesso', textoBotao = 'OK' }) {
  const mensagens = Array.isArray(mensagem) ? mensagem : mensagem ? [mensagem] : [];

  const dialogo = criarDialogo();
  dialogo.setAttribute('data-' + PREFIXO + '-tipo', tipo);

  const h2 = document.createElement('h2');
  h2.textContent = titulo;

  const acoes = document.createElement('div');
  acoes.setAttribute('data-' + PREFIXO, 'acoes');

  const botao = document.createElement('button');
  botao.type = 'button';
  botao.textContent = textoBotao;
  botao.addEventListener('click', () => dialogo.close());
  acoes.append(botao);

  dialogo.append(h2);
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

// Popup de confirmação. Resolve true se confirmou.
export function confirmar({ titulo, mensagem = '', textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar' }) {
  const dialogo = criarDialogo();

  const h2 = document.createElement('h2');
  h2.textContent = titulo;

  const acoes = document.createElement('div');
  acoes.setAttribute('data-' + PREFIXO, 'acoes');

  const cancelar = document.createElement('button');
  cancelar.type = 'button';
  cancelar.textContent = textoCancelar;
  cancelar.addEventListener('click', () => dialogo.close('nao'));

  const confirmarBotao = document.createElement('button');
  confirmarBotao.type = 'button';
  confirmarBotao.textContent = textoConfirmar;
  confirmarBotao.addEventListener('click', () => dialogo.close('sim'));

  acoes.append(cancelar, confirmarBotao);

  dialogo.append(h2);
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
    cancelar.focus();
  });
}

// Popup com uma lista de opções. Resolve com o valor escolhido ou null.
// Usado no checkout para escolher a forma de pagamento.
export function escolher({ titulo, mensagem = '', opcoes, rotuloCampo = 'Opção' }) {
  const dialogo = criarDialogo();

  const h2 = criar('h2', titulo);

  const campoId = 'vinyl-ui-escolha';
  const rotulo = criar('label', rotuloCampo);
  rotulo.htmlFor = campoId;

  const select = document.createElement('select');
  select.id = campoId;
  for (const opcao of opcoes) {
    const item = document.createElement('option');
    item.value = opcao.valor;
    item.textContent = opcao.rotulo;
    select.append(item);
  }

  const acoes = document.createElement('div');
  acoes.setAttribute('data-' + PREFIXO, 'acoes');

  const cancelar = criar('button', 'Cancelar');
  cancelar.type = 'button';
  cancelar.addEventListener('click', () => dialogo.close(''));

  const confirmarBotao = criar('button', 'Confirmar');
  confirmarBotao.type = 'button';
  confirmarBotao.addEventListener('click', () => dialogo.close(select.value));

  acoes.append(cancelar, confirmarBotao);

  dialogo.append(h2);
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

// Aviso rápido, sem bloquear a tela. Some sozinho.
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

  const aviso = document.createElement('p');
  aviso.setAttribute('data-' + PREFIXO, 'aviso');
  aviso.setAttribute('data-' + PREFIXO + '-tipo', tipo);
  aviso.textContent = mensagem;
  area.append(aviso);

  setTimeout(() => aviso.remove(), 4000);
}

// Atalho para qualquer erro vindo do store.
// O ErroApi pode trazer várias mensagens de validação de uma vez.
export function mostrarErro(erro) {
  const mensagens = erro?.mensagens?.length
    ? erro.mensagens
    : [erro?.message || 'Erro inesperado.'];

  return alertar({ titulo: 'Não foi possível concluir', mensagem: mensagens, tipo: 'erro' });
}
