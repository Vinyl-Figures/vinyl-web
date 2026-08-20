

import { ROTAS } from '../config.js';
import { estaLogado } from '../model/session.js';
import { auth } from '../model/store.js';
import { avisar, mostrarErro, alternar } from '../view/ui.js';
import { aplicarSalvas, sincronizar, oferecerAcessibilidade } from '../acessibility-features/index.js';

aplicarSalvas();

const logado = estaLogado();


document.documentElement.setAttribute('data-sessao', logado ? 'ativa' : 'inativa');


const linkConta = document.querySelector(`header nav a[href="${ROTAS.conta}"]`);
if (linkConta && !logado) {
  linkConta.textContent = 'Entrar';
  linkConta.href = ROTAS.entrar;
}

const linkContaRodape = document.querySelector(`footer nav a[href="${ROTAS.conta}"]`);
const linkEntrarRodape = document.querySelector(`footer nav a[href="${ROTAS.entrar}"]`);

alternar(linkContaRodape?.closest('li') || linkContaRodape, logado);
alternar(linkEntrarRodape?.closest('li') || linkEntrarRodape, !logado);




const primeiroCrumb = document.querySelector('main nav[aria-label="Você está aqui"] ol li:first-child a');
const crumbAtual = document.querySelector('main nav[aria-label="Você está aqui"] ol li[aria-current="page"]');
if (logado && primeiroCrumb && crumbAtual?.textContent.trim() !== 'Catálogo') {
  primeiroCrumb.textContent = 'Catálogo';
  primeiroCrumb.href = ROTAS.catalogo;
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


if (logado) {
  sincronizar().catch(() => {});
} else {


  oferecerAcessibilidade().catch(() => {});
}

let saindoPorSessao = false;
document.addEventListener('api:sessao-expirada', () => {
  if (saindoPorSessao) return;
  saindoPorSessao = true;

  sessionStorage.setItem('vinyl.voltarPara', location.href);
  sessionStorage.setItem('vinyl.motivoSaida', 'sessao-expirada');
  location.href = ROTAS.entrar;
});


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
