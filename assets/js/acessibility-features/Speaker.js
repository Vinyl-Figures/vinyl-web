// Leitor de tela embutido.
//
// Usa a API SpeechSynthesis do próprio navegador — sem biblioteca externa.
// Lê em voz alta o elemento que recebe o foco e o texto que o usuário clica.
//
// Não substitui um leitor de tela de verdade (NVDA, VoiceOver): é um apoio
// para quem não usa um. Por isso a marcação semântica das páginas continua
// sendo o que importa.

const sintetizador = window.speechSynthesis;

// Descobre o que faz sentido ler de um elemento, na mesma ordem de
// prioridade que um leitor de tela usaria.
function textoDoElemento(elemento) {
  if (!elemento) return '';

  const rotuloAria = elemento.getAttribute?.('aria-label');
  if (rotuloAria) return rotuloAria;

  if (elemento.tagName === 'IMG') return elemento.alt || '';

  if (elemento.tagName === 'INPUT' || elemento.tagName === 'TEXTAREA' || elemento.tagName === 'SELECT') {
    const rotulo = elemento.labels?.[0]?.textContent || elemento.placeholder || '';
    const tipo = elemento.type === 'checkbox'
      ? elemento.checked ? ', marcado' : ', desmarcado'
      : '';
    return rotulo.trim() + tipo;
  }

  return (elemento.textContent || '').trim();
}

function falar(texto) {
  if (!texto) return;

  // Cancela o que estava sendo lido: o usuário mudou de alvo.
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

// Escape interrompe a leitura a qualquer momento.
function aoTeclar(evento) {
  if (evento.key === 'Escape') sintetizador.cancel();
}

export default {
  slug: 'leitor-de-tela',
  rotulo: 'Leitor de tela',

  apelidos: ['leitor-de-tela', 'leitor', 'screen-reader', 'speaker', 'narrador'],

  aplicar(ativo) {
    // Navegador sem suporte: não adianta ligar nem avisar de erro.
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
