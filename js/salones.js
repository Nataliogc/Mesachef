// js/salones.js - v7 (Fix Key Mismatch)

(function () {
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

        // 1. HOTEL IDENTITY CHECK
        // Align with index.html key
        let currentHotel = localStorage.getItem(STORAGE_KEY);
        console.log("Salones: Hotel detectado (" + STORAGE_KEY + "): ", currentHotel);

        const headerName = document.getElementById("headerHotelName");
        let displayName = "Seleccione Hotel en Inicio";

        if (currentHotel === "Guadiana") displayName = "Sercotel Guadiana";
        else if (currentHotel === "Cumbria") displayName = "Cumbria Spa & Hotel";
        else {
            // Fallback
            if (!currentHotel) {
                currentHotel = "Guadiana";
                // Do not write back to avoid interfering with Dashboard logic unless needed
                displayName = "Sercotel Guadiana (Default)";
            }
        }

        if (headerName) headerName.innerText = displayName;

        // 2. LOAD CONFIG
        db.collection("master_data").doc("CONFIG_SALONES").get().then(doc => {
            if (doc.exists) {
                globalConfig = doc.data();
            } else {
                globalConfig = { montajes: ["Banquete"], Guadiana: [], Cumbria: [] };
            }
            renderGrid();
        }).catch(err => {
            console.error("Salones: Error config", err);
            globalConfig = { montajes: ["Banquete"], Guadiana: [], Cumbria: [] };
            renderGrid();
        });
    }

    function renderGrid() {
        // Read consistently
        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const container = document.getElementById("calendarGrid");
        if (!container) return;

        const salons = (globalConfig[hotel] || []).filter(s => s.active !== false);
        const dates = utils.getWeekDates(currentWeekStart);

        const rangeEl = document.getElementById("currentWeekRange");
        if (rangeEl) rangeEl.innerText = `${dates[0].toLocaleDateString()} - ${dates[6].toLocaleDateString()}`;

        let html = `
        <div style="display:grid; grid-template-columns: 150px repeat(7, 1fr); gap:1px; background:#e5e7eb; border-radius:8px; overflow:hidden;">
            <div class="bg-gray-50 p-3 font-bold text-gray-600 border-b flex items-center justify-center text-sm">SALA</div>
            ${dates.map(d => `<div class="bg-gray-50 p-2 font-bold text-center border-b text-sm uppercase text-slate-500">${utils.formatDateES(d)}</div>`).join('')}
        `;

        if (salons.length === 0) {
            html += `<div style="grid-column: 1/-1; padding:30px; text-align:center; background:white;">
                        <span class="text-2xl block mb-2">🏨</span>
                        <b>No hay salones activos para ${hotel}.</b><br>
                     </div>`;
        } else {
            salons.forEach(salon => {
                html += `<div class="bg-white p-3 border-r font-bold text-slate-700 flex flex-col justify-center border-b">
                            <span class="text-sm">${salon.name}</span>
                            <span class="text-xs text-slate-400 font-normal">Max: ${salon.pax}</span>
                          </div>`;
                dates.forEach(d => {
                    const dateStr = utils.toIsoDate(d);
                    const safeName = salon.name.replace(/'/g, "\\'");
                    html += `<div id="cell_${hotel}_${salon.name.replace(/\s/g, '_')}_${dateStr}" 
                                   class="bg-white hover:bg-blue-50 cursor-pointer min-h-[80px] border-b border-r transition p-1 relative group flex flex-col items-center justify-center"
                                   onclick="openBooking('${safeName}', '${dateStr}')">
                                    <button class="hidden group-hover:flex bg-blue-100 text-blue-600 rounded-full w-8 h-8 items-center justify-center text-lg font-bold shadow-sm">+</button>
                              </div>`;
                });
            });
        }
        html += `</div>`;
        container.innerHTML = html;
    }

    // --- FORM LOGIC ---
    window.openBooking = function (salonName, dateStr) {
        const sSel = document.getElementById("evt-salon");
        const mSel = document.getElementById("evt-montaje");

        sSel.innerHTML = "";
        mSel.innerHTML = "";

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

        document.getElementById("evt-nombre").value = "";
        document.getElementById("evt-telefono").value = "";
        document.getElementById("evt-email").value = "";
        document.getElementById("services-list").innerHTML = "";
        document.getElementById("evt-total").innerText = "0.00 €";

        document.getElementById("evt-fecha").value = dateStr;
        sSel.value = salonName;

        document.getElementById("modal-evt").classList.remove("hidden");
    };

    window.closeModal = function () {
        document.getElementById("modal-evt").classList.add("hidden");
    };

    window.addServiceRow = function () {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="p-2 border-b"><input type="date" value="${document.getElementById("evt-fecha").value}" class="text-xs bg-gray-50 w-full rounded border-gray-200"></td>
            <td class="p-2 border-b"><input type="text" placeholder="Concepto" class="text-xs font-bold w-full rounded border-gray-200"></td>
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
            row.querySelector(".row-total").innerText = sub.toFixed(2) + " €";
            total += sub;
        });
        document.getElementById("evt-total").innerText = total.toFixed(2) + " €";
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

        console.log("Saving Event:", payload);

        try {
            await db.collection("reservas_salones").add(payload);
            closeModal();
            alert("Evento creado exitosamente.");
        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    window.changeWeek = function (delta) {
        currentWeekStart.setDate(currentWeekStart.getDate() + (delta * 7));
        renderGrid();
    }
    window.resetToday = function () {
        currentWeekStart = new Date();
        renderGrid();
    }

    ensureFirebase(startApp);
})();
