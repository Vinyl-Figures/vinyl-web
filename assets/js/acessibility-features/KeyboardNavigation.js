// Atalhos Alt + número pra navegar direto entre as páginas principais.

import { ROTAS } from '../config.js';

const ATALHOS = {
  1: { destino: ROTAS.inicio, rotulo: 'Início' },
  2: { destino: ROTAS.catalogo, rotulo: 'Catálogo' },
  3: { destino: ROTAS.carrinho, rotulo: 'Carrinho' },
  4: { destino: ROTAS.conta, rotulo: 'Conta' },
};

const ID_PULAR_CONTEUDO = 'vinyl-pular-conteudo';
const ID_CONTEUDO = 'vinyl-conteudo-principal';

function garantirAtalhoDeConteudo() {
  if (document.getElementById(ID_PULAR_CONTEUDO)) return;

  const conteudo = document.querySelector('main');
  if (!conteudo) return;

  conteudo.id ||= ID_CONTEUDO;
  conteudo.tabIndex = -1;

  const atalho = document.createElement('a');
  atalho.id = ID_PULAR_CONTEUDO;
  atalho.href = `#${conteudo.id}`;
  atalho.textContent = 'Pular para o conteúdo principal';
  atalho.addEventListener('click', (evento) => {
    evento.preventDefault();
    conteudo.focus();
  });

  document.body.prepend(atalho);
}

function avisarNavegacao(mensagem) {
  document.dispatchEvent(new CustomEvent('a11y:navegacao', { detail: mensagem }));
}

function aoTeclar(evento) {
  if (!evento.altKey || evento.ctrlKey || evento.metaKey) return;

  const atalho = ATALHOS[evento.key];
  if (atalho) {
    evento.preventDefault();
    avisarNavegacao(`Atalho de teclado: indo para ${atalho.rotulo}.`);
    window.setTimeout(() => {
      location.href = atalho.destino;
    }, 120);
  }
}

export default {
  slug: 'navegacao-por-teclado',
  rotulo: 'Navegação por teclado',
  apelidos: ['navegacao-por-teclado', 'navegacao-teclado', 'keyboard-navigation', 'teclado'],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-teclado', 'ativo');
      garantirAtalhoDeConteudo();
      document.addEventListener('keydown', aoTeclar);
    } else {
      document.documentElement.removeAttribute('data-a11y-teclado');
      document.removeEventListener('keydown', aoTeclar);
    }
  },
};
