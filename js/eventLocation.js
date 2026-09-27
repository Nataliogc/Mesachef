(function (root) {
  'use strict';
  const isRestaurant = value => String(value || '').trim().toLowerCase() === 'restaurante';
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
  const api = {isRestaurant, returnToEvents};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.EventLocation = api;
})(typeof window !== 'undefined' ? window : globalThis);
