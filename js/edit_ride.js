// JS/edit_ride.page.js — Editar Ride del driver en sesión
document.addEventListener("DOMContentLoaded", () => {
  const session = Auth.requireAuth?.("driver");
  if (!session) return;

  // --- helpers storage
  const get = k => JSON.parse(localStorage.getItem(k) || "[]");
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // --- localizar ride por query ?id=...
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { alert("Ride not specified."); location.href = "MyRides.html"; return; }

  const rides = get("rides");
  const ride  = rides.find(r => r.id === id);
  if (!ride) { alert("Ride not found."); location.href = "MyRides.html"; return; }

  // ¿es mío?
  const owner = (ride.driverEmail || ride.driver || "").toLowerCase();
  if (owner !== session.email.toLowerCase()) {
    alert("You cannot edit this ride.");
    location.href = "MyRides.html";
    return;
  }

  // --- refs (sin tocar tu HTML; hay fallback si no pusiste ids)
  const form = document.querySelector(".ride-form");
  const [fromInput, toInput] = document.querySelectorAll(".top-row .field-group input");

  let dayChecks = Array.from(
    document.querySelectorAll(".days-below .checkboxes input[type='checkbox']")
  );
  if (!dayChecks.length) {
    dayChecks = Array.from(
      document.querySelectorAll(".field-days .checkboxes input[type='checkbox']")
    );
  }

  const blocks = document.querySelectorAll(".three-fields");
  const schedBlock = blocks[0];
  const carBlock   = blocks[1];

  const timeInput  = schedBlock?.querySelector("input[type='time']");
  const nums       = schedBlock?.querySelectorAll("input[type='number']") || [];
  const seatsInput = nums[0];
  const feeInput   = nums[1];

  const makeSelect = document.getElementById("makeSelect") || carBlock?.querySelector("select");
  const makeInput  = document.getElementById("makeInput")  || null; // opcional
  const modelInput = document.getElementById("modelInput") || carBlock?.querySelector("input[type='text']");
  const yearInput  = document.getElementById("yearInput")  || carBlock?.querySelector("input[type='number']");
  const cancelLink = document.querySelector(".actions a");

  // --- prefill básicos
  if (fromInput) fromInput.value = ride.from || "";
  if (toInput)   toInput.value   = ride.to   || "";
  if (timeInput) timeInput.value = ride.time || "";
  if (seatsInput) seatsInput.value = ride.seats ?? 1;
  if (feeInput)   feeInput.value   = ride.price ?? ride.fee ?? 0;

  const pickedDays = (ride.days || []).map(d => String(d).toLowerCase());
  dayChecks.forEach(ch => {
    const labelTxt = (ch.parentElement?.textContent || "").trim().toLowerCase();
    ch.checked = pickedDays.includes(labelTxt);
  });

  // --- vehículos del usuario (array o campos planos)
  const ss  = Auth.getSession?.() || JSON.parse(sessionStorage.getItem("session") || "null");
  const all = JSON.parse(localStorage.getItem("users") || "[]");
  const me  = all.find(u => (u.email || "").toLowerCase() === (ss?.email || "").toLowerCase()) || {};

  let vehicles = Array.isArray(me.vehicles) ? me.vehicles.slice() : [];
  if (!vehicles.length && (me.brand || me.carBrand)) {
    vehicles.push({
      brand: me.brand || me.carBrand || "",
      model: me.model || me.carModel || "",
      year : me.year  || me.carYear  || "",
      plate: me.plate || ""
    });
  }

  // --- poblar select (mostrar SOLO la marca; pista si hay duplicadas)
  function populateVehicleSelectForEdit() {
    if (!makeSelect) return;

    makeSelect.innerHTML = "";
    const brandCount = vehicles.reduce((acc, v) => {
      const k = (v.brand || "").trim().toLowerCase();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    if (vehicles.length) {
      vehicles.forEach((v, i) => {
        const opt = document.createElement("option");
        let label = v.brand || `Vehicle ${i + 1}`;
        if (brandCount[(v.brand || "").trim().toLowerCase()] > 1) {
          const hint = v.plate || v.model || v.year || `#${i + 1}`;
          label = `${v.brand} (${hint})`; // quita lo de paréntesis si no quieres pista
        }
        opt.value = String(i);
        opt.textContent = label;
        makeSelect.appendChild(opt);
      });
    }

    if (makeInput) {
      const optOther = document.createElement("option");
      optOther.value = "other";
      optOther.textContent = "Other vehicle…";
      makeSelect.appendChild(optOther);
    }

    // preseleccionar según el ride
    let selected = -1;
    if (vehicles.length) {
      selected = vehicles.findIndex(v =>
        (v.brand || "").toLowerCase() === (ride.carBrand || "").toLowerCase() &&
        (!ride.carModel || (v.model || "").toLowerCase() === (ride.carModel || "").toLowerCase()) &&
        (!ride.carYear  || String(v.year || "") === String(ride.carYear || ""))
      );
    }

    if (selected >= 0) {
      makeSelect.value = String(selected);
      applyVehicleFromSelect();
    } else if (makeInput) {
      makeSelect.value = "other";
      makeInput.style.display = "block";
      makeInput.value = ride.carBrand || "";
      if (modelInput) { modelInput.disabled = false; modelInput.value = ride.carModel || ""; }
      if (yearInput)  { yearInput.disabled  = false; yearInput.value  = ride.carYear  || ""; }
    } else {
      // sin makeInput: al menos garantizamos una opción con la marca actual
      const opt = document.createElement("option");
      opt.value = "__current__";
      opt.textContent = ride.carBrand || "Brand";
      makeSelect.appendChild(opt);
      makeSelect.value = "__current__";
      if (modelInput) modelInput.value = ride.carModel || "";
      if (yearInput)  yearInput.value  = ride.carYear  || "";
    }
  }

  function applyVehicleFromSelect() {
    if (!makeSelect) return;
    const val = makeSelect.value;

    if (val === "other" || !vehicles.length) {
      if (makeInput) makeInput.style.display = "block";
      if (modelInput) { modelInput.disabled = false; if (!modelInput.value) modelInput.value = ride.carModel || ""; }
      if (yearInput)  { yearInput.disabled  = false; if (!yearInput.value)  yearInput.value  = ride.carYear  || ""; }
      return;
    }

    const v = vehicles[Number(val)];
    if (!v) return;

    if (makeInput) { makeInput.style.display = "none"; makeInput.value = ""; }
    if (modelInput) { modelInput.value = v.model || ""; modelInput.disabled = true; }
    if (yearInput)  { yearInput.value  = v.year  || ""; yearInput.disabled  = true; }
  }

  makeSelect?.addEventListener("change", applyVehicleFromSelect);
  populateVehicleSelectForEdit();

  // --- guardar cambios
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

    // marca/modelo/año resultantes
    let carBrand = "", carModel = "", carYear = "";
    if (vehicles.length && makeSelect && makeSelect.value !== "other" && makeSelect.value !== "__current__") {
      const v = vehicles[Number(makeSelect.value)];
      carBrand = v?.brand || "";
      carModel = v?.model || "";
      carYear  = v?.year  || "";
    } else {
      carBrand = makeInput ? (makeInput.value || "").trim()
                           : ((makeSelect?.options[makeSelect.selectedIndex]?.textContent) || "").trim();
      carModel = (modelInput?.value || "").trim();
      carYear  = (yearInput?.value  || "").trim();
    }

    // aplicar y persistir
    ride.from = from;
    ride.to   = to;
    ride.days = days;
    ride.time = timeInput?.value || "";
    ride.seats = seats;
    ride.price = fee;
    ride.carBrand = carBrand;
    ride.carModel = carModel;
    ride.carYear  = carYear;
    ride.updatedAt = Date.now();

    const idx = rides.findIndex(r => r.id === ride.id);
    if (idx !== -1) { rides[idx] = ride; set("rides", rides); }

    alert("Ride updated.");
    location.href = "MyRides.html";
  });

  // --- cancelar
  cancelLink?.addEventListener("click", (e) => {
    e.preventDefault();
    location.href = "MyRides.html";
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