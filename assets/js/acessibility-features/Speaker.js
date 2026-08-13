// Leitura em voz alta com a SpeechSynthesis do navegador.
// Não substitui um leitor de tela de verdade: é apoio para quem não usa um.

const sintetizador = window.speechSynthesis;

function textoDoElemento(elemento) {
  if (!elemento) return '';

  const rotuloAria = elemento.getAttribute?.('aria-label');
  if (rotuloAria) return rotuloAria;

  if (elemento.tagName === 'IMG') return elemento.alt || '';

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(elemento.tagName)) {
    const rotulo = elemento.labels?.[0]?.textContent || elemento.placeholder || '';
    const tipo = elemento.type === 'checkbox'
      ? elemento.checked ? ', marcado' : ', desmarcado'
      : '';
    return rotulo.trim() + tipo;
  }

  return (elemento.textContent || '').trim();
}

export function falar(texto) {
  if (!texto || !sintetizador) return;

  sintetizador.cancel();

  const fala = new SpeechSynthesisUtterance(texto.slice(0, 300));
  fala.lang = 'pt-BR';
  fala.rate = 1;
  sintetizador.speak(fala);
}

function aoFocar(evento) {
  falar(textoDoElemento(evento.target));
}

function aoClicar(evento) {
  const alvo = evento.target.closest('p, h1, h2, h3, li, td, th, dd, dt, address, caption');
  if (alvo) falar(textoDoElemento(alvo));
}

function aoTeclar(evento) {
  if (evento.key === 'Escape') sintetizador.cancel();
}

export default {
  slug: 'leitor-de-tela',
  rotulo: 'Leitor de tela',
  apelidos: ['leitor-de-tela', 'leitor', 'screen-reader', 'speaker', 'narrador'],

  aplicar(ativo) {
    if (!sintetizador) return;

    if (ativo) {
      document.documentElement.setAttribute('data-a11y-leitor', 'ativo');
      document.addEventListener('focusin', aoFocar);
      document.addEventListener('click', aoClicar);
      document.addEventListener('keydown', aoTeclar);
    } else {
      document.documentElement.removeAttribute('data-a11y-leitor');
      document.removeEventListener('focusin', aoFocar);
      document.removeEventListener('click', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
      sintetizador.cancel();
    }
  },
};
