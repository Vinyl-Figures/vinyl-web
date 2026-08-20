// Alto contraste é uma preferência de acessibilidade, não uma escolha de
// tema. O CSS centraliza as combinações de cores no atributo abaixo.

export default {
  slug: 'alto-contraste',
  rotulo: 'Alto contraste',
  apelidos: ['alto-contraste', 'contraste', 'contraste-alto', 'high-contrast'],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-contraste', 'alto');
    } else {
      document.documentElement.removeAttribute('data-a11y-contraste');
    }
  },
};
