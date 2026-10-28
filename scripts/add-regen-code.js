// scripts/add-regen-code.js
const fs = require('fs');

// 1. grandes-eventos.html
let html = fs.readFileSync('grandes-eventos.html', 'utf8');
const oldLabel = '<button type="button" id="btnCopyPaygoldRef" style="background:none; border:none; color:#2563eb; cursor:pointer; font-size:11px; padding:0; text-decoration:underline; font-weight:700;">📋 Copiar</button>';
const newLabel = '<div style="display:flex; gap:6px;"><button type="button" id="btnRegenPaygoldRef" title="Generar nuevo código para enviar otro enlace si cambian comensales o importes" style="background:none; border:none; color:#059669; cursor:pointer; font-size:11px; padding:0; text-decoration:underline; font-weight:700;">🔄 Nuevo Cód.</button><button type="button" id="btnCopyPaygoldRef" style="background:none; border:none; color:#2563eb; cursor:pointer; font-size:11px; padding:0; text-decoration:underline; font-weight:700;">📋 Copiar</button></div>';

if (html.includes(oldLabel)) {
  html = html.replace(oldLabel, newLabel);
  console.log('grandes-eventos.html updated with btnRegenPaygoldRef.');
} else {
  console.warn('Could not match oldLabel in grandes-eventos.html');
}

// Update cache buster to 10.3.2
html = html.replace(/grandes-eventos-bundled\.js\?v=10\.[0-9]+\.[0-9]+/g, 'grandes-eventos-bundled.js?v=10.3.2');
fs.writeFileSync('grandes-eventos.html', html, 'utf8');

// 2. js/grandes-eventos-bundled.js
let js = fs.readFileSync('js/grandes-eventos-bundled.js', 'utf8');
const regenJs = `
        // Regenerate PayGold Ref for new link / modification of guests
        $('btnRegenPaygoldRef')?.addEventListener('click', () => {
            const curRef = ($('pPaygoldRef')?.value || '').trim();
            let newRef = '';
            const match = curRef.match(/^(GE-\\d+)(?:-(\\d+))?$/);
            if (match) {
                const base = match[1];
                const ver = parseInt(match[2] || '1', 10) + 1;
                newRef = base + '-' + ver;
            } else {
                newRef = 'GE-' + Math.floor(100000 + Math.random() * 900000);
            }
            if ($('pPaygoldRef')) $('pPaygoldRef').value = newRef;
            if ($('pPaygoldLink')) $('pPaygoldLink').value = '';
            if ($('pPaygoldStatus')) {
                $('pPaygoldStatus').value = 'pendiente';
                updatePaygoldStatusStyle();
            }
            const btn = $('btnRegenPaygoldRef');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = '✅ ¡Generado!';
                setTimeout(() => { btn.textContent = orig; }, 2000);
            }
        });
`;

const copyRefTarget = "$('btnCopyPaygoldRef')?.addEventListener('click', () => {";
if (js.includes(copyRefTarget)) {
  js = js.replace(copyRefTarget, regenJs + '\n        ' + copyRefTarget);
  console.log('js/grandes-eventos-bundled.js updated with btnRegenPaygoldRef listener.');
} else {
  console.warn('Could not match copyRefTarget in js/grandes-eventos-bundled.js');
}
fs.writeFileSync('js/grandes-eventos-bundled.js', js, 'utf8');
console.log('Done!');
