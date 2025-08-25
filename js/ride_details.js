// JS/ride_details.page.js — Detalle de Ride dinámico
document.addEventListener("DOMContentLoaded", () => {
  // Sesión (solo para ocultar/mostrar "Request")
  const session = (typeof Auth !== "undefined" && Auth.getSession) ? Auth.getSession() : null;

  const $ = (sel) => document.querySelector(sel);
  const get = (k) => JSON.parse(localStorage.getItem(k) || "[]");
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // --- Obtener ride por id ---
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { alert("Ride not specified."); location.href = "MyRides.html"; return; }
  const ride = get("rides").find(r => r.id === id);
  if (!ride) { alert("Ride not found."); location.href = "MyRides.html"; return; }

  // --- Referencias
  const driverNameEl = $("#driverName");
  const driverAvatar = $("#driverAvatar");

  const fromInput  = $("#fromInput");
  const toInput    = $("#toInput");
  const daysWrap   = $("#daysContainer");

  const timeInput  = $("#timeInput");
  const seatsInput = $("#seatsInput");
  const feeInput   = $("#feeInput");

  const makeSelect = $("#makeSelect");
  const modelInput = $("#modelInput");
  const yearInput  = $("#yearInput");

  const btnCancel  = $("#btnCancel");
  const btnRequest = $("#btnRequest");
  const form       = $("#rideDetailsForm");

  // --- Info del driver (nombre / avatar si lo guardaste en users)
  const users = get("users");
  const driver = users.find(u => (u.email || "").toLowerCase() === (ride.driverEmail || "").toLowerCase());
  if (driverNameEl) driverNameEl.textContent = driver ? (driver.firstName || "") + " " + (driver.lastName || "") : (ride.driverEmail || "");
  // Si manejas avatar en el perfil, reemplázalo aquí:
  // if (driver && driver.avatarUrl) driverAvatar.src = driver.avatarUrl;

  // --- Construir checkboxes de días y marcar los del ride
  const week = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const picked = (ride.days || []).map(d => String(d).toLowerCase());
  daysWrap.innerHTML = "";
  week.forEach(d => {
    const idd = "d_" + d.toLowerCase();
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" id="${idd}"> ${d}`;
    daysWrap.appendChild(label);
    const cb = label.querySelector("input");
    cb.checked = picked.includes(d.toLowerCase());
  });

  // --- Rellenar campos
  if (fromInput)  fromInput.value  = ride.from  || "";
  if (toInput)    toInput.value    = ride.to    || "";
  if (timeInput)  timeInput.value  = ride.time  || "";
  if (seatsInput) seatsInput.value = ride.seats ?? 1;
  if (feeInput)   feeInput.value   = ride.price ?? 0;

  // Vehículo: mostrar SOLO la marca en el select (sin “quemados”)
  if (makeSelect) {
    makeSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "__brand__";
    opt.textContent = ride.carBrand || "Brand";
    makeSelect.appendChild(opt);
    makeSelect.value = "__brand__";
  }
  if (modelInput) modelInput.value = ride.carModel || "";
  if (yearInput)  yearInput.value  = ride.carYear  || "";

  // --- Dejar todo en solo-lectura (es página de detalle)
  document.querySelectorAll("input, select, textarea").forEach(el => el.disabled = true);

  // --- Mostrar/ocultar "Request"
  const isOwner = session && session.email &&
                  ride.driverEmail && session.email.toLowerCase() === ride.driverEmail.toLowerCase();
  if (isOwner || (session && session.role === "driver")) {
    btnRequest.style.display = "none";
  }

  // --- Enviar solicitud (para clientes)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!btnRequest || btnRequest.style.display === "none") return;

    if (!session || session.role !== "client") {
      alert("Please login as client to request this ride.");
      location.href = "login.html";
      return;
    }

    const bookings = get("bookings");
    bookings.push({
      id: (crypto.randomUUID ? crypto.randomUUID() : "bk_" + Date.now().toString(36)),
      rideId: ride.id,
      clientEmail: session.email,
      driverEmail: ride.driverEmail,
      status: "pending",
      createdAt: Date.now()
    });
    set("bookings", bookings);

    alert("Ride requested! Check it in Bookings.");
    location.href = "view_booking.html";
  });

  // --- Cancelar
  btnCancel.addEventListener("click", (e) => {
    e.preventDefault();
    history.length > 1 ? history.back() : (location.href = "MyRides.html");
  });
});