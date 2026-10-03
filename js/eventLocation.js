(function (root) {
  'use strict';
  const isRestaurant = value => String(value || '').trim().toLowerCase() === 'restaurante';
  async function changeLinkedSalon(db, bookingId, salon, expectedSalon) {
    if (!bookingId || !salon) throw new Error('Selecciona un salón.');
    const source = db.collection('reservas_salones').doc(bookingId);
    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(source);
      if (!snapshot.exists) throw new Error('No se encuentra el evento original.');
      const event = snapshot.data();
      if (event.desvinculado || event.vinculoRoto) throw new Error('El evento ya está desvinculado. Vuelve a abrirlo.');
      if (event.salon !== expectedSalon) throw new Error('La ubicación ha cambiado. Cierra y vuelve a abrir la reserva.');
      if (event.salon === salon) return;
      transaction.update(source, {salon, salonOverride: salon, salonOverrideHotel: event.hotel, updated_at: new Date().toISOString()});
      const mirror = db.collection('reservas_restaurante').doc('salon_' + bookingId);
      if (isRestaurant(salon)) {
        const details = event.detalles || {};
        transaction.set(mirror, {
          hotel: event.hotel, referencia: event.reservaId || bookingId,
          fecha: event.fecha, espacio: 'Restaurante', nombre: event.cliente || '',
          hora: details.hora || '', turno: details.jornada || 'cena',
          pax: (details.pax_adultos || 0) + (details.pax_ninos || 0), ninos: details.pax_ninos || 0,
          estado: event.estado, servicioIncluido: !!details.incluido,
          salonBookingId: bookingId, _isFromSalones: true,
          updatedAt: new Date().toISOString()
        }, {merge: true});
      } else if (isRestaurant(event.salon)) {
        transaction.delete(mirror);
      }
    });
  }
  async function returnToEvents(db, bookingId, salon) {
    if (!bookingId || !salon || isRestaurant(salon)) throw new Error('Selecciona un salón de Eventos.');
    const source = db.collection('reservas_salones').doc(bookingId);
    const mirrors = await db.collection('reservas_restaurante').where('salonBookingId', '==', bookingId).get();
    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(source);
      if (!snapshot.exists) throw new Error('No se encuentra el evento original.');
      if (!isRestaurant(snapshot.data().salon)) throw new Error('La ubicación ha cambiado. Cierra y vuelve a abrir la reserva.');
      transaction.update(source, {salon, updated_at: new Date().toISOString()});
      const refs = new Map();
      mirrors.forEach(doc => refs.set(doc.id, doc.ref));
      refs.set('salon_' + bookingId, db.collection('reservas_restaurante').doc('salon_' + bookingId));
      refs.forEach(ref => transaction.delete(ref));
    });
  }
  const api = {isRestaurant, returnToEvents, changeLinkedSalon};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.EventLocation = api;
})(typeof window !== 'undefined' ? window : globalThis);
