(function(){
  'use strict';

  const ls = localStorage, ss = sessionStorage;
  const getSession = () => {
    try { return window.Auth?.getSession?.() || JSON.parse(ss.getItem('session') || 'null'); }
    catch { return null; }
  };
  const getUsers    = () => JSON.parse(ls.getItem('users') || '[]');
  const getRides    = () => JSON.parse(ls.getItem('rides') || '[]');
  const setRides    = (arr) => ls.setItem('rides', JSON.stringify(arr));
  const getBookings = () => JSON.parse(ls.getItem('bookings') || '[]');
  const setBookings = (arr) => ls.setItem('bookings', JSON.stringify(arr));

  const $ = (s,ctx=document)=>ctx.querySelector(s);

  let thead, tbody;

  function initDom(){
    thead = $('.bookings-table thead');
    tbody = $('.bookings-table tbody');
    const ok = !!(thead && tbody);
    if (!ok) console.error('[bookings] No se encontró .bookings-table thead/tbody');
    return ok;
  }

  function uname(email){
    const u = getUsers().find(u=>u.email===email);
    if (!u) return (email||'').split('@')[0] || email || '-';
    const full = `${u.firstName||''} ${u.lastName||''}`.trim();
    return full || (u.email || email);
  }

  function headClient(){
    thead.innerHTML = `
      <tr>
        <th>Driver</th><th>From</th><th>To</th><th>Time</th><th>Price</th><th>Status</th><th>Actions</th>
      </tr>`;
  }
  function headDriver(){
    thead.innerHTML = `
      <tr>
        <th>User</th><th>From</th><th>To</th><th>Time</th><th>Status</th><th>Actions</th>
      </tr>`;
  }

  function addRow(colsHtml){
    const tr = document.createElement('tr');
    tr.innerHTML = colsHtml;
    tbody.appendChild(tr);
  }

  // ===== Render para CLIENTE =====
  function renderClient(session){
    const rides = getRides();
    const ridesById = Object.fromEntries(rides.map(r=>[r.id,r]));
    const my = getBookings().filter(b => b.clientEmail === session?.email)
      .sort((a,b)=>b.createdAt - a.createdAt);

    if (!my.length){
      addRow(`<td colspan="7">No requests</td>`);
      return;
    }

    my.forEach(b=>{
      const ride = ridesById[b.rideId];
      if (!ride){
        addRow(`<td colspan="7">Ride eliminado (id=${b.rideId}) — status: ${b.status}</td>`);
        return;
      }
      const price = ride.price!=null ? '$'+Number(ride.price).toFixed(2) : '-';
      const act = (b.status==='pending' || b.status==='approved')
        ? `<button data-cancel="${b.id}">Cancel</button>` : '-';

      addRow(`
        <td>${uname(ride.driverEmail)}</td>
        <td><a href="rides.html?id=${encodeURIComponent(ride.id)}">${ride.from}</a></td>
        <td>${ride.to}</td>
        <td>${ride.time || '-'}</td>
        <td>${price}</td>
        <td>${b.status}</td>
        <td class="actions">${act}</td>
      `);
    });
  }

  // ===== Render para DRIVER =====
  function renderDriver(session){
    const rides = getRides().filter(r=>r.driverEmail===session?.email);
    const rideIds = new Set(rides.map(r=>r.id));
    const ridesById = Object.fromEntries(rides.map(r=>[r.id,r]));
    const incoming = getBookings().filter(b=>rideIds.has(b.rideId))
      .sort((a,b)=>b.createdAt - a.createdAt);

    if (!incoming.length){
      addRow(`<td colspan="6">No requests for your rides</td>`);
      return;
    }

    incoming.forEach(b=>{
      const ride = ridesById[b.rideId];
      if (!ride){
        addRow(`<td colspan="6">Solicitud huérfana (ride eliminado) — status: ${b.status}</td>`);
        return;
      }
      const actions = (b.status==='pending')
        ? `<a href="#" data-accept="${b.id}">Accept</a> | <a href="#" data-reject="${b.id}">Reject</a>`
        : '-';

      addRow(`
        <td>${uname(b.clientEmail)}</td>
        <td><a href="rides.html?id=${encodeURIComponent(ride.id)}">${ride.from}</a></td>
        <td>${ride.to}</td>
        <td>${ride.time || '-'}</td>
        <td>${b.status}</td>
        <td class="actions">${actions}</td>
      `);
    });
  }

  // ===== Actions =====
  function wireActions(){
    tbody.addEventListener('click', e=>{
      const a = e.target.closest('a,button');
      if (!a) return;

      // Accept
      const acc = a.getAttribute('data-accept');
      if (acc){
        e.preventDefault();
        const bks = getBookings();
        const rides = getRides();
        const b = bks.find(x=>x.id===acc);
        const ride = b && rides.find(r=>r.id===b.rideId);
        if (!b || !ride) return alert('Registro no disponible');
        if (b.status!=='pending') return alert('Solo pendientes');
        if (Number(ride.seats)<=0) return alert('Sin asientos');

        b.status='approved';
        ride.seats=Number(ride.seats)-1;
        setBookings(bks); setRides(rides);
        renderAll();
        return;
      }

      // Reject
      const rej = a.getAttribute('data-reject');
      if (rej){
        e.preventDefault();
        const bks = getBookings();
        const b = bks.find(x=>x.id===rej);
        if (!b) return;
        if (b.status!=='pending') return alert('Solo pendientes');
        b.status='rejected';
        setBookings(bks);
        renderAll();
        return;
      }

      // Cancel (cliente)
      const cancel = a.getAttribute('data-cancel');
      if (cancel){
        e.preventDefault();
        const bks = getBookings();
        const rides = getRides();
        const b = bks.find(x=>x.id===cancel);
        if (!b) return;
        if (b.status==='approved'){
          const ride = rides.find(r=>r.id===b.rideId);
          if (ride){ ride.seats = Number(ride.seats)+1; setRides(rides); }
        }
        b.status='cancelled';
        setBookings(bks);
        renderAll();
        return;
      }
    });
  }

  function renderAll(){
    const session = getSession();

    tbody.innerHTML = '';

    if (session?.role === 'driver'){
      headDriver();
      renderDriver(session);
      return;
    }

    if (session?.email){
      headClient();
      renderClient(session);
      return;
    }

    thead.innerHTML = '';
    addRow('<td colspan="7">Necesitas iniciar sesión para ver tus bookings.</td>');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    if (!initDom()) return;
    try { window.Auth?.applyRoleUI?.(); } catch {}
    wireActions();
    renderAll();
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