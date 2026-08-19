const logoutButton =
  document.getElementById("logoutButton");

const accessibilityForm =
  document.getElementById("accessibilityForm");


if (accessibilityForm) {
  accessibilityForm.addEventListener(
    "submit",
    event => {
      event.preventDefault();
    }
  );
}


if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    () => {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("jwt");

      window.location.href = "/index.html";
    }
  );
}