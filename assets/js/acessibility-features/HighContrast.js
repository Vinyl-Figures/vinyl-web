// html[data-a11y-contraste="alto"] — o CSS engancha aqui.

export default {
  slug: 'alto-contraste',
  rotulo: 'Alto contraste',
  apelidos: ['alto-contraste', 'high-contrast', 'contraste', 'contraste-alto'],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-contraste', 'alto');
    } else {
      document.documentElement.removeAttribute('data-a11y-contraste');
    }
  },
};
