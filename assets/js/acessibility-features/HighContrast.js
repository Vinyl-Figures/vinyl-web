// Alto contraste.
//
// O módulo não escreve CSS: ele só marca o <html> com um atributo.
// Quem estiliza escreve a regra do lado do CSS, por exemplo:
//   html[data-a11y-contraste="alto"] { ... }

export default {
  slug: 'alto-contraste',
  rotulo: 'Alto contraste',

  // Nomes que o recurso pode ter no cadastro da API.
  apelidos: ['alto-contraste', 'high-contrast', 'contraste', 'contraste-alto'],

  aplicar(ativo) {
    if (ativo) {
      document.documentElement.setAttribute('data-a11y-contraste', 'alto');
    } else {
      document.documentElement.removeAttribute('data-a11y-contraste');
    }
  },
};
