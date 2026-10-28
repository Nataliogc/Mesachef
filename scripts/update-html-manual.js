// scripts/update-html-manual.js
const fs = require('fs');

let html = fs.readFileSync('manual-recepcion-paygold.html', 'utf8');

const target = '<!-- PASO 5 -->';
const parts = html.split(target);

const newPaso5And6Snippet = `<!-- PASO 5 -->
    <div class="step-box">
      <div class="step-header">
        <span class="step-pill">PASO 5</span>
        <div class="step-title">Dónde se Configura la Notificación Online en Eurocaja (Redsys)</div>
      </div>
      <div class="step-desc">
        <ul>
          <li>Para que el TPV de Eurocaja Rural avise automáticamente a MesaChef cada vez que un cliente pague, se configura una sola vez en el portal del banco:</li>
          <li>Accede a la administración del comercio <span class="code-chip">168355840-001</span> en Redsys Canales.</li>
          <li>En la sección <strong>Parámetros del TPV Virtual &gt; Notificación online</strong>:</li>
          <li>Marca la casilla: <strong>☑️ Notificar resultado a la siguiente URL</strong>.</li>
          <li>En <strong>"URL destino notificación"</strong>, pega la URL oficial de MesaChef:
            <div style="margin: 6px 0; font-family: monospace; font-size: 11px; background: #f0fdf4; padding: 6px 10px; border-radius: 6px; border: 1px solid #86efac; color: #166534; font-weight: bold;">
              https://europe-west1-mesa-chef-prod.cloudfunctions.net/redsysWebhook
            </div>
            <em>(Puedes copiarla directamente en MesaChef con el botón "📋 Copiar URL Webhook").</em>
          </li>
          <li>Pulsa <strong>Aceptar / Guardar</strong>.</li>
        </ul>
      </div>
      <div class="img-wrapper">
        <img src="Img/manual/step_webhook_config.png" alt="Configuración de Notificación Online en Eurocaja Redsys">
        <div class="img-caption">Figura 5: Casilla y campo de URL destino notificación en el portal de Eurocaja Rural</div>
      </div>
    </div>

    <!-- PASO 6 -->
    <div class="step-box">
      <div class="step-header">
        <span class="step-pill">PASO 6</span>
        <div class="step-title">Actualización Automática (Webhook) y Conciliación con Isabel (Administración)</div>
      </div>`;

if (parts.length > 1) {
  let rest = parts[1];
  const oldHeader = rest.substring(0, rest.indexOf('<div class="step-desc">'));
  const afterHeader = rest.substring(rest.indexOf('<div class="step-desc">'));
  html = parts[0] + newPaso5And6Snippet + '\n      ' + afterHeader;
  console.log('manual-recepcion-paygold.html successfully updated with Paso 5 and Paso 6.');
}

// Update version string to 10.3.3
html = html.replace(/MesaChef Matrix v10\.[0-9]+\.[0-9]+/g, 'MesaChef Matrix v10.3.3');
fs.writeFileSync('manual-recepcion-paygold.html', html, 'utf8');
