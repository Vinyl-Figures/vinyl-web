



const CHAVE = 'vinyl.tema';

function preferenciaDoSistema() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

export function temaSalvo() {
  const salvo = localStorage.getItem(CHAVE);
  return salvo === 'claro' || salvo === 'escuro' ? salvo : null;
}


export function temaAtual() {
  return temaSalvo() || preferenciaDoSistema();
}

export function aplicarTema(tema) {
  document.documentElement.setAttribute('data-tema', tema);
}

export function definirTema(tema) {
  localStorage.setItem(CHAVE, tema);
  aplicarTema(tema);
}

export function alternarTema() {
  const proximo = temaAtual() === 'escuro' ? 'claro' : 'escuro';
  definirTema(proximo);
  return proximo;
}


export function aplicarSalvo() {
  aplicarTema(temaAtual());
}
