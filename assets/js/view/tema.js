// Preferência de tema fica só no navegador (não é recurso de acessibilidade
// da API, é visual). Só liga o atributo no <html> — o CSS que lê
// data-tema="escuro"/"claro" ainda não existe.

const CHAVE = 'vinyl.tema';

function preferenciaDoSistema() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
}

export function temaSalvo() {
  const salvo = localStorage.getItem(CHAVE);
  return salvo === 'claro' || salvo === 'escuro' ? salvo : null;
}

// Sem preferência salva, segue o tema do sistema operacional.
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

// Roda em toda página antes de qualquer render, para não piscar.
export function aplicarSalvo() {
  aplicarTema(temaAtual());
}
