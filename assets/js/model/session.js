// Guarda o token e o userId devolvidos pelo login.
// A API não tem rota "quem sou eu": o userId só chega no POST /auth/tokens,
// e quase toda rota pessoal é /users/{userId}/..., então ele precisa ficar salvo.
//
// Este arquivo só mexe em localStorage. Quem fala com a rede é o store.

const CHAVE = 'vinyl.sessao';

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || null;
  } catch {
    return null;
  }
}

// Recebe o TokenResp: { token, tokenType, expiresIn, userId }.
// expiresIn vem em segundos; guardamos o instante de expiração já calculado.
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

// Devolve null se não há sessão ou se o token já venceu.
// Não existe refresh token na API: quando vence, é login de novo.
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
