import { state } from './state.js';
import { calculateStats } from './utils.js';

// Access global db instance (from firebase-init.js)
const db = window.db;
const eventosRef = db.collection("grandes_eventos");
const participantesRef = db.collection("participantes_eventos");
const masterRef = db.collection("master_data");

export async function fetchSalonConfig() {
    try {
        const doc = await masterRef.doc("CONFIG_SALONES").get();
        return doc.exists ? doc.data() : { Guadiana: [], Cumbria: [] };
    } catch (e) {
        console.error("Error fetching salon config:", e);
        return { Guadiana: [], Cumbria: [] };
    }
}

export async function fetchEvents(filters = {}) {
    let query = eventosRef.orderBy("fecha", "desc");
    const snapshot = await query.get();
    let events = [];

    // Load events with participant stats
    for (const doc of snapshot.docs) {
        const eventData = { id: doc.id, ...doc.data() };

        // Fetch participants for this event to calculate totalPax
        const participantsSnapshot = await participantesRef.where("eventoId", "==", doc.id).get();
        let totalPax = 0;

        participantsSnapshot.forEach(pDoc => {
            const p = pDoc.data();
            // Only count active participants
            const isAnulado = p.estado && p.estado.startsWith('anulado');
            if (!isAnulado) {
                totalPax += (parseInt(p.adultos) || 0) + (parseInt(p.ninos) || 0);
            }
        });

        // Add stats to event object
        eventData.stats = { totalPax };
        events.push(eventData);
    }

    return events;
}

export async function fetchEventDetails(eventId) {
    const doc = await eventosRef.doc(eventId).get();
    if (!doc.exists) throw new Error("Evento no encontrado");
    return { id: doc.id, ...doc.data() };
}

export async function fetchParticipants(eventId) {
    const snapshot = await participantesRef.where("eventoId", "==", eventId).get();
    let participants = [];
    snapshot.forEach(doc => participants.push({ id: doc.id, ...doc.data() }));
    return participants;
}

export async function createEvent(eventData) {
    // Generate simple ref
    const prefix = eventData.nombre.substring(0, 3).toUpperCase();
    const cleanDate = eventData.fecha.replace(/-/g, '');
    const ref = `${prefix}${cleanDate}-GE${Math.floor(Math.random() * 1000)}`;

    const newEvent = {
        ...eventData,
        referencia: ref,
        estado: 'abierto',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await eventosRef.add(newEvent);
    return docRef.id;
}

export async function updateEvent(eventId, updates) {
    await eventosRef.doc(eventId).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

export async function saveParticipant(participantData) {
    if (participantData.id) {
        // Update existing participant
        const ref = participantesRef.doc(participantData.id);
        const { id, ...data } = participantData;
        await ref.update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else {
        // Create new participant
        await participantesRef.add({
            ...participantData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

export async function cancelParticipant(pId, reason, action, modalPagos) {
    let updates = {
        estado: 'anulado',
        motivoAnulacion: reason,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (action === "refund") {
        // If refunding, we effectively remove payments from the record? 
        // Or keep them but mark as refunded? 
        // User legacy logic was: just empty the payments array or let user edit it manually?
        // The code showed conditional logic.
        // For now, mirroring user's "Delete" intent if they chose Refund(Borrar)
        // Wait, the prompt said "Devolver (Borrar)" vs "Retener (Gastos)".
        // If "refund", we assume money is returned, so balance is 0. 
        // We can clear the payments array to reflect mapped reality.
        updates.pagos = [];
        updates.pagado = 0;
    } else {
        // Keep payments as "Retained"
        // No change to payments array
    }

    await participantesRef.doc(pId).update(updates);
}

export async function recoverParticipant(pId) {
    await participantesRef.doc(pId).update({
        estado: 'activo',
        motivoAnulacion: firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

export async function cancelEvent(eventId, salonId, fecha) {
    // Update event status to 'anulado'
    await eventosRef.doc(eventId).update({
        estado: 'anulado',
        fechaAnulacion: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Release salon reservation if exists
    if (salonId && fecha) {
        await releaseSalonReservation(salonId, fecha, eventId);
    }
}

async function releaseSalonReservation(salonId, fecha, eventoId) {
    try {
        // Query for the salon reservation
        const salonesRef = db.collection("reservas_salones");
        const snapshot = await salonesRef
            .where("salon", "==", salonId)
            .where("fecha", "==", fecha)
            .where("tipo", "==", "evento")
            .get();

        // Mark reservation as cancelled (don't delete, preserve data)
        const batch = db.batch();
        snapshot.forEach(doc => {
            // Check if this reservation belongs to this event
            const data = doc.data();
            if (data.eventoId === eventoId || data.referencia?.includes(eventoId)) {
                batch.update(doc.ref, {
                    estado: 'cancelado',
                    fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        await batch.commit();
    } catch (e) {
        console.error("Error releasing salon reservation:", e);
        // Don't throw - event cancellation should proceed even if salon release fails
    }
}

export async function batchUpdateReferences(updates) {
    const batch = db.batch();
    updates.forEach(u => {
        const ref = participantesRef.doc(u.id);
        batch.update(ref, { referencia: u.referencia, secuencia: u.secuencia });
    });
    await batch.commit();
}
