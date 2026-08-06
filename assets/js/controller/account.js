// Minha conta: dados pessoais, endereços, pedidos e acessibilidade.

import { getUserId } from '../model/session.js';
import { usuarios, enderecos, pedidos, pagamentos } from '../model/store.js';
import { itemEndereco, linhaPedido, preencher } from '../view/templates.js';
import { avisar, confirmar, mostrarErro, ocupado, travarBotao } from '../view/ui.js';
import { listarRecursos, preferenciasLocais, definir, sincronizar } from '../acessibility-features/index.js';
import { exigirLogin } from './app.js';

function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

// --- Dados pessoais ---

const formDados = document.querySelector('#conta-nome')?.form;

async function carregarDados() {
  const usuario = await usuarios.buscar(getUserId());

  formDados.querySelector('#conta-nome').value = usuario.name || '';
  formDados.querySelector('#conta-email').value = usuario.email || '';
  formDados.querySelector('#conta-telefone').value = usuario.cellphone || '';
}

formDados?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const botao = formDados.querySelector('button[type="submit"]');
  travarBotao(botao, true, 'Salvando…');

  try {
    // No PATCH todos os campos são opcionais: só vai o que foi preenchido.
    const dados = {};
    const nome = formDados.querySelector('#conta-nome').value.trim();
    const email = formDados.querySelector('#conta-email').value.trim();
    const telefone = apenasDigitos(formDados.querySelector('#conta-telefone').value);

    if (nome) dados.name = nome;
    if (email) dados.email = email;
    if (telefone) dados.cellphone = telefone;

    await usuarios.atualizar(getUserId(), dados);
    avisar('Dados salvos.');
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    travarBotao(botao, false);
  }
});

// --- Endereços ---

const secaoEnderecos = document.querySelector('#enderecos');
const listaEnderecos = secaoEnderecos?.querySelector('ul');
const formEndereco = document.querySelector('#end-cep')?.form;

async function carregarEnderecos() {
  ocupado(secaoEnderecos, true);
  try {
    const lista = await enderecos.listar(getUserId());
    preencher(listaEnderecos, lista.map(itemEndereco));
  } finally {
    ocupado(secaoEnderecos, false);
  }
}

formEndereco?.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const cep = apenasDigitos(formEndereco.querySelector('#end-cep').value);
  if (cep.length !== 8) {
    avisar('O CEP precisa ter 8 dígitos.', 'erro');
    return;
  }

  const botao = formEndereco.querySelector('button[type="submit"]');
  travarBotao(botao, true, 'Salvando…');

  try {
    // A API guarda apenas número, complemento e CEP.
    await enderecos.criar(getUserId(), {
      number: formEndereco.querySelector('#end-numero').value.trim(),
      complement: formEndereco.querySelector('#end-complemento').value.trim(),
      zipCode: cep,
    });

    formEndereco.reset();
    await carregarEnderecos();
    avisar('Endereço adicionado.');
  } catch (erro) {
    mostrarErro(erro);
  } finally {
    travarBotao(botao, false);
  }
});

listaEnderecos?.addEventListener('click', async (evento) => {
  const botao = evento.target.closest('[data-acao="remover-endereco"]');
  if (!botao) return;

  const confirmado = await confirmar({
    titulo: 'Remover este endereço?',
    textoConfirmar: 'Remover',
  });
  if (!confirmado) return;

  try {
    await enderecos.excluir(Number(botao.dataset.enderecoId));
    await carregarEnderecos();
    avisar('Endereço removido.');
  } catch (erro) {
    mostrarErro(erro);
  }
});

// --- Pedidos ---

const secaoPedidos = document.querySelector('#pedidos');
const corpoPedidos = secaoPedidos?.querySelector('tbody');

async function carregarPedidos() {
  ocupado(secaoPedidos, true);

  try {
    // OrderResp não traz status: ele vem do pagamento associado ao pedido.
    const [lista, listaPagamentos] = await Promise.all([
      pedidos.listar(getUserId()),
      pagamentos.listar({ userId: getUserId() }).catch(() => []),
    ]);

    const statusPorPedido = {};
    for (const pagamento of listaPagamentos) {
      statusPorPedido[pagamento.orderId] = pagamento.status;
    }

    const linhas = lista.map((pedido) =>
      linhaPedido(pedido, statusPorPedido[pedido.id] || 'Sem pagamento')
    );
    preencher(corpoPedidos, linhas);
  } finally {
    ocupado(secaoPedidos, false);
  }
}

// --- Acessibilidade ---

const formAcessibilidade = document.querySelector('#acessibilidade form');
const fieldsetAcessibilidade = formAcessibilidade?.querySelector('fieldset');

// O HTML tem quatro checkboxes. Navegação por teclado não tem checkbox,
// então os recursos que faltam são acrescentados aqui, na mesma estrutura.
function completarCheckboxes() {
  if (!fieldsetAcessibilidade) return;

  const existentes = new Set(
    [...fieldsetAcessibilidade.querySelectorAll('input[type="checkbox"]')].map((i) => i.value)
  );

  for (const recurso of listarRecursos()) {
    if (existentes.has(recurso.slug)) continue;

    const label = document.createElement('label');
    label.htmlFor = recurso.slug;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = recurso.slug;
    input.name = 'acessibilidade';
    input.value = recurso.slug;

    label.append(input, document.createTextNode(' ' + recurso.rotulo));
    fieldsetAcessibilidade.append(label);
  }
}

function marcarCheckboxes(slugsAtivos) {
  const ativos = new Set(slugsAtivos);
  for (const input of formAcessibilidade.querySelectorAll('input[name="acessibilidade"]')) {
    input.checked = ativos.has(input.value);
  }
}

// Acessibilidade tem que valer na hora, não só depois de salvar.
formAcessibilidade?.addEventListener('change', async (evento) => {
  const input = evento.target;
  if (input.name !== 'acessibilidade') return;

  try {
    await definir(input.value, input.checked);
  } catch (erro) {
    // O recurso já foi aplicado na tela e salvo no navegador;
    // aqui só falhou o envio para a conta.
    input.checked = !input.checked;
    mostrarErro(erro);
  }
});

formAcessibilidade?.addEventListener('submit', (evento) => {
  evento.preventDefault();
  // Cada marcação já foi salva quando mudou; o botão só confirma.
  avisar('Preferências de acessibilidade salvas.');
});

formAcessibilidade?.addEventListener('reset', () => {
  setTimeout(() => marcarCheckboxes(preferenciasLocais()));
});

async function carregarAcessibilidade() {
  completarCheckboxes();
  marcarCheckboxes(preferenciasLocais());

  // Depois confere com o que está salvo na conta.
  const doServidor = await sincronizar().catch(() => null);
  if (doServidor) marcarCheckboxes(doServidor);
}

// --- Início ---

if (exigirLogin()) {
  // Cada bloco carrega sozinho: um erro em pedidos não derruba o perfil.
  carregarDados().catch(mostrarErro);
  carregarEnderecos().catch(mostrarErro);
  carregarPedidos().catch(mostrarErro);
  carregarAcessibilidade().catch(() => {});
}
