import { ROTAS } from '../config.js';
import { auth, usuarios } from '../model/store.js';
import { alertar, avisar, mostrarErro, travarBotao } from '../view/ui.js';
import { sincronizar } from '../acessibility-features/index.js';
import { destinoAposLogin } from './app.js';

function apenasDigitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

// --- Entrar ---

const formEntrar = document.querySelector('#login-email')?.form;

if (formEntrar) {
  if (sessionStorage.getItem('vinyl.motivoSaida') === 'sessao-expirada') {
    sessionStorage.removeItem('vinyl.motivoSaida');
    avisar('Sua sessão expirou. Entre novamente.', 'info');
  }

  formEntrar.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const botao = formEntrar.querySelector('button[type="submit"]');
    travarBotao(botao, true, 'Entrando…');

    try {
      await auth.entrar(
        formEntrar.querySelector('#login-email').value.trim(),
        formEntrar.querySelector('#login-senha').value
      );

      await sincronizar().catch(() => {});

      location.href = destinoAposLogin();
    } catch (erro) {
      travarBotao(botao, false);
      mostrarErro(erro);
    }
  });
}

// --- Criar conta ---

const formCadastro = document.querySelector('#cad-nome')?.form;

if (formCadastro) {
  formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const senha = formCadastro.querySelector('#cad-senha').value;
    const confirmacao = formCadastro.querySelector('#cad-senha-confirma').value;

    // A API não recebe o campo de confirmação.
    if (senha !== confirmacao) {
      alertar({
        titulo: 'As senhas não conferem',
        mensagem: 'Digite a mesma senha nos dois campos.',
        tipo: 'erro',
      });
      return;
    }

    const documento = apenasDigitos(formCadastro.querySelector('#cad-documento')?.value);
    if (documento.length !== 11) {
      alertar({
        titulo: 'CPF inválido',
        mensagem: 'O CPF precisa ter 11 dígitos.',
        tipo: 'erro',
      });
      return;
    }

    const email = formCadastro.querySelector('#cad-email').value.trim();

    const botao = formCadastro.querySelector('button[type="submit"]');
    travarBotao(botao, true, 'Criando…');

    try {
      // newsletter não tem campo na API: não é enviado.
      await usuarios.criar({
        name: formCadastro.querySelector('#cad-nome').value.trim(),
        document: documento,
        cellphone: apenasDigitos(formCadastro.querySelector('#cad-celular')?.value),
        email,
        password: senha,
      });

      await alertar({
        titulo: 'Cadastro realizado com sucesso',
        mensagem: 'Sua conta foi criada. Vamos entrar com ela agora.',
      });

      // O cadastro não devolve token: precisa logar em seguida.
      try {
        await auth.entrar(email, senha);
        location.href = ROTAS.conta;
      } catch {
        location.href = ROTAS.entrar;
      }
    } catch (erro) {
      travarBotao(botao, false);
      mostrarErro(erro);
    }
  });
}
