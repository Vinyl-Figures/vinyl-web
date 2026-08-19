const cartItems =
  document.getElementById("cartItems");

const cartCount =
  document.getElementById("cartCount");

const subtotalValue =
  document.getElementById("subtotalValue");

const shippingValue =
  document.getElementById("shippingValue");

const totalValue =
  document.getElementById("totalValue");

const emptyCart =
  document.getElementById("emptyCart");

const cartForm =
  document.getElementById("cartForm");

const checkoutButton =
  document.getElementById("checkoutButton");

const applyCouponButton =
  document.getElementById("applyCouponButton");

const shippingButton =
  document.getElementById("shippingButton");

const couponInput =
  document.getElementById("cupom");

const cepInput =
  document.getElementById("cep");


let cart = null;

let shipping = 0;


function getToken() {

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt")
  );

}


async function loadCart() {

  showLoading();


  const token =
    getToken();


  if (!token) {

    showError(
      "Entre na sua conta para carregar o carrinho."
    );

    return;

  }


  try {

    const cartUrl =
      localStorage.getItem("cartApiUrl");


    if (!cartUrl) {

      showError(
        "A rota do carrinho ainda não foi configurada."
      );

      return;

    }


    const response =
      await fetch(
        cartUrl,
        {
          method: "GET",

          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `Erro ${response.status} ao carregar o carrinho.`
      );

    }


    const data =
      await response.json();


    cart =
      normalizeCart(data);


    renderCart();

  }

  catch (error) {

    console.error(
      "Erro ao carregar carrinho:",
      error
    );


    showError(
      error.message
    );

  }

}


function normalizeCart(data) {

  if (!data) {

    return {
      items: []
    };

  }


  if (Array.isArray(data)) {

    return {
      items: data
    };

  }


  if (Array.isArray(data.items)) {

    return data;

  }


  if (
    data.cart &&
    Array.isArray(data.cart.items)
  ) {

    return data.cart;

  }


  if (
    data.data &&
    Array.isArray(data.data.items)
  ) {

    return data.data;

  }


  return {
    items: []
  };

}


function renderCart() {

  const items =
    cart?.items ?? [];


  if (items.length === 0) {

    showEmptyCart();

    return;

  }


  emptyCart.hidden =
    true;


  cartForm.style.display =
    "block";


  cartItems.innerHTML =
    "";


  items.forEach(
    item => {

      const card =
        createCartItem(item);


      cartItems.appendChild(card);

    }
  );


  updateSummary();

}


function createCartItem(item) {

  const article =
    document.createElement("article");


  article.classList.add(
    "cart-item"
  );


  const vinyl =
    item.vinyl ??
    item.product ??
    item;


  const id =
    item.id ??
    item.cartItemId ??
    vinyl.id ??
    "";


  const title =
    vinyl.title ??
    vinyl.name ??
    "Título não informado";


  const artist =
    vinyl.artist?.name ??
    vinyl.artistName ??
    vinyl.artist ??
    "Artista não informado";


  const image =
    vinyl.imageUrl ??
    vinyl.image ??
    vinyl.coverUrl ??
    "";


  const price =
    Number(
      item.unitPrice ??
      vinyl.price ??
      item.price ??
      0
    );


  const quantity =
    Number(
      item.quantity ??
      1
    );


  const subtotal =
    Number(
      item.subtotal ??
      price * quantity
    );


  const product =
    document.createElement("div");


  product.classList.add(
    "cart-product"
  );


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
      `Capa de ${title}`;


    imageContainer.appendChild(
      img
    );

  }


  const productInfo =
    document.createElement("div");


  productInfo.classList.add(
    "product-info"
  );


  const artistElement =
    document.createElement("span");


  artistElement.textContent =
    String(artist).toUpperCase();


  const titleElement =
    document.createElement("h3");


  titleElement.textContent =
    title;


  const typeElement =
    document.createElement("p");


  typeElement.textContent =
    "Vinyl Record";


  productInfo.appendChild(
    artistElement
  );


  productInfo.appendChild(
    titleElement
  );


  productInfo.appendChild(
    typeElement
  );


  product.appendChild(
    imageContainer
  );


  product.appendChild(
    productInfo
  );


  const priceContainer =
    document.createElement("div");


  priceContainer.classList.add(
    "item-price"
  );


  priceContainer.innerHTML = `
    <span>PREÇO</span>
    <strong>${formatPrice(price)}</strong>
  `;


  const quantityContainer =
    document.createElement("div");


  quantityContainer.classList.add(
    "quantity"
  );


  const quantityLabel =
    document.createElement("label");


  quantityLabel.textContent =
    "QTD.";


  const quantityInput =
    document.createElement("input");


  quantityInput.type =
    "number";


  quantityInput.min =
    "1";


  quantityInput.max =
    "10";


  quantityInput.value =
    quantity;


  quantityInput.addEventListener(
    "change",
    () => {

      updateItemQuantity(
        item,
        Number(quantityInput.value)
      );

    }
  );


  quantityContainer.appendChild(
    quantityLabel
  );


  quantityContainer.appendChild(
    quantityInput
  );


  const subtotalContainer =
    document.createElement("div");


  subtotalContainer.classList.add(
    "subtotal"
  );


  subtotalContainer.innerHTML = `
    <span>SUBTOTAL</span>
    <strong>${formatPrice(subtotal)}</strong>
  `;


  const removeButton =
    document.createElement("button");


  removeButton.type =
    "button";


  removeButton.classList.add(
    "remove-button"
  );


  removeButton.textContent =
    "×";


  removeButton.setAttribute(
    "aria-label",
    `Remover ${title} do carrinho`
  );


  removeButton.addEventListener(
    "click",
    () => {

      removeItem(
        item,
        id
      );

    }
  );


  article.appendChild(
    product
  );


  article.appendChild(
    priceContainer
  );


  article.appendChild(
    quantityContainer
  );


  article.appendChild(
    subtotalContainer
  );


  article.appendChild(
    removeButton
  );


  return article;

}


