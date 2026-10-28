// scripts/add-novelties-block.js
const fs = require('fs');

let html = fs.readFileSync('manual-recepcion-paygold.html', 'utf8');

// 1. Update Header with version pill
const oldHeaderBadges = '<span class="badge-hotel">Sercotel Guadiana • Recepción</span>';
const newHeaderBadges = `<div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="badge-hotel">Sercotel Guadiana • Recepción</span>
          <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-weight: 800; padding: 3px 10px; border-radius: 9999px;">Manual v10.3.3 • 28/10/2026</span>
        </div>`;

if (html.includes(oldHeaderBadges)) {
  html = html.replace(oldHeaderBadges, newHeaderBadges);
  console.log('Header badge updated with version pill.');
}

// 2. Insert Novedades Recientes block right before TABLA DE DATOS CLAVE
const oldKeyTableComment = '    <!-- TABLA DE DATOS CLAVE -->';
const noveltiesSnippet = `    <!-- BLOQUE DE NOVEDADES RECIENTES -->
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 6px;">
          <span>✨</span> Novedades Recientes de esta Versión (Manual v10.3.3)
        </div>
        <span style="font-size: 10px; background: #0284c7; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700;">ÚLTIMA ACTUALIZACIÓN</span>
      </div>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #334155; line-height: 1.6;">
        <li><strong>⚡ Notificación Automática Online (Webhook):</strong> Integración con Eurocaja Redsys para que la reserva pase a <span style="color: #16a34a; font-weight: 700;">🟢 Garantizado</span> en tiempo real al cobrar, sin que Recepción tenga que esperar el email de Isabel.</li>
        <li><strong>📍 Captura Oficial del TPV (Paso 5):</strong> Se añade en el manual la imagen exacta de la pantalla de Eurocaja donde se activa la casilla <em>"Notificar resultado a la siguiente URL"</em> y se introduce la URL de MesaChef.</li>
        <li><strong>🔄 Botón "Nuevo Cód." para Modificaciones:</strong> Si el cliente amplía comensales o cambia importes, este botón genera un sufijo correlativo (<code style="background: #e2e8f0; padding: 1px 4px; border-radius: 3px;">GE-XXXXXX-2</code>) para evitar el <em>Error 913 (Pedido repetido)</em> en Redsys.</li>
        <li><strong>💰 Copia Inteligente del Importe Pendiente:</strong> El botón <em>"💰 Copiar Importe"</em> detecta si el cliente ya abonó parte de la reserva y copia automáticamente solo la diferencia que falta por cobrar.</li>
        <li><strong>📋 Copia Directa de URL en el Modal:</strong> Se incorpora el botón <em>"📋 Copiar URL Webhook"</em> en la ficha del participante para copiar la dirección sin tener que buscarla.</li>
        <li><strong>🔓 Guardado Flexible de Reserva:</strong> Se permite guardar la reserva en cualquier momento sin obligar a tener el enlace PayGold de inmediato. El enlace solo se exige al pulsar <em>"📱 WhatsApp PayGold"</em>.</li>
      </ul>
    </div>

    <!-- TABLA DE DATOS CLAVE -->`;

if (html.includes(oldKeyTableComment)) {
  html = html.replace(oldKeyTableComment, noveltiesSnippet);
  console.log('Novelties block inserted successfully.');
}

fs.writeFileSync('manual-recepcion-paygold.html', html, 'utf8');
console.log('Done!');
