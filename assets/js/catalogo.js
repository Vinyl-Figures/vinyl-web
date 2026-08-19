/* ============================================
   VINYL FIGURES STORE
   CATÁLOGO
   ============================================ */


/* ============================================
   CONFIGURAÇÃO DA API
   ============================================ */



const API_URL =
  "http://localhost:8080/api/v1/vinyls";


/* ============================================
   ELEMENTOS DO HTML
   ============================================ */

const productsGrid =
  document.getElementById("productsGrid");

const resultCount =
  document.getElementById("resultCount");

const emptyState =
  document.getElementById("emptyState");

const searchForm =
  document.getElementById("searchForm");

const searchInput =
  document.getElementById("busca");

const sortSelect =
  document.getElementById("sortSelect");

const clearFiltersButton =
  document.getElementById("clearFilters");

const applyFiltersButton =
  document.getElementById("applyFilters");

const priceMinInput =
  document.getElementById("priceMin");

const priceMaxInput =
  document.getElementById("priceMax");


/* ============================================
   ESTADO
   ============================================ */

let allVinyls = [];

let filteredVinyls = [];


/* ============================================
   BUSCAR DISCOS NA API
   ============================================ */

async function loadVinyls() {

  showLoading();

  try {

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt");


    const headers = {
      "Accept": "application/json"
    };


    if (token) {

      headers.Authorization =
        `Bearer ${token}`;

    }


    const response =
      await fetch(
        API_URL,
        {
          method: "GET",
          headers: headers
        }
      );


    if (!response.ok) {

      throw new Error(
        `Erro ${response.status} ao carregar o catálogo.`
      );

    }


    const data =
      await response.json();


    console.log(
      "Resposta da API:",
      data
    );


    allVinyls =
      normalizeResponse(data);


    filteredVinyls =
      [...allVinyls];


    applyFilters();

  }

  catch (error) {

    console.error(
      "Erro ao buscar os discos:",
      error
    );


    showError(
      error.message
    );

  }

}


/* ============================================
   NORMALIZAR RESPOSTA
   ============================================ */


function normalizeResponse(data) {

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
   RENDERIZAR DISCOS
   ============================================ */

function renderVinyls(vinyls) {

  productsGrid.innerHTML = "";


  if (vinyls.length === 0) {

    productsGrid.style.display =
      "none";


    emptyState.hidden =
      false;


    resultCount.textContent =
      "0 discos encontrados";


    return;

  }


  productsGrid.style.display =
    "grid";


  emptyState.hidden =
    true;


  vinyls.forEach(
    vinyl => {

      const card =
        createVinylCard(vinyl);


      productsGrid.appendChild(card);

    }
  );


  resultCount.textContent =
    `${vinyls.length} ${
      vinyls.length === 1
        ? "disco encontrado"
        : "discos encontrados"
    }`;

}


/* ============================================
   CRIAR CARD
   ============================================ */

function createVinylCard(vinyl) {

  const article =
    document.createElement("article");


  article.classList.add(
    "product-card"
  );




  const id =
    vinyl.id ??
    vinyl.vinylId ??
    "";


  const title =
    vinyl.title ??
    vinyl.name ??
    vinyl.albumName ??
    "Título não informado";


  const artist =
    vinyl.artist?.name ??
    vinyl.artistName ??
    vinyl.artist ??
    "Artista não informado";


  const genre =
    vinyl.genre?.name ??
    vinyl.genreName ??
    vinyl.genre ??
    "";


  const price =
    Number(
      vinyl.price ??
      vinyl.value ??
      0
    );


  const image =
    vinyl.imageUrl ??
    vinyl.image ??
    vinyl.coverUrl ??
    vinyl.cover ??
    "";


  article.dataset.name =
    `${artist} ${title}`;


  article.dataset.genre =
    String(genre);


  article.dataset.price =
    String(price);


  /* ==========================================
     IMAGEM
     ========================================== */

  const imageContainer =
    document.createElement("div");


  imageContainer.classList.add(
    "product-image"
  );


  if (image) {

    const img =
      document.createElement("img");


    img.src =
      image;


    img.alt =
      `Capa do álbum ${title}`;


    img.loading =
      "lazy";


    imageContainer.appendChild(
      img
    );

  }


  /* ==========================================
     BOTÃO CARRINHO
     ========================================== */

  const cartButton =
    document.createElement("button");


  cartButton.classList.add(
    "cart-button"
  );


  cartButton.type =
    "button";


  cartButton.textContent =
    "+";


  cartButton.setAttribute(
    "aria-label",
    `Adicionar ${title} ao carrinho`
  );


  cartButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      handleAddToCart(
        vinyl,
        cartButton
      );

    }
  );


  imageContainer.appendChild(
    cartButton
  );


  /* ==========================================
     ARTISTA
     ========================================== */

  const artistElement =
    document.createElement("span");


  artistElement.classList.add(
    "artist"
  );


  artistElement.textContent =
    String(artist).toUpperCase();


  /* ==========================================
     TÍTULO
     ========================================== */

  const titleElement =
    document.createElement("h3");


  titleElement.textContent =
    title;


  /* ==========================================
     PREÇO
     ========================================== */

  const priceElement =
    document.createElement("strong");


  priceElement.classList.add(
    "price"
  );


  priceElement.textContent =
    formatPrice(price);


  /* ==========================================
     MONTAR CARD
     ========================================== */

  article.appendChild(
    imageContainer
  );


  article.appendChild(
    artistElement
  );


  article.appendChild(
    titleElement
  );


  article.appendChild(
    priceElement
  );


  article.dataset.id =
    String(id);


  return article;

}


/* ============================================
   BUSCA E FILTROS
   ============================================ */

