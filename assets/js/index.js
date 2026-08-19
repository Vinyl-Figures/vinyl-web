/* ============================================
   VINYL FIGURES STORE
   INDEX.JS
   ============================================ */


/* ============================================
   CONFIGURAÇÃO DA API
   ============================================ */

const API_BASE_URL = "http://localhost:8080/api/v1";

const VINYLS_ENDPOINT = `${API_BASE_URL}/vinyls`;


/* ============================================
   ELEMENTOS DO HTML
   ============================================ */

const albumsGrid = document.getElementById("albumsGrid");

const previousButton =
  document.getElementById("previousAlbums");

const nextButton =
  document.getElementById("nextAlbums");


/* ============================================
   ESTADO DO CARROSSEL
   ============================================ */

let vinyls = [];

let currentPage = 0;

const albumsPerPage = 4;


/* ============================================
   CARREGAR VINIS DA API
   ============================================ */

async function loadVinyls() {

  showLoading();

  try {

    /*
      Caso o login da aplicação salve o JWT,
      procuramos os nomes mais comuns.

      Depois, quando vocês fizerem o login,
      podemos padronizar isso.
    */

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt");


    const headers = {
      "Content-Type": "application/json"
    };


    /*
      Se existir token, enviamos para a API.

      Se o GET /vinyls for público,
      funciona normalmente mesmo sem token.
    */

    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }


    const response = await fetch(
      VINYLS_ENDPOINT,
      {
        method: "GET",
        headers: headers
      }
    );


    /*
      401 = rota exige login
    */

    if (response.status === 401) {

      throw new Error(
        "Você precisa estar logado para acessar os vinis."
      );

    }


    /*
      403 = autenticado, mas sem permissão
    */

    if (response.status === 403) {

      throw new Error(
        "Você não possui permissão para acessar os vinis."
      );

    }


    /*
      Qualquer outro erro HTTP
    */

    if (!response.ok) {

      throw new Error(
        `Erro ${response.status} ao acessar a API.`
      );

    }


    const data = await response.json();


    /*
      Algumas APIs retornam:

      [
        {...},
        {...}
      ]

      Outras retornam:

      {
        content: [...]
      }

      ou:

      {
        data: [...]
      }

      Esse trecho suporta os três formatos.
    */

    vinyls = normalizeVinylResponse(data);


    if (vinyls.length === 0) {

      showEmpty();

      return;

    }


    currentPage = 0;

    renderVinyls();

  }

  catch (error) {

    console.error(
      "Erro ao carregar vinis:",
      error
    );

    showError(error.message);

  }

}


/* ============================================
   NORMALIZAR RESPOSTA
   ============================================ */

function normalizeVinylResponse(data) {

  if (Array.isArray(data)) {

    return data;

  }


  if (
    data &&
    Array.isArray(data.content)
  ) {

    return data.content;

  }


  if (
    data &&
    Array.isArray(data.data)
  ) {

    return data.data;

  }


  if (
    data &&
    Array.isArray(data.vinyls)
  ) {

    return data.vinyls;

  }


  return [];

}


/* ============================================
   RENDERIZAR VINIS
   ============================================ */

function renderVinyls() {

  albumsGrid.innerHTML = "";


  const start =
    currentPage * albumsPerPage;

  const end =
    start + albumsPerPage;


  const currentVinyls =
    vinyls.slice(start, end);


  currentVinyls.forEach(
    (vinyl, index) => {

      const card =
        createVinylCard(
          vinyl,
          index
        );

      albumsGrid.appendChild(card);

    }
  );


  updateCarouselButtons();

}


/* ============================================
   CRIAR CARD
   ============================================ */

