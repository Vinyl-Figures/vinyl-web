// Texto aumentado.
//
// Marca o <html> e deixa o tamanho para o CSS, por exemplo:
//   html[data-a11y-texto="grande"] { font-size: 125%; }
//
// Se o CSS usar rem nas medidas, aumentar a raiz já escala a página inteira.

export default {
  slug: 'texto-aumentado',
  rotulo: 'Texto aumentado',

  apelidos: [
    'texto-aumentado',
    'texto-grande',
    'aumentar-texto',
    'increased-text',
    'large-text',
  ],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-texto', 'grande');
    } else {
      document.documentElement.removeAttribute('data-a11y-texto');
    }
  },
};
