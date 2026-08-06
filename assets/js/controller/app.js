// Roda em todas as páginas.

import { ROTAS } from '../config.js';
import { estaLogado } from '../model/session.js';
import { auth } from '../model/store.js';
import { avisar, mostrarErro } from '../view/ui.js';
import { aplicarSalvas, sincronizar } from '../acessibility-features/index.js';

aplicarSalvas();

// html[data-sessao="inativa"] fica disponível para o CSS.
document.documentElement.setAttribute('data-sessao', estaLogado() ? 'ativa' : 'inativa');

let avisouDemora = false;
document.addEventListener('api:demorando', () => {
  if (avisouDemora) return;
  avisouDemora = true;
  avisar('Acordando o servidor. Isso pode levar até um minuto na primeira vez.', 'info');
});
document.addEventListener('api:respondeu', () => {
  avisouDemora = false;
});

const linkSair = document.querySelector('[data-acao="sair"]');
if (linkSair) {
  linkSair.addEventListener('click', async (evento) => {
    evento.preventDefault();
    try {
      await auth.sair();
    } catch (erro) {
      mostrarErro(erro);
    }
    location.href = ROTAS.inicio;
  });
}

// Falhar aqui não pode quebrar a página: o localStorage já valeu.
if (estaLogado()) {
  sincronizar().catch(() => {});
}

let saindoPorSessao = false;
document.addEventListener('api:sessao-expirada', () => {
  if (saindoPorSessao) return; // várias chamadas podem falhar juntas
  saindoPorSessao = true;

  sessionStorage.setItem('vinyl.voltarPara', location.href);
  sessionStorage.setItem('vinyl.motivoSaida', 'sessao-expirada');
  location.href = ROTAS.entrar;
});

// A API só tem duas rotas públicas: até o catálogo exige token.
export function exigirLogin() {
  if (estaLogado()) return true;

  sessionStorage.setItem('vinyl.voltarPara', location.href);
  location.href = ROTAS.entrar;
  return false;
}

export function destinoAposLogin() {
  const salvo = sessionStorage.getItem('vinyl.voltarPara');
  sessionStorage.removeItem('vinyl.voltarPara');
  return salvo || ROTAS.conta;
}
