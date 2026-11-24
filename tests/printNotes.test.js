const test = require('node:test');
const assert = require('node:assert/strict');
const { stripNexusGroupsMetadata } = require('../js/printNotes');

test('elimina por completo la etiqueta Nexus Groups cuando no hay otras observaciones', () => {
  assert.equal(
    stripNexusGroupsMetadata('[Nexus Groups] Ref: 79257 | Programación de comidas | Pax: 68'),
    ''
  );
});

test('conserva la observación real en la misma línea antes de la etiqueta Nexus Groups', () => {
  assert.equal(
    stripNexusGroupsMetadata('Desayuno Migas [Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70'),
    'Desayuno Migas'
  );
});

test('conserva la observación real separada por saltos de línea', () => {
  assert.equal(
    stripNexusGroupsMetadata('Desayuno Migas\n[Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70'),
    'Desayuno Migas'
  );
  assert.equal(
    stripNexusGroupsMetadata('Desayuno Migas\r\n\r\n[Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70'),
    'Desayuno Migas'
  );
});

test('conserva la observación real cuando aparece en la línea siguiente a Nexus Groups', () => {
  assert.equal(
    stripNexusGroupsMetadata('[Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70\nDesayuno Migas'),
    'Desayuno Migas'
  );
});

test('conserva observaciones antes y después de la línea Nexus Groups', () => {
  assert.equal(
    stripNexusGroupsMetadata('Primera nota\n[Nexus Groups] Ref: 79257 | Programación de comidas | Pax: 68\nSegunda nota'),
    'Primera nota\nSegunda nota'
  );
});

test('limpia separadores colgantes antes de la etiqueta Nexus Groups', () => {
  assert.equal(
    stripNexusGroupsMetadata('Desayuno Migas | [Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70'),
    'Desayuno Migas'
  );
  assert.equal(
    stripNexusGroupsMetadata('Desayuno Migas - [Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70'),
    'Desayuno Migas'
  );
  assert.equal(
    stripNexusGroupsMetadata('Desayuno Migas · [Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70'),
    'Desayuno Migas'
  );
});

test('conserva el texto posterior a | Pax: N (caso espejo a Restaurante) y combina texto previo y posterior', () => {
  assert.equal(
    stripNexusGroupsMetadata('[Nexus Groups] Ref: 79257 | Programación de comidas | Pax: 68 | Sin lactosa'),
    'Sin lactosa'
  );
  assert.equal(
    stripNexusGroupsMetadata('Desayuno Migas | [Nexus Groups] Ref: 79257 | Programación de Desayuno | Pax: 70 | Sin lactosa'),
    'Desayuno Migas | Sin lactosa'
  );
});

test('elimina etiquetas Nexus Groups aunque no terminen en | Pax: N', () => {
  assert.equal(
    stripNexusGroupsMetadata('[Nexus Groups] Ref: 79257 | Salón Marte'),
    ''
  );
  assert.equal(
    stripNexusGroupsMetadata('Montaje en U [Nexus Groups] Ref: 79257 | Sala'),
    'Montaje en U'
  );
});

test('maneja mayúsculas/minúsculas, espacios extra y múltiples bloques Nexus Groups', () => {
  assert.equal(
    stripNexusGroupsMetadata('[nexus  groups] Ref: 79257 | Programación de comidas | Pax: 68'),
    ''
  );
  assert.equal(
    stripNexusGroupsMetadata('Nota real [NEXUS GROUPS] Ref: 1 | Programación | Pax: 10 [Nexus Groups] Ref: 2 | Sala | Pax: 20'),
    'Nota real'
  );
});

test('mantiene sin cambios las observaciones normales sin Nexus Groups', () => {
  assert.equal(
    stripNexusGroupsMetadata('PRESIDENCIA 2 PERS'),
    'PRESIDENCIA 2 PERS'
  );
  assert.equal(
    stripNexusGroupsMetadata('50 PERSONAS EN TEATRO, PANTALLA, PROYECTOR, MICRO, ATRIL PRESIDENCIA 2 PERS, SIN TARIMA, REVISAR CERRADURA PUERTA PARA QUE ESTE ABIERTA'),
    '50 PERSONAS EN TEATRO, PANTALLA, PROYECTOR, MICRO, ATRIL PRESIDENCIA 2 PERS, SIN TARIMA, REVISAR CERRADURA PUERTA PARA QUE ESTE ABIERTA'
  );
  assert.equal(
    stripNexusGroupsMetadata('- Poner agua\n- Proyector'),
    '- Poner agua\n- Proyector'
  );
});

test('devuelve cadena vacía ante entradas vacías, espacios, null o undefined', () => {
  assert.equal(stripNexusGroupsMetadata(''), '');
  assert.equal(stripNexusGroupsMetadata('   \n  '), '');
  assert.equal(stripNexusGroupsMetadata(null), '');
  assert.equal(stripNexusGroupsMetadata(undefined), '');
});
