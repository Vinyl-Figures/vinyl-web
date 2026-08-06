// Ponto único de comunicação com a API.
// Monta a URL, coloca o Bearer, converte JSON e transforma
// qualquer falha em um ErroApi com mensagens legíveis.

import { API_BASE_URL } from '../config.js';
import { getToken, limparSessao } from './session.js';

export class ErroApi extends Error {
  constructor(status, mensagens) {
    super(mensagens[0] || 'Erro inesperado.');
    this.name = 'ErroApi';
    this.status = status;
    this.mensagens = mensagens;
  }
}

async function requisitar(metodo, caminho, { corpo, query, autenticado = true } = {}) {
  const url = new URL(API_BASE_URL + caminho);

  if (query) {
    for (const [chave, valor] of Object.entries(query)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(chave, valor);
      }
    }
  }

  const headers = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';

  if (autenticado) {
    const token = getToken();
    if (!token) throw new ErroApi(401, ['Sua sessão expirou. Entre novamente.']);
    headers.Authorization = `Bearer ${token}`;
  }

  // A API está hospedada no plano gratuito do Render, que desliga o servidor
  // depois de um tempo parado. A primeira chamada do dia leva ~35s para
  // acordar a máquina. Sem aviso, a tela parece travada.
  const avisoDemora = setTimeout(() => {
    document.dispatchEvent(new CustomEvent('api:demorando'));
  }, 3000);

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    // Servidor fora do ar, DNS ou CORS bloqueado: o fetch nem chegou a responder.
    // O navegador não deixa o JavaScript distinguir os casos por segurança,
    // então a pista fica no console para quem estiver depurando.
    console.error(
      `[api] ${metodo} ${caminho} não completou.\n` +
        'Se o console acima mostrar "blocked by CORS policy", o problema é no ' +
        'servidor: o filtro de JWT está respondendo antes do CORS, então as ' +
        'respostas 401 e as requisições OPTIONS (preflight) voltam sem o ' +
        'cabeçalho Access-Control-Allow-Origin.'
    );
    throw new ErroApi(0, ['Não foi possível falar com o servidor. Verifique se a API está no ar.']);
  } finally {
    clearTimeout(avisoDemora);
    document.dispatchEvent(new CustomEvent('api:respondeu'));
  }

  // Token recusado pelo servidor: derruba a sessão local para não insistir.
  if (resposta.status === 401 && autenticado) {
    limparSessao();
    throw new ErroApi(401, ['Sua sessão expirou. Entre novamente.']);
  }

  if (resposta.status === 204) return null;

  // A API responde erro no formato { messages: [...], status: 400 }.
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagens = Array.isArray(dados?.messages) && dados.messages.length
      ? dados.messages
      : [`Erro ${resposta.status}.`];
    throw new ErroApi(resposta.status, mensagens);
  }

  return dados;
}

export const api = {
  get: (caminho, opcoes) => requisitar('GET', caminho, opcoes),
  post: (caminho, corpo, opcoes) => requisitar('POST', caminho, { ...opcoes, corpo }),
  patch: (caminho, corpo, opcoes) => requisitar('PATCH', caminho, { ...opcoes, corpo }),
  delete: (caminho, opcoes) => requisitar('DELETE', caminho, opcoes),
};
