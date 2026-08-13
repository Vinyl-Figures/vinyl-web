// Frase mostrada ao usuário, escolhida por contexto da operação + status.

const POR_STATUS = {
  0: 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.',
  400: 'Confira os dados informados e tente de novo.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para fazer isso.',
  404: 'Não encontramos o que você procurava.',
  409: 'Esse registro já existe.',
  415: 'Formato de dados não aceito pelo servidor.',
  500: 'O servidor teve um problema. Tente de novo em alguns instantes.',
};

const PADRAO = 'Algo deu errado. Tente novamente.';

const POR_OPERACAO = {
  // Autenticação
  login: {
    400: 'Preencha o e-mail e a senha.',
    401: 'E-mail ou senha incorretos.',
    404: 'E-mail ou senha incorretos.',
    padrao: 'Não foi possível entrar. Tente novamente.',
  },
  logout: {
    padrao: 'Não foi possível encerrar a sessão no servidor.',
  },
  cadastro: {
    400: 'Confira os dados: há campos em branco ou fora do formato.',
    409: 'Já existe uma conta com esse e-mail, CPF ou celular.',
    padrao: 'Não foi possível criar a conta.',
  },

  // Perfil
  'perfil-carregar': { padrao: 'Não foi possível carregar seus dados.' },
  'perfil-salvar': {
    400: 'Confira os dados informados.',
    409: 'Esse e-mail ou celular já está em uso por outra conta.',
    padrao: 'Não foi possível salvar seus dados.',
  },
  'conta-excluir': { padrao: 'Não foi possível excluir a conta.' },

  // Catálogo
  'catalogo-listar': { padrao: 'Não foi possível carregar o catálogo.' },
  'vinil-carregar': {
    404: 'Esse disco não está mais disponível.',
    padrao: 'Não foi possível carregar o disco.',
  },
  'generos-listar': { padrao: 'Não foi possível carregar os gêneros.' },

  // Endereços
  'enderecos-listar': { padrao: 'Não foi possível carregar seus endereços.' },
  'endereco-criar': {
    400: 'Confira o número e o CEP.',
    padrao: 'Não foi possível salvar o endereço.',
  },
  'endereco-atualizar': {
    400: 'Confira o número e o CEP.',
    padrao: 'Não foi possível atualizar o endereço.',
  },
  'endereco-excluir': { padrao: 'Não foi possível remover o endereço.' },

  // Carrinho
  'carrinho-listar': { padrao: 'Não foi possível carregar seu carrinho.' },
  'carrinho-adicionar': {
    404: 'Esse disco não está mais disponível.',
    409: 'Esse disco já está no seu carrinho.',
    padrao: 'Não foi possível adicionar ao carrinho.',
  },
  'carrinho-atualizar': { padrao: 'Não foi possível atualizar a quantidade.' },
  'carrinho-remover': { padrao: 'Não foi possível remover o item do carrinho.' },
  'carrinho-esvaziar': { padrao: 'Não foi possível esvaziar o carrinho.' },
  'cupom-buscar': {
    404: 'Cupom não encontrado.',
    padrao: 'Não foi possível aplicar o cupom.',
  },
  'frete-calcular': {
    400: 'CEP inválido.',
    padrao: 'Não foi possível calcular o frete.',
  },

  // Pedidos
  checkout: {
    400: 'Seu carrinho está vazio ou tem itens indisponíveis.',
    padrao: 'Não foi possível finalizar a compra.',
  },
  'pedidos-listar': { padrao: 'Não foi possível carregar seus pedidos.' },
  'pedido-carregar': {
    404: 'Pedido não encontrado.',
    padrao: 'Não foi possível carregar o pedido.',
  },
  'pedido-excluir': { padrao: 'Não foi possível excluir o pedido.' },

  // Pagamentos
  'pagamento-criar': {
    400: 'Confira a forma de pagamento.',
    padrao: 'O pedido foi criado, mas o pagamento não foi registrado.',
  },
  'pagamentos-listar': { padrao: 'Não foi possível carregar os pagamentos.' },
  'pagamento-status': { padrao: 'Não foi possível atualizar o pagamento.' },

  // Acessibilidade
  'acessibilidade-carregar': {
    padrao: 'Não foi possível carregar suas preferências de acessibilidade.',
  },
  'acessibilidade-salvar': {
    padrao: 'A preferência valeu neste navegador, mas não foi salva na sua conta.',
  },
};

const STATUS_SEM_RESPOSTA = 0;

// Sessão vencida e falta de permissão explicam melhor que a frase padrão
// da operação. A operação ainda sobrescreve: no login, 401 é senha errada.
const STATUS_QUE_EXPLICAM_MELHOR = [401, 403];

export function mensagemDoErro(erro) {
  const status = erro?.status ?? null;

  if (status === STATUS_SEM_RESPOSTA) return POR_STATUS[0];

  const daOperacao = POR_OPERACAO[erro?.contexto];

  if (daOperacao?.[status]) return daOperacao[status];

  if (STATUS_QUE_EXPLICAM_MELHOR.includes(status)) return POR_STATUS[status];

  return daOperacao?.padrao || POR_STATUS[status] || PADRAO;
}
