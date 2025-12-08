// js/restaurante.js - v7 (Fixed & Clean)

(function () {
  // --- FIREBASE INIT ---
  function ensureFirebase(callback) {
    if (window.firebase && window.firebase.apps.length) { callback(); return; }
    const s1 = document.createElement("script");
    s1.src = "https://www.gstatic.com/firebasejs/9.6.7/firebase-app-compat.js";
    s1.onload = function () {
      const s2 = document.createElement("script");
      s2.src = "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore-compat.js";
      s2.onload = function () { initFirebase(callback); };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }

  function initFirebase(callback) {
    const firebaseConfig = {
      apiKey: "AIzaSyAXv_wKD48EFDe8FBQ-6m0XGUNoxSRiTJY",
      authDomain: "mesa-chef-prod.firebaseapp.com",
      projectId: "mesa-chef-prod",
      storageBucket: "mesa-chef-prod.firebasestorage.app",
      messagingSenderId: "43170330072",
      appId: "1:43170330072:web:bcdd09e39930ad08bf2ead"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    callback();
  }

  let db;
  let currentWeekStart = new Date();
  const cleanDay = currentWeekStart.getDay();
  const diff = currentWeekStart.getDate() - cleanDay + (cleanDay === 0 ? -6 : 1);
  currentWeekStart.setDate(diff);

  let loadedReservations = [];
  const STORAGE_KEY = "mesaChef_hotel";
  const SPACES = ["Restaurante", "Cafeteria"];

  const utils = {
    getWeekDates: (d) => {
      const start = new Date(d);
      const dates = [];
      for (let i = 0; i < 7; i++) {
        let temp = new Date(start);
        temp.setDate(temp.getDate() + i);
        dates.push(temp);
      }
      return dates;
    },
    toIsoDate: (d) => d.toISOString().split('T')[0],
    formatDateES: (d) => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    formatDateShort: (d) => d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
  };

  function startApp() {
    console.log("Restaurante v7: Starting...");
    db = firebase.firestore();

    // 1. HOTEL
    let currentHotel = localStorage.getItem(STORAGE_KEY);
    if (!currentHotel) currentHotel = "Guadiana";

    const headerHotelName = document.getElementById("headerHotelName");
    console.log("DEBUG: looking for headerHotelName", headerHotelName);
    if (headerHotelName) {
      console.log("DEBUG: injection hotel", currentHotel);
      if (currentHotel === "Guadiana") {
        headerHotelName.innerHTML = `
              <img src="Img/logo-guadiana.svg" class="h-8 w-auto object-contain mr-3" alt="Sercotel Guadiana">
              <span class="text-slate-700 font-bold tracking-tight">Sercotel Guadiana</span>
          `;
      } else {
        headerHotelName.innerHTML = `
              <img src="Img/logo-cumbria.svg" class="h-8 w-auto object-contain mr-3" alt="Cumbria Spa">
              <span class="text-slate-700 font-bold tracking-tight">Cumbria Spa&Hotel</span>
          `;
      }
    } else {
      console.error("DEBUG: headerHotelName NOT FOUND");
    }
    const connStatus = document.getElementById("connStatus");
    if (connStatus) connStatus.classList.remove("opacity-50"); // Example logic, or generally just leave it be as style is static mainly.
    // Actually, in salones.js we didn't specifically toggle a class to show it, it's always there. 
    // But the loading logic handles the 'Online' text. Let's match existing logic if possible or ignore if visual only.
    // In startApp, line 69 was showing a label. The new UI has it always visible.
    // We can just remove the old line 69.

    // 2. LISTENERS
    document.getElementById("btnNuevaReserva").addEventListener("click", () => openBooking());
    document.getElementById("btnCerrarModal").addEventListener("click", closeModal);
    document.getElementById("btnCancelarReserva").addEventListener("click", closeModal);
    document.getElementById("formReserva").addEventListener("submit", saveReservation);

    document.getElementById("btnPrev").addEventListener("click", () => changeWeek(-1));
    document.getElementById("btnNext").addEventListener("click", () => changeWeek(1));

    // PRINT
    document.getElementById("btnPrintWeek").addEventListener("click", () => printReport('semana'));
    document.getElementById("btnPrintDay").addEventListener("click", () => printReport('dia'));

    // FILTERS
    document.getElementById("filtroEstado").addEventListener("change", () => paintReservations(loadedReservations));
    document.getElementById("txtBuscar").addEventListener("input", () => paintReservations(loadedReservations));

    renderGridStructure();
    loadReservations();
  }

  function renderGridStructure() {
    const grid = document.getElementById("gridRestaurante");
    if (!grid) return;

    const dates = utils.getWeekDates(currentWeekStart);
    document.getElementById("inputSemana").value = utils.toIsoDate(dates[0]);

    let html = ``;
    html += `<div class="grid-header-cell">ESPACIO</div>`;
    dates.forEach(d => {
      html += `<div class="grid-header-cell">${utils.formatDateShort(d)}</div>`;
    });

    SPACES.forEach(space => {
      html += `<div class="space-label pl-4">${space}</div>`;
      dates.forEach(d => {
        const dateStr = utils.toIsoDate(d);

        // Calculate Totals for this cell
        let lunchPax = 0;
        let dinnerPax = 0;
        const currentHotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";

        loadedReservations.forEach(r => {
          if (r.hotel && r.hotel !== currentHotel) return;
          // Status Check (only Count Active)
          const st = (r.estado || 'pendiente').toLowerCase();
          if (st === 'anulada') return;

          // Date Check
          let rDate = "";
          if (r.fecha && r.fecha.toDate) rDate = utils.toIsoDate(r.fecha.toDate());
          else if (typeof r.fecha === 'string') rDate = r.fecha;

          if (rDate !== dateStr) return;
          if ((r.espacio || 'Restaurante') !== space) return;

          const t = (r.turno || 'almuerzo').toLowerCase();
          const p = parseInt(r.pax) || 0;

          if (t === 'almuerzo') lunchPax += p;
          if (t === 'cena') dinnerPax += p;
        });

        const lunchDisplay = lunchPax > 0 ? `<span class="ml-1 font-bold text-slate-600">${lunchPax} 👥</span>` : '';
        const dinnerDisplay = dinnerPax > 0 ? `<span class="ml-1 font-bold text-slate-600">${dinnerPax} 👥</span>` : '';

        html += `
                 <div class="day-column">
                    <div class="turn-cell group">
                         <div class="flex justify-between items-center mb-1">
                            <div class="flex items-center">
                                <span class="text-xs text-amber-500 mr-1">☀️</span>
                                ${lunchDisplay}
                            </div>
                            <button onclick="openBooking('${space}', '${dateStr}', 'almuerzo')" class="opacity-0 group-hover:opacity-100 text-blue-600 font-bold bg-blue-50 px-1.5 rounded text-[10px] transition">+</button>
                         </div>
                         <div id="zone_${space}_${dateStr}_almuerzo" class="flex flex-col gap-2"></div>
                    </div>
                    <div class="turn-cell group">
                         <div class="flex justify-between items-center mb-1">
                            <div class="flex items-center">
                                <span class="text-xs text-slate-400 mr-1">🌙</span>
                                ${dinnerDisplay}
                            </div>
                            <button onclick="openBooking('${space}', '${dateStr}', 'cena')" class="opacity-0 group-hover:opacity-100 text-blue-600 font-bold bg-blue-50 px-1.5 rounded text-[10px] transition">+</button>
                         </div>
                         <div id="zone_${space}_${dateStr}_cena" class="flex flex-col gap-2"></div>
                    </div>
                 </div>`;
      });
    });

    grid.innerHTML = html;
    if (loadedReservations.length > 0) paintReservations(loadedReservations);
  }

  // Helper to log to UI
  function logUI(msg) {
    console.log("[Restaurante]", msg);
    const el = document.getElementById("connStatus");
    if (el) {
      const textSpan = el.querySelector("span");
      const indicator = el.querySelector("div");
      if (textSpan) textSpan.innerText = msg;

      // Visual cues
      if (msg.toLowerCase().includes("error") || msg.toLowerCase().includes("fatal")) {
        el.className = "flex items-center gap-2 px-3 py-0.5 bg-red-50 rounded-full border border-red-100";
        if (indicator) indicator.className = "w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse";
        if (textSpan) textSpan.className = "text-[10px] font-bold text-red-700 uppercase tracking-wide";
      } else if (msg.toLowerCase().includes("conectado")) {
        el.className = "flex items-center gap-2 px-3 py-0.5 bg-green-50 rounded-full border border-green-100";
        if (indicator) indicator.className = "w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]";
        if (textSpan) textSpan.className = "text-[10px] font-bold text-green-700 uppercase tracking-wide";
      }
    }
  }

  function loadReservations() {
    logUI("Cargando...");
    const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";

    // Correct Collection: reservas_restaurante
    console.log("loadReservations: Subscribing to 'reservas_restaurante'...");
    try {
      db.collection("reservas_restaurante")
        .onSnapshot(snapshot => {
          logUI("Conectado");
          loadedReservations = [];
          snapshot.forEach(doc => {
            const r = doc.data();
            r.id = doc.id;
            loadedReservations.push(r);
          });
          console.log("loadReservations: Data processed. Re-rendering...");
          renderGridStructure();

          // Clear the loading message if it exists
          // We don't have a specific loading ID element in the HTML other than the initial text.
          // The grid render overwrites it.
        }, err => {
          logUI("CRITICAL ERROR: Snapshot failed: " + err.message);
          console.error("Restaurante Load Error:", err);
        });
    } catch (e) {
      log("CRITICAL ERROR invoking collection(): " + e.message);
    }
  }

  function paintReservations(reservations) {
    const dates = utils.getWeekDates(currentWeekStart);
    const startStr = utils.toIsoDate(dates[0]);
    const endStr = utils.toIsoDate(dates[6]);
    const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";

    const filterStatus = document.getElementById("filtroEstado").value;
    const searchText = (document.getElementById("txtBuscar").value || "").toLowerCase();

    // Clean zones first? No, append logic. But renderGridStructure clears them.
    // We probably should clear zones if we call this independently.
    // For now, renderGridStructure clears HTML so we are safe only if called from there or we manually clear.
    // Ideally we select all [id^='zone_'] and clear, but that's heavy.
    // Let's assume renderGridStructure calls this.
    // Wait, 'change' listener calls this directly! Duplicate cards risk!
    // FIX: Clear zones logic or re-render grid.
    // Efficient way: re-call renderGridStructure?
    // Let's just re-call renderGridStructure() inside the listener, but avoid loop.
    // Actually, easiest is:
    const zones = document.querySelectorAll("[id^='zone_']");
    zones.forEach(z => z.innerHTML = '');

    reservations.forEach(r => {
      // 1. Filter Hotel
      if (r.hotel && r.hotel !== hotel) return;

      // 2. Date
      let rDateStr = "";
      if (r.fecha && r.fecha.toDate) rDateStr = utils.toIsoDate(r.fecha.toDate());
      else if (typeof r.fecha === 'string') rDateStr = r.fecha;

      if (rDateStr < startStr || rDateStr > endStr) return;

      // 3. Status Filter
      const rStatus = (r.estado || "pendiente").toLowerCase();
      if (filterStatus === 'activos') {
        if (rStatus === 'anulada') return;
      } else if (filterStatus !== 'todas') {
        if (rStatus !== filterStatus) return;
      }

      // 4. Search Filter
      if (searchText) {
        const combined = `${r.nombre || ''} ${r.telefono || ''} ${r.id || ''}`.toLowerCase();
        if (!combined.includes(searchText)) return;
      }

      // 5. Paint
      const space = r.espacio || "Restaurante";
      const turno = r.turno || "almuerzo";
      const time = r.hora || "--:--";
      const name = r.nombre || r.cliente || "Sin nombre";
      const pax = r.pax || "?";
      const precio = r.precio || "";

      const zoneId = `zone_${space}_${rDateStr}_${turno}`;
      const zone = document.getElementById(zoneId);

      if (zone) {
        const div = document.createElement("div");
        let border = 'border-l-[3px] border-amber-300';
        if (rStatus === 'confirmada') border = 'border-l-[3px] border-green-500';
        if (rStatus === 'anulada') border = 'border-l-[3px] border-red-500';

        div.className = `bg-white border border-gray-100 shadow-sm rounded p-1.5 cursor-pointer hover:shadow-md transition text-[10px] ${border} mb-1`;
        div.innerHTML = `
                    <div class="flex justify-between font-bold text-gray-700 pointer-events-none">
                        <span>${time}</span>
                        <span>${pax}p</span>
                    </div>
                    <div class="truncate text-gray-500 my-0.5 pointer-events-none" title="${name}">${name}</div>
                    <div class="text-right text-gray-400 font-mono pointer-events-none">${precio ? precio + '€' : ''}</div>
                `;
        div.onclick = (e) => { e.stopPropagation(); openBooking(space, rDateStr, turno, r); };
        zone.appendChild(div);
      }
    });
  }

  window.printReport = function (mode) {
    const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
    const dates = utils.getWeekDates(currentWeekStart);
    let title = "";
    let filterFn;

    if (mode === 'dia') {
      const todayStr = utils.toIsoDate(new Date());
      const startStr = utils.toIsoDate(dates[0]);
      const endStr = utils.toIsoDate(dates[6]);
      let targetDateStr = todayStr;
      if (todayStr < startStr || todayStr > endStr) targetDateStr = startStr;
      const prettyDate = utils.formatDateES(new Date(targetDateStr));
      title = `Informe Diario - ${prettyDate}`;
      filterFn = (r, dateStr) => dateStr === targetDateStr;
    } else {
      const d1 = utils.formatDateES(dates[0]);
      const d2 = utils.formatDateES(dates[6]);
      title = `Informe Semanal (${d1} - ${d2})`;
      filterFn = (r, dateStr) => dateStr >= utils.toIsoDate(dates[0]) && dateStr <= utils.toIsoDate(dates[6]);
    }

    const logoUrl = (hotel === "Guadiana") ? "Img/logo-guadiana.svg" : "Img/logo-cumbria.svg";

    // Generate Grouped HTML instead of Table
    let html = `
            <div style="font-family: sans-serif; padding: 20px;">
                <div style="display:flex; align-items:center; gap:20px; margin-bottom:20px; border-bottom:2px solid #eee; padding-bottom:15px;">
                   <img src="${logoUrl}" style="height:60px; width:auto;">
                   <div>
                        <h1 style="font-size: 24px; font-weight: bold; margin:0; color:#333;">${hotel === "Guadiana" ? "Sercotel Guadiana" : "Cumbria Spa&Hotel"}</h1>
                        <h2 style="font-size: 16px; color: #666; margin:5px 0 0 0;">${title}</h2>
                   </div>
                </div>
    `;

    // 0. Collect Rows (Restored Logic)
    let rows = [];
    loadedReservations.forEach(r => {
      if (r.hotel && r.hotel !== hotel) return;
      let rDateStr = "";
      if (r.fecha && r.fecha.toDate) rDateStr = utils.toIsoDate(r.fecha.toDate());
      else if (typeof r.fecha === 'string') rDateStr = r.fecha;

      // STRICT FILTER: Date Range AND (Pendiente OR Confirmada)
      if (filterFn(r, rDateStr) && ['pendiente', 'confirmada'].includes(r.estado)) {
        rows.push({ ...r, dateStr: rDateStr, ts: new Date(rDateStr + 'T' + (r.hora || '00:00')) });
      }
    });
    rows.sort((a, b) => a.ts - b.ts);

    // 1. Group records by Date
    const groups = {};
    rows.forEach(r => {
      if (!groups[r.dateStr]) groups[r.dateStr] = [];
      groups[r.dateStr].push(r);
    });

    // 2. Iterate sorted dates
    const sortedDates = Object.keys(groups).sort();

    if (sortedDates.length === 0) {
      html += `<p style="color:#666; font-style:italic;">No hay reservas para este periodo.</p>`;
    } else {
      sortedDates.forEach(dateStr => {
        const dateObj = new Date(dateStr);
        // Format: "Lunes 8 de diciembre"
        // Note: dateStr is ISO (YYYY-MM-DD), so sorting works.
        const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        // Capitalize first letter
        const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        html += `<h3 style="font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">📅 ${dayNameCap}</h3>`;
        html += `<ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;">`;

        let dailyPax = 0;
        let countLunch = 0;
        let countDinner = 0;
        let countSpecial = 0;

        // Table (Start)
        html += `<table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f1f5f9; color: #475569; text-align: left;">
                            <th style="padding: 6px; width: 45px; border-bottom: 2px solid #ddd;">Hora</th>
                            <th style="padding: 6px; width: 70px; border-bottom: 2px solid #ddd;">Esp.</th>
                            <th style="padding: 6px; width: 130px; border-bottom: 2px solid #ddd;">Cliente</th>
                            <th style="padding: 6px; width: 30px; border-bottom: 2px solid #ddd; text-align:center;">Pax</th>
                            <th style="padding: 6px; border-bottom: 2px solid #ddd;">Notas / Observaciones</th>
                            <th style="padding: 6px; width: 40px; border-bottom: 2px solid #ddd;">Est.</th>
                            <th style="padding: 6px; width: 50px; border-bottom: 2px solid #ddd;">Serv.</th>
                        </tr>
                    </thead>
                    <tbody>`;

        groups[dateStr].forEach(r => {
          const pax = parseInt(r.pax) || 0;
          dailyPax += pax;
          const clientName = r.nombre || r.cliente || "Sin Nombre";
          const time = r.hora || "00:00";
          const space = r.espacio || "Restaurante";
          let statusFull = r.estado || "confirmada";

          // Abbreviate Status, Space
          let statusAbbr = (statusFull === 'confirmada' || statusFull === 'confirmed') ? 'Conf' : 'Pend';
          const spaceAbbr = space.substring(0, 8) + (space.length > 8 ? '.' : '');

          // Fix Notes
          let notesText = "";
          if (r.notas) {
            if (typeof r.notas === 'string') notesText = r.notas;
            else if (typeof r.notas === 'object') {
              notesText = Object.values(r.notas).filter(v => v && typeof v === 'string').join(". ");
            }
          }

          // Classification Logic
          let type = "Esp.";
          let typeFull = "Especial";
          const hour = parseInt(time.split(':')[0]);

          if (hour >= 12 && hour <= 15) { type = "Alm."; typeFull = "Almuerzo"; }
          else if (hour >= 20) { type = "Cena"; typeFull = "Cena"; }

          if (typeFull === "Almuerzo") countLunch += pax;
          else if (typeFull === "Cena") countDinner += pax;
          else countSpecial += pax;

          // Row
          html += `<tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 6px; font-weight:bold;">${time}</td>
                    <td style="padding: 6px; color:#555;">${spaceAbbr}</td>
                    <td style="padding: 6px; font-weight:600; color:#333;">${clientName.substring(0, 20)}</td>
                    <td style="padding: 6px; text-align:center;">${pax}</td>
                    <td style="padding: 6px; font-style:italic; color:#444;">${notesText}</td>
                    <td style="padding: 6px;">${statusAbbr}</td>
                    <td style="padding: 6px;">${type}</td>
                   </tr>`;
        });

        html += `</tbody></table>`;

        // Summary String construction
        let parts = [];
        if (countLunch > 0) parts.push(`${countLunch} almuerzo${countLunch > 1 ? 's' : ''}`);
        if (countDinner > 0) parts.push(`${countDinner} cena${countDinner > 1 ? 's' : ''}`);
        if (countSpecial > 0) parts.push(`${countSpecial} especial${countSpecial > 1 ? 'es' : ''}`);
        const breakdown = parts.length > 0 ? `(${parts.join(', ')})` : "";

        // Summary Footer
        html += `<div style="font-size: 13px; font-weight: bold; color: #333; margin-bottom: 30px; background: #fafafa; padding: 10px; border-left: 4px solid #666;">
                    Resumen día ${dateObj.getDate()}: Total ${dailyPax} personas ${breakdown}
                 </div>`;
      });
    }

    html += `
              <div style="margin-top: 20px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 5px;">
                  Impreso el ${new Date().toLocaleString()}
              </div>
          </div>`;


    const printArea = document.getElementById("printArea");
    if (printArea) {
      printArea.innerHTML = html;
      window.print();
    }
  };

  // FORM LOGIC
  window.openBooking = function (space, dateStr, turno, data) {
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Go top
    const modal = document.getElementById("modalReserva");
    document.getElementById("formReserva").reset();
    modal.classList.remove("hidden");

    if (data) {
      document.getElementById("campoNombre").value = data.nombre || data.cliente || "";
      document.getElementById("campoTelefono").value = data.telefono || "";
      document.getElementById("campoHora").value = data.hora || "";
      document.getElementById("campoPrecio").value = data.precio || "";
      document.getElementById("campoPax").value = data.pax || "";
      document.getElementById("campoNotas").value = data.notas || "";
      document.getElementById("campoNotaCliente").value = data.notaCliente || "";
      if (data.espacio) document.getElementById("campoEspacio").value = data.espacio;
      if (data.turno) document.getElementById("campoTurno").value = data.turno;
      if (data.estado) document.getElementById("campoEstado").value = data.estado;
      let dVal = dateStr;
      if (!dVal && data.fecha) {
        if (data.fecha.toDate) dVal = utils.toIsoDate(data.fecha.toDate());
        else dVal = data.fecha;
      }
      document.getElementById("campoFecha").value = dVal;
    } else {
      document.getElementById("campoEspacio").value = space || "Restaurante";
      document.getElementById("campoFecha").value = dateStr || utils.toIsoDate(new Date());
      if (turno) document.getElementById("campoTurno").value = turno;
    }
  };

  window.closeModal = function () {
    document.getElementById("modalReserva").classList.add("hidden");
  };

  window.saveReservation = async function (e) {
    e.preventDefault();
    const payload = {
      hotel: localStorage.getItem(STORAGE_KEY) || "Guadiana",
      fecha: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById("campoFecha").value)),
      espacio: document.getElementById("campoEspacio").value,
      nombre: document.getElementById("campoNombre").value,
      telefono: document.getElementById("campoTelefono").value,
      hora: document.getElementById("campoHora").value,
      pax: parseInt(document.getElementById("campoPax").value) || 0,
      precio: parseFloat(document.getElementById("campoPrecio").value) || 0,
      turno: document.getElementById("campoTurno").value,
      estado: document.getElementById("campoEstado").value,
      notas: document.getElementById("campoNotas").value,
      notaCliente: document.getElementById("campoNotaCliente").value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
      await db.collection("reservas_restaurante").add(payload);
      closeModal();
    } catch (err) {
      alert(err);
    }
  };

  window.changeWeek = function (d) {
    currentWeekStart.setDate(currentWeekStart.getDate() + (d * 7));
    renderGridStructure();
  }

  // --- GLOBAL SEARCH LOGIC (Restaurante) ---
  let searchDebounce = null;

  window.handleSearch = function (query) {
    clearTimeout(searchDebounce);
    const container = document.getElementById("searchResults");

    if (!query || query.trim().length < 2) {
      if (container) container.classList.add("hidden");
      return;
    }

    searchDebounce = setTimeout(() => {
      doSearch(query);
    }, 300);
  };

  function doSearch(query) {
    const q = query.toLowerCase();
    const container = document.getElementById("searchResults");
    if (!container) return;

    const results = loadedReservations.filter(r => {
      const combined = `${r.nombre || ''} ${r.cliente || ''} ${r.telefono || ''} ${r.email || ''} ${r.id || ''} ${r.espacio || ''} `.toLowerCase();
      const dateStr = r.fecha && r.fecha.toDate ? utils.toIsoDate(r.fecha.toDate()) : (r.fecha || "");
      return combined.includes(q) || dateStr.includes(q);
    });

    renderSearchResults(results);
  }

  function renderSearchResults(results) {
    const container = document.getElementById("searchResults");
    if (!container) return;
    container.innerHTML = "";

    if (results.length === 0) {
      container.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">No se encontraron resultados</div>';
    } else {
      // Sort by Date Desc
      results.sort((a, b) => {
        const da = a.fecha && a.fecha.toDate ? a.fecha.toDate() : new Date(a.fecha);
        const db = b.fecha && b.fecha.toDate ? b.fecha.toDate() : new Date(b.fecha);
        return db - da; // Descending
      });

      results.slice(0, 50).forEach(r => {
        const rDate = r.fecha && r.fecha.toDate ? r.fecha.toDate() : new Date(r.fecha);
        const datePretty = utils.formatDateShort(rDate);
        const name = r.nombre || r.cliente || "Sin Nombre";

        const item = document.createElement("div");
        item.className = "p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition border-b border-gray-50 last:border-0";
        item.innerHTML = `
      <div class="flex flex-col">
                      <span class="font-bold text-slate-800 text-sm">${name}</span>
                      <span class="text-[10px] text-slate-500 uppercase">📅 ${datePretty} &bull; ${r.espacio || 'Restaurante'} &bull; ${r.turno}</span>
                  </div>
      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${r.estado || 'pendiente'}</span>
    `;
        item.onclick = () => selectSearchResult(r);
        container.appendChild(item);
      });
    }
    container.classList.remove("hidden");
  }

  window.selectSearchResult = function (r) {
    document.getElementById("searchResults").classList.add("hidden");
    const rDate = r.fecha && r.fecha.toDate ? r.fecha.toDate() : new Date(r.fecha);
    goToDate(rDate);
    // Optional: openBooking(r.espacio, utils.toIsoDate(rDate), r.turno, r);
  };

  window.goToDate = function (dateObj) {
    const d = new Date(dateObj);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    d.setDate(diff);

    currentWeekStart = d;
    renderGridStructure();
  };

  ensureFirebase(startApp);
})();
