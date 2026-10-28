// scripts/add-webhook-ui.js
const fs = require('fs');

// 1. Update grandes-eventos.html
let html = fs.readFileSync('grandes-eventos.html', 'utf8');

const targetHtml = '<!-- Barra de ayuda para rellenar Eurocaja rápidamente -->';
const newHtmlSnippet = `<!-- Barra de ayuda para rellenar Eurocaja rápidamente -->
              <div style="background:#ecfdf5; border:1px dashed #6ee7b7; border-radius:8px; padding:8px 12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span style="font-size:11px; color:#065f46; font-weight:800;">⚡ Para Eurocaja:</span>
                <div style="display:flex; gap:8px;">
                  <button type="button" id="btnCopyPaygoldAmount" style="background:#ffffff; border:1px solid #a7f3d0; border-radius:6px; padding:4px 10px; font-size:11px; color:#047857; cursor:pointer; font-weight:700;">💰 Copiar Importe</button>
                  <button type="button" id="btnCopyPaygoldDesc" style="background:#ffffff; border:1px solid #a7f3d0; border-radius:6px; padding:4px 10px; font-size:11px; color:#047857; cursor:pointer; font-weight:700;">📝 Copiar Descripción</button>
                </div>
              </div>

              <!-- URL Notificación Online (Webhook para avisar a MesaChef) -->
              <div style="background:#ffffff; border:1px solid #86efac; border-radius:8px; padding:8px 12px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:11px; font-weight:800; color:#14532d; display:flex; align-items:center; gap:5px;">
                    <span>📡</span> URL Notificación Online (Pegar en Eurocaja TPV para auto-notificar cobro):
                  </span>
                  <button type="button" id="btnCopyWebhookUrl" style="background:#15803d; color:#ffffff; border:none; font-size:10px; font-weight:800; padding:3px 10px; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:4px;">
                    📋 Copiar URL Webhook
                  </button>
                </div>
                <div style="font-family:monospace; font-size:11px; color:#166534; background:#f0fdf4; padding:5px 8px; border-radius:5px; border:1px dashed #86efac; word-break:break-all; user-select:all;">
                  https://europe-west1-mesa-chef-prod.cloudfunctions.net/redsysWebhook
                </div>
              </div>`;

if (html.includes(targetHtml)) {
  const parts = html.split(targetHtml);
  // Replace the entire old "Barra de ayuda" block with newHtmlSnippet
  // Let's locate the closing </div> of Barra de ayuda
  const rest = parts[1];
  const closingIdx = rest.indexOf('</div>\r\n\r\n              <!-- Acciones: Enlace a Eurocaja');
  if (closingIdx !== -1) {
    const afterClosing = rest.substring(closingIdx + 6);
    html = parts[0] + newHtmlSnippet + afterClosing;
    console.log('grandes-eventos.html updated with Webhook URL box.');
  } else {
    // Try with LF
    const closingIdxLF = rest.indexOf('</div>\n\n              <!-- Acciones: Enlace a Eurocaja');
    if (closingIdxLF !== -1) {
      const afterClosing = rest.substring(closingIdxLF + 6);
      html = parts[0] + newHtmlSnippet + afterClosing;
      console.log('grandes-eventos.html (LF) updated with Webhook URL box.');
    } else {
      console.warn('Could not locate closing index in grandes-eventos.html');
    }
  }
}

// Update cache buster in script tag
html = html.replace(/grandes-eventos-bundled\.js\?v=10\.[0-9]+\.[0-9]+/g, 'grandes-eventos-bundled.js?v=10.3.2');
fs.writeFileSync('grandes-eventos.html', html, 'utf8');

// 2. Update js/grandes-eventos-bundled.js to attach btnCopyWebhookUrl listener
let js = fs.readFileSync('js/grandes-eventos-bundled.js', 'utf8');
const copyDescTarget = "            }).catch(() => alert('Descripción: ' + desc));\r\n        });";
const copyDescTargetLF = "            }).catch(() => alert('Descripción: ' + desc));\n        });";

const webhookJsSnippet = `

        // Copy Webhook Notification URL button
        $('btnCopyWebhookUrl')?.addEventListener('click', () => {
            const url = 'https://europe-west1-mesa-chef-prod.cloudfunctions.net/redsysWebhook';
            navigator.clipboard.writeText(url).then(() => {
                const btn = $('btnCopyWebhookUrl');
                if (btn) {
                    const orig = btn.innerHTML;
                    btn.innerHTML = '✅ ¡URL Copiada!';
                    setTimeout(() => { btn.innerHTML = orig; }, 2000);
                }
            }).catch(() => alert('URL Notificación: ' + url));
        });`;

if (js.includes(copyDescTarget)) {
  js = js.replace(copyDescTarget, copyDescTarget + webhookJsSnippet);
  console.log('js/grandes-eventos-bundled.js updated with btnCopyWebhookUrl listener.');
} else if (js.includes(copyDescTargetLF)) {
  js = js.replace(copyDescTargetLF, copyDescTargetLF + webhookJsSnippet);
  console.log('js/grandes-eventos-bundled.js (LF) updated with btnCopyWebhookUrl listener.');
} else {
  console.warn('Could not match copyDescTarget in js/grandes-eventos-bundled.js');
}

fs.writeFileSync('js/grandes-eventos-bundled.js', js, 'utf8');
console.log('Done adding Webhook UI.');
