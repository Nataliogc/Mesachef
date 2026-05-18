document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        alert("ID de reserva no proporcionado.");
        window.close();
        return;
    }

    const shortId = id.slice(-6).toUpperCase();
    document.getElementById("lblId").innerText = shortId;
    document.getElementById("txtRef").innerText = shortId;

    // Set current print date
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById("lblFechaImpresion").innerText = `${day}/${month}/${year} ${hours}:${minutes}`;

    // Esperar a que la autenticación esté lista antes de consultar Firestore
    const checkFirebase = setInterval(() => {
        if (window.firebase && window.firebase.auth) {
            clearInterval(checkFirebase);
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    await loadData(id);
                } else {
                    firebase.auth().signInAnonymously().catch(err => {
                        console.error("Error Auth:", err);
                        alert("Error de permisos: " + err.message);
                    });
                }
            });
        }
    }, 100);
});

async function loadData(id) {
    try {
        const db = firebase.firestore();
        const doc = await db.collection("reservas_salones").doc(id).get();
        if (!doc.exists) {
            alert("La reserva no existe.");
            return;
        }

        const data = doc.data();
        window.currentBookingData = data;
        window.currentBookingId = id;

        // Branding
        const STORAGE_KEY = 'MesaChef_Hotel';
        const hotel = localStorage.getItem(STORAGE_KEY) || data.hotel || "Guadiana";
        if (hotel === "Guadiana") {
            document.getElementById("headerHotelName").innerText = "HOTEL GUADIANA";
            document.getElementById("footerHotelName").innerText = "G U A D I A N A";
            document.getElementById("footerAddress").innerText = "Guadiana Baja, 36 | 13002 Ciudad Real | ESPAÑA";
            document.getElementById("footerPhone").innerText = "Telf.: 926 22 33 13 www.hotelguadiana.es";
        } else {
            document.getElementById("headerHotelName").innerText = "HOTEL CUMBRIA";
            document.getElementById("footerHotelName").innerText = "C U M B R I A";
            document.getElementById("footerAddress").innerText = "Ctra. de Toledo, 26 | 13005 Ciudad Real | ESPAÑA";
            document.getElementById("footerPhone").innerText = "Telf.: 926 25 04 04 www.encumbria.es";
        }

        if (data.ordenServicio) {
            let modDateStr = "--/--/---- --:--";
            if (data.ordenServicio.guardadoEl) {
                const modDate = new Date(data.ordenServicio.guardadoEl);
                if (!isNaN(modDate.getTime())) {
                    const day = String(modDate.getDate()).padStart(2, '0');
                    const month = String(modDate.getMonth() + 1).padStart(2, '0');
                    const year = modDate.getFullYear();
                    const hours = String(modDate.getHours()).padStart(2, '0');
                    const minutes = String(modDate.getMinutes()).padStart(2, '0');
                    modDateStr = `${day}/${month}/${year} ${hours}:${minutes}`;
                }
            } else if (data.updatedAt) {
                const modDate = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
                if (!isNaN(modDate.getTime())) {
                    const day = String(modDate.getDate()).padStart(2, '0');
                    const month = String(modDate.getMonth() + 1).padStart(2, '0');
                    const year = modDate.getFullYear();
                    const hours = String(modDate.getHours()).padStart(2, '0');
                    const minutes = String(modDate.getMinutes()).padStart(2, '0');
                    modDateStr = `${day}/${month}/${year} ${hours}:${minutes}`;
                }
            }
            const lblMod = document.getElementById("lblFechaModificacion");
            if (lblMod) lblMod.innerText = modDateStr;
            renderFromSaved(data.ordenServicio);
        } else {
            const lblMod = document.getElementById("lblFechaModificacion");
            if (lblMod) lblMod.innerText = "No guardada aún";
            renderDefaults(data);
        }
    } catch (e) {
        console.error("Error al cargar datos:", e);
        alert("Error: " + e.message);
    }
}

