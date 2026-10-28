// scripts/update-manual.js
const fs = require('fs');

let html = fs.readFileSync('manual-recepcion-paygold.html', 'utf8');

// 1. Update Parameters Table
const oldTableTarget = '        <tr>\r\n          <td><strong>Email de Notificación de Cobro</strong></td>\r\n          <td><code>administracion@hotelguadiana.es</code> (Bandeja de <strong>Isabel</strong>)</td>\r\n        </tr>\r\n        <tr>\r\n          <td><strong>Circuito Operativo</strong></td>\r\n          <td>Isabel recibe el aviso de cobro del banco y lo <strong>reenvía a Recepción</strong> para su apunte en MesaChef.</td>\r\n        </tr>';

const newTableReplacement = '        <tr>\r\n          <td><strong>Email Oficial de Cobro</strong></td>\r\n          <td><code>administracion@hotelguadiana.es</code> (Bandeja de <strong>Isabel</strong>)</td>\r\n        </tr>\r\n        <tr>\r\n          <td><strong>URL Notificación Online (Webhook)</strong></td>\r\n          <td><span class="code-chip" style="font-size: 11px;">https://europe-west1-mesa-chef-prod.cloudfunctions.net/redsysWebhook</span></td>\r\n        </tr>\r\n        <tr>\r\n          <td><strong>Sincronización Automática</strong></td>\r\n          <td><span style="color: #16a34a; font-weight: 700;">Instantánea</span>: MesaChef pasa a 🟢 Garantizado y anota el pago al momento</td>\r\n        </tr>\r\n        <tr>\r\n          <td><strong>Circuito de Conciliación</strong></td>\r\n          <td>Isabel recibe el justificante oficial de Eurocaja para control contable y cuadratura mensual.</td>\r\n        </tr>';

if (html.includes(oldTableTarget)) {
  html = html.replace(oldTableTarget, newTableReplacement);
  console.log('Parameters table updated successfully.');
} else {
  // Try with LF if CRLF did not match
  const oldLF = oldTableTarget.replace(/\r\n/g, '\n');
  const newLF = newTableReplacement.replace(/\r\n/g, '\n');
  if (html.includes(oldLF)) {
    html = html.replace(oldLF, newLF);
    console.log('Parameters table (LF) updated successfully.');
  } else {
    console.warn('Parameters table not matched.');
  }
}

// 2. Update Paso 5 Title
const oldPaso5Title = '<div class="step-title">Confirmación del Pago y Circuito con Isabel (Administración)</div>';
const newPaso5Title = '<div class="step-title">Sincronización Automática (Webhook) y Conciliación con Isabel (Administración)</div>';
html = html.replace(oldPaso5Title, newPaso5Title);

// 3. Update Paso 5 Description
const oldPaso5Desc = '      <div class="step-desc">\r\n        <ul>\r\n          <li>Cuando el cliente completa el pago (mediante Bizum o Tarjeta bancaria), el banco envía un email automático con el justificante.</li>\r\n          <li>Este aviso llega al buzón de <strong>Isabel</strong>: <span class="code-chip">administracion@hotelguadiana.es</span>.</li>\r\n          <li><strong>Acción de Isabel:</strong> Isabel comprueba la entrada del abono en la cuenta y <strong>reenvía el correo a Recepción</strong> con la referencia del pedido (<span class="code-chip">GE-XXXXXX</span>).</li>\r\n          <li><strong>Acción de Recepción:</strong>\r\n            <ul>\r\n              <li>Abre la reserva en MesaChef.</li>\r\n              <li>En el <strong>Historial de Pagos</strong>, anota el importe y pulsa <strong>+ Añadir</strong>.</li>\r\n              <li>Cambia el <strong>Estado Garantía</strong> a: <span style="color: #16a34a; font-weight: 700;">✅ Garantizado / Pagado</span>.</li>\r\n              <li>Pulsa <strong>Guardar Ficha</strong>. ¡La reserva queda formalizada y protegida al 100%!</li>\r\n            </ul>\r\n          </li>\r\n        </ul>\r\n      </div>';

const newPaso5Desc = '      <div class="step-desc">\r\n        <ul>\r\n          <li><strong>⚡ 1. Sincronización Automática en Tiempo Real (MesaChef):</strong>\r\n            <ul>\r\n              <li>En el instante en que el cliente paga desde su móvil (Bizum o Tarjeta), Redsys notifica al <strong>Webhook de MesaChef</strong>.</li>\r\n              <li>La ficha se actualiza automáticamente a <span style="color: #16a34a; font-weight: 700;">✅ Garantizado / Pagado</span> y anota el pago en el historial con su código de autorización.</li>\r\n              <li><strong>El personal de Recepción no tiene que hacer nada a mano</strong>; la pantalla se pone en verde sola.</li>\r\n            </ul>\r\n          </li>\r\n          <li style="margin-top: 8px;"><strong>📑 2. Control y Conciliación Contable (Isabel):</strong>\r\n            <ul>\r\n              <li>El banco envía en paralelo el justificante por email a <span class="code-chip">administracion@hotelguadiana.es</span> (<strong>Isabel</strong>).</li>\r\n              <li>Este correo sirve para el archivo contable y la conciliación bancaria mensual.</li>\r\n              <li>Recepción ya no necesita esperar el correo para atender al cliente o dar por cerrada la reserva.</li>\r\n            </ul>\r\n          </li>\r\n        </ul>\r\n      </div>';

if (html.includes(oldPaso5Desc)) {
  html = html.replace(oldPaso5Desc, newPaso5Desc);
  console.log('Paso 5 updated successfully.');
} else {
  const oldLF = oldPaso5Desc.replace(/\r\n/g, '\n');
  const newLF = newPaso5Desc.replace(/\r\n/g, '\n');
  if (html.includes(oldLF)) {
    html = html.replace(oldLF, newLF);
    console.log('Paso 5 (LF) updated successfully.');
  } else {
    console.warn('Paso 5 desc not matched.');
  }
}

// 4. Update Footer Version
html = html.replace(/MesaChef Matrix v10\.[0-9]+\.[0-9]+/g, 'MesaChef Matrix v10.3.0');

fs.writeFileSync('manual-recepcion-paygold.html', html, 'utf8');
console.log('manual-recepcion-paygold.html successfully updated to v10.3.0.');
