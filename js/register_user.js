// JS/register_user.js


function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function setUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function emailExists(users, email) {
  return users.some(u => (u.email || "").toLowerCase() === email.toLowerCase());
}

function idExists(users, idNumberOrCedula) {
  return users.some(u => (u.idNumber || u.cedula || "").trim() === idNumberOrCedula.trim());
}

// --- Registro genérico: detecta formulario presente ---
window.addEventListener("DOMContentLoaded", () => {
  const driverForm = document.getElementById("driver_registration_form");
  const clientForm = document.getElementById("client_registration_form");

  if (driverForm) {
    driverForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveUserFromDriverForm();
    });
  }

  if (clientForm) {
    clientForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveUserFromClientForm();
    });
  }
});

// --- Guardar: Driver ---
function saveUserFromDriverForm() {
  const firstName = document.getElementById("firstname").value.trim();
  const lastName = document.getElementById("lastname").value.trim();
  const idNumber = document.getElementById("cedula").value.trim();
  const birthdate = document.getElementById("birthdate").value;
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const brand = document.getElementById("carBrand").value.trim();
  const model = document.getElementById("carModel").value.trim();
  const year = document.getElementById("carYear").value.trim();
  const plate = document.getElementById("plate").value.trim();
  const password = document.getElementById("password").value;
  const repeatPassword = document.getElementById("repeat-password").value;

  if (password !== repeatPassword) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  const users = getUsers();

  if (emailExists(users, email)) {
    alert("Este correo ya está registrado.");
    return;
  }
  if (idExists(users, idNumber)) {
    alert("Esta cédula/ID ya está registrada.");
    return;
  }
  if (plateExists(users, plate)) {
    alert("Esta placa ya está registrada.");
    return;
  }

  const user = {
    firstName,
    lastName,
    birthdate,
    idNumber,
    email,
    phone,
    password,
    role: "driver",
    brand,
    model,
    year,
    plate
  };

  users.push(user);
  setUsers(users);

  alert("¡Conductor registrado correctamente!");
  document.getElementById("driver_registration_form").reset();
}

// --- Guardar: Cliente ---
function saveUserFromClientForm() {
  const firstName = document.getElementById("firstname").value.trim();
  const lastName = document.getElementById("lastname").value.trim();
  const birthdate = document.getElementById("birthdate").value;
  const cedula = document.getElementById("cedula").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const repeatPassword = document.getElementById("repeat-password").value;

  if (password !== repeatPassword) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  const users = getUsers();

  if (emailExists(users, email)) {
    alert("Este correo ya está registrado.");
    return;
  }
  if (idExists(users, cedula)) {
    alert("Esta cédula/ID ya está registrada.");
    return;
  }

  const user = {
    firstName,
    lastName,
    birthdate,
    idNumber: cedula,   // unificamos el nombre del campo
    email,
    phone,
    password,
    role: "client"
    // sin campos de vehículo
  };

  users.push(user);
  setUsers(users);

  alert("¡Cliente registrado correctamente!");
  document.getElementById("client_registration_form").reset();
}