const test = require('node:test');
const assert = require('node:assert/strict');
const {isRestaurant, returnToEvents} = require('../js/eventLocation');
function fixture(salon = 'Restaurante', fail = false) {
  const records = new Map([
    ['reservas_salones/event', {salon, hotel:'Guadiana', desvinculado:true, vinculoRoto:true, detalles:{pax_adultos:3}, servicios:[{concepto:'Almuerzo',uds:3}]}],
    ['reservas_restaurante/salon_event', {salonBookingId:'event'}],
    ['reservas_restaurante/legacy', {salonBookingId:'event'}],
    ['reservas_restaurante/other', {nombre:'Otra reserva'}]
  ]);
  const db = {
    collection: c => ({
      doc: id => ({key:c+'/'+id}),
      where: (field,op,value) => ({get:async()=>({forEach:fn=>[...records].filter(([k,v])=>k.startsWith(c+'/')&&v[field]===value).forEach(([k])=>fn({id:k.split('/')[1],ref:{key:k}}))})})
    }),
    runTransaction: async fn => {
      const writes = [];
      await fn({
        get:async ref=>({exists:records.has(ref.key),data:()=>records.get(ref.key)}),
        update:(ref,value)=>writes.push(()=>records.set(ref.key,{...records.get(ref.key),...value})),
        delete:ref=>writes.push(()=>records.delete(ref.key))
      });
      if (fail) throw new Error('Sin permisos');
      writes.forEach(fn=>fn());
    }
  };
  return {db, records};
}
test('Restaurante y Eventos Restaurante son ubicaciones diferentes',()=>{
  assert.equal(isRestaurant(' Restaurante '),true);
  assert.equal(isRestaurant('Eventos Restaurante'),false);
  assert.equal(isRestaurant('Eventos Grupos Alarcos'),false);
});
test('devuelve a Eventos sin duplicados ni pérdida de datos o desvinculación',async()=>{
  const {db,records}=fixture();
  await returnToEvents(db,'event','Eventos Grupos Alarcos');
  const event=records.get('reservas_salones/event');
  assert.equal(event.salon,'Eventos Grupos Alarcos');
  assert.equal(event.desvinculado,true);
  assert.equal(event.vinculoRoto,true);
  assert.equal(event.detalles.pax_adultos,3);
  assert.deepEqual(event.servicios,[{concepto:'Almuerzo',uds:3}]);
  assert.equal(records.has('reservas_restaurante/salon_event'),false);
  assert.equal(records.has('reservas_restaurante/legacy'),false);
  assert.equal(records.has('reservas_restaurante/other'),true);
});
test('un fallo no deja el traslado a medias',async()=>{
  const {db,records}=fixture('Restaurante',true);
  await assert.rejects(returnToEvents(db,'event','Eventos Grupos Alarcos'),/Sin permisos/);
  assert.equal(records.get('reservas_salones/event').salon,'Restaurante');
  assert.equal(records.has('reservas_restaurante/salon_event'),true);
});
test('rechaza cambios si otro usuario ya movió el evento',async()=>{
  const {db,records}=fixture('Otro salón');
  await assert.rejects(returnToEvents(db,'event','Eventos Grupos Alarcos'),/ubicación ha cambiado/);
  assert.equal(records.get('reservas_salones/event').salon,'Otro salón');
});
