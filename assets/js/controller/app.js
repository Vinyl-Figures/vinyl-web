// Roda em todas as páginas.

import { ROTAS } from '../config.js';
import { estaLogado } from '../model/session.js';
import { auth } from '../model/store.js';
import { avisar, mostrarErro, alternar } from '../view/ui.js';
import { aplicarSalvas, sincronizar, oferecerAcessibilidade } from '../acessibility-features/index.js';
import { aplicarSalvo, temaAtual, alternarTema } from '../view/tema.js';

aplicarSalvas();
aplicarSalvo();

const logado = estaLogado();

// html[data-sessao="inativa"] fica disponível para o CSS.
document.documentElement.setAttribute('data-sessao', logado ? 'ativa' : 'inativa');

// Sem sessão, "Conta" vira "Entrar" no header, e o footer mostra só o link certo.
const linkConta = document.querySelector(`header nav a[href="${ROTAS.conta}"]`);
if (linkConta && !logado) {
  linkConta.textContent = 'Entrar';
  linkConta.href = ROTAS.entrar;
}

alternar(document.querySelector(`footer nav a[href="${ROTAS.conta}"]`)?.closest('li'), logado);
alternar(document.querySelector(`footer nav a[href="${ROTAS.entrar}"]`)?.closest('li'), !logado);

// Logado, o catálogo é o destino padrão (destinoAposLogin já reflete
// isso) — o rastro de pão troca "Início" por "Catálogo", exceto na
// própria página do catálogo (senão viraria "Catálogo > Catálogo").
const primeiroCrumb = document.querySelector('main > nav[aria-label="Você está aqui"] ol li:first-child a');
const crumbAtual = document.querySelector('main > nav[aria-label="Você está aqui"] ol li[aria-current="page"]');
if (logado && primeiroCrumb && crumbAtual?.textContent.trim() !== 'Catálogo') {
  primeiroCrumb.textContent = 'Catálogo';
  primeiroCrumb.href = ROTAS.catalogo;
}

// Sem CSS ainda: o botão só troca o atributo no <html> e o próprio rótulo.
function rotuloTema(tema) {
  return tema === 'escuro' ? 'Modo claro' : 'Modo escuro';
}

const botaoTema = document.querySelector('[data-acao="alternar-tema"]');
if (botaoTema) {
  botaoTema.textContent = rotuloTema(temaAtual());
  botaoTema.addEventListener('click', () => {
    botaoTema.textContent = rotuloTema(alternarTema());
  });
}

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
if (logado) {
  sincronizar().catch(() => {});
} else {
  // Sem sessão não existe como chegar na tela de Acessibilidade: oferece
  // os recursos direto, falado, pra quem não enxerga a página.
  oferecerAcessibilidade().catch(() => {});
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
  return salvo || ROTAS.catalogo;
}
