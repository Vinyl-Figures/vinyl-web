


import { api } from './api.js';
import { salvarSessao, limparSessao, getUserId } from './session.js';

export const auth = {
  async entrar(email, senha) {
    const resposta = await api.post(
      '/auth/tokens',
      { email, password: senha },
      { autenticado: false, contexto: 'login' }
    );
    salvarSessao(resposta);
    return resposta;
  },

  async sair() {
    try {
      await api.delete('/auth/tokens/current', { contexto: 'logout' });
    } catch {

    }
    limparSessao();
  },
};

export const usuarios = {
  criar({ name, document, cellphone, email, password }) {
    return api.post(
      '/users',
      { name, document, cellphone, email, password },
      { autenticado: false, contexto: 'cadastro' }
    );
  },

  buscar(id) {
    return api.get(`/users/${id}`, { contexto: 'perfil-carregar' });
  },

  atualizar(id, dados) {
    return api.patch(`/users/${id}`, dados, { contexto: 'perfil-salvar' });
  },

  excluir(id) {
    return api.delete(`/users/${id}`, { contexto: 'conta-excluir' });
  },
};

export const vinis = {


  listar({ genreId, artistId } = {}) {
    return api.get('/vinyls', {
      query: { genreId, artistId },
      contexto: 'catalogo-listar',
    });
  },


  buscar(id, expand) {
    return api.get(`/vinyls/${id}`, { query: { expand }, contexto: 'vinil-carregar' });
  },
};

export const generos = {
  listar: () => api.get('/genres', { contexto: 'generos-listar' }),
  buscar: (id) => api.get(`/genres/${id}`, { contexto: 'generos-listar' }),
};


export const enderecos = {
  listar: (userId) =>
    api.get(`/users/${userId}/addresses`, { contexto: 'enderecos-listar' }),

  criar: (userId, { number, complement, zipCode }) =>
    api.post(
      `/users/${userId}/addresses`,
      { number, complement, zipCode },
      { contexto: 'endereco-criar' }
    ),

  atualizar: (addressId, dados) =>
    api.patch(`/addresses/${addressId}`, dados, { contexto: 'endereco-atualizar' }),

  excluir: (addressId) =>
    api.delete(`/addresses/${addressId}`, { contexto: 'endereco-excluir' }),
};


export const carrinho = {
  listar(userId = getUserId()) {
    return api.get(`/users/${userId}/cartItems`, {
      query: { expand: 'vinyl' },
      contexto: 'carrinho-listar',
    });
  },


  adicionar(vinylIds, userId = getUserId()) {
    return api.post(
      `/users/${userId}/cartItems/bulk`,
      { vinylIds },
      { contexto: 'carrinho-adicionar' }
    );
  },

  atualizar(vinylId, quantity, userId = getUserId()) {
    return api.patch(`/users/${userId}/cartItems/${vinylId}`, { quantity }, {
      contexto: 'carrinho-atualizar',
    });
  },

  remover(vinylId, userId = getUserId()) {
    return api.delete(`/users/${userId}/cartItems/${vinylId}`, {
      contexto: 'carrinho-remover',
    });
  },

  esvaziar(userId = getUserId()) {
    return api.delete(`/users/${userId}/cartItems`, { contexto: 'carrinho-esvaziar' });
  },
};

export const cupons = {
  buscar: (code) => api.get(`/coupons/code/${code}`, { contexto: 'cupom-buscar' }),
};

export const pedidos = {



  finalizar({ userId = getUserId(), zipCode, couponCode } = {}) {
    return api.post('/orders', { userId, zipCode, couponCode }, { contexto: 'checkout' });
  },

  listar(userId = getUserId()) {
    return api.get(`/users/${userId}/orders`, { contexto: 'pedidos-listar' });
  },

  buscar(orderId) {
    return api.get(`/orders/${orderId}`, {
      query: { expand: 'items' },
      contexto: 'pedido-carregar',
    });
  },

  itens(orderId) {
    return api.get(`/orders/${orderId}/items`, { contexto: 'pedido-carregar' });
  },

  excluir(orderId) {
    return api.delete(`/orders/${orderId}`, { contexto: 'pedido-excluir' });
  },
};

export const pagamentos = {
  criar({ userId = getUserId(), orderId, value, paymentMethod, status = 'PENDENTE' }) {
    return api.post(
      '/payments',
      { userId, orderId, value, paymentMethod, status },
      { contexto: 'pagamento-criar' }
    );
  },

  listar({ userId, orderId, status, paymentMethod } = {}) {
    return api.get('/payments', {
      query: { userId, orderId, status, paymentMethod },
      contexto: 'pagamentos-listar',
    });
  },

  buscar: (id) => api.get(`/payments/${id}`, { contexto: 'pagamentos-listar' }),

  atualizarStatus: (id, status) =>
    api.patch(`/payments/${id}`, { status }, { contexto: 'pagamento-status' }),
};


export const acessibilidade = {
  catalogo: () => api.get('/accessibility', { contexto: 'acessibilidade-carregar' }),

  doUsuario: (userId = getUserId()) =>
    api.get(`/users/${userId}/accessibility`, { contexto: 'acessibilidade-carregar' }),

  selecionar: (accessibilityId, userId = getUserId()) =>
    api.post(
      `/users/${userId}/accessibility`,
      { accessibilityId },
      { contexto: 'acessibilidade-salvar' }
    ),

  remover: (accessibilityId, userId = getUserId()) =>
    api.delete(`/users/${userId}/accessibility/${accessibilityId}`, {
      contexto: 'acessibilidade-salvar',
    }),
};
