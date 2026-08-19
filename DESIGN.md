# DESIGN.md — Vinyl Figures Store

Referência do sistema visual. Documenta o que **existe hoje** e define o
vocabulário para mudanças futuras. A identidade é editorial/tipográfica:
preto e branco de base, um único azul de destaque, tipografia pesada com
tracking negativo, tudo em pílula ou card arredondado.

Não é um redesign. É o registro do que já está construído, com os pontos
onde o sistema ainda não é sistema.

---

## 1. Identidade

O que define visualmente este projeto e **não deve mudar**:

| Elemento | Valor | Onde |
|---|---|---|
| Tipografia | `Syne`, 400–800 | Google Fonts, `base.css` |
| Base | Preto sobre branco | `body` |
| Header/footer | Barra preta sólida, texto branco | `base.css` |
| Destaque | `#105682` (azul petróleo) | botões, foco, paginação, checkbox |
| Forma dominante | Pílula (`border-radius: 30px`) | botões, inputs, chips |
| Forma de contêiner | Card (`border-radius: 16px`) | formulários, cards de produto |
| Títulos | 700–800, `letter-spacing` negativo | todos os `h1`/`h2` |
| Hero | Disco de vinil girando, sangrando pela direita | `index.html` |

O azul `#105682` foi escolhido deliberadamente (ver histórico: a paleta era
100% preto e branco e o recurso de alto contraste ficava inútil). Uma
tentativa de laranja `#FD871D` no tema escuro foi testada e **revertida**.
Cor de destaque única, nos dois temas.

---

## 2. Arquitetura CSS

Sem build, sem framework. Quatro folhas, carregadas na ordem:

```
base.css       → reset, fonte, header, footer, breadcrumb,
                 popups (data-vinyl-ui), tema escuro, acessibilidade
style.css      → só o hero da index
catalogo.css   → catálogo (busca, filtros, grid de cards, paginação)
paginas.css    → entrar, cadastro, conta, carrinho (forms, tabelas, dl)
disco.css      → detalhe do disco (reaproveita classes do catalogo.css)
```

Regras de convivência já estabelecidas:

- **`base.css` sempre primeiro.** Ele contém o reset e os overrides de
  tema; o resto sobrescreve por especificidade natural, não por ordem.
- **Seletores estruturais, não classes.** O HTML é semântico e quase sem
  `class` — o CSS mira `main section ul li article`, `nav[aria-label="..."]`,
  `[data-acao="..."]`. Classes só quando a estrutura não distingue
  (`.stepper-qtd`, `.campo-senha`, `.linha-acao-catalogo`, `.disco-*`).
- **`data-*` é a interface JS↔CSS.** `data-tema`, `data-a11y-*`,
  `data-vinyl-ui`, `data-acao`, `data-sessao`.
- **Sem `!important`,** com uma exceção documentada: `[hidden]`, porque a
  regra do navegador perde para qualquer `display:flex` de autor — é
  problema de origem na cascata, não de especificidade.

### Temas

`data-tema="escuro"` no `<html>`, setado por `view/tema.js`. Não há
`prefers-color-scheme` no CSS porque o JS sempre resolve para um valor
concreto antes da primeira pintura.

Hoje cada regra de tema escuro é um bloco duplicado do bloco claro. É a
maior fonte de repetição do projeto (ver §6).

### Acessibilidade

| Atributo | Efeito |
|---|---|
| `data-a11y-texto="grande"` | `:root { font-size: 120% }` |
| `data-a11y-cursor="realce"` | contorno laranja no elemento sob o ponteiro |
| `data-a11y-fonte="dislexia"` | CSS injetado pelo próprio `DyslexiaFont.js` |

`data-a11y-contraste` (alto contraste) foi **removido** — a paleta com o
azul de destaque já dá contraste suficiente e o recurso era redundante.

Navegação por teclado: `Alt+1..4` (atalhos globais, sempre ativos) e
foco visível em todo link/botão. Diálogos devolvem o foco a quem os abriu.

