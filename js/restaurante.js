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
      apiKey: "AIzaSyBAK0sGUYpV8KHy1KwIdNRLtHlq5LT3Vwg",
      authDomain: "gestionsalones-bba4b.firebaseapp.com",
      projectId: "gestionsalones-bba4b",
      storageBucket: "gestionsalones-bba4b.firebasestorage.app",
      messagingSenderId: "860164285474",
      appId: "1:860164285474:web:ff995e88093e5aa5eb167b"
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

    const titleHotel = document.getElementById("tituloHotel");
    if (titleHotel) {
      titleHotel.innerText = currentHotel === "Guadiana" ? "Sercotel Guadiana" : "Cumbria Spa";
    }
    document.getElementById("labelConectado").classList.remove("hidden");

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
        html += `
                 <div class="day-column">
                    <div class="turn-cell group">
                         <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-amber-500">☀️</span>
                            <button onclick="openBooking('${space}', '${dateStr}', 'almuerzo')" class="opacity-0 group-hover:opacity-100 text-blue-600 font-bold bg-blue-50 px-1.5 rounded text-[10px] transition">+</button>
                         </div>
                         <div id="zone_${space}_${dateStr}_almuerzo" class="flex flex-col gap-2"></div>
                    </div>
                    <div class="turn-cell group">
                         <div class="flex justify-between items-center mb-1">
                            <span class="text-xs text-slate-400">🌙</span>
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

  function loadReservations() {
    log("loadReservations: Starting...");
    const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";

    // Correct Collection: reservas_restaurante
    log("loadReservations: Subscribing to 'reservas_restaurante'...");
    try {
      db.collection("reservas_restaurante")
        .onSnapshot(snapshot => {
          log(`loadReservations: SNAPSHOT RECEIVED. Docs: ${snapshot.size}`);
          loadedReservations = [];
          snapshot.forEach(doc => {
            const r = doc.data();
            r.id = doc.id;
            loadedReservations.push(r);
          });
          log("loadReservations: Data processed. Re-rendering...");
          renderGridStructure();

          // Clear the loading message if it exists
          // We don't have a specific loading ID element in the HTML other than the initial text.
          // The grid render overwrites it.
        }, err => {
          log("CRITICAL ERROR: Snapshot failed: " + err.message);
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

    let html = `
            <div style="font-family: sans-serif; padding: 20px;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">${hotel === "Guadiana" ? "Sercotel Guadiana" : "Cumbria Spa"}</h1>
                <h2 style="font-size: 18px; color: #555; margin-bottom: 20px;">${title}</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f3f3f3; border-bottom: 2px solid #ccc;">
                            <th style="padding: 8px; text-align: left;">Fecha</th>
                            <th style="padding: 8px; text-align: left;">Hora</th>
                            <th style="padding: 8px; text-align: left;">Espacio</th>
                            <th style="padding: 8px; text-align: left;">Cliente</th>
                            <th style="padding: 8px; text-align: left;">Pax</th>
                            <th style="padding: 8px; text-align: left;">Teléfono</th>
                            <th style="padding: 8px; text-align: left;">Notas</th>
                            <th style="padding: 8px; text-align: left;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    let rows = [];
    loadedReservations.forEach(r => {
      if (r.hotel && r.hotel !== hotel) return;
      let rDateStr = "";
      if (r.fecha && r.fecha.toDate) rDateStr = utils.toIsoDate(r.fecha.toDate());
      else if (typeof r.fecha === 'string') rDateStr = r.fecha;

      if (filterFn(r, rDateStr)) {
        rows.push({ ...r, dateStr: rDateStr, ts: new Date(rDateStr + 'T' + (r.hora || '00:00')) });
      }
    });

    rows.sort((a, b) => a.ts - b.ts);

    rows.forEach(r => {
      const dateDisplay = new Date(r.dateStr).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px;">${dateDisplay}</td>
                    <td style="padding: 8px;"><b>${r.hora || '--:--'}</b></td>
                    <td style="padding: 8px;">${r.espacio || ''}</td>
                    <td style="padding: 8px;">${r.nombre || r.cliente || ''}</td>
                    <td style="padding: 8px;">${r.pax || ''}</td>
                    <td style="padding: 8px;">${r.telefono || ''}</td>
                    <td style="padding: 8px; color:#666;">${r.notas || ''}</td>
                    <td style="padding: 8px;">${r.estado || ''}</td>
                </tr>
            `;
    });

    html += `   </tbody></table>
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

  ensureFirebase(startApp);
})();
