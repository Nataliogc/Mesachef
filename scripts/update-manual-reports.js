// scripts/update-manual-reports.js
const fs = require('fs');

// 1. Update manual-recepcion-paygold.html
let html = fs.readFileSync('manual-recepcion-paygold.html', 'utf8');
html = html.replace(/Manual v10\.[0-9]+\.[0-9]+/g, 'Manual v10.3.4');
html = html.replace(/Versión 10\.[0-9]+\.[0-9]+/g, 'Versión 10.3.4');

const targetLi = '<li><strong>🔓 Guardado Flexible de Reserva:</strong>';
const newLi = `<li><strong>📊 Diferenciación de Informes de Impresión:</strong> El <em>Listado de Participantes</em> para puerta/maitre ya no muestra importes ni dinero en euros; muestra únicamente el estado operativo (<span style="color:#15803d; font-weight:bold;">✅ Confirmado</span> / <span style="color:#d97706; font-weight:bold;">⏳ Pendiente</span>), comensales, mesa y observaciones. Los importes y pagos quedan reservados en exclusiva para el <em>Resumen Financiero</em>.</li>\n        ` + targetLi;

if (html.includes(targetLi) && !html.includes('Diferenciación de Informes')) {
  html = html.replace(targetLi, newLi);
  console.log('manual-recepcion-paygold.html updated with print report differentiation.');
}
fs.writeFileSync('manual-recepcion-paygold.html', html, 'utf8');

// 2. Update MANUAL_RECEPCION_PAYGOLD_GUADIANA.md
let md = fs.readFileSync('MANUAL_RECEPCION_PAYGOLD_GUADIANA.md', 'utf8');
md = md.replace(/v10\.[0-9]+\.[0-9]+/g, 'v10.3.4');

const targetMdLi = '* **🔓 Guardado Flexible de Reserva:**';
const newMdLi = `* **📊 Diferenciación de Informes de Impresión:** El *Listado de Participantes* para recepción/maitre no muestra importes ni dinero; refleja el estado operativo (\`✅ Confirmado\` / \`⏳ Pendiente\`), total de comensales, mesa y observaciones. Los importes económicos quedan reservados para el *Resumen Financiero*.\n` + targetMdLi;

if (md.includes(targetMdLi) && !md.includes('Diferenciación de Informes')) {
  md = md.replace(targetMdLi, newMdLi);
  console.log('MANUAL_RECEPCION_PAYGOLD_GUADIANA.md updated.');
}
fs.writeFileSync('MANUAL_RECEPCION_PAYGOLD_GUADIANA.md', md, 'utf8');

// Sync to brain artifact
const artifactPath = "C:\\Users\\comun\\.gemini\\antigravity\\brain\\3b38be9e-0060-443c-9319-5cc598ddb7d2\\MANUAL_RECEPCION_PAYGOLD_GUADIANA.md";
fs.writeFileSync(artifactPath, md, 'utf8');
console.log('Artifact synced.');