---

## 3. Cor

### Base

| Papel | Claro | Escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#1c1c1c` |
| Texto | `#000000` | `#f5f5f5` |
| Superfície (card/form) | `#f9f9f9` · `#fafafa` | `#262626` |
| Borda de superfície | `#e5e5e5` · `#eaeaea` | `#2a2a2a` |
| Campo (input) | `#ffffff` | `#1c1c1c` |
| Borda de campo | `#dcdcdc` | `#333333` |
| Header | `#000000` | `#000000` |
| Footer | `#0c0c0c` | `#0c0c0c` |

### Destaque e semântica

| Papel | Valor |
|---|---|
| Destaque | `#105682` |
| Destaque (hover) | `#0c4160` |
| Destaque (fundo suave) | `rgba(16, 86, 130, 0.08)` |
| Erro | `#c0392b` claro · `#e74c3c` escuro |
| Info | `#2d6cdf` claro · `#5b9bf5` escuro |
| Sucesso | preto/branco (sem cor própria — é o padrão do toast) |
| Realce de cursor (a11y) | `#ff5a00` |

### Texto secundário

`#555555` (corpo), `#666666` (`dt`), `#777777` (`thead th`), `#999999`
(escuro). No escuro: `#cccccc`, `#bbbbbb`, `#999999`.

> **Dívida conhecida:** há 12 cinzas em uso, vários indistinguíveis entre
> si (`#e0e0e0` / `#e5e5e5` / `#eaeaea`). E `#777777` sobre branco dá
> **4.48:1** — abaixo do mínimo AA de 4.5:1 para texto normal.

---

## 4. Tipografia

Uma família só: `Syne`, variável 400–800.

### Escala em uso

| Uso | Tamanho | Peso | Tracking |
|---|---|---|---|
| Hero `h1` (index) | `4.8rem` | 800 | `-2.5px` |
| `h1` catálogo | `3.5rem` | 800 | `-2px` |
| `h1` páginas | `3rem` | 800 | `-1.5px` |
| `h1` disco | `2.5rem` | 800 | `-1px` |
| `h2` seção | `1.2`–`1.3rem` | 700 | — |
| `h2` diálogo | `1.25rem` | 800 | `-0.5px` |
| `h3` card | `1rem` | 700 | — |
| Corpo | `0.9`–`0.95rem` | 400–500 | — |
| Rótulo/UI | `0.85rem` | 600 | — |
| Meta/tabela | `0.8rem` | 600 | `0.5px` (caixa alta) |

### Regras

- Peso **800** só em display (`h1`, total do resumo, `h2` de diálogo).
- Peso **600** é o padrão de UI (rótulo, botão, chip).
- `thead th` é a única caixa alta do projeto, com tracking positivo.
- Preço no card e no detalhe usa peso alto — é âncora de leitura.

> **Dívida conhecida:** os tamanhos são valores soltos, sem razão entre
> eles, e o `letter-spacing` está em `px` — não acompanha o `font-size`
> quando o recurso "texto aumentado" muda a raiz para 120%. Não existe
> `line-height` global: o padrão do navegador (~1.2) vale para quase todo
> o corpo de texto.

---

## 5. Espaçamento, forma e elevação

### Raios

| Forma | Raio |
|---|---|
| Pílula (botão, input, chip) | `30px` |
| Card / formulário / diálogo | `16px` |
| Card interno (endereço, tabela) | `12px` |
| Imagem de capa | `10px` |
| Checkbox | `6px` |
| Círculo (paginação, badge) | `50%` |

### Sombra

Só em elementos que flutuam:

```
card hover  →  0 10px 25px rgba(0,0,0,0.08)
toast       →  0 15px 35px rgba(0,0,0,0.18)
diálogo     →  0 20px 50px rgba(0,0,0,0.25)
```

Superfícies em repouso usam **borda**, nunca sombra.

### Espaçamento

Valores em uso: `4 · 5 · 6 · 7 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 ·
25 · 28 · 30 · 32 · 35 · 40 · 50 · 60 · 80`.

