(function(){
  'use strict';

  const ls = localStorage, ss = sessionStorage;
  const getSession = () => window.Auth?.getSession?.() || JSON.parse(ss.getItem('session') || 'null');
  const getUsers = () => JSON.parse(ls.getItem('users') || '[]');
  const getRides = () => JSON.parse(ls.getItem('rides') || '[]');
  const getBookings = () => JSON.parse(ls.getItem('bookings') || '[]');
  const setBookings = (arr) => ls.setItem('bookings', JSON.stringify(arr));

  const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c=>{
      const r=Math.random()*16|0, v=c==='x'?r:(r&0x3|0x8); return v.toString(16);
    }));

  const $ = (s,ctx=document)=>ctx.querySelector(s);
  const $$ = (s,ctx=document)=>Array.from(ctx.querySelectorAll(s));

  let form, fromSel, toSel, dayChecks, tbody;

  function initDom(){
    form = $('.search-box form');
    if (!form) return false;
    [fromSel, toSel] = form.querySelectorAll('select');
    dayChecks = form.querySelectorAll('.days input[type="checkbox"]');
    tbody = document.querySelector('.results table tbody');
    return !!(fromSel && toSel && tbody);
  }

  function unique(arr){ return Array.from(new Set(arr)); }

  function populateSelects(){
    const rides = getRides();
    const froms = unique(rides.map(r=>r.from).filter(Boolean)).sort();
    const tos   = unique(rides.map(r=>r.to).filter(Boolean)).sort();

    function fillSelect(sel, values){
      const current = sel.value;
      sel.innerHTML = '<option value="">All</option>' + values.map(v=>`<option value="${v}">${v}</option>`).join('');
      if (Array.from(sel.options).some(o=>o.value===current)) sel.value = current;
    }

    fillSelect(fromSel, froms);
    fillSelect(toSel, tos);
  }

  function readFilters(){
    const from = (fromSel?.value || '').trim();
    const to   = (toSel?.value || '').trim();
    const days = Array.from(dayChecks).filter(c=>c.checked).map(c=>c.parentElement.textContent.trim().split(' ')[0]);
    return {from, to, days};
  }

  function matchesFilters(ride, f){
    const okFrom = !f.from || ride.from === f.from;
    const okTo   = !f.to   || ride.to   === f.to;
    const okDays = !f.days.length || (Array.isArray(ride.days) && ride.days.some(d => f.days.includes(d)));
    return okFrom && okTo && okDays;
  }

  function hasRequested(rideId, email){
    return getBookings().some(b => b.rideId===rideId && b.clientEmail===email && b.status!=='cancelled');
  }

  function displayName(email){
    const u = getUsers().find(u=>u.email===email);
    if (!u) return email;
    const name = `${u.firstName||''} ${u.lastName||''}`.trim();
    return name || email;
  }

  function requestRide(ride){
    const session = getSession();
    if (!session){
      alert('Necesitas iniciar sesión para solicitar un ride.');
      location.href = 'login.html';
      return;
    }
    if (ride.driverEmail === session.email){
      alert('No puedes solicitar tu propio ride.');
      return;
    }
    const bookings = getBookings();
    if (bookings.find(b=>b.rideId===ride.id && b.clientEmail===session.email && b.status!=='cancelled')){
      alert('Ya solicitaste este ride.');
      render();
      return;
    }
    bookings.push({
      id: uuid(),
      rideId: ride.id,
      clientEmail: session.email,
      createdAt: Date.now(),
      status: 'pending'
    });
    setBookings(bookings);
    render();
  }

  function render(){
    const rides = getRides();
    const session = getSession();
    const f = readFilters();

    const list = rides.filter(r=>matchesFilters(r, f));

    tbody.innerHTML = '';

    if (list.length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="7">No rides match your filters.</td>`;
      tbody.appendChild(tr);
      return;
    }

    list.forEach(ride=>{
      const isOwn = session && ride.driverEmail === session.email;
      const isFull = Number(ride.seats) <= 0;
      const already = session ? hasRequested(ride.id, session.email) : false;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${displayName(ride.driverEmail)}</td>
        <td><a href="rides.html?id=${encodeURIComponent(ride.id)}">${ride.from}</a></td>
        <td>${ride.to}</td>
        <td>${ride.seats}</td>
        <td>${[ride.carBrand, ride.carModel, ride.carYear].filter(Boolean).join(' ') || '-'}</td>
        <td>$${(Number(ride.price)||0).toFixed(2)}</td>
        <td class="actions"></td>
      `;
      const btn = document.createElement('button');
      const actions = tr.querySelector('.actions');

      if (!session){
        btn.textContent = 'Login to request';
        btn.onclick = ()=>{ alert('Inicia sesión para solicitar un ride'); location.href='login.html'; };
      } else if (isOwn){
        btn.textContent = 'Own ride'; btn.disabled = true;
      } else if (already){
        btn.textContent = 'Requested'; btn.disabled = true;
      } else if (isFull){
        btn.textContent = 'Full'; btn.disabled = true;
      } else {
        btn.textContent = 'Request';
        btn.onclick = ()=>requestRide(ride);
      }
      actions.appendChild(btn);
      tbody.appendChild(tr);
    });
  }

  function bindEvents(){
    if (form){
      form.addEventListener('submit', (e)=>{ e.preventDefault(); render(); });
    }
    [fromSel, toSel].forEach(sel=> sel?.addEventListener('change', render));
    dayChecks.forEach(c=> c.addEventListener('change', render));
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    try{ window.Auth?.applyRoleUI?.(); }catch(e){}
    if (!initDom()) return;
    populateSelects();
    bindEvents();
    render();
  });

})();

document.addEventListener("DOMContentLoaded", ()=>{
  const link = document.getElementById("logoutLink");
  if(link){
    link.addEventListener("click", (e)=>{
      e.preventDefault();
      Auth.logout(); // ✅ cierra sesión y redirige
    });
  }
});