// Navegação por teclado.
//
// Substitui o arquivo KeyboradNavegation.js, que estava vazio e com o nome
// grafado errado.
//
// Este recurso não tinha checkbox em conta.html — se ele for cadastrado na
// API, aparece automaticamente na lista de recursos.
//
// Comportamento puro, sem CSS:
//  - insere um link "Pular para o conteúdo" no topo da página;
//  - marca o <html> para o CSS poder reforçar o indicador de foco;
//  - atalhos Alt + número para as seções principais.

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

  // O main precisa ser focável para receber o foco depois do pulo.
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

  apelidos: [
    'navegacao-por-teclado',
    'navegacao-teclado',
    'keyboard-navigation',
    'teclado',
  ],

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
