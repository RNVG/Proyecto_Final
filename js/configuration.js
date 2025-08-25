// JS/configuration.page.js
document.addEventListener("DOMContentLoaded", () => {
  // 1) Requiere sesión (cualquier rol). Si no hay, redirige a login.
  const session = (Auth.requireAuth?.() ?? JSON.parse(sessionStorage.getItem("session") || "{}"));
  Auth.applyRoleUI?.();

  const email =
    (session?.email || session?.user?.email || "").toLowerCase();

  // 2) Campos
  const nameInput = document.getElementById("name");
  const bioInput  = document.getElementById("bio");
  const form      = document.querySelector(".config-form");

  // 3) Utilidades de storage
  const readUsers = () => JSON.parse(localStorage.getItem("users") || "[]");
  const writeUsers = (arr) => localStorage.setItem("users", JSON.stringify(arr));

  const findMe = () => {
    const users = readUsers();
    return users.find(u => (u.email || "").toLowerCase() === email) || null;
  };

  const updateMe = (updater) => {
    const users = readUsers();
    const idx = users.findIndex(u => (u.email || "").toLowerCase() === email);
    if (idx < 0) return null;
    users[idx] = updater(users[idx]);
    writeUsers(users);

    // Sincroniza la sesión (tolerante a distintas formas)
    try {
      const s = JSON.parse(sessionStorage.getItem("session") || "{}");
      if (s.user) s.user = { ...s.user, ...users[idx] };
      sessionStorage.setItem("session", JSON.stringify(s));
    } catch {}
    return users[idx];
  };

  // 4) Prefill
  function prefill() {
    const u = findMe() || {};
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();

    if (nameInput) {
      nameInput.value =
        u.publicName ?? u.displayName ?? u.name ?? fullName ?? "";
    }
    if (bioInput) {
      bioInput.value =
        u.publicBio ?? u.bio ?? "";
    }
  }
  prefill();

  // 5) Guardar
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const publicName = (nameInput?.value || "").trim();
    const publicBio  = (bioInput?.value  || "").trim();

    const saved = updateMe((u) => ({
      ...u,
      publicName,
      displayName: publicName || u.displayName || u.name, // por compatibilidad
      publicBio,
      bio: publicBio || u.bio
    }));

    if (!saved) {
      alert("No se encontró el usuario para actualizar.");
      return;
    }

    prefill();                // se ve inmediatamente
    alert("Changes saved.");  // feedback
  });

  // 6) Menú de avatar por click (móvil/desktop)
  const pmenu  = document.querySelector(".profile-menu");
  const avatar = pmenu?.querySelector("img");
  avatar?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    pmenu.classList.toggle("open");
  });
  document.addEventListener("click", () => pmenu?.classList.remove("open"));
});