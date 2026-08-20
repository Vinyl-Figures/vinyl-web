


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
  apelidos: ['realce-de-cursor', 'realce-cursor', 'cursor-highlight', 'destaque-de-cursor'],

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
