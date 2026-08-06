// Configuração da aplicação.
// Para apontar para outro servidor, troque apenas API_BASE_URL.

export const API_BASE_URL = 'https://vinyl-api-m6y9.onrender.com/api/v1';

// Para rodar contra a API local, troque pela linha abaixo:
// export const API_BASE_URL = 'http://localhost:8080/api/v1';

// Os href do HTML ainda apontam para caminhos que não existem.
// Todo redirecionamento feito por JavaScript passa por aqui, então
// consertar a navegação depois é editar só este bloco.
const dentroDePages = location.pathname.includes('/assets/pages/');
const raiz = dentroDePages ? '../../' : '';
const pages = dentroDePages ? '' : 'assets/pages/';

export const ROTAS = {
  inicio: raiz + 'index.html',
  catalogo: pages + 'catalogo.html',
  carrinho: pages + 'carrinho.html',
  conta: pages + 'conta.html',
  entrar: pages + 'entrar.html',
  cadastro: pages + 'cadastro.html',
};

// Usada quando o vinil não tem imageUrl cadastrado na API.
export const IMAGEM_PLACEHOLDER =
  (dentroDePages ? '../imagens/' : 'assets/imagens/') + 'capa-placeholder.svg';

// Enumerações aceitas pela API (seção 7.11 da especificação).
export const METODOS_PAGAMENTO = ['DEBITO', 'CREDITO', 'PIX', 'BOLETO', 'TED'];
export const STATUS_PAGAMENTO = ['PENDENTE', 'APROVADO', 'CANCELADO'];