function getFormatDate(isoDate) {
    if (!isoDate) return "---";
    const d = new Date(isoDate);
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
    const day = d.getDate();
    const month = d.getMonth() + 1;
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${day}/${month}`;
}

function renderDefaults(data) {
    document.getElementById("txtGrupo").value = data.cliente || "";
    const totalPax = (parseInt(data.detalles?.pax_adultos) || 0) + (parseInt(data.detalles?.pax_ninos) || 0);
    document.getElementById("txtPax").value = totalPax || "";
    document.getElementById("txtSalon").value = data.salon || "";
    
    let notas = "";
    if (data.notas?.interna) {
        notas = data.notas.interna;
    }
    document.getElementById("txtNotas").value = notas;

    const tbodySrv = document.querySelector("#tableServicios tbody");
    tbodySrv.innerHTML = "";
    
    if (data.servicios && data.servicios.length > 0) {
        const filteredServices = data.servicios.filter(s => !s.concepto.toLowerCase().includes('alquiler'));
        
        if (filteredServices.length > 0) {
            filteredServices.forEach(s => {
                const tr = createServicioRow(getFormatDate(s.fecha), s.concepto, s.uds, "", "__:__ h");
                tbodySrv.appendChild(tr);
            });
        } else {
            tbodySrv.appendChild(createServicioRow(getFormatDate(data.fecha), "Servicio", totalPax, "", data.detalles?.hora || "__:__ h"));
        }
    } else {
        tbodySrv.appendChild(createServicioRow(getFormatDate(data.fecha), "Evento", totalPax, "", data.detalles?.hora || "__:__ h"));
    }

    const tbodyInc = document.querySelector("#tableIncidencias tbody");
    tbodyInc.innerHTML = "";
    tbodyInc.appendChild(createIncidenciaRow("---", "---", "---", "---"));
}

function renderFromSaved(osData) {
    const data = window.currentBookingData || {};
    const totalPax = (parseInt(data.detalles?.pax_adultos) || 0) + (parseInt(data.detalles?.pax_ninos) || 0);

    document.getElementById("txtGrupo").value = osData.grupo || data.cliente || "";
    document.getElementById("txtSalon").value = osData.salon || data.salon || "";
    
    // Always refresh the header pax and notes to the latest details from the reservation
    document.getElementById("txtPax").value = totalPax || "";
    document.getElementById("txtNotas").value = osData.notas || data.notas?.interna || "";

    const tbodySrv = document.querySelector("#tableServicios tbody");
    tbodySrv.innerHTML = "";

    // Smart Merge for Plan de Servicios
    const currentServices = (data.servicios || []).filter(s => !s.concepto.toLowerCase().includes('alquiler'));

    if (currentServices.length > 0) {
        currentServices.forEach((cs, index) => {
            // Find a matching saved service row by index
            const savedRow = (osData.planServicios && osData.planServicios[index]) ? osData.planServicios[index] : null;

            let dia = getFormatDate(cs.fecha);
            let servicio = cs.concepto;
            let pax = cs.uds; // Always refresh to the latest Pax/Units!
            let menu = "";
            let hora = cs.hora || "__:__ h";

            if (savedRow) {
                // Keep manually edited concept, menu, and time if present, but update pax and dia to latest
                if (savedRow.servicio) servicio = savedRow.servicio;
                if (savedRow.menu) menu = savedRow.menu;
                if (savedRow.hora && savedRow.hora !== "__:__ h") hora = savedRow.hora;
            }

            tbodySrv.appendChild(createServicioRow(dia, servicio, pax, menu, hora));
        });

        // Append any extra manual rows from the saved plan that exceed currentServices
        if (osData.planServicios && osData.planServicios.length > currentServices.length) {
            for (let i = currentServices.length; i < osData.planServicios.length; i++) {
                const s = osData.planServicios[i];
                tbodySrv.appendChild(createServicioRow(s.dia, s.servicio, s.pax, s.menu, s.hora));
            }
        }
    } else {
        // Fallback to legacy saved data if no current services are defined
        if (osData.planServicios && osData.planServicios.length > 0) {
            osData.planServicios.forEach(s => {
                tbodySrv.appendChild(createServicioRow(s.dia, s.servicio, s.pax, s.menu, s.hora));
            });
        } else {
            addServicioRow();
        }
    }

    const tbodyInc = document.querySelector("#tableIncidencias tbody");
    tbodyInc.innerHTML = "";
    if (osData.incidencias && osData.incidencias.length > 0) {
        osData.incidencias.forEach(i => {
            tbodyInc.appendChild(createIncidenciaRow(i.tipo, i.pax, i.detalle, i.servicios));
        });
    } else {
        addIncidenciaRow();
    }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

function createServicioRow(dia, servicio, pax, menu, hora) {
    dia = dia || "";
    servicio = servicio || "";
    pax = pax || "";
    menu = menu || "";
    hora = hora || "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="align-top"><input type="text" class="field-input w-full" value="${dia}"></td>
        <td class="align-top"><textarea class="field-input w-full" rows="1" oninput="autoResize(this)">${servicio}</textarea></td>
        <td class="align-top"><input type="text" class="field-input w-full" value="${pax}"></td>
        <td class="align-top bg-yellow-100/50 print:bg-yellow-50"><textarea class="field-input w-full print:bg-yellow-50" rows="1" oninput="autoResize(this)">${menu}</textarea></td>
        <td class="align-top"><input type="text" class="field-input w-full" value="${hora}"></td>
        <td class="align-top text-right no-print"><button onclick="this.closest('tr').remove()" class="text-red-400 font-bold hover:text-red-600">&times;</button></td>
    `;
    // Trigger initial resize after adding to DOM
    setTimeout(() => {
        tr.querySelectorAll('textarea').forEach(autoResize);
    }, 10);
    return tr;
}

