import { API_BASE_URL } from '../config.js';
import { getToken, limparSessao } from './session.js';

export class ErroApi extends Error {
  constructor(status, mensagens, contexto) {
    super(mensagens[0] || 'Erro inesperado.');
    this.name = 'ErroApi';
    this.status = status;
    this.mensagens = mensagens;
    this.contexto = contexto;
  }
}

async function requisitar(metodo, caminho, { corpo, query, autenticado = true, contexto } = {}) {
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
    if (!token) {
      document.dispatchEvent(new CustomEvent('api:sessao-expirada'));
      throw new ErroApi(401, ['Token ausente ou vencido no cliente.'], contexto);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  // O Render desliga o servidor parado: a primeira chamada leva ~35s.
  const avisoDemora = setTimeout(() => {
    document.dispatchEvent(new CustomEvent('api:demorando'));
  }, 3000);

  console.debug(`[api] ${metodo} ${url}`, corpo ?? '');

  let resposta;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    // Servidor fora, DNS ou CORS: o navegador não deixa distinguir.
    console.error(`[api] ${metodo} ${caminho} não completou. Veja se há erro de CORS acima.`);
    throw new ErroApi(0, ['Servidor inalcançável.'], contexto);
  } finally {
    clearTimeout(avisoDemora);
    document.dispatchEvent(new CustomEvent('api:respondeu'));
  }

  if (resposta.status === 401 && autenticado) {
    limparSessao();
    document.dispatchEvent(new CustomEvent('api:sessao-expirada'));
    throw new ErroApi(401, ['Token recusado pelo servidor.'], contexto);
  }

  if (resposta.status === 204) {
    console.debug(`[api] ${metodo} ${url} -> 204`);
    return null;
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagens = Array.isArray(dados?.messages) && dados.messages.length
      ? dados.messages
      : [`Erro ${resposta.status}.`];

    // Detalhe cru só no console; a tela mostra a frase da operação.
    console.error(`[api] ${metodo} ${caminho} -> ${resposta.status}`, mensagens);

    throw new ErroApi(resposta.status, mensagens, contexto);
  }

  console.debug(`[api] ${metodo} ${url} -> ${resposta.status}`, dados);

  return dados;
}

export const api = {
  get: (caminho, opcoes) => requisitar('GET', caminho, opcoes),
  post: (caminho, corpo, opcoes) => requisitar('POST', caminho, { ...opcoes, corpo }),
  patch: (caminho, corpo, opcoes) => requisitar('PATCH', caminho, { ...opcoes, corpo }),
  delete: (caminho, opcoes) => requisitar('DELETE', caminho, opcoes),
};
