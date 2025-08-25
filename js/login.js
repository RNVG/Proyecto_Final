// JS/login.js — manejo del formulario de Login (email + password)
document.addEventListener("DOMContentLoaded", () => {
  // Si ya hay sesión, envía a su dashboard (guest only)
  if (window.Auth && typeof Auth.requireGuest === "function") {
    Auth.requireGuest();
  }

  // Opcional: marca rol para CSS/UI (quedará "guest" aquí)
  if (window.Auth && typeof Auth.applyRoleUI === "function") {
    Auth.applyRoleUI();
  }

  const form = document.querySelector(".login-form");
  if (!form) return;

  const emailInput = document.getElementById("username"); // tu HTML usa id="username"
  const passInput  = document.getElementById("password");
  const loginBtn   = form.querySelector(".login-btn");
  const googleBtn  = document.querySelector(".google-btn");

  const showError = (msg) => {
    let box = document.getElementById("login-error");
    if (!box) {
      box = document.createElement("div");
      box.id = "login-error";
      box.style.marginTop = "6px";
      box.style.fontSize = "14px";
      box.style.color = "#c0392b";
      form.appendChild(box);
    }
    box.textContent = msg;
  };

  const clearError = () => {
    const box = document.getElementById("login-error");
    if (box) box.textContent = "";
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());

  // Demo: Google no implementado aún
  if (googleBtn) {
    googleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Demo: inicio con Google aún no está implementado.");
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearError();

    const email = (emailInput?.value || "").trim();
    const password = passInput?.value || "";

    if (!email || !password) {
      showError("Por favor, completa ambos campos.");
      return;
    }
    if (!isValidEmail(email)) {
      showError("Ingresa un correo válido.");
      emailInput?.focus();
      return;
    }

    // Evitar doble submit visualmente
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.style.opacity = "0.7";
    }

    const res = Auth.loginWithEmail(email, password);
    if (!res.ok) {
      showError(res.error);
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.style.opacity = "";
      }
      return;
    }

    // Redirección por rol
    window.location.href = (res.role === "driver") ? "Myrides.html" : "Home.html";
  });
});