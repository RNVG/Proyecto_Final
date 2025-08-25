// JS/edit_profile.page.js
document.addEventListener("DOMContentLoaded", () => {
  // --- 1) Requiere sesión (cliente o driver) ---
  let session = null;
  try {
    if (typeof Auth?.requireAuth === "function") {
      session = Auth.requireAuth(); // permite client o driver
    } else {
      session = JSON.parse(sessionStorage.getItem("session") || "null");
      if (!session || !session.email) throw new Error("no session");
    }
  } catch {
    window.location.href = "login.html";
    return;
  }

  // --- 2) Helpers de storage ---
  const getUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
  const setUsers = (arr) => localStorage.setItem("users", JSON.stringify(arr));

  // --- 3) Refs del DOM ---
  const form = document.getElementById("profile_form");
  const firstName = document.getElementById("firstName");
  const lastName  = document.getElementById("lastName");
  const email     = document.getElementById("email");
  const password  = document.getElementById("password");
  const repeatPwd = document.getElementById("repeatPassword");
  const address   = document.getElementById("address");
  const country   = document.getElementById("country");
  const state     = document.getElementById("state");
  const city      = document.getElementById("city");
  const phone     = document.getElementById("phone");
  const btnCancel = document.querySelector(".cancel");

  // --- 4) Cargar usuario activo y prefill ---
  const users = getUsers();
  const me = (typeof Auth?.getActiveUser === "function")
    ? (Auth.getActiveUser() || {})
    : users.find(u => (u.email || "").toLowerCase() === (session.email || "").toLowerCase()) || {};

  firstName.value = me.firstName || "";
  lastName.value  = me.lastName  || "";
  email.value     = me.email     || "";
  address.value   = me.address   || "";
  country.value   = me.country   || "Costa Rica";
  state.value     = me.state     || "";
  city.value      = me.city      || "";
  phone.value     = me.phone     || "";
  password.value  = "";
  repeatPwd.value = "";

  // --- 5) Guardar ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validaciones mínimas
    if (!firstName.value.trim() || !lastName.value.trim()) {
      alert("First name and Last name are required.");
      return;
    }
    if (!email.value.trim()) {
      alert("Email is required.");
      return;
    }
    if (password.value || repeatPwd.value) {
      if (password.value !== repeatPwd.value) {
        alert("Passwords do not match.");
        return;
      }
    }

    // Email único (excepto yo)
    const newEmailLower = email.value.trim().toLowerCase();
    const oldEmailLower = (me.email || "").toLowerCase();
    const dupe = users.some(u => (u.email || "").toLowerCase() === newEmailLower && (u.email || "").toLowerCase() !== oldEmailLower);
    if (dupe) { alert("This email is already registered."); return; }

    // Construir actualización preservando datos previos (role, vehículo, etc.)
    const updated = {
      ...me,
      firstName: firstName.value.trim(),
      lastName : lastName.value.trim(),
      email    : email.value.trim(),
      address  : address.value.trim(),
      country  : country.value,
      state    : state.value.trim(),
      city     : city.value.trim(),
      phone    : phone.value.trim(),
      password : password.value ? password.value : (me.password || "")
    };

    // Persistir en users
    const idx = users.findIndex(u => (u.email || "").toLowerCase() === oldEmailLower);
    if (idx >= 0) users[idx] = updated; else users.push(updated);
    setUsers(users);

    // Actualizar sesión activa
    const newSession = { ...session, email: updated.email, activeUser: updated, role: updated.role || session.role };
    sessionStorage.setItem("session", JSON.stringify(newSession));

    alert("Profile saved.");
    window.location.href = "Home.html";
  });

  // --- 6) Cancelar ---
  btnCancel?.addEventListener("click", (e) => {
    e.preventDefault();
    if (document.referrer) history.back();
    else window.location.href = "Home.html";
  });
});