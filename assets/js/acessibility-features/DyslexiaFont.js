
const PREFIXO = 'vinyl-a11y-fonte';

let estiloInjetado = false;

function injetarEstilo() {
  if (estiloInjetado) return;
  estiloInjetado = true;

  const estilo = document.createElement('style');
  estilo.dataset.origem = PREFIXO;
  estilo.textContent = `
    html[data-a11y-fonte="dislexia"] {
      font-family: Verdana, Tahoma, Arial, sans-serif;
      letter-spacing: 0.04em;
      word-spacing: 0.12em;
      line-height: 1.6;
    }
  `;
  document.head.append(estilo);
}

export default {
  slug: 'fonte-dislexia',
  rotulo: 'Fonte para dislexia',
  apelidos: ['fonte-dislexia', 'fonte-para-dislexia', 'dislexia', 'dyslexia-font', 'dyslexia'],

  aplicar(ativo) {
    if (ativo) {
      injetarEstilo();
      document.documentElement.setAttribute('data-a11y-fonte', 'dislexia');
    } else {
      document.documentElement.removeAttribute('data-a11y-fonte');
    }
  },
};
