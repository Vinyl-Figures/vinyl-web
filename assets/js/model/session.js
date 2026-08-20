

const CHAVE = 'vinyl.sessao';

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || null;
  } catch {
    return null;
  }
}


export function salvarSessao({ token, expiresIn, userId }) {
  localStorage.setItem(
    CHAVE,
    JSON.stringify({
      token,
      userId,
      expiraEm: Date.now() + (expiresIn || 0) * 1000,
    })
  );
}

export function limparSessao() {
  localStorage.removeItem(CHAVE);
}


export function getToken() {
  const sessao = ler();
  if (!sessao) return null;

  if (sessao.expiraEm && Date.now() >= sessao.expiraEm) {
    limparSessao();
    return null;
  }
  return sessao.token;
}

export function getUserId() {
  return getToken() ? ler().userId : null;
}

export function estaLogado() {
  return getToken() !== null;
}
