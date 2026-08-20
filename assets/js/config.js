export const API_BASE_URL = 'http://localhost:8080/api/v1';
// Produção: 'https://api-production-0425.up.railway.app/api/v1'

// Todo redirecionamento feito por JavaScript passa por ROTAS.
const dentroDePages = location.pathname.includes('/assets/pages/');
const raiz = dentroDePages ? '../../' : '';
const pages = dentroDePages ? '' : 'assets/pages/';

export const ROTAS = {
  inicio: raiz + 'index.html',
  catalogo: pages + 'catalogo.html',
  disco: pages + 'disco.html',
  carrinho: pages + 'carrinho.html',
  conta: pages + 'conta.html',
  entrar: pages + 'entrar.html',
  cadastro: pages + 'cadastro.html',
};

export const METODOS_PAGAMENTO = ['DEBITO', 'CREDITO', 'PIX', 'BOLETO', 'TED'];
