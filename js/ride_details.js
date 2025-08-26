// JS/rides.page.js — Detalle de Ride con bloqueo de duplicados
document.addEventListener("DOMContentLoaded", () => {
  'use strict';

  // Helpers de storage
  const get = k => JSON.parse(localStorage.getItem(k) || (k==="session"?"null":"[]"));
  const set = (k,v) => localStorage.setItem(k, JSON.stringify(v));
  const $ = s => document.querySelector(s);

  // Sesión
  const session = (window.Auth?.getSession?.() ?? get("session")) || null;

  // Obtener id de ?id=
  const id = new URLSearchParams(location.search).get("id");
  if (!id){ alert("Ride not specified."); location.href = "MyRides.html"; return; }

  const rides = get("rides");
  const ride = rides.find(r=>r.id===id);
  if (!ride){ alert("Ride not found."); location.href = "MyRides.html"; return; }

  // DOM refs
  const driverNameEl = $("#driverName");
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

  // Nombre del driver (si existe en users)
  const users = get("users");
  const driver = users.find(u => (u.email||"").toLowerCase()===(ride.driverEmail||"").toLowerCase());
  if (driverNameEl) {
    const name = `${driver?.firstName||""} ${driver?.lastName||""}`.trim();
    driverNameEl.textContent = name || ride.driverEmail || "-";
  }

  // Pintar días
  const week = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const picked = (ride.days||[]).map(d=>String(d).toLowerCase());
  if (daysWrap){
    daysWrap.innerHTML = "";
    week.forEach(d=>{
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" disabled> ${d}`;
      const cb = label.querySelector("input");
      cb.checked = picked.includes(d.toLowerCase());
      daysWrap.appendChild(label);
    });
  }

  // Rellenar campos (solo lectura)
  if (fromInput)  { fromInput.value  = ride.from  || ""; fromInput.disabled  = true; }
  if (toInput)    { toInput.value    = ride.to    || ""; toInput.disabled    = true; }
  if (timeInput)  { timeInput.value  = ride.time  || ""; timeInput.disabled  = true; }
  if (seatsInput) { seatsInput.value = ride.seats ?? 1;  seatsInput.disabled = true; }
  if (feeInput)   { feeInput.value   = ride.price ?? 0;  feeInput.disabled   = true; }

  if (makeSelect){
    makeSelect.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "__brand__";
    opt.textContent = ride.carBrand || "Brand";
    makeSelect.appendChild(opt);
    makeSelect.disabled = true;
  }
  if (modelInput) { modelInput.value = ride.carModel || ""; modelInput.disabled = true; }
  if (yearInput)  { yearInput.value  = ride.carYear  || ""; yearInput.disabled  = true; }

  // Reglas de CTA
  const isOwner = !!(session?.email) &&
                  (ride.driverEmail||"").toLowerCase() === session.email.toLowerCase();
  const isFull = Number(ride.seats) <= 0;

  const alreadyRequested = () => {
    const bookings = get("bookings");
    // Bloquear si ya existe una booking no cancelada para este ride por este cliente
    return !!(session?.email) && bookings.some(b =>
      b.rideId === ride.id &&
      (b.clientEmail||"").toLowerCase() === session.email.toLowerCase() &&
      b.status !== 'cancelled'
    );
  };

  function refreshCTA(){
    if (!btnRequest) return;

    // Por defecto
    btnRequest.disabled = false;
    btnRequest.textContent = "Request";
    btnRequest.style.display = "inline-block";

    if (!session){
      btnRequest.textContent = "Login to request";
      btnRequest.disabled = false; // permitimos click para redirigir
      return;
    }
    if (isOwner){
      btnRequest.textContent = "Own ride";
      btnRequest.disabled = true;
      return;
    }
    if (alreadyRequested()){
      btnRequest.textContent = "Requested";
      btnRequest.disabled = true;
      return;
    }
    if (isFull){
      btnRequest.textContent = "Full";
      btnRequest.disabled = true;
      return;
    }
  }

  refreshCTA();

  // Enviar solicitud (solo clientes)
  form?.addEventListener("submit", (e)=>{
    e.preventDefault();

    if (!session){
      alert("Please login to request this ride.");
      location.href = "login.html";
      return;
    }
    if (session.role !== "client"){
      alert("Only clients can request rides.");
      return;
    }
    if (isOwner){
      alert("No puedes solicitar tu propio ride.");
      return;
    }
    if (alreadyRequested()){
      // Doble seguridad por si el usuario intenta forzar
      alert("Ya solicitaste este ride.");
      refreshCTA();
      return;
    }
    if (isFull){
      alert("Sin asientos disponibles.");
      refreshCTA();
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

    alert("Ride solicitado. Revisa la sección Bookings.");
    refreshCTA();
    location.href = "view_booking.html";
  });

  // Cancel/volver
  btnCancel?.addEventListener("click", (e)=>{
    e.preventDefault();
    history.length > 1 ? history.back() : (location.href = "MyRides.html");
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