function createIncidenciaRow(tipo, pax, detalle, servicios) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><input type="text" class="field-input w-full" value="${tipo}"></td>
        <td><input type="text" class="field-input w-full" value="${pax}"></td>
        <td><input type="text" class="field-input w-full" value="${detalle}"></td>
        <td><input type="text" class="field-input w-full" value="${servicios}"></td>
        <td class="text-right no-print"><button onclick="this.closest('tr').remove()" class="text-red-400 font-bold hover:text-red-600">&times;</button></td>
    `;
    return tr;
}

window.addServicioRow = function() {
    document.querySelector("#tableServicios tbody").appendChild(createServicioRow("", "", "", "---", "__:__ h"));
};

window.addIncidenciaRow = function() {
    document.querySelector("#tableIncidencias tbody").appendChild(createIncidenciaRow("---", "---", "---", "---"));
};

window.restaurarDatos = function() {
    if (confirm("¿Estás seguro? Se sobreescribirán los datos actuales con los del evento guardado.")) {
        renderDefaults(window.currentBookingData);
    }
};

async function saveOrdenServicioData() {
    if (!window.currentBookingId) return false;

    const planServicios = [];
    document.querySelectorAll("#tableServicios tbody tr").forEach(tr => {
        const fields = tr.querySelectorAll(".field-input");
        if (fields.length >= 5) {
            planServicios.push({
                dia: fields[0].value || "",
                servicio: fields[1].value || "",
                pax: fields[2].value || "",
                menu: fields[3].value || "",
                hora: fields[4].value || ""
            });
        }
    });

    const incidencias = [];
    document.querySelectorAll("#tableIncidencias tbody tr").forEach(tr => {
        const fields = tr.querySelectorAll(".field-input");
        if (fields.length >= 4) {
            incidencias.push({
                tipo: fields[0].value || "",
                pax: fields[1].value || "",
                detalle: fields[2].value || "",
                servicios: fields[3].value || ""
            });
        }
    });

    const osData = {
        grupo: document.getElementById("txtGrupo").value || "",
        salon: document.getElementById("txtSalon").value || "",
        pax: document.getElementById("txtPax").value || "",
        notas: document.getElementById("txtNotas").value || "",
        guardadoEl: new Date().toISOString(),
        planServicios,
        incidencias
    };

    console.log("Guardando Orden de Servicio:", osData);

    const db = firebase.firestore();
    try {
        await db.collection("reservas_salones").doc(window.currentBookingId).update({
            ordenServicio: osData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("¡Orden guardada con éxito!");
        
        // Update modification time label immediately in UI
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const lblMod = document.getElementById("lblFechaModificacion");
        if (lblMod) lblMod.innerText = `${day}/${month}/${year} ${hours}:${minutes}`;
        
        return true;
    } catch (e) {
        console.error("Error guardando orden de servicio:", e);
        alert("Hubo un error al guardar: " + e.message);
        return false;
    }
}

window.guardarDatosOnly = async function(closeAfter = false) {
    const success = await saveOrdenServicioData();
    if (success) {
        if (closeAfter) {
            window.close();
        } else {
            alert("💾 ¡Cambios guardados con éxito en la base de datos!");
        }
    }
};

window.guardarYSalir = async function() {
    await window.guardarDatosOnly(true);
};

window.guardarEImprimir = async function() {
    const success = await saveOrdenServicioData();
    if (!success) return;

    // Set dynamic document title for browser print dialog filename
    const originalTitle = document.title;
    const shortId = window.currentBookingId ? window.currentBookingId.substring(window.currentBookingId.length - 6).toUpperCase() : "";
    const grupo = document.getElementById("txtGrupo").value || "";
    document.title = `Orden de Servicio ${shortId} - ${grupo}`;

    // Print when finished saving
    window.print();

    // Restore title
    document.title = originalTitle;
};
