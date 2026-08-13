# Vinyl Figures Store

Loja virtual de discos de vinil. Front-end estático (HTML + JS puro, sem
build, sem framework) que consome a API real do
[`vinyl-api`](https://github.com/Vinyl-Figures/vinyl-api) (Spring Boot +
Postgres, hospedada no Render).

## Stack

- HTML semântico, sem template engine.
- JavaScript com módulos ES nativos (`<script type="module">`), sem bundler
  nem `package.json` — cada página carrega um único script direto no
  navegador.
- Sem CSS ainda (só uma folha mínima que `view/ui.js` injeta em runtime para
  os popups, e outra que `acessibility-features/DyslexiaFont.js` injeta
  quando esse recurso é ativado).

## Como rodar

Não tem passo de build. Basta abrir `index.html` num navegador (ou servir a
pasta com qualquer servidor estático). A API usada fica em
`assets/js/config.js` (`API_BASE_URL`).

## Arquitetura

Camadas inspiradas em MVC, cada uma na sua pasta dentro de `assets/js/`:

```
config.js              rotas (ROTAS), URL da API, constantes
model/
  api.js                único ponto de fetch: headers, token, timeout de
                         cold-start do Render, tradução de erro em ErroApi
  session.js            sessão em localStorage (token, expiração)
  store.js               wrappers da API por recurso: auth, usuarios, vinis,
                         carrinho, pedidos, pagamentos, acessibilidade...
view/
  ui.js                 popups (<dialog>), avisos, formatação, spinners
  templates.js           monta elementos DOM a partir de dados da API
  erros.js               mensagem de erro por contexto + status HTTP
  mascaras.js             máscara de CPF/telefone/CEP nos inputs
  tema.js                 preferência de claro/escuro (só localStorage)
controller/
  app.js                 roda em toda página: sessão, nav condicional,
                         tema, popup de acessibilidade, logout
  catalog.js, cart.js,
  auth.js, account.js     lógica de cada página, ligada direto ao HTML
                         por seletor (sem framework)
acessibility-features/
  index.js               orquestra os recursos, localStorage + sync com API
  HighContrast.js, IncreasedText.js, CursorHighlight.js, Speaker.js,
  DyslexiaFont.js         um módulo por recurso, plugável
```

Cada página em `assets/pages/*.html` carrega só o controller que precisa
(`catalog.js`, `cart.js`, `auth.js` ou `account.js`); `app.js` roda em todas,
direto (`index.html`) ou por import transitivo (os outros controllers
importam `exigirLogin`/`destinoAposLogin` dele, o que já executa seu código
de topo de módulo).

## Autenticação

Sessão fica em `localStorage` (token JWT + expiração), sem refresh token.
`exigirLogin()` (em `app.js`) redireciona pra `entrar.html` guardando a URL
de origem em `sessionStorage`, pra voltar depois do login. Das rotas da API,
só `POST /users` e `POST /auth/tokens` são públicas — até listar o catálogo
exige token.

## Acessibilidade

Sistema plugável em `acessibility-features/`: cada módulo exporta
`{ slug, rotulo, apelidos, aplicar(ativo) }`. `index.js` mantém a lista
ativa em `localStorage` (`vinyl.acessibilidade`) e, quando há sessão, também
sincroniza com a API (`GET/POST/DELETE /users/{id}/accessibility`).

- **Navegação por teclado** não é preferência — fica sempre ativa (skip link
  + atalhos `Alt+1..4`), porque sem ela não tem como alcançar o toggle dela
  mesma.
- **Sem sessão** não existe como chegar na tela de Acessibilidade (fica
  atrás de login), então `app.js` dispara um popup falado uma vez por aba
  oferecendo todos os recursos, com "Leitor de tela" pré-marcado e o botão
  de salvar já focado.
- **Fonte para dislexia** é o único recurso "visual" que já funciona de
  ponta a ponta (injeta o próprio CSS). Alto contraste, texto aumentado e
  realce de cursor só setam atributo `data-a11y-*` no `<html>` — funcionam,
  mas esperam um CSS que ainda não foi escrito.

## Limitações conhecidas

- Sem folha de estilo própria — o site é funcional mas não tem visual
  desenhado ainda.
- Carrinho é um conjunto, não suporta quantidade por item (restrição real
  do schema do `vinyl-api`: `UNIQUE(id_user, id_vinyl)` em `carts`).
- Cupom e frete no carrinho ficam desabilitados — a API não tem essas
  rotas.
