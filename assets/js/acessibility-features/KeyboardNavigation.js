// Atalhos Alt + número pra navegar direto entre as páginas principais.

import { ROTAS } from '../config.js';

const ATALHOS = {
  1: ROTAS.inicio,
  2: ROTAS.catalogo,
  3: ROTAS.carrinho,
  4: ROTAS.conta,
};

function aoTeclar(evento) {
  if (!evento.altKey || evento.ctrlKey || evento.metaKey) return;

  const destino = ATALHOS[evento.key];
  if (destino) {
    evento.preventDefault();
    location.href = destino;
  }
}

export default {
  slug: 'navegacao-por-teclado',
  rotulo: 'Navegação por teclado',
  apelidos: ['navegacao-por-teclado', 'navegacao-teclado', 'keyboard-navigation', 'teclado'],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-teclado', 'ativo');
      document.addEventListener('keydown', aoTeclar);
    } else {
      document.documentElement.removeAttribute('data-a11y-teclado');
      document.removeEventListener('keydown', aoTeclar);
    }
  },
};
