// Um objeto por recurso da API. Cada método é uma chamada só,
// com o nome dos campos exatamente como a especificação pede.

import { api } from './api.js';
import { salvarSessao, limparSessao, getUserId } from './session.js';

// --- Autenticação (rotas públicas + logout) ---
export const auth = {
  // POST /auth/tokens -> { token, tokenType, expiresIn, userId }
  async entrar(email, senha) {
    const resposta = await api.post(
      '/auth/tokens',
      { email, password: senha },
      { autenticado: false }
    );
    salvarSessao(resposta);
    return resposta;
  },

  // Mesmo se o servidor recusar, a sessão local tem que morrer.
  async sair() {
    try {
      await api.delete('/auth/tokens/current');
    } catch {
      // token já vencido ou servidor fora: seguir e limpar mesmo assim
    }
    limparSessao();
  },
};

// --- Usuários ---
export const usuarios = {
  // POST /users é público. document = 11 dígitos, todos os campos obrigatórios.
  criar({ name, document, cellphone, email, password }) {
    return api.post(
      '/users',
      { name, document, cellphone, email, password },
      { autenticado: false }
    );
  },

  buscar(id) {
    return api.get(`/users/${id}`);
  },

  // Só envia o que foi preenchido: todos os campos do PATCH são opcionais.
  atualizar(id, dados) {
    return api.patch(`/users/${id}`, dados);
  },

  excluir(id) {
    return api.delete(`/users/${id}`);
  },
};

// --- Catálogo ---
export const vinis = {
  // A API filtra por genreId OU artistId. Busca por texto, faixa de preço,
  // ordenação e paginação não existem no servidor: são feitas na tela.
  listar({ genreId, artistId } = {}) {
    return api.get('/vinyls', { query: { genreId, artistId } });
  },

  // expand aceita 'genres', 'artists' ou 'genres,artists'.
  buscar(id, expand) {
    return api.get(`/vinyls/${id}`, { query: { expand } });
  },
};

export const artistas = {
  listar: () => api.get('/artists'),
  buscar: (id) => api.get(`/artists/${id}`),
};

export const generos = {
  listar: () => api.get('/genres'),
  buscar: (id) => api.get(`/genres/${id}`),
};

// --- Endereços ---
// A API guarda apenas número, complemento e CEP (8 dígitos, sem traço).
export const enderecos = {
  listar: (userId) => api.get(`/users/${userId}/addresses`),

  criar: (userId, { number, complement, zipCode }) =>
    api.post(`/users/${userId}/addresses`, { number, complement, zipCode }),

  atualizar: (addressId, dados) => api.patch(`/addresses/${addressId}`, dados),

  excluir: (addressId) => api.delete(`/addresses/${addressId}`),
};

// --- Carrinho ---
// Não há quantidade: o carrinho é um conjunto de vinis, sem repetição.
export const carrinho = {
  // expand=vinyl traz título e preço junto, evitando uma chamada por item.
  listar(userId = getUserId()) {
    return api.get(`/users/${userId}/cartItems`, { query: { expand: 'vinyl' } });
  },

  // POST em lote -> { created: [...], skipped: { id: motivo } }
  adicionar(vinylIds, userId = getUserId()) {
    return api.post(`/users/${userId}/cartItems/bulk`, { vinylIds });
  },

  remover(vinylId, userId = getUserId()) {
    return api.delete(`/users/${userId}/cartItems/${vinylId}`);
  },

  esvaziar(userId = getUserId()) {
    return api.delete(`/users/${userId}/cartItems`);
  },
};

// --- Pedidos ---
export const pedidos = {
  // Checkout: a API soma o total, copia o preço para priceAtPurchase
  // e esvazia o carrinho.
  finalizar(userId = getUserId()) {
    return api.post('/orders', { userId });
  },

  listar(userId = getUserId()) {
    return api.get(`/users/${userId}/orders`);
  },

  buscar(orderId) {
    return api.get(`/orders/${orderId}`, { query: { expand: 'items' } });
  },

  itens(orderId) {
    return api.get(`/orders/${orderId}/items`);
  },

  excluir(orderId) {
    return api.delete(`/orders/${orderId}`);
  },
};

// --- Pagamentos ---
export const pagamentos = {
  criar({ userId = getUserId(), orderId, value, paymentMethod, status = 'PENDENTE' }) {
    return api.post('/payments', { userId, orderId, value, paymentMethod, status });
  },

  // Os filtros podem ser combinados.
  listar({ userId, orderId, status, paymentMethod } = {}) {
    return api.get('/payments', { query: { userId, orderId, status, paymentMethod } });
  },

  buscar: (id) => api.get(`/payments/${id}`),

  atualizarStatus: (id, status) => api.patch(`/payments/${id}`, { status }),
};

// --- Acessibilidade ---
// O catálogo de recursos vem do banco, não do front: os nomes são
// cadastrados pela API e precisam ser casados com os módulos locais.
export const acessibilidade = {
  catalogo: () => api.get('/accessibility'),

  doUsuario: (userId = getUserId()) => api.get(`/users/${userId}/accessibility`),

  selecionar: (accessibilityId, userId = getUserId()) =>
    api.post(`/users/${userId}/accessibility`, { accessibilityId }),

  remover: (accessibilityId, userId = getUserId()) =>
    api.delete(`/users/${userId}/accessibility/${accessibilityId}`),
};

// --- Gêneros favoritos ---
export const generosFavoritos = {
  listar: (userId = getUserId()) => api.get(`/users/${userId}/favoriteGenres`),

  adicionar: (genreId, userId = getUserId()) =>
    api.post(`/users/${userId}/favoriteGenres`, { genreId }),

  remover: (genreId, userId = getUserId()) =>
    api.delete(`/users/${userId}/favoriteGenres/${genreId}`),
};
