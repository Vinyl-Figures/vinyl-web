

export default {
  slug: 'texto-aumentado',
  rotulo: 'Texto aumentado',
  apelidos: ['texto-aumentado', 'texto-grande', 'aumentar-texto', 'increased-text', 'large-text'],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-texto', 'grande');
    } else {
      document.documentElement.removeAttribute('data-a11y-texto');
    }
  },
};
