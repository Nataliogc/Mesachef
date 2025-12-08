// js/salones.js - v10 (Full Rewrite)

(function () {
    // --- ROBUST FIREBASE INIT ---
    let appStarted = false;

    function ensureFirebase(callback) {
        if (!document.querySelector('script[src*="firebase-app-compat"]')) {
            const s1 = document.createElement("script");
            s1.src = "https://www.gstatic.com/firebasejs/9.6.7/firebase-app-compat.js";
            s1.onload = function () {
                const s2 = document.createElement("script");
                s2.src = "https://www.gstatic.com/firebasejs/9.6.7/firebase-auth-compat.js";
                s2.onload = function () {
                    const s3 = document.createElement("script");
                    s3.src = "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore-compat.js";
                    s3.onload = function () { initFirebase(callback); };
                    document.head.appendChild(s3);
                };
                document.head.appendChild(s2);
            };
            document.head.appendChild(s1);
        } else {
            const checkInterval = setInterval(() => {
                if (window.firebase && window.firebase.auth && window.firebase.firestore) {
                    clearInterval(checkInterval);
                    initFirebase(callback);
                }
            }, 100);
        }
    }

    function initFirebase(callback) {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyAXv_wKD48EFDe8FBQ-6m0XGUNoxSRiTJY",
                authDomain: "mesa-chef-prod.firebaseapp.com",
                projectId: "mesa-chef-prod",
                storageBucket: "mesa-chef-prod.firebasestorage.app",
                messagingSenderId: "43170330072",
                appId: "1:43170330072:web:bcdd09e39930ad08bf2ead"
            };

            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

            // AUTH LISTENER
            firebase.auth().onAuthStateChanged((user) => {
                if (user && !appStarted) {
                    console.log("Salones: Auth Ready", user.uid);
                    appStarted = true;
                    callback();
                }
            });

            // TRIGGER SIGN IN
            if (!firebase.auth().currentUser) {
                firebase.auth().signInAnonymously().catch((error) => {
                    console.error("Auth Error", error);
                });
            }
        } catch (e) { console.error("Firebase Init Error:", e); }
    }

    let db;
    let globalConfig = null;
    let currentWeekStart = new Date();
    // Key used by index.html
    const STORAGE_KEY = "mesaChef_hotel";

    const utils = window.MesaChef || {
        getWeekDates: (d) => {
            const start = new Date(d);
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            let dates = [];
            for (let i = 0; i < 7; i++) {
                let temp = new Date(start);
                temp.setDate(temp.getDate() + i);
                dates.push(temp);
            }
            return dates;
        },
        toIsoDate: (d) => d.toISOString().split('T')[0],
        formatDateES: (d) => d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    };

    function startApp() {
        console.log("Salones: Iniciando aplicación...");
        db = firebase.firestore();

        // 1. HOTEL IDENTITY & LOGO
        const currentHotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const headerName = document.getElementById("headerHotelName");

        if (headerName) {
            const logoSrc = currentHotel === "Guadiana" ? "Img/logo-guadiana.svg" : "Img/logo-cumbria.svg";
            const displayName = currentHotel === "Guadiana" ? "Sercotel Guadiana" : "Cumbria Spa & Hotel";
            headerName.innerHTML = `<div class="flex items-center"><img src="${logoSrc}" class="h-8 mr-2"> ${displayName}</div>`;
        }

        // 2. LOAD CONFIG
        db.collection("master_data").doc("CONFIG_SALONES").get().then(doc => {
            if (doc.exists) {
                globalConfig = doc.data();
            } else {
                globalConfig = { montajes: ["Banquete"], Guadiana: [], Cumbria: [] };
            }
            populateDatalist();
            renderGrid();
        }).catch(err => {
            console.error("Salones: Error config", err);
            globalConfig = { montajes: ["Banquete"], Guadiana: [], Cumbria: [] };
            renderGrid();
        });
    }

    function populateDatalist(salonFilter = null) {
        const dl = document.getElementById("charge-options");
        if (!dl || !globalConfig) return;

        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        let html = "";

        // 1. Add Salon Rental Options (Filtered)
        if (globalConfig[hotel]) {
            globalConfig[hotel].forEach(s => {
                if (s.active !== false) {
                    // Filter: Show only if no filter is set OR matches selected salon
                    if (!salonFilter || s.name === salonFilter) {
                        html += `<option value="Alquiler Salón ${s.name} - todo">`;
                        html += `<option value="Alquiler Salón ${s.name} - mañana">`;
                        html += `<option value="Alquiler Salón ${s.name} - tarde">`;
                    }
                }
            });
        }

        // 2. Add Extras (Always show)
        if (globalConfig.extras) {
            globalConfig.extras.forEach(e => {
                html += `<option value="${e.name}">`;
            });
        }

        dl.innerHTML = html;
    }

    window.updateRowPrice = function (input) {
        const val = input.value.trim();
        const row = input.closest("tr");
        const priceInput = row.querySelector(".row-price");
        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";

        console.log("updateRowPrice Check:", { val, hotel, hasGlobal: !!globalConfig });

        if (!val || !priceInput) return;

        // A. Check Extras
        if (globalConfig.extras) {
            const extra = globalConfig.extras.find(e => e.name === val);
            if (extra) {
                console.log("Match Extra:", extra);
                priceInput.value = extra.price;
                calcTotal();
                return;
            }
        }

        // B. Check Salon Rental Pattern
        if (globalConfig[hotel]) {
            const salon = globalConfig[hotel].find(s => val.startsWith(`Alquiler Salón ${s.name}`));
            if (salon) {
                let price = 0;
                if (val.endsWith(" - todo")) price = salon.priceFull;
                else if (val.endsWith(" - mañana") || val.endsWith(" - tarde")) price = salon.priceHalf;

                console.log("Match Rental:", { salon: salon.name, price });
                if (price > 0) {
                    priceInput.value = price;
                    calcTotal();
                }
            }
        }
    };

    let loadedReservations = [];
    let unsubscribe = null;

    window.renderGrid = function () {
        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const container = document.getElementById("calendarGrid");
        if (!container) return;

        // Ensure reservations are loaded
        loadReservations();

        const salons = (globalConfig[hotel] || []).filter(s => s.active !== false);
        const dates = utils.getWeekDates(currentWeekStart);

        const rangeEl = document.getElementById("currentWeekRange");
        if (rangeEl) rangeEl.innerText = `${dates[0].toLocaleDateString()} - ${dates[6].toLocaleDateString()}`;

        // TABLE LAYOUT
        let html = `
        <div style="display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="display: grid; grid-template-columns: 200px repeat(7, 1fr); background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <div class="p-4 font-bold text-slate-700 text-sm tracking-wide uppercase flex items-center justify-center border-r border-slate-200">SALA</div>
                ${dates.map(d => `
                    <div class="p-3 font-bold text-center text-xs uppercase text-slate-500 border-r border-slate-100 last:border-r-0 flex flex-col justify-center">
                        <span class="text-slate-800 text-sm">${d.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}</span>
                        <span class="text-slate-400 font-normal">${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}</span>
                    </div>
                `).join('')}
            </div>
        `;

        if (salons.length === 0) {
            html += `
            <div class="p-10 text-center text-slate-400">
                <span class="text-4xl block mb-2">🏨</span>
                <span class="font-bold">No hay salones activos para ${hotel}.</span>
            </div>`;
        } else {
            const bloqueos = globalConfig.bloqueos || [];

            salons.forEach((salon, index) => {
                const isLast = index === salons.length - 1;
                html += `<div style="display: grid; grid-template-columns: 200px repeat(7, 1fr); ${isLast ? '' : 'border-bottom: 1px solid #f1f5f9;'}">
                            <div class="bg-white p-4 font-bold text-slate-700 flex flex-col justify-center border-r border-slate-100 relative group">
                                <span class="text-sm text-slate-800">${salon.name}</span>
                                <span class="text-[10px] text-slate-400 font-normal mt-1 uppercase tracking-wider">Capacidad: ${salon.pax}</span>
                                <div class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition"></div>
                            </div>`;

                dates.forEach(d => {
                    const dateStr = utils.toIsoDate(d);
                    const safeName = salon.name.replace(/'/g, "\\'");

                    // Check Block
                    let isBlocked = false;
                    let blockReason = "";
                    bloqueos.forEach(b => {
                        if (b.salon === "TODOS" || b.salon === salon.name) {
                            if (dateStr >= b.start && dateStr <= b.end) {
                                isBlocked = true;
                                blockReason = b.note || "Bloqueado";
                            }
                        }
                    });

                    if (isBlocked) {
                        html += `<div id="cell_${hotel.replace(/\s/g, '_')}_${salon.name.replace(/\s/g, '_')}_${dateStr}" 
                                    class="bg-red-50 hover:bg-red-100 border-r border-slate-100 last:border-r-0 transition p-1 relative flex flex-col items-center justify-center group cursor-not-allowed" title="${blockReason}">
                                    <span class="text-2xl">🔒</span>
                                    <span class="text-[10px] text-red-600 font-bold uppercase mt-1 text-center leading-tight">${blockReason}</span>
                               </div>`;
                    } else {
                        // VISUAL SPLIT: Morning / Afternoon click zones
                        html += `<div id="cell_${hotel.replace(/\s/g, '_')}_${salon.name.replace(/\s/g, '_')}_${dateStr}" 
                                       class="bg-white min-h-[90px] border-r border-slate-100 last:border-r-0 relative flex flex-col group">
                                        
                                        <!-- Morning Zone -->
                                        <div onclick="window.openBooking('${safeName}', '${dateStr}', null, 'mañana')" 
                                            class="flex-1 border-b border-dashed border-slate-200 hover:bg-blue-50 cursor-pointer flex items-center justify-center group/morning transition">
                                            <span class="opacity-0 group-hover/morning:opacity-100 text-[10px] font-bold text-blue-400">MAÑANA</span>
                                        </div>

                                        <!-- Afternoon Zone -->
                                        <div onclick="window.openBooking('${safeName}', '${dateStr}', null, 'tarde')" 
                                            class="flex-1 hover:bg-blue-50 cursor-pointer flex items-center justify-center group/afternoon transition">
                                            <span class="opacity-0 group-hover/afternoon:opacity-100 text-[10px] font-bold text-blue-400">TARDE</span>
                                        </div>
                                  </div>`;
                    }
                });
                html += `</div>`;
            });
        }

        html += `</div>`;
        container.innerHTML = html;
        paintReservations(hotel);
    };

    function loadReservations() {
        if (unsubscribe) unsubscribe();

        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const dates = utils.getWeekDates(currentWeekStart);
        const start = utils.toIsoDate(dates[0]);
        const end = utils.toIsoDate(dates[6]);

        console.log(`Loading reservations for ${hotel} from ${start} to ${end}`);

        unsubscribe = db.collection("reservas_salones")
            .where("fecha", ">=", start)
            .where("fecha", "<=", end)
            .onSnapshot(snapshot => {
                loadedReservations = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.hotel === hotel) {
                        loadedReservations.push({ id: doc.id, ...data });
                    }
                });
                paintReservations(hotel);
            }, error => {
                console.error("Error loading reservations:", error);
            });
    }

    function paintReservations(hotel) {
        // Clear previous paintings
        document.querySelectorAll(".booking-card").forEach(el => el.remove());
        document.querySelectorAll(".booking-placeholder").forEach(el => el.style.display = 'flex');

        const filterEl = document.getElementById("filterStatus");
        const filterVal = filterEl ? filterEl.value : "todos";

        console.log("Painting Reservations. Hotel:", hotel, "Filter:", filterVal, "Total Loaded:", loadedReservations.length);

        // Group by cell
        const cellGroups = {};
        loadedReservations.forEach(res => {
            // Filter logic
            if (filterVal !== "todos") {
                if (filterVal === "activos") {
                    // User definition: "activos: confirmados y provisionales"
                    if (res.estado !== 'confirmada' && res.estado !== 'provisional') return;
                } else {
                    // Specific status (confirmada, provisional, presupuesto, cancelada)
                    if (res.estado !== filterVal) return;
                }
            }

            // Group by cell (Multi-day support)
            // If services have different dates, show on each date
            let relevantDates = new Set();
            if (res.servicios && res.servicios.length > 0) {
                res.servicios.forEach(s => { if (s.fecha) relevantDates.add(s.fecha); });
            }
            if (relevantDates.size === 0) relevantDates.add(res.fecha);

            relevantDates.forEach(date => {
                const key = `${res.hotel}_${res.salon}_${date}`;
                if (!cellGroups[key]) cellGroups[key] = [];

                // Derive Jornada for THIS date
                let dailyJornada = res.detalles?.jornada || "todo";
                if (res.servicios) {
                    const rentalService = res.servicios.find(s =>
                        s.fecha === date &&
                        s.concepto &&
                        s.concepto.toLowerCase().startsWith("alquiler salón")
                    );

                    if (rentalService) {
                        const c = rentalService.concepto.toLowerCase();
                        if (c.includes("- mañana") || c.includes(" mañana")) dailyJornada = "mañana";
                        else if (c.includes("- tarde") || c.includes(" tarde")) dailyJornada = "tarde";
                        else if (c.includes("- todo") || c.includes(" todo")) dailyJornada = "todo";
                    }
                }

                cellGroups[key].push({ ...res, fecha: date, _displayJornada: dailyJornada });
            });
        });

        Object.keys(cellGroups).forEach(key => {
            const group = cellGroups[key];
            if (group.length === 0) return;

            const sample = group[0]; // All have same hotel/salon/date because of key
            const cellId = `cell_${hotel.replace(/\s/g, '_')}_${sample.salon.replace(/\s/g, '_')}_${sample.fecha}`;
            const cell = document.getElementById(cellId);

            if (!cell) {
                // Only warn if the date is within the current view week
                const dates = utils.getWeekDates(currentWeekStart).map(d => utils.toIsoDate(d));
                if (dates.includes(sample.fecha)) {
                    console.warn("Cell not found for:", cellId, "Data:", sample);
                }
                return;
            }

            // Hide placeholder if we have anything
            const placeholder = cell.querySelector(".booking-placeholder");
            if (placeholder) placeholder.style.display = 'none';

            group.forEach(res => {
                const jornada = res._displayJornada || res.detalles?.jornada || "todo";
                // console.log(`[Render] ${res.cliente} (${res.fecha}) -> Jornada: '${jornada}'`);

                // Colors
                let colorClass = 'bg-blue-100 border-blue-500 text-blue-800'; // Default

                if (res.estado === 'confirmada') colorClass = 'bg-green-100 border-green-500 text-green-800';
                else if (res.estado === 'provisional') colorClass = 'bg-yellow-100 border-yellow-500 text-yellow-800';
                else if (res.estado === 'presupuesto') colorClass = 'bg-orange-100 border-orange-500 text-orange-800';
                else if (res.estado === 'cancelada') colorClass = 'bg-red-100 border-red-500 text-red-800 opacity-60'; // Dimmed

                const card = document.createElement("div");

                // Base classes (Visuals only, removed positioning classes)
                let classes = `booking-card w-[95%] rounded border-l-4 ${colorClass} shadow-sm px-1 py-0.5 text-[10px] flex flex-col justify-between overflow-hidden relative box-border hover:z-10 hover:shadow-md transition`;
                card.className = classes;

                // FORCE POSITIONING (Inline Styles)
                card.style.position = "absolute";

                if (jornada === "todo") {
                    card.style.height = "94%";
                    card.style.top = "3%";
                    card.style.left = "2.5%";
                    card.style.zIndex = "10";
                } else if (jornada === "mañana") {
                    card.style.height = "46%";
                    card.style.top = "2%";
                    card.style.left = "2.5%";
                    card.style.zIndex = "10";
                } else if (jornada === "tarde") {
                    card.style.height = "46%";
                    card.style.bottom = "2%";
                    card.style.left = "2.5%";
                    card.style.zIndex = "10";
                }

                card.onclick = (e) => { e.stopPropagation(); openBooking(res.salon, res.fecha, res); };

                const timeStr = res.detalles?.hora ? `<span class="opacity-75">${res.detalles.hora}</span>` : '';
                const paxTotal = (res.detalles?.pax_adultos || 0) + (res.detalles?.pax_ninos || 0);
                const paxStr = paxTotal > 0 ? `<span class="text-[9px] bg-white/50 px-1 rounded ml-1">👤${paxTotal}</span>` : '';

                // Red Dot if !revisado (and not cancelled)
                const redDot = (!res.revisado && res.estado !== 'cancelada')
                    ? `<div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-sm animate-pulse" title="Sin Revisar"></div>`
                    : '';

                // Internal Note Indicator
                const hasNote = res.notas && res.notas.interna && res.notas.interna.trim().length > 0;
                const noteStr = hasNote ? `<span title="Nota Interna: ${res.notas.interna.replace(/"/g, '&quot;')}" class="cursor-help ml-1">📝</span>` : '';

                card.innerHTML = `
                    ${redDot}
                    <div class="flex items-center justify-between">
                        <div class="font-bold truncate leading-tight flex-1" title="${res.cliente}">${res.cliente}</div>
                        <div class="text-[10px]">${noteStr}</div>
                    </div>
                    
                    <div class="flex justify-between items-end mt-1 text-[9px]">
                        <span class="truncate opacity-80">${res.detalles?.montaje || '-'}</span>
                         <div class="flex items-center space-x-1">
                            ${timeStr}
                            ${paxStr}
                        </div>
                    </div>
                `;
                cell.appendChild(card);
            });
        });

    }

    // --- GLOBAL SEARCH LOGIC ---
    let allReservations = [];
    let hasLoadedAll = false;
    let fetchPromise = null;
    let searchDebounce = null;

    window.handleSearch = function (query) {
        clearTimeout(searchDebounce);
        const container = document.getElementById("searchResults");

        if (!query || query.trim().length < 2) {
            if (container) container.classList.add("hidden");
            return;
        }

        searchDebounce = setTimeout(() => {
            if (!hasLoadedAll) {
                fetchAllReservations().then(() => doSearch(query));
            } else {
                doSearch(query);
            }
        }, 500);
    };

    function fetchAllReservations() {
        if (hasLoadedAll) return Promise.resolve();
        if (fetchPromise) return fetchPromise;

        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const container = document.getElementById("searchResults");

        if (container) {
            container.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">⏳ Cargando histórico...</div>';
            container.classList.remove("hidden");
        }

        fetchPromise = db.collection("reservas_salones")
            .where("hotel", "==", hotel)
            .get()
            .then(snapshot => {
                allReservations = [];
                snapshot.forEach(doc => {
                    allReservations.push({ id: doc.id, ...doc.data() });
                });
                hasLoadedAll = true;
                console.log(`Global Search: Loaded ${allReservations.length} records.`);
                fetchPromise = null;
            })
            .catch(err => {
                console.error("Search Error", err);
                hasLoadedAll = false;
                fetchPromise = null;
                if (container) container.innerHTML = `< div class="p-2 text-red-500 text-xs text-center" > Error al cargar: ${err.message}</div > `;
                throw err;
            });

        return fetchPromise;
    }

    function doSearch(query) {
        try {
            if (!query) return;
            const q = query.toLowerCase();

            if (!allReservations) allReservations = [];

            const results = allReservations.filter(r => {
                const name = (r.cliente || "").toLowerCase();
                const tel = (r.contact?.tel || "").toLowerCase();
                const email = (r.contact?.email || "").toLowerCase();
                const salon = (r.salon || "").toLowerCase();
                const dateStr = (r.fecha || "");

                return name.includes(q) || tel.includes(q) || email.includes(q) || salon.includes(q) || dateStr.includes(q);
            });

            renderSearchResults(results);
        } catch (e) {
            console.error("Filtering Error", e);
            const container = document.getElementById("searchResults");
            if (container) container.innerHTML = `< div class="p-2 text-red-500 text-xs text-center" > Error de filtrado: ${e.message}</div > `;
        }
    }

    function renderSearchResults(results) {
        const container = document.getElementById("searchResults");
        if (!container) return;

        container.innerHTML = "";

        if (results.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs">No se encontraron resultados</div>';
        } else {
            // Sort by date desc (recent first)
            results.sort((a, b) => b.fecha.localeCompare(a.fecha));

            results.slice(0, 50).forEach(r => { // Limit to 50
                const datePretty = new Date(r.fecha).toLocaleDateString();
                const item = document.createElement("div");
                item.className = "p-3 border-b border-slate-50 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition";

                // Prevent blurring when clicking
                item.onmousedown = (e) => e.preventDefault();
                item.onclick = () => selectSearchResult(r);

                const statusColor = r.estado === 'confirmada' ? 'bg-green-100 text-green-700 border border-green-200' :
                    r.estado === 'cancelada' ? 'bg-red-100 text-red-700 border border-red-200' :
                        r.estado === 'presupuesto' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-yellow-100 text-yellow-700 border border-yellow-200';

                item.innerHTML = `
                    < div class="flex flex-col" >
                        <span class="font-bold text-slate-800 text-sm leading-tight">${r.cliente}</span>
                        <span class="text-[10px] text-slate-500 uppercase tracking-wide mt-1">📅 ${datePretty} &bull; ${r.salon}</span>
                    </div >
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor} uppercase shadow-sm">${r.estado}</span>
                `;
                container.appendChild(item);
            });
        }
        container.classList.remove("hidden");
    }

    window.selectSearchResult = function (r) {
        document.getElementById("searchResults").classList.add("hidden");
        // Optional: Keep search text or clear?
        // document.getElementById("searchInput").value = ""; 

        // Navigate
        window.goToDate(r.fecha);
    };

    // --- FORM LOGIC ---
    let currentBookingId = null;

    window.openBooking = function (salonName, dateStr, existing = null, defaultJornada = 'todo') {
        const sSel = document.getElementById("evt-salon");
        const mSel = document.getElementById("evt-montaje");

        sSel.innerHTML = "";
        mSel.innerHTML = "";

        // Filter Autocomplete on Salon Change
        sSel.onchange = function () {
            populateDatalist(this.value);
            updateRentalPrice(); // Update rental row if present
        };

        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const salons = globalConfig[hotel] || [];

        salons.forEach(s => {
            const op = document.createElement("option");
            op.value = s.name;
            op.text = s.name;
            sSel.appendChild(op);
        });

        if (globalConfig.montajes) {
            globalConfig.montajes.forEach(m => {
                const op = document.createElement("option");
                op.value = m;
                op.text = m;
                mSel.appendChild(op);
            });
        }

        // RESET
        currentBookingId = null;
        document.getElementById("evt-nombre").value = "";
        document.getElementById("evt-telefono").value = "";
        document.getElementById("evt-email").value = "";
        document.getElementById("services-list").innerHTML = "";
        document.getElementById("evt-total").innerText = "0.00 €";
        document.getElementById("evt-nota-interna").value = "";
        document.getElementById("evt-nota-cliente").value = "";
        document.getElementById("evt-pax-a").value = "";
        document.getElementById("evt-pax-n").value = "";
        document.getElementById("evt-hora").value = "";
        document.getElementById("evt-revisado").checked = false; // Default unreviewed

        // Default Jornada
        document.getElementById("evt-jornada").value = defaultJornada;

        // POPULATE
        if (existing) {
            currentBookingId = existing.id;
            document.getElementById("evt-fecha").value = existing.fecha;
            sSel.value = existing.salon;
            populateDatalist(existing.salon); // Filter for this salon
            document.getElementById("evt-nombre").value = existing.cliente;
            if (existing.contact) {
                document.getElementById("evt-telefono").value = existing.contact.tel || "";
                document.getElementById("evt-email").value = existing.contact.email || "";
            }
            document.getElementById("evt-estado").value = existing.estado || "pendiente";
            document.getElementById("evt-revisado").checked = existing.revisado === true; // Load Status

            if (existing.detalles) {
                document.getElementById("evt-jornada").value = existing.detalles.jornada || "todo";
                mSel.value = existing.detalles.montaje || "";
                document.getElementById("evt-hora").value = existing.detalles.hora || "";
                document.getElementById("evt-pax-a").value = existing.detalles.pax_adultos || "";
                document.getElementById("evt-pax-n").value = existing.detalles.pax_ninos || "";
            }

            if (existing.notas) {
                document.getElementById("evt-nota-interna").value = existing.notas.interna || "";
                document.getElementById("evt-nota-cliente").value = existing.notas.cliente || "";
            }

            if (existing.servicios) {
                existing.servicios.forEach(s => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                    <td class="p-2 border-b"><input type="date" value="${s.fecha}" class="text-xs bg-gray-50 w-full rounded border-gray-200"></td>
                        <td class="p-2 border-b"><input type="text" value="${s.concepto}" list="charge-options" onchange="updateRowPrice(this)" class="text-xs font-bold w-full rounded border-gray-200"></td>
                        <td class="p-2 border-b"><input type="number" onchange="calcTotal()" value="${s.uds}" class="text-xs text-center row-uds w-full rounded border-gray-200"></td>
                        <td class="p-2 border-b"><input type="number" onchange="calcTotal()" value="${s.precio}" class="text-xs text-right row-price w-full rounded border-gray-200"></td>
                        <td class="p-2 border-b text-right font-bold text-xs row-total text-slate-600">${s.total.toFixed(2)} €</td>
                        <td class="p-2 border-b text-center"><button onclick="this.closest('tr').remove(); calcTotal()" class="text-red-400 hover:text-red-600 font-bold">&times;</button></td>
                `;
                    document.getElementById("services-list").appendChild(row);
                });
                calcTotal();
            }
        } else {
            document.getElementById("evt-fecha").value = dateStr || new Date().toISOString().split('T')[0];
            if (salonName) {
                sSel.value = salonName;
                populateDatalist(salonName);
            } else {
                populateDatalist(); // No filter if new and no salon pre-set
            }
            // Auto-add rental price for new events
            setTimeout(updateRentalPrice, 100);
        }

        document.getElementById("modal-evt").classList.remove("hidden");
    };

    window.closeModal = function () {
        document.getElementById("modal-evt").classList.add("hidden");
    };

    window.addServiceRow = function () {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="p-2 border-b"><input type="date" value="${document.getElementById("evt-fecha").value}" class="text-xs bg-gray-50 w-full rounded border-gray-200"></td>
            <td class="p-2 border-b"><input type="text" placeholder="Concepto" list="charge-options" onchange="updateRowPrice(this)" class="text-xs font-bold w-full rounded border-gray-200"></td>
            <td class="p-2 border-b"><input type="number" onchange="calcTotal()" value="1" class="text-xs text-center row-uds w-full rounded border-gray-200"></td>
            <td class="p-2 border-b"><input type="number" onchange="calcTotal()" value="0" class="text-xs text-right row-price w-full rounded border-gray-200"></td>
            <td class="p-2 border-b text-right font-bold text-xs row-total text-slate-600">0.00 €</td>
            <td class="p-2 border-b text-center"><button onclick="this.closest('tr').remove(); calcTotal()" class="text-red-400 hover:text-red-600 font-bold">&times;</button></td>
                `;
        document.getElementById("services-list").appendChild(row);
    };

    window.calcTotal = function () {
        let total = 0;
        document.querySelectorAll("#services-list tr").forEach(row => {
            const uds = parseFloat(row.querySelector(".row-uds").value) || 0;
            const price = parseFloat(row.querySelector(".row-price").value) || 0;
            const sub = uds * price;
            // Update row total
            row.querySelector(".row-total").innerText = sub.toFixed(2) + " €";
            total += sub;
        });
        document.getElementById("evt-total").innerText = total.toFixed(2) + " €";
    };

    window.updateRentalPrice = function () {
        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const salonName = document.getElementById("evt-salon").value;
        const jornada = document.getElementById("evt-jornada").value;

        // Debug scope
        console.log("updateRentalPrice Triggered:", { hotel, salonName, jornada, configLoaded: !!globalConfig });

        if (!globalConfig || !globalConfig[hotel]) {
            console.warn("Global Config not ready or hotel missing");
            return;
        }

        const sObj = globalConfig[hotel].find(s => s.name === salonName);
        if (!sObj) {
            console.warn("Salon not found in config:", salonName);
            return;
        }

        let price = (jornada === 'todo') ? (sObj.priceFull || 0) : (sObj.priceHalf || 0);
        console.log("Price Calculated:", price);

        // Find existing 'Alquiler Salón' row
        let found = false;
        document.querySelectorAll("#services-list tr").forEach(row => {
            const inp = row.querySelector("input[type='text']");
            // Check if it looks like a rental line (starts with Alquiler Salón)
            if (inp && inp.value.startsWith("Alquiler Salón")) {
                found = true;
                row.querySelector(".row-price").value = price;
                inp.value = `Alquiler Salón ${salonName} - ${jornada}`;
                calcTotal(); // Update totals
            }
        });

        if (!found) {
            console.log("Creating new rental row...");
            const row = document.createElement("tr");
            const dateStr = document.getElementById("evt-fecha").value;
            row.innerHTML = `
                <td class="p-2 border-b"><input type="date" value="${dateStr}" class="text-xs bg-gray-50 w-full rounded border-gray-200"></td>
                <td class="p-2 border-b"><input type="text" value="Alquiler Salón ${salonName} - ${jornada}" list="charge-options" onchange="updateRowPrice(this)" class="text-xs font-bold w-full rounded border-gray-200"></td>
                <td class="p-2 border-b"><input type="number" onchange="calcTotal()" value="1" class="text-xs text-center row-uds w-full rounded border-gray-200"></td>
                <td class="p-2 border-b"><input type="number" onchange="calcTotal()" value="${price}" class="text-xs text-right row-price w-full rounded border-gray-200"></td>
                <td class="p-2 border-b text-right font-bold text-xs row-total text-slate-600">${price.toFixed(2)} €</td>
                <td class="p-2 border-b text-center"><button onclick="this.closest('tr').remove(); calcTotal()" class="text-red-400 hover:text-red-600 font-bold">&times;</button></td>
            `;
            document.getElementById("services-list").prepend(row);
            calcTotal();
        }
    };

    window.saveBooking = async function () {
        const btn = document.querySelector("button[onclick='saveBooking()']");
        const originalText = btn.innerText;
        btn.innerText = "Guardando...";
        btn.disabled = true;

        const payload = {
            hotel: localStorage.getItem(STORAGE_KEY) || "Guadiana",
            created_at: new Date().toISOString(),
            fecha: document.getElementById("evt-fecha").value,
            salon: document.getElementById("evt-salon").value,
            cliente: document.getElementById("evt-nombre").value,
            contact: {
                tel: document.getElementById("evt-telefono").value,
                email: document.getElementById("evt-email").value
            },
            estado: document.getElementById("evt-estado").value,
            revisado: document.getElementById("evt-revisado").checked, // Save Status
            detalles: {
                jornada: document.getElementById("evt-jornada").value,
                montaje: document.getElementById("evt-montaje").value,
                hora: document.getElementById("evt-hora").value,
                pax_adultos: parseInt(document.getElementById("evt-pax-a").value) || 0,
                pax_ninos: parseInt(document.getElementById("evt-pax-n").value) || 0
            },
            notas: {
                interna: document.getElementById("evt-nota-interna").value,
                cliente: document.getElementById("evt-nota-cliente").value
            },
            servicios: []
        };

        document.querySelectorAll("#services-list tr").forEach(row => {
            const inputs = row.querySelectorAll("input");
            payload.servicios.push({
                fecha: inputs[0].value,
                concepto: inputs[1].value,
                uds: parseFloat(inputs[2].value) || 0,
                precio: parseFloat(inputs[3].value) || 0,
                total: parseFloat(row.querySelector(".row-total").innerText)
            });
        });

        console.log("Validating Event:", payload);

        // --- BLOCK VALIDATION ---
        if (globalConfig.bloqueos) {
            const isBlocked = globalConfig.bloqueos.some(b => {
                return (b.salon === "TODOS" || b.salon === payload.salon) &&
                    (payload.fecha >= b.start && payload.fecha <= b.end);
            });
            if (isBlocked) {
                alert("⛔ FECHA BLOQUEADA: El salón seleccionado no está disponible en esta fecha (Reparación/Bloqueo).");
                btn.innerText = originalText;
                btn.disabled = false;
                return;
            }
        }

        try {
            // --- CONFLICT VALIDATION ---
            // If I am cancelling, I don't care about conflicts
            let conflict = false;
            let conflictReason = "";

            if (payload.estado !== 'cancelada') {
                const existingSnapshot = await db.collection("reservas_salones")
                    .where("hotel", "==", payload.hotel)
                    .where("salon", "==", payload.salon)
                    .where("fecha", "==", payload.fecha)
                    .get();

                existingSnapshot.forEach(doc => {
                    if (currentBookingId && doc.id === currentBookingId) return; // Ignore self

                    const other = doc.data();
                    if (other.estado === 'cancelada') return; // Ignore cancelled events

                    const myJornada = payload.detalles.jornada;
                    const otherJornada = other.detalles?.jornada || "todo";

                    if (myJornada === "todo" || otherJornada === "todo") {
                        conflict = true;
                        conflictReason = `El salón ya está ocupado(Jornada Completa) por: ${other.cliente} `;
                    } else if (myJornada === otherJornada) {
                        conflict = true;
                        conflictReason = `Ya existe un evento en la franja ${myJornada} de: ${other.cliente} `;
                    }
                });
            }

            if (conflict) {
                alert("⛔ CONFLICTO DE RESERVA:\n" + conflictReason);
                btn.innerText = originalText;
                btn.disabled = false;
                return; // ABORT SAVE
            }

            if (currentBookingId) {
                // Update existing
                await db.collection("reservas_salones").doc(currentBookingId).set(payload, { merge: true });
            } else {
                // Create new
                await db.collection("reservas_salones").add(payload);
            }
            closeModal();
            // alert("Evento guardado exitosamente."); // Removed to be less intrusive, UI updates automatically via snapshot
        } catch (e) {
            console.error(e);
            alert("Error: " + e.message);
        } finally {
            if (btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    };

    window.printReport = function (mode) {
        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const dates = utils.getWeekDates(currentWeekStart);
        let title = "";
        let filterFn;

        if (mode === 'dia') {
            // Assume today or first day of current week view if passed? 
            // Better behavior: Default to today, but if today is not in week view, maybe first day of view?
            // Use Today for simplicity as per common use case
            const todayStr = utils.toIsoDate(new Date());
            const startStr = utils.toIsoDate(dates[0]);
            const endStr = utils.toIsoDate(dates[6]);
            // If today is in view, use today. Else use start of view.
            let targetDateStr = todayStr;
            if (todayStr < startStr || todayStr > endStr) targetDateStr = startStr;

            const prettyDate = new Date(targetDateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            title = `Informe Diario - ${prettyDate} `;
            filterFn = (r) => r.fecha === targetDateStr && r.estado !== 'cancelada';
        } else {
            const d1 = dates[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const d2 = dates[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            title = `Informe Semanal(${d1} - ${d2})`;
            // Filter is within range
            const s = utils.toIsoDate(dates[0]);
            const e = utils.toIsoDate(dates[6]);
            filterFn = (r) => r.fecha >= s && r.fecha <= e && r.estado !== 'cancelada';
        }

        let html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 5px; display: flex; align-items: center;">
                🏨 ${hotel}
            </h1>
            <h2 style="font-size: 18px; color: #555; margin-bottom: 20px;">${title}</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f3f3f3; border-bottom: 2px solid #ccc;">
                        <th style="padding: 8px; text-align: left;">Fecha</th>
                        <th style="padding: 8px; text-align: left;">Hora</th>
                        <th style="padding: 8px; text-align: left;">Salón</th>
                        <th style="padding: 8px; text-align: left;">Cliente</th>
                        <th style="padding: 8px; text-align: left;">Montaje</th>
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
            if (filterFn(r)) {
                rows.push(r);
            }
        });

        // Sort by Date then Time
        rows.sort((a, b) => {
            if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
            return (a.detalles?.hora || "00:00").localeCompare(b.detalles?.hora || "00:00");
        });

        rows.forEach(r => {
            const dateDisplay = new Date(r.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
            const pax = (r.detalles?.pax_adultos || 0) + (r.detalles?.pax_ninos || 0);
            html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px;">${dateDisplay}</td>
                <td style="padding: 8px;"><b>${r.detalles?.hora || '--:--'}</b></td>
                <td style="padding: 8px;">${r.salon || ''}</td>
                <td style="padding: 8px;">${r.cliente || ''}</td>
                <td style="padding: 8px;">${r.detalles?.montaje || ''}</td>
                <td style="padding: 8px;">${pax || ''}</td>
                <td style="padding: 8px;">${r.contact?.tel || ''}</td>
                <td style="padding: 8px; color:#666;">${r.notas?.interna || ''}</td>
                <td style="padding: 8px;">${r.estado || ''}</td>
            </tr>
            `;
        });

        html += `   </tbody></table>
            <div style="margin-top: 20px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 5px;">
                Impreso el ${new Date().toLocaleString()}
            </div>
        </div > `;

        const printArea = document.getElementById("printArea");
        if (printArea) {
            printArea.innerHTML = html;
            window.print();
        }
    };

    window.goToDate = function (val) {
        if (!val) return;
        currentWeekStart = new Date(val);
        // Ensure we are viewing that week? Or just that day? 
        // The current app logic is Week-Based. So if I pick a date, I should go to the week containing that date.
        // We need to adjust currentWeekStart to the *start* of that week?
        // Or if the logic uses currentWeekStart as the anchor, we just set it.
        // renderGrid uses utils.getWeekDates(currentWeekStart).
        // If I pick a Wednesday, I want to see that Wednesday.
        // utils.getWeekDates calculates forward from 'd'. 
        // If currentWeekStart is arbitrary, it will show 7 days starting from that date. Is that desired?
        // Currently 'changeWeek' adds +/- 7 days. 'resetToday' sets to new Date().
        // If we want "Monday Start" behavior, we might need normalization.
        // Restaurant module normalizes. Salones module... let's check utils.getWeekDates implementation.
        // Look at line 357 in viewed file (Step 158 for Restaurant... wait, looking at Salones JS).
        // Let's assume standard behavior: Set date, render 7 days starting from there (or normalize to Monday).
        // Improving logic: Normalize to Monday if user wants "Weeks".
        // But for now, let's just set the date.
        renderGrid();
    }

    // Update Date Picker in renderGrid
    // We need to inject this logic into renderGrid. Since I can't easily inject into the middle of a function without multi-replace or bigger context,
    // I will append a helper that renderGrid calls? No, renderGrid is internal.
    // I will hook into 'changeWeek', 'resetToday' and 'goToDate' to update the input manually if needed.
    // Better: Update the input value at the end of renderGrid.
    // But renderGrid is inside the closure. 
    // I need to redefine renderGrid or find where to patch it.
    // The previous view of salones.js (Step 175) shows renderGrid is NOT exported.
    // I must look at where renderGrid is defined.
    // Be careful. I'll stick to updating the input when 'changeWeek' or 'resetToday' is called.

    // Re-wrapping the window functions to also update the UI
    window.changeWeek = function (delta) {
        currentWeekStart.setDate(currentWeekStart.getDate() + (delta * 7));
        renderGrid();
        updateDatePicker();
    }

    window.resetToday = function () {
        currentWeekStart = new Date();
        renderGrid();
        updateDatePicker();
    }

    window.goToDate = function (val) {
        if (!val) return;
        currentWeekStart = new Date(val);
        renderGrid();
        // The input is already set by the user, but we sync state
    };

    // Helper to update the input
    function updateDatePicker() {
        const picker = document.getElementById("datePicker");
        if (picker && currentWeekStart) {
            picker.value = utils.toIsoDate(currentWeekStart);
        }
    }

    // Initialize
    ensureFirebase(() => {
        startApp();
        // Set default date in picker after app start
        setTimeout(updateDatePicker, 500);
    });
})();
