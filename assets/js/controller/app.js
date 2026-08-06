// Roda em todas as páginas.
// Aplica a acessibilidade salva, marca o estado da sessão, avisa quando o
// servidor está demorando a acordar e liga o botão Sair.

import { ROTAS } from '../config.js';
import { estaLogado } from '../model/session.js';
import { auth } from '../model/store.js';
import { avisar, mostrarErro } from '../view/ui.js';
import { aplicarSalvas, sincronizar } from '../acessibility-features/index.js';

// Primeiro de tudo: o que já estava salvo vale imediatamente,
// sem esperar resposta de rede.
aplicarSalvas();

// Deixa o estado da sessão disponível para o CSS, sem escrever CSS aqui.
// Ex.: html[data-sessao="inativa"] [data-so-logado] { display: none; }
document.documentElement.setAttribute(
  'data-sessao',
  estaLogado() ? 'ativa' : 'inativa'
);

// A API dorme quando fica parada e a primeira chamada leva uns 35 segundos.
// Sem esse aviso a tela parece congelada.
let avisouDemora = false;
document.addEventListener('api:demorando', () => {
  if (avisouDemora) return;
  avisouDemora = true;
  avisar('Acordando o servidor. Isso pode levar até um minuto na primeira vez.', 'info');
});
document.addEventListener('api:respondeu', () => {
  avisouDemora = false;
});

// O link de sair é marcado com data-acao="sair" no HTML.
// O href dele aponta para a home, que é o destino certo mesmo se o
// JavaScript não carregar — a diferença é que aí a sessão não é encerrada.
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

// Traz do servidor as preferências de acessibilidade da conta.
// Falha aqui não pode quebrar a página: o que está no navegador já valeu.
if (estaLogado()) {
  sincronizar().catch(() => {});
}

// A API avisa quando o token venceu no meio de uma operação.
// Não adianta mostrar o erro e deixar o usuário na página: sem token,
// nada mais ali vai funcionar. Ele volta para o login sabendo o motivo,
// e depois retorna para onde estava.
let saindoPorSessao = false;
document.addEventListener('api:sessao-expirada', () => {
  if (saindoPorSessao) return; // várias chamadas podem falhar juntas
  saindoPorSessao = true;

  sessionStorage.setItem('vinyl.voltarPara', location.href);
  sessionStorage.setItem('vinyl.motivoSaida', 'sessao-expirada');
  location.href = ROTAS.entrar;
});

// Páginas que dependem de token chamam isto no início.
// A API só deixa duas rotas públicas — o catálogo, inclusive, exige token.
export function exigirLogin() {
  if (estaLogado()) return true;

  // Guarda para onde voltar depois do login.
  sessionStorage.setItem('vinyl.voltarPara', location.href);
  location.href = ROTAS.entrar;
  return false;
}

// Usado pelo auth.js depois de um login bem-sucedido.
export function destinoAposLogin() {
  const salvo = sessionStorage.getItem('vinyl.voltarPara');
  sessionStorage.removeItem('vinyl.voltarPara');
  return salvo || ROTAS.conta;
}
