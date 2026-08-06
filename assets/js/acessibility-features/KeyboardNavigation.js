// Link "Pular para o conteúdo", marcação para o CSS reforçar o foco
// e atalhos Alt + número.

import { ROTAS } from '../config.js';

const ID_CONTEUDO = 'conteudo-principal';

const ATALHOS = {
  1: ROTAS.inicio,
  2: ROTAS.catalogo,
  3: ROTAS.carrinho,
  4: ROTAS.conta,
};

function criarLinkDeAtalho() {
  if (document.getElementById('pular-para-conteudo')) return;

  const principal = document.querySelector('main');
  if (!principal) return;

  if (!principal.id) principal.id = ID_CONTEUDO;

  const link = document.createElement('a');
  link.id = 'pular-para-conteudo';
  link.href = `#${principal.id}`;
  link.textContent = 'Pular para o conteúdo';

  // Focável para receber o foco depois do pulo.
  principal.tabIndex = -1;

  document.body.prepend(link);
}

function removerLinkDeAtalho() {
  document.getElementById('pular-para-conteudo')?.remove();
}

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
      criarLinkDeAtalho();
      document.addEventListener('keydown', aoTeclar);
    } else {
      document.documentElement.removeAttribute('data-a11y-teclado');
      removerLinkDeAtalho();
      document.removeEventListener('keydown', aoTeclar);
    }
  },
};