> **Dívida conhecida:** não há escala. São 21 valores distintos, muitos
> separados por 2px — diferença que não se lê como intenção.

### Larguras

| Página | `max-width` |
|---|---|
| Catálogo | `1400px` |
| Detalhe do disco | `1100px` |
| Formulários / conta / carrinho | `900px` |
| Diálogo | `28rem` |
| Toast | `420px` |
| Hero | largura total (sangra) |

---

## 6. Estados de interação

| Estado | Tratamento atual |
|---|---|
| `:hover` botão primário | escurece o fundo (`#105682` → `#0c4160`) |
| `:hover` botão de diálogo | `opacity: 0.8` |
| `:hover` card | sobe 5px + sombra |
| `:hover` chip/paginação | inverte para o azul |
| `:focus` campo | borda azul |
| `:focus-visible` | anel `2px` azul (branco no escuro) |
| `:checked` | preenche de azul |
| Carregando (bloco) | `<progress>` indeterminado + `aria-busy` |
| Carregando (botão) | spinner circular + texto, `disabled` |

> **Dívidas conhecidas:**
> - **Não existe `:active`** em lugar nenhum — nenhum botão responde ao
>   clique enquanto pressionado.
> - **Não existe `:disabled`.** O JS *desabilita* elementos de verdade
>   (`travarBotao()`, o `<select>` de endereço durante o cálculo do frete),
>   mas eles continuam com a aparência de clicáveis.
> - `opacity` como hover no diálogo destoa do resto (que muda cor de fundo).
> - Card tem `:hover` mas não `:focus-within` — quem navega por teclado
>   não recebe o mesmo destaque.
> - **Sem `prefers-reduced-motion`,** com três animações ativas, incluindo
>   o vinil girando em laço infinito.

---

## 7. Componentes

### Botões

```
primário   fundo #105682, texto branco, pílula, 600
secundário fundo #e0e0e0, texto preto        (type="reset")
diálogo    contorno preto sobre branco; o último filho é o primário
stepper    fantasma, só ícone, dentro da pílula do grupo
```

### Campos

Pílula de `1px`, fundo branco, foco azul. `<select>` segue o mesmo
tratamento. Checkbox é customizado (`appearance: none` + `::after`) — a
caixa nativa destoava dos campos arredondados.

Chips de gênero (catálogo) são `<label>` envolvendo checkbox, com estado
marcado via `:has()`.

### Card de produto

`article` em coluna, altura total da célula do grid (para que fileiras
fiquem alinhadas mesmo com descrições de tamanhos diferentes). Imagem
`1:1`, título, preço, descrição opcional, e a linha de ação
(stepper + "Adicionar ao carrinho") colada embaixo via `margin-top: auto`.

Imagem e título são um `<a>` para o detalhe — link de verdade, não clique
no card inteiro, porque o card já contém dois outros controles.

### Popups (`view/ui.js`)

`<dialog>` nativo com `showModal()`. Variantes: `alertar`, `confirmar`,
`escolher`, `escolherVarios`, `pedirCampos`. Todas devolvem o foco ao
elemento invocador ao fechar.

### Toast

Card fixo no topo, borda esquerda colorida por tipo, entra deslizando.
`role="status"` + `aria-live="polite"`.

---

## 8. Princípios

1. **Semântica primeiro.** Se o HTML descreve a coisa, o CSS a encontra.
   Classe só quando a estrutura não basta.
2. **Uma cor de destaque.** Novas cores precisam de justificativa forte.
3. **Borda em repouso, sombra em elevação.**
4. **Especificidade em vez de `!important`.**
5. **Estados são funcionalidade,** não enfeite: se o JS desabilita, o CSS
   mostra desabilitado.
6. **Contraste é requisito.** Alvo: AA (4.5:1 texto, 3:1 UI e foco).
7. **Sem padrão genérico.** Nada de gradiente decorativo, glassmorphism,
   sombra colorida ou emoji como ícone.
