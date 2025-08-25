// JS/auth.js — núcleo de autenticación + guards + helpers de UI
const USERS_KEY = "users";
const SESSION_KEY = "session"; // usuario activo en sessionStorage

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
const getSession = () => JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
const setSession = (s) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

function findUserByEmail(email){
  const t = (email || "").trim().toLowerCase();
  return getUsers().find(u => (u.email || "").toLowerCase() === t) || null;
}

function loginWithEmail(email, password){
  const user = findUserByEmail(email);
  if (!user) return { ok:false, error:"No existe un usuario con ese correo." };
  if (user.password !== password) return { ok:false, error:"Contraseña incorrecta." };

  setSession({
    email: user.email,
    idNumber: user.idNumber,
    name: `${user.firstName||""} ${user.lastName||""}`.trim(),
    role: user.role,
    loginAt: Date.now()
  });
  return { ok:true, role:user.role };
}

function logout(){ clearSession(); location.href = "login.html"; }

function requireAuth(role){
  const s = getSession();
  if (!s){ location.href = "login.html"; return null; }
  if (role && s.role !== role){
    alert("No tienes permisos para esta página.");
    location.href = "Home.html";
    return null;
  }
  applyRoleUI();
  return s;
}

function requireGuest(){
  const s = getSession();
  if (s) location.href = (s.role === "driver" ? "rides.html" : "Home.html");
}

function applyRoleUI(){
  const s = getSession();
  const role = s ? s.role : "guest";
  document.documentElement.setAttribute("data-role", role);
  document.querySelectorAll("[data-role-only]").forEach(el=>{
    const roles = (el.dataset.roleOnly||"").split(",").map(r=>r.trim());
    el.style.display = roles.includes(role) ? "" : "none";
  });
}

window.Auth = { loginWithEmail, logout, requireAuth, requireGuest, getSession, applyRoleUI };