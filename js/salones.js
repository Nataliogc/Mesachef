// js/salones.js - v9 (Restored & Fixed)

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
            renderGrid();
        }).catch(err => {
            console.error("Salones: Error config", err);
            globalConfig = { montajes: ["Banquete"], Guadiana: [], Cumbria: [] };
            renderGrid();
        });
    }

    function renderGrid() {
        const hotel = localStorage.getItem(STORAGE_KEY) || "Guadiana";
        const container = document.getElementById("calendarGrid");
        if (!container) return;

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
                        <span class="text-slate-400 font-normal">${d.getDate()} ${d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}</span>
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
                        html += `<div class="bg-red-50 hover:bg-red-100 border-r border-slate-100 last:border-r-0 transition p-1 relative flex flex-col items-center justify-center group cursor-not-allowed" title="${blockReason}">
                                    <span class="text-2xl">🔒</span>
                                    <span class="text-[10px] text-red-600 font-bold uppercase mt-1 text-center leading-tight">${blockReason}</span>
                               </div>`;
                    } else {
                        html += `<div id="cell_${hotel}_${salon.name.replace(/\s/g, '_')}_${dateStr}" 
                                       class="bg-white hover:bg-slate-50 cursor-pointer min-h-[90px] border-r border-slate-100 last:border-r-0 transition p-1 relative flex flex-col items-center justify-center group"
                                       onclick="openBooking('${safeName}', '${dateStr}')">
                                        <button class="opacity-0 group-hover:opacity-100 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold shadow-md transform transition scale-90 hover:scale-105">+</button>
                                  </div>`;
                    }
                });
                html += `</div>`;
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

        document.getElementById("evt-fecha").value = dateStr || new Date().toISOString().split('T')[0];
        if (salonName) sSel.value = salonName;

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
            // Update row total
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

    // START
    ensureFirebase(startApp);
})();
