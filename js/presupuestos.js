// js/presupuestos.js
(function () {
    const { getCurrentHotel, toIsoDate, formatDateES } = window.MesaChef;
    const hotelId = getCurrentHotel();

    // State
    const state = {
        presupuestos: [],
        filtroEstado: "activos", // activos, pendientes, confirmados, anulados, todos
        filtroTexto: "",
        editingId: null
    };

    // --- DOM Refs ---
    const tituloHotel = document.getElementById("tituloHotel");
    const estadoConexion = document.getElementById("estadoConexion");
    const listContainer = document.getElementById("listContainer");
    const txtBuscar = document.getElementById("txtBuscar");
    const selFiltro = document.getElementById("selFiltro");
    const btnNuevo = document.getElementById("btnNuevo");

    // Modal Refs
    const modalPresupuesto = document.getElementById("modalPresupuesto");
    const formPresupuesto = document.getElementById("formPresupuesto");
    const tituloModal = document.getElementById("tituloModal");
    const btnCerrarModal = document.getElementById("btnCerrarModal");
    const btnCancelar = document.getElementById("btnCancelar");

    // Form Fields
    const labelRef = document.getElementById("labelRef");
    const campoCliente = document.getElementById("campoCliente");
    const campoFechaEvento = document.getElementById("campoFechaEvento");
    const campoTipoEvento = document.getElementById("campoTipoEvento");
    const campoPax = document.getElementById("campoPax");
    const campoImporte = document.getElementById("campoImporte");
    const campoEstado = document.getElementById("campoEstado");
    const campoNotas = document.getElementById("campoNotas");
    const containerItems = document.getElementById("containerItems"); // Para items (opcional futura expansión)

    // --- UI Helpers ---
    function nombreHotelCompleto(id) {
        if (id === "Guadiana") return "Sercotel Guadiana";
        if (id === "Cumbria") return "Cumbria Spa&Hotel";
        return id || "Hotel";
    }

    function formatEuro(n) {
        if (!n || isNaN(n)) return "0,00 €";
        return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
    }

    function actualizarEstadoConexion(status) {
        if (!estadoConexion) return;
        estadoConexion.className = "estado-conexion";
        if (status === "ok") {
            estadoConexion.classList.add("estado-ok");
            estadoConexion.textContent = "Conectado";
        } else if (status === "error") {
            estadoConexion.classList.add("estado-error");
            estadoConexion.textContent = "Sin conexión";
        } else {
            estadoConexion.style.backgroundColor = "#fff3cd";
            estadoConexion.style.color = "#856404";
            estadoConexion.textContent = "Cargando...";
        }
    }

    // --- INIT UI ---
    // if (tituloHotel) tituloHotel.textContent = `Presupuestos · ${nombreHotelCompleto(hotelId)}`;
    const headerHotelName = document.getElementById("headerHotelName");
    if (headerHotelName) {
        if (hotelId === "Guadiana") {
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
    }

    // --- FIRESTORE ---
    const colPresupuestos = db.collection("presupuestos");
    const docCounter = db.collection("counters").doc(`presupuestos_${hotelId}`);

    // 1. Escuchar datos (Read)
    function escucharPresupuestos() {
        actualizarEstadoConexion("pending");
        colPresupuestos
            .where("hotel", "==", hotelId)
            .orderBy("createdAt", "desc") // Ordenar por creación (más reciente arriba)
            // Nota: Si falta índice compuesto, Firestore avisará en consola.
            // Si falla por índice, haremos ordenación en cliente.
            .onSnapshot(
                (snap) => {
                    actualizarEstadoConexion("ok");
                    state.presupuestos = [];
                    snap.forEach((d) => {
                        const data = d.data();
                        // Fallback safe date
                        let fechaJS = new Date();
                        if (data.createdAt && data.createdAt.toDate) fechaJS = data.createdAt.toDate();

                        state.presupuestos.push({
                            id: d.id,
                            ...data,
                            _createdAtJS: fechaJS
                        });
                    });
                    renderList();
                },
                (err) => {
                    console.error("Error escuchando presupuestos", err);
                    actualizarEstadoConexion("error");
                    // Fallback a sin order si falla indice
                    if (err.code === "failed-precondition") {
                        console.warn("Intentando sin orderBy (falta índice)...");
                        colPresupuestos.where("hotel", "==", hotelId).onSnapshot(s => {
                            actualizarEstadoConexion("ok");
                            state.presupuestos = [];
                            s.forEach(d => state.presupuestos.push({ id: d.id, ...d.data() }));
                            // Ordenar manual en cliente
                            state.presupuestos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                            renderList();
                        });
                    }
                }
            );
    }

    // 2. Generar Referencia Única (Transaction)
    async function generarReferenciaUnica() {
        const year = new Date().getFullYear();
        const prefix = `${hotelId.charAt(0).toUpperCase()}${year}-`; // Ej: G2025- or C2025-

        // Transacción para incrementar contador
        try {
            const nuevaRef = await db.runTransaction(async (transaction) => {
                const cDoc = await transaction.get(docCounter);
                let currentSeq = 0;
                let dbYear = year;

                if (cDoc.exists) {
                    const data = cDoc.data();
                    // Si cambiamos de año, reset? (Opcional, aquí mantendré simple)
                    if (data.year === year) {
                        currentSeq = data.seq || 0;
                    } else {
                        // Cambio de año, reset seq
                        currentSeq = 0;
                    }
                }

                const nextSeq = currentSeq + 1;
                const seqStr = String(nextSeq).padStart(4, "0"); // 0001

                transaction.set(docCounter, { year: year, seq: nextSeq });

                return prefix + seqStr; // G2025-0001
            });
            return nuevaRef;
        } catch (e) {
            console.error("Error transacción contador:", e);
            throw e;
        }
    }

    // 3. Render
    function renderList() {
        if (!listContainer) return;

        // Filtrar
        let filtered = state.presupuestos.filter(item => {
            // Filtro Texto
            if (state.filtroTexto) {
                const search = ((item.referencia || "") + " " + (item.cliente || "") + " " + (item.tipoEvento || "")).toLowerCase();
                if (!search.includes(state.filtroTexto)) return false;
            }

            // Filtro Estado
            const st = (item.estado || "pendiente").toLowerCase();
            if (state.filtroEstado === "activos") {
                return st !== "anulada" && st !== "rechazada" && st !== "archivada";
            }
            if (state.filtroEstado === "todos") return true;
            if (state.filtroEstado === "pendientes" && (st === "pendiente" || st === "enviada")) return true;
            if (state.filtroEstado === "confirmados" && (st === "confirmada" || st === "aceptada")) return true;
            if (state.filtroEstado === "anulados" && (st === "anulada" || st === "rechazada")) return true;

            return st.includes(state.filtroEstado); // fallback simple
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#999;">No hay presupuestos con este criterio.</div>`;
            return;
        }

        let html = `
      <div class="presupuestos-grid-header">
         <div>REF</div>
         <div>FECHA</div>
         <div>CLIENTE / EVENTO</div>
         <div>PAX</div>
         <div>IMPORTE</div>
         <div>ESTADO</div>
         <div>ACCIONES</div>
      </div>
    `;

        filtered.forEach(p => {
            const fechaFmt = p.fechaEvento ? formatDateES(new Date(p.fechaEvento)) : "-";
            let badgeClass = "badge-gray";
            if (p.estado === "confirmada" || p.estado === "aceptada") badgeClass = "badge-green";
            if (p.estado === "anulada" || p.estado === "rechazada") badgeClass = "badge-red";
            if (p.estado === "pendiente") badgeClass = "badge-orange";

            html += `
       <div class="presupuesto-row" data-id="${p.id}">
          <div class="p-ref"><strong>${p.referencia || "---"}</strong></div>
          <div class="p-fecha">${fechaFmt}</div>
          <div class="p-cliente">
             <div class="p-cliente-nombre">${p.cliente || "Cliente"}</div>
             <div class="p-cliente-sub">${p.tipoEvento || ""}</div>
          </div>
          <div class="p-pax">${p.pax || 0} pax</div>
          <div class="p-importe font-mono">${formatEuro(p.importeTotal)}</div>
          <div class="p-estado"><span class="badge ${badgeClass}">${p.estado?.toUpperCase()}</span></div>
          <div class="p-acciones">
             <button class="btn-icon btn-edit" title="Ver/Editar">✏️</button>
             <!-- NO DELETE BUTTON HERE AS REQUESTED -->
          </div>
       </div>
       `;
        });

        listContainer.innerHTML = html;
    }

    // --- 4. Modal Logic ---
    async function abrirModal(id = null) {
        modalPresupuesto.classList.remove("hidden");
        if (id) {
            state.editingId = id;
            const item = state.presupuestos.find(x => x.id === id);
            if (!item) return;

            tituloModal.textContent = `Editar Presupuesto ${item.referencia || ""}`;
            labelRef.textContent = item.referencia || "REF-???";

            campoCliente.value = item.cliente || "";
            campoFechaEvento.value = item.fechaEvento || "";
            campoTipoEvento.value = item.tipoEvento || "";
            campoPax.value = item.pax || 0;
            campoImporte.value = item.importeTotal || 0;
            campoEstado.value = item.estado || "pendiente";
            campoNotas.value = item.notas || "";
        } else {
            state.editingId = null;
            tituloModal.textContent = "Nuevo Presupuesto";
            labelRef.textContent = "(Generando Ref...)";

            campoCliente.value = "";
            campoFechaEvento.value = toIsoDate(new Date());
            campoTipoEvento.value = "";
            campoPax.value = "";
            campoImporte.value = "";
            campoEstado.value = "pendiente";
            campoNotas.value = "";
        }
    }

    function cerrarModal() {
        modalPresupuesto.classList.add("hidden");
    }

    // Listeners
    if (btnNuevo) btnNuevo.addEventListener("click", () => abrirModal(null));
    if (btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModal);
    if (btnCancelar) btnCancelar.addEventListener("click", cerrarModal);
    if (modalPresupuesto) modalPresupuesto.addEventListener("click", (e) => {
        if (e.target === modalPresupuesto) cerrarModal();
    });

    // Click edit
    if (listContainer) {
        listContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-edit");
            if (btn) {
                const row = btn.closest(".presupuesto-row");
                if (row) abrirModal(row.dataset.id);
            }
        });
    }

    // Filtros
    if (txtBuscar) {
        txtBuscar.addEventListener("input", () => {
            state.filtroTexto = txtBuscar.value.toLowerCase();
            renderList();
        });
    }
    if (selFiltro) {
        selFiltro.addEventListener("change", () => {
            state.filtroEstado = selFiltro.value;
            renderList();
        });
    }

    // Submit
    if (formPresupuesto) {
        formPresupuesto.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!campoCliente.value) {
                alert("El cliente es obligatorio");
                return;
            }

            const payload = {
                hotel: hotelId,
                cliente: campoCliente.value.trim(),
                fechaEvento: campoFechaEvento.value,
                tipoEvento: campoTipoEvento.value.trim(),
                pax: parseInt(campoPax.value) || 0,
                importeTotal: parseFloat(campoImporte.value) || 0,
                estado: campoEstado.value,
                notas: campoNotas.value.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                if (state.editingId) {
                    await colPresupuestos.doc(state.editingId).update(payload);
                } else {
                    // CREATE
                    // 1. Generate REF
                    const newRef = await generarReferenciaUnica();

                    const nuevoDoc = {
                        ...payload,
                        referencia: newRef,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    await colPresupuestos.add(nuevoDoc);
                    alert("Presupuesto creado con referencia: " + newRef);
                }
                cerrarModal();
            } catch (err) {
                console.error("Error guardando presupuesto", err);
                alert("Error al guardar. Inténtalo de nuevo.");
            }
        });
    }

    // --- GLOBAL SEARCH LOGIC (Presupuestos) ---
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

        // Use state.presupuestos directly
        const results = state.presupuestos.filter(r => {
            const combined = `${r.cliente || ''} ${r.referencia || ''} ${r.tipoEvento || ''} ${r.notas || ''} ${r.estado || ''}`.toLowerCase();
            return combined.includes(q);
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
            // Priority: Active first, then by date desc
            results.sort((a, b) => {
                const aActive = (a.estado === 'confirmada' || a.estado === 'pendiente') ? 1 : 0;
                const bActive = (b.estado === 'confirmada' || b.estado === 'pendiente') ? 1 : 0;
                if (aActive !== bActive) return bActive - aActive;
                // Date desc
                return (b._createdAtJS || 0) - (a._createdAtJS || 0);
            });

            results.slice(0, 50).forEach(r => {
                const datePretty = r.fechaEvento ? formatDateES(new Date(r.fechaEvento)) : "-";
                // Color items based on status
                let badgeClass = "bg-gray-100 text-gray-600";
                if (r.estado === "confirmada" || r.estado === "aceptada") badgeClass = "bg-green-100 text-green-700";
                if (r.estado === "anulada" || r.estado === "rechazada") badgeClass = "bg-red-100 text-red-700";
                if (r.estado === "pendiente") badgeClass = "bg-orange-100 text-orange-700";

                const item = document.createElement("div");
                item.className = "p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition border-b border-slate-50 last:border-0";
                item.innerHTML = `
                     <div class="flex flex-col">
                        <span class="font-bold text-slate-800 text-sm leading-tight">${r.cliente || "Sin Cliente"}</span>
                        <span class="text-[10px] text-slate-500 uppercase mt-0.5">Reference: ${r.referencia || "?"} &bull; ${datePretty}</span>
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass} uppercase">${r.estado}</span>
                `;
                item.onclick = (e) => {
                    e.stopPropagation(); // Prevent bubbling issues
                    document.getElementById("searchResults").classList.add("hidden");
                    abrirModal(r.id);
                };
                container.appendChild(item);
            });
        }
        container.classList.remove("hidden");
    }

    // Run
    escucharPresupuestos();

})();