function applyFilters() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();


  const selectedGenres =
    Array
      .from(
        document.querySelectorAll(
          'input[name="genre"]:checked'
        )
      )
      .map(
        input =>
          input.value.toLowerCase()
      );


  const minPrice =
    priceMinInput.value
      ? Number(priceMinInput.value)
      : 0;


  const maxPrice =
    priceMaxInput.value
      ? Number(priceMaxInput.value)
      : Infinity;


  filteredVinyls =
    allVinyls.filter(
      vinyl => {

        const title =
          getTitle(vinyl)
            .toLowerCase();


        const artist =
          getArtist(vinyl)
            .toLowerCase();


        const genre =
          getGenre(vinyl)
            .toLowerCase();


        const price =
          getPrice(vinyl);


        /* BUSCA */

        const matchesSearch =
          title.includes(search) ||
          artist.includes(search);


        /* GÊNERO */

        const matchesGenre =
          selectedGenres.length === 0 ||
          selectedGenres.some(
            selectedGenre =>
              genre.includes(
                selectedGenre
              )
          );


        /* PREÇO */

        const matchesPrice =
          price >= minPrice &&
          price <= maxPrice;


        return (
          matchesSearch &&
          matchesGenre &&
          matchesPrice
        );

      }
    );


  sortVinyls();

}


/* ============================================
   ORDENAÇÃO
   ============================================ */

function sortVinyls() {

  const vinyls =
    [...filteredVinyls];


  switch (
    sortSelect.value
  ) {


    /* MENOR PREÇO */

    case "price-low":

      vinyls.sort(
        (a, b) =>
          getPrice(a) -
          getPrice(b)
      );

      break;


    /* MAIOR PREÇO */

    case "price-high":

      vinyls.sort(
        (a, b) =>
          getPrice(b) -
          getPrice(a)
      );

      break;


    /* A-Z */

    case "az":

      vinyls.sort(
        (a, b) =>
          getTitle(a)
            .localeCompare(
              getTitle(b),
              "pt-BR"
            )
      );

      break;


    /* MAIS RECENTES */

    case "recent":

      vinyls.sort(
        (a, b) => {

          const dateA =
            new Date(
              a.createdAt ??
              a.releaseDate ??
              a.releasedAt ??
              0
            );


          const dateB =
            new Date(
              b.createdAt ??
              b.releaseDate ??
              b.releasedAt ??
              0
            );


          return (
            dateB - dateA
          );

        }
      );

      break;

  }


  renderVinyls(
    vinyls
  );

}


/* ============================================
   CARRINHO
   ============================================ */

function handleAddToCart(
  vinyl,
  button
) {


  console.log(
    "Disco selecionado:",
    vinyl
  );


  button.textContent =
    "✓";


  button.classList.add(
    "added"
  );


  setTimeout(
    () => {

      button.textContent =
        "+";


      button.classList.remove(
        "added"
      );

    },
    1200
  );

}


/* ============================================
   FUNÇÕES AUXILIARES
   ============================================ */

function getTitle(vinyl) {

  return String(
    vinyl.title ??
    vinyl.name ??
    vinyl.albumName ??
    ""
  );

}


function getArtist(vinyl) {

  return String(
    vinyl.artist?.name ??
    vinyl.artistName ??
    vinyl.artist ??
    ""
  );

}


function getGenre(vinyl) {

  return String(
    vinyl.genre?.name ??
    vinyl.genreName ??
    vinyl.genre ??
    ""
  );

}


function getPrice(vinyl) {

  return Number(
    vinyl.price ??
    vinyl.value ??
    0
  );

}


function formatPrice(price) {

  const value =
    Number(price);


  if (
    Number.isNaN(value)
  ) {

    return "Preço indisponível";

  }


  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


/* ============================================
   LOADING
   ============================================ */

function showLoading() {

  productsGrid.style.display =
    "grid";


  emptyState.hidden =
    true;


  productsGrid.innerHTML = `

    <div class="products-message">

      <div class="loading-disc">
        ♪
      </div>

      <strong>
        Carregando discos...
      </strong>

      <span>
        Preparando sua coleção.
      </span>

    </div>

  `;


  resultCount.textContent =
    "Carregando catálogo...";

}


/* ============================================
   ERRO
   ============================================ */

function showError(message) {

  productsGrid.style.display =
    "grid";


  emptyState.hidden =
    true;


  productsGrid.innerHTML = `

    <div class="products-message error-message">

      <strong>
        Não foi possível carregar o catálogo.
      </strong>

      <span>
        ${message}
      </span>

      <button
        type="button"
        id="retryCatalog"
      >
        TENTAR NOVAMENTE
      </button>

    </div>

  `;


  resultCount.textContent =
    "Erro ao carregar catálogo";


  const retryButton =
    document.getElementById(
      "retryCatalog"
    );


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

/* BUSCAR */

searchForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();

    applyFilters();

  }
);


/* BUSCA EM TEMPO REAL */

searchInput.addEventListener(
  "input",
  applyFilters
);


/* APLICAR FILTROS */

applyFiltersButton.addEventListener(
  "click",
  applyFilters
);


/* ORDENAR */

sortSelect.addEventListener(
  "change",
  sortVinyls
);


/* LIMPAR FILTROS */

clearFiltersButton.addEventListener(
  "click",
  () => {

    searchInput.value =
      "";


    priceMinInput.value =
      "";


    priceMaxInput.value =
      "";


    document
      .querySelectorAll(
        'input[name="genre"]'
      )
      .forEach(
        checkbox => {

          checkbox.checked =
            false;

        }
      );


    filteredVinyls =
      [...allVinyls];


    sortSelect.value =
      "recent";


    sortVinyls();

  }
);


/* ============================================
   INICIALIZAÇÃO
   ============================================ */

document.addEventListener(
  "DOMContentLoaded",
  loadVinyls
);