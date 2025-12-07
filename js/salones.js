// js/salones.js
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
        eventos: [],
        configSalones: [],
        configMontajes: [],
        editingId: null,
        currentConceptos: [] // Array { concepto, uds, precio }
    };

    // DOM
    const tituloHotel = document.getElementById("tituloHotel");
    const estadoConexion = document.getElementById("estadoConexion");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    const inputSemana = document.getElementById("inputSemana");
    const grid = document.getElementById("gridSalones");
    const btnNuevoEvento = document.getElementById("btnNuevoEvento");
    const btnReporteSemana = document.getElementById("btnReporteSemana");

    // Modal
    const modalEvento = document.getElementById("modalEvento");
    const formEvento = document.getElementById("formEvento");
    const tituloModalEvento = document.getElementById("tituloModalEvento");
    const btnCerrarModal = document.getElementById("btnCerrarModal");
    const btnCancelarEvento = document.getElementById("btnCancelarEvento");

    const campoSalon = document.getElementById("campoSalon");
    const campoFecha = document.getElementById("campoFecha");
    const campoNombre = document.getElementById("campoNombre");
    const campoPax = document.getElementById("campoPax");
    const campoTurno = document.getElementById("campoTurno");
    const campoMontaje = document.getElementById("campoMontaje");
    const campoNotas = document.getElementById("campoNotas");
    const campoEstado = document.getElementById("campoEstado"); // Nuevo

    // Conceptos
    const tbodyConceptos = document.getElementById("tbodyConceptos");
    const btnAddLine = document.getElementById("btnAddLine");
    const lblTotalGeneral = document.getElementById("lblTotalGeneral");

    // --- Utils ---
    function actualizarEstadoConexion(estado) {
        if (!estadoConexion) return;
        estadoConexion.className = "estado-conexion";
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

    if (tituloHotel) {
        const logo = getLogoPath(hotelId);
        tituloHotel.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
           ${logo ? `<img src="${logo}" style="height:24px; width:auto;" alt="Logo" />` : ''}
           <span>Salas & Eventos · ${nombreHotelCompleto(hotelId)}</span>
        </div>
      `;
    }

    // --- Config Logic ---
    async function cargarConfiguracion() {
        try {
            const doc = await db.collection("master_data").doc("CONFIG_SALONES").get();
            if (doc.exists) {
                const data = doc.data();
                if (data[hotelId]) {
                    state.configSalones = data[hotelId].map((s, i) => ({
                        id: "salon_" + i,
                        nombre: s.name,
                        paxCap: s.pax,
                        precioMedia: s.priceHalf,
                        precioCompleta: s.priceFull
                    }));
                } else {
                    state.configSalones = [{ id: "def1", nombre: "Salón Principal (Default)", precioMedia: 0, precioCompleta: 0 }];
                }

                if (data.montajes && Array.isArray(data.montajes)) {
                    state.configMontajes = data.montajes;
                } else {
                    state.configMontajes = ["Escuela", "Teatro", "Imperial", "U", "Cocktail", "Banquete"];
                }
            } else {
                state.configSalones = [{ id: "def1", nombre: "Default Salon" }];
                state.configMontajes = ["Escuela"];
            }
        } catch (e) {
            console.warn("Error config", e);
            state.configSalones = [{ id: "err", nombre: "Error Config" }];
        }
        renderSelectSalones();
        renderSelectMontajes();
        render();
    }

    function renderSelectSalones() {
        campoSalon.innerHTML = "";
        state.configSalones.forEach(s => {
            const op = document.createElement("option");
            op.value = s.id;
            op.textContent = s.nombre;
            campoSalon.appendChild(op);
        });
    }

    function renderSelectMontajes() {
        if (!campoMontaje) return;
        campoMontaje.innerHTML = "";
        state.configMontajes.forEach(m => {
            const op = document.createElement("option");
            op.value = m;
            op.textContent = m;
            campoMontaje.appendChild(op);
        });
    }

    const colEventos = db.collection("reservas_salones");
    function initListener() {
        actualizarEstadoConexion("pending");
        colEventos.where("hotelId", "==", hotelId).onSnapshot(
            (snap) => {
                state.eventos = [];
                snap.forEach((d) => { state.eventos.push({ id: d.id, ...d.data() }); });
                actualizarEstadoConexion("ok");
                render();
            },
            (err) => {
                console.error("Error salones:", err);
                actualizarEstadoConexion("error");
            }
        );
    }

    // --- Grid Render ---
    function render() {
        if (!grid) return;
        if (inputSemana) inputSemana.value = toIsoDate(state.baseDate);
        const days = getWeekDates(state.baseDate);

        let html = `<div class="planning-grid" style="grid-template-columns: 120px repeat(7, 1fr);">`;

        html += `<div class="planning-header"><div class="planning-header-cell">SALA</div>`;
        days.forEach(d => html += `<div class="planning-header-cell">${formatDayHeader(d)}</div>`);
        html += `</div>`;

        state.configSalones.forEach(sala => {
            html += `<div class="planning-row">`;
            html += `<div class="planning-row-label">${sala.nombre}</div>`;

            days.forEach(d => {
                const iso = toIsoDate(d);
                const evs = state.eventos.filter(e => {
                    if ((e.salonId || "def1") !== sala.id) return false;
                    const fEvent = (e.fechaInicio || "").slice(0, 10);
                    return fEvent === iso;
                });

                html += `<div class="planning-cell cell-dia"><div class="planning-cell-inner">`;

                ["mañana", "tarde"].forEach(slotName => {
                    const enSlot = evs.filter(e => {
                        const t = (e.turno || "mañana").toLowerCase();
                        if (t === "completa") return true;
                        return t === slotName;
                    });

                    // If empty, show "+" button. If items, show items.
                    // If "completa" occupies both, the visual logic handles it by mapping filter.

                    const hasItems = enSlot.length > 0 ? "has-items" : "";
                    // const icon = slotName==="mañana" ? "☀️" : "🌙"; // Optional depending on design reqs (screen doesn't show icons)

                    html += `<div class="turn-slot ${hasItems} slot-jornada" 
                               data-date="${iso}" data-salon="${sala.id}" data-turn="${slotName}">`;

                    if (enSlot.length === 0) {
                        // EMPTY SLOT with + Button
                        html += `<button class="btn-add-slot" title="Añadir evento">+</button>`;
                    } else {
                        // Render cards
                        enSlot.forEach(ev => {
                            const isComplete = (ev.turno || "").toLowerCase() === "completa";
                            const styleClass = isComplete ? "reserva-completa" : "reserva-confirmada";
                            // Simplified visual
                            html += `
                            <div class="reserva-card ${styleClass}" data-id="${ev.id}">
                               <div class="reserva-name">${ev.nombre}</div>
                            </div>
                          `;
                        });
                    }
                    html += `</div>`;
                });
                html += `</div></div>`;
            });
            html += `</div>`;
        });
        html += `</div>`;
        grid.innerHTML = html;
    }

    // --- Modal Logic ---

    function applyDefaultConcept(salonId, turno) {
        // Find tariff
        const salon = state.configSalones.find(s => s.id === salonId);
        let price = 0;
        if (salon) {
            if (turno === "completa") price = salon.precioCompleta;
            else price = salon.precioMedia;
        }
        // Add or update first line
        state.currentConceptos = [
            { concepto: "Alquiler " + (salon ? salon.nombre : "Sala"), uds: 1, precio: price }
        ];
        renderConceptos();
    }

    function renderConceptos() {
        tbodyConceptos.innerHTML = "";
        let totalSum = 0;
        state.currentConceptos.forEach((c, idx) => {
            const subtotal = (parseFloat(c.uds) || 0) * (parseFloat(c.precio) || 0);
            totalSum += subtotal;

            const tr = document.createElement("tr");
            tr.innerHTML = `
           <td><input type="text" class="input-concept js-desc" value="${c.concepto || ''}" data-idx="${idx}"></td>
           <td><input type="number" class="input-uds js-uds" value="${c.uds || 1}" min="1" data-idx="${idx}"></td>
           <td><input type="number" step="0.01" class="input-price js-price" value="${c.precio || 0}" data-idx="${idx}"></td>
           <td class="cell-total">${subtotal.toFixed(2)}€</td>
           <td><button type="button" class="btn-del-row js-del" data-idx="${idx}">&times;</button></td>
         `;
            tbodyConceptos.appendChild(tr);
        });
        lblTotalGeneral.textContent = totalSum.toFixed(2) + "€";
    }

    // Conceptos Event Delegation
    tbodyConceptos.addEventListener("input", (e) => {
        if (e.target.matches(".js-desc") || e.target.matches(".js-uds") || e.target.matches(".js-price")) {
            const idx = parseInt(e.target.dataset.idx);
            const field = e.target.classList.contains("js-desc") ? "concepto"
                : e.target.classList.contains("js-uds") ? "uds" : "precio";

            let val = e.target.value;
            if (field !== "concepto") val = parseFloat(val) || 0;

            state.currentConceptos[idx][field] = val;
            // Refresh render to update subtotal (debouncing could be better but this is fast enough)
            // To maintain focus we might avoid full re-render, but simplest is re-calc.
            // Let's just update the specific total cell to avoid focus loss.
            const subtotal = (state.currentConceptos[idx].uds * state.currentConceptos[idx].precio).toFixed(2);
            const row = e.target.closest("tr");
            row.querySelector(".cell-total").textContent = subtotal + "€";

            // Update grand total
            let grand = state.currentConceptos.reduce((acc, curr) => acc + (curr.uds * curr.precio), 0);
            lblTotalGeneral.textContent = grand.toFixed(2) + "€";
        }
    });

    tbodyConceptos.addEventListener("click", (e) => {
        if (e.target.matches(".js-del")) {
            const idx = parseInt(e.target.dataset.idx);
            state.currentConceptos.splice(idx, 1);
            renderConceptos();
        }
    });

    btnAddLine.addEventListener("click", () => {
        state.currentConceptos.push({ concepto: "", uds: 1, precio: 0 });
        renderConceptos();
    });

    // Salon/Turno change -> Auto update price? Only if new event.
    const handleTariffChange = () => {
        if (!state.editingId && state.currentConceptos.length > 0) {
            // Check if first line resembles rental
            if (state.currentConceptos[0].concepto.includes("Alquiler")) {
                const salon = state.configSalones.find(s => s.id === campoSalon.value);
                if (salon) {
                    const p = (campoTurno.value === "completa") ? salon.precioCompleta : salon.precioMedia;
                    state.currentConceptos[0].precio = p;
                    state.currentConceptos[0].concepto = "Alquiler " + salon.nombre;
                    renderConceptos();
                }
            }
        }
    };
    campoSalon.addEventListener("change", handleTariffChange);
    campoTurno.addEventListener("change", handleTariffChange);


    async function guardarEvento(e) {
        e.preventDefault();
        // Calculate Total
        let total = state.currentConceptos.reduce((acc, curr) => acc + (curr.uds * curr.precio), 0);

        const payload = {
            hotelId,
            salonId: campoSalon.value,
            fechaInicio: campoFecha.value,
            nombre: campoNombre.value,
            pax: parseInt(campoPax.value) || 0,
            turno: campoTurno.value,
            montaje: campoMontaje.value,
            notas: campoNotas.value,
            estado: campoEstado.value || "pendiente",
            // New
            conceptos: state.currentConceptos,
            importeTotal: total,

            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (state.editingId) {
                await colEventos.doc(state.editingId).update(payload);
            } else {
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await colEventos.add(payload);
            }
            cerrarModal();
        } catch (err) {
            console.error(err);
            alert("Error al guardar");
        }
    }

    function abrirModal(ev, defaults = null) {
        modalEvento.classList.remove("hidden");
        if (ev) {
            state.editingId = ev.id;
            tituloModalEvento.textContent = "Editar Evento";
            campoSalon.value = ev.salonId || (state.configSalones[0]?.id);
            campoFecha.value = ev.fechaInicio || "";
            campoNombre.value = ev.nombre || "";
            campoPax.value = ev.pax || "";
            campoTurno.value = ev.turno || "mañana";
            campoEstado.value = ev.estado || "pendiente";

            // Montaje
            if (state.configMontajes.includes(ev.montaje)) campoMontaje.value = ev.montaje;
            else if (state.configMontajes.length > 0) campoMontaje.value = state.configMontajes[0];

            campoNotas.value = ev.notas || "";

            // Conceptos Legacy Support
            if (ev.conceptos && Array.isArray(ev.conceptos)) {
                state.currentConceptos = JSON.parse(JSON.stringify(ev.conceptos)); // Clone
            } else if (ev.precio) {
                // Migrate old price
                state.currentConceptos = [{ concepto: "Concepto General", uds: 1, precio: ev.precio }];
            } else {
                state.currentConceptos = [];
            }
            renderConceptos();
        } else {
            state.editingId = null;
            tituloModalEvento.textContent = "Ficha";
            campoFecha.value = defaults ? defaults.date : toIsoDate(state.baseDate);
            campoNombre.value = "";
            campoPax.value = "";
            campoTurno.value = defaults ? defaults.turn : "mañana";
            campoEstado.value = "pendiente";

            if (state.configMontajes.length > 0) campoMontaje.value = state.configMontajes[0];
            campoNotas.value = "";

            if (defaults && defaults.salonId) campoSalon.value = defaults.salonId;

            // Apply Default Tariff
            applyDefaultConcept(campoSalon.value, campoTurno.value);
        }
    }
    function cerrarModal() { modalEvento.classList.add("hidden"); }

    if (btnPrev) btnPrev.onclick = () => { const d = new Date(state.baseDate); d.setDate(d.getDate() - 7); state.baseDate = d; render(); };
    if (btnNext) btnNext.onclick = () => { const d = new Date(state.baseDate); d.setDate(d.getDate() + 7); state.baseDate = d; render(); };
    if (inputSemana) inputSemana.onchange = () => { if (inputSemana.value) { state.baseDate = new Date(inputSemana.value); render(); } };

    if (btnNuevoEvento) btnNuevoEvento.onclick = () => abrirModal(null);
    if (btnCerrarModal) btnCerrarModal.onclick = cerrarModal;
    if (btnCancelarEvento) btnCancelarEvento.onclick = cerrarModal;
    formEvento.onsubmit = guardarEvento;

    grid.onclick = (e) => {
        // 1. Click on Card
        const card = e.target.closest(".reserva-card");
        if (card && card.dataset.id) {
            const ev = state.eventos.find(x => x.id === card.dataset.id);
            if (ev) abrirModal(ev);
            return;
        }

        // 2. Click on Add Button
        if (e.target.matches(".btn-add-slot")) {
            const slot = e.target.closest(".slot-jornada");
            if (slot) {
                const date = slot.dataset.date;
                const salon = slot.dataset.salon;
                const turn = slot.dataset.turn;
                abrirModal(null, { date, salonId: salon, turn });
            }
        }
    };

    // Imprimir logic (simplified)
    if (btnReporteSemana) {
        btnReporteSemana.onclick = () => {
            const days = getWeekDates(state.baseDate);
            const start = toIsoDate(days[0]);
            const end = toIsoDate(days[6]);
            const data = state.eventos.filter(e => {
                const f = (e.fechaInicio || "").slice(0, 10);
                return f >= start && f <= end;
            }).sort((a, b) => (a.fechaInicio || "").localeCompare(b.fechaInicio || ""));

            const logo = getLogoPath(hotelId);
            let html = `<html><head><title>Informe</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #ccc;padding:8px;} th{background:#eee;}</style></head><body>
            <div style="display:flex;align-items:center;gap:15px;margin-bottom:20px;">
                <img src="${logo}" style="height:40px;">
                <h2>Informe Semanal Salones (${nombreHotelCompleto(hotelId)})</h2>
            </div>
            <table><thead><tr><th>Fecha</th><th>Sala</th><th>Evento</th><th>Pax</th><th>Turno</th><th>Total</th></tr></thead><tbody>`;
            data.forEach(e => {
                const sName = state.configSalones.find(s => s.id === e.salonId)?.nombre || e.salonId;
                // Calculate total from concepts if not present
                let total = e.importeTotal;
                if (total === undefined && e.conceptos) total = e.conceptos.reduce((a, c) => a + (c.uds * c.precio), 0);
                if (total === undefined) total = e.precio || 0;

                html += `<tr><td>${formatDateES(new Date(e.fechaInicio))}</td><td>${sName}</td><td>${e.nombre}</td><td>${e.pax}</td><td>${e.turno}</td><td>${parseFloat(total).toFixed(2)}€</td></tr>`;
            });
            html += `</tbody></table></body></html>`;
            const w = window.open("", "_blank"); w.document.write(html); w.document.close(); w.print();
        };
    }

    cargarConfiguracion();
    initListener();

})();
