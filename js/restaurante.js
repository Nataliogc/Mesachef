// js/restaurante.js
(function () {
    const {
        getCurrentHotel,
        getWeekDates,
        toIsoDate,
        formatDayHeader,
        formatDateES
    } = window.MesaChef;

    const hotelId = getCurrentHotel();

    const state = {
        baseDate: new Date(),
        reservas: [],
        filtroTexto: "",
        filtroEstado: "activos",
        editingId: null
    };

    // --- DOM ---
    const tituloHotel = document.getElementById("tituloHotel");
    const estadoConexion = document.getElementById("estadoConexion");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    const inputSemana = document.getElementById("inputSemana");
    const txtBuscar = document.getElementById("txtBuscar");
    const filtroEstado = document.getElementById("filtroEstado");
    const grid = document.getElementById("gridRestaurante");

    // Reporting buttons
    const btnReporteSemana = document.getElementById("btnReporteSemana");
    const btnReporteDia = document.getElementById("btnReporteDia");

    const btnNuevaReserva = document.getElementById("btnNuevaReserva");
    const modalReserva = document.getElementById("modalReserva");
    const formReserva = document.getElementById("formReserva");
    const tituloModalReserva = document.getElementById("tituloModalReserva");

    const campoEspacio = document.getElementById("campoEspacio");
    const campoFecha = document.getElementById("campoFecha");
    const campoHora = document.getElementById("campoHora");
    const campoNombre = document.getElementById("campoNombre");
    const campoTelefono = document.getElementById("campoTelefono");
    const campoPax = document.getElementById("campoPax");
    const campoTurno = document.getElementById("campoTurno");
    const campoPrecio = document.getElementById("campoPrecio");
    const campoNotas = document.getElementById("campoNotas");
    const campoNotaCliente = document.getElementById("campoNotaCliente");
    const campoEstado = document.getElementById("campoEstado");

    const btnCancelarReserva = document.getElementById("btnCancelarReserva");
    const btnCerrarModal = document.getElementById("btnCerrarModal");

    // Utils
    function getLogoPath(id) {
        if (id === "Guadiana") return "Img/logo-guadiana.svg";
        if (id === "Cumbria") return "Img/logo-cumbria.svg";
        return "";
    }

    function nombreHotelCompleto(id) {
        if (id === "Guadiana") return "Sercotel Guadiana";
        if (id === "Cumbria") return "Cumbria Spa&Hotel";
        return id || "Hotel";
    }

    function actualizarEstadoConexion(estado) {
        if (!estadoConexion) return;
        estadoConexion.className = "estado-conexion";
        estadoConexion.classList.remove("estado-ok", "estado-error");
        if (estado === "ok") {
            estadoConexion.classList.add("estado-ok");
            estadoConexion.textContent = "Conectado";
        } else if (estado === "error") {
            estadoConexion.classList.add("estado-error");
            estadoConexion.textContent = "Sin conexión";
        } else {
            estadoConexion.textContent = "Cargando...";
        }
    }

    if (tituloHotel) {
        const logo = getLogoPath(hotelId);
        tituloHotel.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
           ${logo ? `<img src="${logo}" style="height:24px; width:auto;" alt="Logo" />` : ''}
           <span>Restaurante · ${nombreHotelCompleto(hotelId)}</span>
        </div>
      `;
    }

    function normalizarTurno(v) {
        const s = String(v || "").toLowerCase();
        if (s.includes("cena")) return "cena";
        return "almuerzo";
    }

    function normalizarEstado(v) {
        const s = String(v || "").toLowerCase();
        if (s.includes("anul")) return "anulada";
        if (s.includes("conf")) return "confirmada";
        return "pendiente";
    }

    // Firestore
    const colReservas = db.collection("reservas_restaurante");
    function initListener() {
        actualizarEstadoConexion("pending");
        colReservas.where("hotelId", "==", hotelId).onSnapshot(
            (snap) => {
                state.reservas = [];
                snap.forEach((d) => { state.reservas.push({ id: d.id, ...d.data() }); });
                actualizarEstadoConexion("ok");
                render();
            },
            (err) => {
                console.error("Error reserva:", err);
                actualizarEstadoConexion("error");
            }
        );
    }
    initListener();

    function render() {
        if (!grid) return;
        const days = getWeekDates(state.baseDate);
        if (inputSemana) inputSemana.value = toIsoDate(state.baseDate);

        const filteredGlobal = state.reservas.filter((r) => {
            if (state.filtroTexto) {
                const text = ((r.nombre || "") + " " + (r.notas || "")).toLowerCase();
                if (!text.includes(state.filtroTexto)) return false;
            }
            const est = normalizarEstado(r.estado);
            if (state.filtroEstado === "activos" && est === "anulada") return false;
            if (state.filtroEstado === "confirmada" && est !== "confirmada") return false;
            if (state.filtroEstado === "pendiente" && est !== "pendiente") return false;
            if (state.filtroEstado === "anulada" && est !== "anulada") return false;
            return true;
        });

        let html = `<div class="planning-grid">`;
        html += `<div class="planning-header"><div class="planning-header-cell">ESPACIO</div>`;
        days.forEach((d) => { html += `<div class="planning-header-cell">${formatDayHeader(d)}</div>`; });
        html += `</div>`;

        const espacios = [{ id: "restaurante", label: "Restaurante" }, { id: "cafeteria", label: "Cafetería" }];

        espacios.forEach((esp) => {
            html += `<div class="planning-row">`;
            html += `<div class="planning-row-label">${esp.label}</div>`;

            days.forEach((d) => {
                const isoDate = toIsoDate(d);
                const dayRes = filteredGlobal.filter((r) => {
                    if ((r.espacioId || "restaurante") !== esp.id) return false;
                    let fDoc = "";
                    if (r.fecha && r.fecha.toDate) fDoc = toIsoDate(r.fecha.toDate());
                    else fDoc = (r.fecha || "").slice(0, 10);
                    return fDoc === isoDate;
                });

                html += `<div class="planning-cell cell-dia"><div class="planning-cell-inner">`;

                ["almuerzo", "cena"].forEach(turno => {
                    const turnRes = dayRes.filter(r => normalizarTurno(r.turno) === turno);
                    turnRes.sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));

                    const totalPax = turnRes.filter(r => normalizarEstado(r.estado) !== "anulada")
                        .reduce((acc, curr) => acc + (parseInt(curr.pax) || 0), 0);
                    const icon = turno === "almuerzo" ? "☀️" : "🌙";
                    const hasClass = turnRes.length > 0 ? "has-items" : "";

                    html += `<div class="turn-slot ${hasClass}">
                      <div class="turn-slot-header">
                          <span class="turn-slot-icon" title="${turno}">${icon}</span>
                          ${totalPax > 0 ? `<span class="turn-slot-pax">${totalPax} pax</span>` : ''}
                      </div>`;

                    turnRes.forEach(r => {
                        const st = normalizarEstado(r.estado);
                        const stClass = `status-${st}`;
                        const hasNotes = r.notas && r.notas.trim().length > 0;
                        html += `
               <div class="reserva-card ${stClass}" data-id="${r.id}">
                  <div class="reserva-top">
                     <span class="reserva-time">${r.hora || "--:--"}</span>
                     <div style="display:flex; align-items:center; gap:4px; overflow:hidden;">
                        ${hasNotes ? '<span title="Tiene notas internas">📝</span>' : ''}
                        <span class="reserva-name">${r.nombre || "Sin Nombre"}</span>
                     </div>
                  </div>
                  <div class="reserva-meta">
                     <span>${r.pax || 0} pax</span>
                     <span>${r.precioPorPersona ? r.precioPorPersona + ' €' : ''}</span>
                  </div>
               </div>`;
                    });
                    html += `</div>`;
                });
                html += `   </div></div>`;
            });
            html += `</div>`;
        });
        html += `</div>`;
        grid.innerHTML = html;
    }

    // Handlers
    if (btnPrev) btnPrev.addEventListener("click", () => { const d = new Date(state.baseDate); d.setDate(d.getDate() - 7); state.baseDate = d; render(); });
    if (btnNext) btnNext.addEventListener("click", () => { const d = new Date(state.baseDate); d.setDate(d.getDate() + 7); state.baseDate = d; render(); });
    if (inputSemana) inputSemana.addEventListener("change", () => { if (inputSemana.value) { state.baseDate = new Date(inputSemana.value + "T00:00:00"); render(); } });
    if (txtBuscar) txtBuscar.addEventListener("input", () => { state.filtroTexto = txtBuscar.value.toLowerCase(); render(); });
    if (filtroEstado) filtroEstado.addEventListener("change", () => { state.filtroEstado = filtroEstado.value; render(); });

    // REPORTING LOGIC
    function imprimirInforme(tipo) {
        let start, end, title;
        if (tipo === 'dia') {
            // Default: Today in DD-MM-YYYY
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            const def = `${dd}-${mm}-${yyyy}`;

            const input = prompt("Introduce la fecha a imprimir (DD-MM-YYYY):", def);
            if (!input) return;

            // Parse input DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
            const parts = input.split(/[-/]/);
            if (parts.length < 3) return alert("Formato inválido");

            const P_dd = parts[0].padStart(2, '0');
            const P_mm = parts[1].padStart(2, '0');
            const P_yy = parts[2].length === 2 ? "20" + parts[2] : parts[2];
            const iso = `${P_yy}-${P_mm}-${P_dd}`;

            start = iso;
            end = iso;
            title = "Informe Diario · " + input;
        } else {
            // Semana actual
            const days = getWeekDates(state.baseDate);
            start = toIsoDate(days[0]);
            end = toIsoDate(days[6]);
            title = "Informe Semanal · " + formatDateES(days[0]) + " - " + formatDateES(days[6]);
        }

        // Filter
        const data = state.reservas.filter(r => {
            let fDoc = "";
            if (r.fecha && r.fecha.toDate) fDoc = toIsoDate(r.fecha.toDate());
            else fDoc = (r.fecha || "").slice(0, 10);
            return fDoc >= start && fDoc <= end && normalizarEstado(r.estado) !== "anulada";
        });

        // Sort
        data.sort((a, b) => {
            const fa = (a.fecha?.toDate ? toIsoDate(a.fecha.toDate()) : a.fecha) || "";
            const fb = (b.fecha?.toDate ? toIsoDate(b.fecha.toDate()) : b.fecha) || "";
            if (fa !== fb) return fa.localeCompare(fb);
            const ta = a.turno || ""; const tb = b.turno || "";
            if (ta !== tb) return ta.localeCompare(tb); // a vs c
            return (a.hora || "").localeCompare(b.hora || "");
        });

        // HTML
        let html = `
        <html><head><title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
          th { background: #f4f4f4; text-transform: uppercase; font-size: 11px; }
          .total-row { background: #eee; font-weight: bold; }
        </style>
        </head><body>
        <h1>${title} (${nombreHotelCompleto(hotelId)})</h1>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Espacio</th>
              <th>Cliente</th>
              <th>Pax</th>
              <th>Teléfono</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>`;

        let totalPax = 0;
        data.forEach(r => {
            let fShow = r.fecha;
            if (r.fecha && r.fecha.toDate) fShow = formatDateES(r.fecha.toDate());
            totalPax += (parseInt(r.pax) || 0);
            html += `<tr>
            <td>${fShow}</td>
            <td>${r.hora || '--:--'}</td>
            <td>${(r.espacioId || "").toUpperCase()} (${(r.turno || "").substring(0, 3)})</td>
            <td>${r.nombre || ''}</td>
            <td>${r.pax || 0}</td>
            <td>${r.telefono || ''}</td>
            <td>${r.notes || r.notas || ''}</td>
        </tr>`;
        });
        html += `<tr class="total-row"><td colspan="4" style="text-align:right">TOTAL PAX:</td><td>${totalPax}</td><td colspan="2"></td></tr>`;
        html += `</tbody></table></body></html>`;

        const w = window.open("", "_blank");
        w.document.write(html);
        w.document.close();
        w.print();
    }

    if (btnReporteSemana) btnReporteSemana.onclick = () => imprimirInforme('semana');
    if (btnReporteDia) btnReporteDia.onclick = () => imprimirInforme('dia');

    function abrirModal(r = null) {
        modalReserva.classList.remove("hidden");
        if (r) {
            state.editingId = r.id;
            tituloModalReserva.textContent = r.nombre || "Editar Reserva";
            campoEspacio.value = r.espacioId || "restaurante";
            campoFecha.value = r.fecha || "";
            campoHora.value = r.hora || "";
            campoNombre.value = r.nombre || "";
            campoTelefono.value = r.telefono || "";
            campoPax.value = r.pax || "";
            campoTurno.value = normalizarTurno(r.turno);
            campoPrecio.value = r.precioPorPersona || "";
            campoNotas.value = r.notas || "";
            campoEstado.value = normalizarEstado(r.estado);
            if (campoNotaCliente) campoNotaCliente.value = "";
        } else {
            state.editingId = null;
            tituloModalReserva.textContent = "Nueva Reserva";
            campoEspacio.value = "restaurante";
            campoFecha.value = inputSemana.value || toIsoDate(new Date());
            campoHora.value = "";
            campoNombre.value = "";
            campoTelefono.value = "";
            campoPax.value = "";
            campoTurno.value = "almuerzo";
            campoPrecio.value = "";
            campoNotas.value = "";
            campoEstado.value = "pendiente";
            if (campoNotaCliente) campoNotaCliente.value = "";
        }
    }

    function cerrarModal() {
        modalReserva.classList.add("hidden");
    }

    if (btnNuevaReserva) btnNuevaReserva.addEventListener("click", () => abrirModal(null));
    if (btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModal);
    if (btnCancelarReserva) btnCancelarReserva.addEventListener("click", cerrarModal);
    if (modalReserva) modalReserva.addEventListener("click", e => { if (e.target === modalReserva) cerrarModal(); });
    grid.addEventListener("click", (e) => {
        const card = e.target.closest(".reserva-card");
        if (card && card.dataset.id) {
            const r = state.reservas.find(x => x.id === card.dataset.id);
            if (r) abrirModal(r);
        }
    });

    formReserva.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!campoNombre.value || !campoFecha.value) return;
        const payload = {
            hotelId,
            espacioId: campoEspacio.value,
            fecha: campoFecha.value,
            hora: campoHora.value,
            nombre: campoNombre.value.trim(),
            telefono: campoTelefono.value.trim(),
            pax: parseInt(campoPax.value) || 0,
            turno: campoTurno.value,
            precioPorPersona: parseFloat(campoPrecio.value) || 0,
            importeTotal: (parseInt(campoPax.value) || 0) * (parseFloat(campoPrecio.value) || 0),
            notas: campoNotas.value.trim(),
            estado: campoEstado.value,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            if (state.editingId) {
                await colReservas.doc(state.editingId).update(payload);
            } else {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await colReservas.add(payload);
            }
            cerrarModal();
        } catch (err) {
            console.error("Error save", err);
            alert("Error al guardar reserva");
        }
    });
})();
