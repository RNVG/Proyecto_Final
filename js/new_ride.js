// JS/new_ride.page.js — New Ride con autos del conductor en sesión
document.addEventListener("DOMContentLoaded", () => {
  // 1) Solo conductores
  const session = Auth.requireAuth?.("driver");
  if (!session) return;

  // --- Referencias sin cambiar tu estructura base ---
  const form = document.querySelector(".ride-form");

  // From / To
  const [fromInput, toInput] = document.querySelectorAll(".top-row .field-group input");

  // Días (soporta .days-below o .field-days)
  let dayChecks = Array.from(
    document.querySelectorAll(".days-below .checkboxes input[type='checkbox']")
  );
  if (!dayChecks.length) {
    dayChecks = Array.from(
      document.querySelectorAll(".field-days .checkboxes input[type='checkbox']")
    );
  }

  // Bloques de 3 campos: [ horario+seats+fee, vehículo ]
  const blocks = document.querySelectorAll(".three-fields");
  const schedBlock = blocks[0];
  const carBlock   = blocks[1];

  const timeInput  = schedBlock?.querySelector("input[type='time']");
  const nums       = schedBlock?.querySelectorAll("input[type='number']") || [];
  const seatsInput = nums[0];                // Seats
  const feeInput   = nums[1];                // Fee

  // Vehículo (con ids si ya los pusiste; si no, fallback)
  const makeSelect = document.getElementById("makeSelect") || carBlock?.querySelector("select");
  const makeInput  = document.getElementById("makeInput")  || null; // opcional (para "Other vehicle…")
  const modelInput = document.getElementById("modelInput") || carBlock?.querySelector("input[type='text']");
  const yearInput  = document.getElementById("yearInput")  || carBlock?.querySelector("input[type='number']");

  const cancelLink = document.querySelector(".actions a");

  // --- Usuario activo + vehículos ---
  const ss  = Auth.getSession?.() || JSON.parse(sessionStorage.getItem("session") || "null");
  const all = JSON.parse(localStorage.getItem("users") || "[]");
  const me  = all.find(u => (u.email || "").toLowerCase() === (ss?.email || "").toLowerCase()) || {};

  // Soportamos dos modelos:
  // 1) me.vehicles = [{brand, model, year, plate}, ...]
  // 2) Campos planos brand/model/year/plate
  let vehicles = Array.isArray(me.vehicles) ? me.vehicles.slice() : [];
  if (!vehicles.length && (me.brand || me.carBrand)) {
    vehicles.push({
      brand: me.brand || me.carBrand || "",
      model: me.model || me.carModel || "",
      year : me.year  || me.carYear  || "",
      plate: me.plate || ""
    });
  }

  // --- Poblar select con autos del usuario ---
  function populateVehicleSelect() {
  if (!makeSelect) return;

  if (vehicles.length) {
    makeSelect.innerHTML = "";

    // Cuenta cuántos autos hay por marca (para desambiguar si hay repetidos)
    const brandCount = vehicles.reduce((acc, v) => {
      const k = (v.brand || "").trim().toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    vehicles.forEach((v, i) => {
      const opt = document.createElement("option");

      // === Mostrar SOLO la marca ===
      let label = v.brand || `Vehicle ${i + 1}`;

      // (Opcional) si hay varias unidades de la misma marca, añade una pista
      if (brandCount[(v.brand || "").trim().toLowerCase()] > 1) {
        const hint = v.plate || v.model || v.year || `#${i + 1}`;
        label = `${v.brand} (${hint})`;
      }

      opt.value = String(i);      // seguimos usando el índice como value
      opt.textContent = label;    // ← ahora se ve solo la marca (con pista opcional)
      makeSelect.appendChild(opt);
    });

    const optOther = document.createElement("option");
    optOther.value = "other";
    optOther.textContent = "Other vehicle…";
    makeSelect.appendChild(optOther);

    makeSelect.value = "0";
    applyVehicleFromSelect();
  } else {
    // Sin vehicles en el perfil → modo manual
    if (makeSelect) {
      makeSelect.innerHTML = "";
      const optOther = document.createElement("option");
      optOther.value = "other";
      optOther.textContent = "Other vehicle…";
      makeSelect.appendChild(optOther);
      makeSelect.value = "other";
    }
    if (makeInput) { makeInput.style.display = "block"; makeInput.value = me.brand || me.carBrand || ""; }
    if (modelInput) { modelInput.disabled = false; modelInput.value = me.model || me.carModel || ""; }
    if (yearInput)  { yearInput.disabled  = false; yearInput.value  = me.year  || me.carYear  || ""; }
  }
}

  function applyVehicleFromSelect() {
    if (!makeSelect) return;
    const val = makeSelect.value;

    if (val === "other" || !vehicles.length) {
      // Modo manual
      if (makeInput) makeInput.style.display = "block";
      if (modelInput) modelInput.disabled = false;
      if (yearInput)  yearInput.disabled  = false;
      return;
    }

    // Autocompletar con vehículo elegido del perfil
    const v = vehicles[Number(val)];
    if (!v) return;

    if (makeInput) { makeInput.style.display = "none"; makeInput.value = ""; }
    if (modelInput) { modelInput.value = v.model || ""; modelInput.disabled = true; }
    if (yearInput)  { yearInput.value  = v.year  || ""; yearInput.disabled  = true; } // cambia a false si quieres editable
  }

  makeSelect?.addEventListener("change", applyVehicleFromSelect);
  populateVehicleSelect();

  // --- Helpers de storage ---
  const get = k => JSON.parse(localStorage.getItem(k) || "[]");
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const gid = () =>
    (crypto.randomUUID ? crypto.randomUUID() : "ride_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));

  // --- Submit: crear ride ---
  form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const from = (fromInput?.value || "").trim();
    const to   = (toInput?.value   || "").trim();
    if (!from || !to) { alert("Please complete Departure and Arrive To."); return; }

    const seats = Number(seatsInput?.value || 0);
    const fee   = Number(feeInput?.value   || 0);
    if (!Number.isFinite(seats) || seats < 1) { alert("Seats must be at least 1."); return; }
    if (!Number.isFinite(fee)   || fee < 0)   { alert("Fee must be 0 or more.");   return; }

    const days = dayChecks
      .filter(ch => ch.checked)
      .map(ch => ch.parentElement?.textContent?.trim() || "");

    // Marca/Modelo/Año a guardar
    let carBrand = "", carModel = "", carYear = "";

    if (vehicles.length && makeSelect && makeSelect.value !== "other") {
      const v = vehicles[Number(makeSelect.value)];
      carBrand = v?.brand || "";
      carModel = v?.model || "";
      carYear  = v?.year  || "";
    } else {
      // Manual o sin vehicles en perfil
      if (makeInput && makeInput.style.display !== "none") {
        carBrand = (makeInput.value || "").trim();
      } else if (makeSelect) {
        // Si quedó un select con opciones quemadas, toma el texto de la opción
        const sel = makeSelect.options[makeSelect.selectedIndex];
        carBrand = (sel?.textContent || makeSelect.value || "").trim();
      }
      carModel = (modelInput?.value || "").trim();
      carYear  = (yearInput?.value  || "").trim();
    }

    const ride = {
      id: gid(),
      driverEmail: session.email,
      from, to,
      days,                                // ej. ["Mon","Wed","Fri"]
      time: timeInput?.value || "",
      seats,
      price: fee,
      carBrand, carModel, carYear,
      notes: "",
      status: "active",
      createdAt: Date.now()
    };

    const rides = get("rides");
    rides.push(ride);
    set("rides", rides);

    alert("Ride created.");
    window.location.href = "MyRides.html"; // ajusta si tu archivo se llama distinto
  });

  // --- Cancel ---
  cancelLink?.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "MyRides.html";
  });
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