function updateSummary() {

  const items =
    cart?.items ?? [];


  const quantity =
    items.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity ?? 1
        ),
      0
    );


  const subtotal =
    items.reduce(
      (total, item) => {

        const vinyl =
          item.vinyl ??
          item.product ??
          item;


        const price =
          Number(
            item.unitPrice ??
            vinyl.price ??
            item.price ??
            0
          );


        const itemQuantity =
          Number(
            item.quantity ??
            1
          );


        const itemSubtotal =
          Number(
            item.subtotal ??
            price * itemQuantity
          );


        return (
          total +
          itemSubtotal
        );

      },
      0
    );


  const total =
    subtotal +
    shipping;


  cartCount.textContent =
    `${quantity} ${
      quantity === 1
        ? "ITEM"
        : "ITENS"
    }`;


  subtotalValue.textContent =
    formatPrice(subtotal);


  shippingValue.textContent =
    formatPrice(shipping);


  totalValue.textContent =
    formatPrice(total);

}


async function updateItemQuantity(
  item,
  quantity
) {

  if (
    quantity < 1 ||
    Number.isNaN(quantity)
  ) {

    return;

  }


  item.quantity =
    quantity;


  renderCart();

}


async function removeItem(
  item,
  id
) {

  if (!cart) {
    return;
  }


  cart.items =
    cart.items.filter(
      currentItem =>
        currentItem !== item
    );


  renderCart();


  console.log(
    "Item a remover da API:",
    id
  );

}


applyCouponButton.addEventListener(
  "click",
  () => {

    const coupon =
      couponInput.value.trim();


    if (!coupon) {
      return;
    }


    console.log(
      "Cupom a enviar para a API:",
      coupon
    );

  }
);


shippingButton.addEventListener(
  "click",
  () => {

    const cep =
      cepInput.value.trim();


    if (!cep) {
      return;
    }


    console.log(
      "CEP a enviar para a API:",
      cep
    );

  }
);


cartForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    console.log(
      "Checkout do carrinho:",
      cart
    );

  }
);


function showLoading() {

  emptyCart.hidden =
    true;


  cartForm.style.display =
    "block";


  cartItems.innerHTML = `

    <div class="cart-loading">

      <div class="loading-disc">
        ♪
      </div>

      <strong>
        Carregando carrinho...
      </strong>

      <span>
        Preparando seus discos.
      </span>

    </div>

  `;


  cartCount.textContent =
    "Carregando...";


  subtotalValue.textContent =
    "—";


  shippingValue.textContent =
    "—";


  totalValue.textContent =
    "—";

}


function showEmptyCart() {

  cartForm.style.display =
    "none";


  emptyCart.hidden =
    false;


  emptyCart.style.display =
    "grid";


  cartCount.textContent =
    "0 ITENS";

}


function showError(message) {

  cartItems.innerHTML = `

    <div class="cart-error">

      <div class="error-symbol">
        !
      </div>

      <strong>
        Não foi possível carregar o carrinho.
      </strong>

      <span>
        ${message}
      </span>

      <button
        type="button"
        id="retryCart"
      >
        TENTAR NOVAMENTE
      </button>

    </div>

  `;


  cartCount.textContent =
    "Erro";


  subtotalValue.textContent =
    "—";


  shippingValue.textContent =
    "—";


  totalValue.textContent =
    "—";


  const retry =
    document.getElementById(
      "retryCart"
    );


  retry?.addEventListener(
    "click",
    loadCart
  );

}


function formatPrice(value) {

  const number =
    Number(value);


  if (
    Number.isNaN(number)
  ) {

    return "—";

  }


  return number.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

}


document.addEventListener(
  "DOMContentLoaded",
  loadCart
);