function createVinylCard(vinyl, index) {

  const article =
    document.createElement("article");

  article.classList.add("album-card");


  /*
    Alguns possíveis nomes de campos foram
    adicionados para evitar quebra caso o DTO
    use nomes ligeiramente diferentes.
  */

  const id =
    vinyl.id ??
    vinyl.vinylId ??
    "";

  const title =
    vinyl.title ??
    vinyl.name ??
    vinyl.albumName ??
    "Vinil";

  const price =
    vinyl.price ??
    vinyl.value ??
    0;

  const image =
    vinyl.imageUrl ??
    vinyl.image ??
    vinyl.coverUrl ??
    vinyl.cover ??
    "../assets/imagens/disco-vinil.png";


  /*
    Se no backend vier artista como objeto:

    artist: {
      name: "Taylor Swift"
    }

    também funciona.
  */

  const artist =
    vinyl.artist?.name ??
    vinyl.artistName ??
    vinyl.artist ??
    "VINYL";


  /*
    Tags apenas decorativas para os
    primeiros cards.
  */

  let tag = "";

  if (index === 0) {

    tag = "NEW";

  }

  else if (index === 1) {

    tag = "HOT";

  }

  else if (index === 2) {

    tag = "LIMITED";

  }


  article.innerHTML = `

    <div class="album-image">

      ${
        tag
          ? `<span class="album-tag">${tag}</span>`
          : ""
      }

      <img
        src="${escapeHTML(image)}"
        alt="Capa do álbum ${escapeHTML(title)}"
        loading="lazy"
      >

    </div>

    <span class="artist">
      ${escapeHTML(String(artist).toUpperCase())}
    </span>

    <h3>
      ${escapeHTML(title)}
    </h3>

    <strong class="price">
      ${formatPrice(price)}
    </strong>

  `;


  /*
    Caso exista uma página de detalhes,
    enviamos o ID na URL.

    Exemplo:

    produto.html?id=5
  */

  if (id !== "") {

    article.addEventListener(
      "click",
      () => {

        window.location.href =
          `produto.html?id=${encodeURIComponent(id)}`;

      }
    );

  }


  /*
    Caso a imagem retornada pela API esteja
    quebrada, usamos o vinil padrão.
  */

  const imageElement =
    article.querySelector("img");


  imageElement.addEventListener(
    "error",
    () => {

      imageElement.src =
        "../assets/imagens/disco-vinil.png";

    }
  );


  return article;

}


/* ============================================
   FORMATAR PREÇO
   ============================================ */

function formatPrice(price) {

  const number =
    Number(price);


  if (Number.isNaN(number)) {

    return "Preço indisponível";

  }


  return number.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


/* ============================================
   SEGURANÇA DO HTML
   ============================================ */

function escapeHTML(value) {

  const element =
    document.createElement("div");

  element.textContent =
    value ?? "";

  return element.innerHTML;

}


/* ============================================
   CARROSSEL
   ============================================ */

function nextAlbums() {

  const totalPages =
    Math.ceil(
      vinyls.length /
      albumsPerPage
    );


  if (
    currentPage <
    totalPages - 1
  ) {

    currentPage++;

    renderVinyls();

  }

}


function previousAlbums() {

  if (currentPage > 0) {

    currentPage--;

    renderVinyls();

  }

}


/* ============================================
   BOTÕES DO CARROSSEL
   ============================================ */

function updateCarouselButtons() {

  const totalPages =
    Math.ceil(
      vinyls.length /
      albumsPerPage
    );


  previousButton.disabled =
    currentPage === 0;


  nextButton.disabled =
    currentPage >= totalPages - 1;

}


/* ============================================
   LOADING
   ============================================ */

function showLoading() {

  albumsGrid.innerHTML = `

    <div class="albums-message">

      <div class="loading-disc">
        ♪
      </div>

      <strong>
        Carregando discos...
      </strong>

      <span>
        Preparando o próximo giro.
      </span>

    </div>

  `;

}


/* ============================================
   SEM RESULTADOS
   ============================================ */

function showEmpty() {

  albumsGrid.innerHTML = `

    <div class="albums-message">

      <strong>
        Nenhum disco encontrado.
      </strong>

      <span>
        Novos títulos chegarão em breve.
      </span>

    </div>

  `;

}


/* ============================================
   ERRO
   ============================================ */

function showError(message) {

  albumsGrid.innerHTML = `

    <div class="albums-message error-message">

      <strong>
        Não conseguimos carregar os discos.
      </strong>

      <span>
        ${escapeHTML(message)}
      </span>

      <button
        type="button"
        id="retryVinyls"
      >
        Tentar novamente
      </button>

    </div>

  `;


  const retryButton =
    document.getElementById("retryVinyls");


  if (retryButton) {

    retryButton.addEventListener(
      "click",
      loadVinyls
    );

  }

}


/* ============================================
   EVENTOS
   ============================================ */

nextButton.addEventListener(
  "click",
  nextAlbums
);


previousButton.addEventListener(
  "click",
  previousAlbums
);


/* ============================================
   INICIAR PÁGINA
   ============================================ */

document.addEventListener(
  "DOMContentLoaded",
  loadVinyls
);