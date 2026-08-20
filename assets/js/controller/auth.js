import { ROTAS } from '../config.js';
import { auth, usuarios } from '../model/store.js';
import { alertar, avisar, mostrarErro, travarBotao, alternar } from '../view/ui.js';
import { apenasDigitos, aplicarMascara, mascararCpf, mascararTelefone } from '../view/mascaras.js';
import { sincronizar } from '../acessibility-features/index.js';
import { destinoAposLogin } from './app.js';



document.addEventListener('click', (evento) => {
  const botao = evento.target.closest('[data-acao="mostrar-senha"]');
  if (!botao) return;

  const campo = document.getElementById(botao.dataset.alvo);
  if (!campo) return;

  const vaiMostrar = campo.type === 'password';
  campo.type = vaiMostrar ? 'text' : 'password';
  botao.setAttribute('aria-pressed', String(vaiMostrar));
  botao.setAttribute('aria-label', vaiMostrar ? 'Ocultar senha' : 'Mostrar senha');

  alternar(botao.querySelector('[data-icone="fechado"]'), !vaiMostrar);
  alternar(botao.querySelector('[data-icone="aberto"]'), vaiMostrar);
});



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



const formCadastro = document.querySelector('#cad-nome')?.form;

if (formCadastro) {
  aplicarMascara(formCadastro.querySelector('#cad-documento'), mascararCpf);
  aplicarMascara(formCadastro.querySelector('#cad-celular'), mascararTelefone);

  formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const senha = formCadastro.querySelector('#cad-senha').value;
    const confirmacao = formCadastro.querySelector('#cad-senha-confirma').value;


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


      try {
        await auth.entrar(email, senha);
        location.href = destinoAposLogin();
      } catch {
        location.href = ROTAS.entrar;
      }
    } catch (erro) {
      travarBotao(botao, false);
      mostrarErro(erro);
    }
  });
}
