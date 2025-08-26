// JS/myrides.page.js
document.addEventListener("DOMContentLoaded", () => {
  // 1) Guard solo-driver
  const session = Auth.requireAuth("driver");
  if (!session) return; // redirige si no cumple

  Auth.applyRoleUI(); // oculta links según rol

  // 2) Helpers de storage
  const getRides = () => JSON.parse(localStorage.getItem("rides") || "[]");
  const setRides = (arr) => localStorage.setItem("rides", JSON.stringify(arr));
  const getBookings = () => JSON.parse(localStorage.getItem("bookings") || "[]");
  const setBookings = (arr) => localStorage.setItem("bookings", JSON.stringify(arr));

  // 3) Referencias del DOM
  const tbody = document.getElementById("rides-tbody");
  const btnNew = document.getElementById("btn-new-ride");
  const searchInput = document.getElementById("search");
  
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmt(n) { return Number(n || 0).toFixed(2); }

function rowTemplate(r) {
  const car = [r.carBrand, r.carModel, r.carYear].filter(Boolean).join(" ") || "-";
  return `
    <tr data-id="${r.id}">
      <td><a href="rides.html?id=${encodeURIComponent(r.id)}">${escapeHtml(r.from || "-")}</a></td>
      <td>${escapeHtml(r.to || "-")}</td>
      <td>${r.seats ?? "-"}</td>
      <td>${escapeHtml(car)}</td>
      <td>${r.price != null ? `$${fmt(r.price)}` : "--"}</td>
      <td>
        <a href="edit_ride.html?id=${encodeURIComponent(r.id)}" class="link-edit">Edit</a>
        |
        <a href="#" class="link-delete" data-id="${r.id}">Delete</a>
      </td>
    </tr>
  `;
}

  function getMine() {
    const email = (session.email || "").toLowerCase();
    return getRides().filter(r => (r.driverEmail || r.driver || "").toLowerCase() === email);
  }

  function render(filterText = "") {
    const text = (filterText || "").trim().toLowerCase();
    let mine = getMine();

    if (text) {
      mine = mine.filter(r =>
        [r.from, r.to, r.notes, r.carBrand, r.carModel, r.carYear]
          .filter(Boolean)
          .map(String)
          .some(val => val.toLowerCase().includes(text))
      );
    }

    tbody.innerHTML = mine.length ? mine.map(rowTemplate).join("") : `
      <tr><td colspan="6" style="text-align:center;color:#666;padding:14px;">
        No rides yet.
      </td></tr>
    `;
  }

  // 5) Eventos
  if (btnNew) {
    btnNew.addEventListener("click", () => {
      window.location.href = "new_ride.html";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => render(e.target.value));
  }

  tbody.addEventListener("click", (e) => {
    const del = e.target.closest(".link-delete");
    if (del) {
      e.preventDefault();
      const id = del.dataset.id;
      if (!id) return;

      if (!confirm("¿Eliminar este ride? Se eliminarán también sus bookings asociados.")) return;

      // elimina ride
      setRides(getRides().filter(r => r.id !== id));
      // elimina bookings relacionados
      setBookings(getBookings().filter(b => b.rideId !== id));

      render(searchInput?.value);
    }
  });

  // 6) Primer render
  render();
});

document.addEventListener("DOMContentLoaded", ()=>{
  const link = document.getElementById("logoutLink");
  if(link){
    link.addEventListener("click", (e)=>{
      e.preventDefault();
      Auth.logout(); // ✅ cierra sesión y redirige
    });
  }
});