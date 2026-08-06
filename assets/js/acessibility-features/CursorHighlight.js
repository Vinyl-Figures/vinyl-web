// Realce de cursor.
//
// Este recurso está nos checkboxes de conta.html mas não tinha arquivo.
//
// Marca o <html> e deixa a aparência do realce para o CSS, por exemplo:
//   html[data-a11y-cursor="realce"] a:hover,
//   html[data-a11y-cursor="realce"] button:hover { outline: 3px solid; }
//
// A parte que é comportamento — saber onde o ponteiro está — fica aqui:
// o elemento sob o cursor recebe data-a11y-sob-cursor, para o CSS realçar
// exatamente um alvo por vez.

const ATRIBUTO_ALVO = 'data-a11y-sob-cursor';

let alvoAtual = null;

function aoMover(evento) {
  const alvo = evento.target.closest('a, button, input, select, textarea, label, [tabindex]');
  if (alvo === alvoAtual) return;

  if (alvoAtual) alvoAtual.removeAttribute(ATRIBUTO_ALVO);
  alvoAtual = alvo;
  if (alvoAtual) alvoAtual.setAttribute(ATRIBUTO_ALVO, '');
}

function limparAlvo() {
  if (alvoAtual) alvoAtual.removeAttribute(ATRIBUTO_ALVO);
  alvoAtual = null;
}

export default {
  slug: 'realce-de-cursor',
  rotulo: 'Realce de cursor',

  apelidos: [
    'realce-de-cursor',
    'realce-cursor',
    'cursor-highlight',
    'destaque-de-cursor',
  ],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-cursor', 'realce');
      document.addEventListener('mousemove', aoMover);
      document.addEventListener('mouseleave', limparAlvo);
    } else {
      document.documentElement.removeAttribute('data-a11y-cursor');
      document.removeEventListener('mousemove', aoMover);
      document.removeEventListener('mouseleave', limparAlvo);
      limparAlvo();
    }
  },
};
