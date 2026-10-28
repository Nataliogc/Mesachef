// scripts/fix-servicio-incluido-print.js
const fs = require('fs');

let js = fs.readFileSync('js/grandes-eventos-bundled.js', 'utf8');

// 1. Update generateParticipantsPdf
const targetParticipantsBlock = `            const paid = (p.pagos || []).reduce((a, c) => a + (parseFloat(c.amount) || 0), 0) + (parseFloat(p.pagado) || 0);
            const cost = (ad * (parseFloat(state.currentEvent?.precioAdulto) || 0) + ni * (parseFloat(state.currentEvent?.precioNino) || 0));
            const isConfirmed = (cost > 0 && paid >= cost) || (p.paygoldStatus === 'garantizado');

            if (isConfirmed) totalConfirmed++;
            else totalPendingCount++;

            const statusBadge = isConfirmed
                ? '<span style="color:#15803d; font-weight:700;">✅ Confirmado</span>'
                : '<span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>';`;

const replacementParticipantsBlock = `            const isIncluded = Boolean(p.servicioIncluido);
            const rawPaid = (p.pagos || []).reduce((a, c) => a + (parseFloat(c.amount) || 0), 0) + (parseFloat(p.pagado) || 0);
            const cost = (ad * (parseFloat(state.currentEvent?.precioAdulto) || 0) + ni * (parseFloat(state.currentEvent?.precioNino) || 0));
            const paid = isIncluded ? cost : rawPaid;
            const isConfirmed = isIncluded || (cost > 0 && paid >= cost) || (p.paygoldStatus === 'garantizado');

            if (isConfirmed) totalConfirmed++;
            else totalPendingCount++;

            const statusBadge = isIncluded
                ? '<span style="color:#15803d; font-weight:700;">✅ Confirmado (Incluido)</span>'
                : (isConfirmed
                    ? '<span style="color:#15803d; font-weight:700;">✅ Confirmado</span>'
                    : '<span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>');`;

if (js.includes(targetParticipantsBlock)) {
  js = js.replace(targetParticipantsBlock, replacementParticipantsBlock);
  console.log('generateParticipantsPdf updated for servicioIncluido.');
} else {
  console.warn('Could not match targetParticipantsBlock');
}

// 2. Update generateFinancialPdf
const targetFinancialBlock = `            const paid = (p.pagos || []).reduce((a, c) => a + (parseFloat(c.amount) || 0), 0) + (parseFloat(p.pagado) || 0);
            const cost = (ad * parseFloat($('inputPriceAdult')?.value || state.currentEvent?.precioAdulto || 0) + 
                          ni * parseFloat($('inputPriceChild')?.value || state.currentEvent?.precioNino || 0));
            const pending = Math.max(0, cost - paid);

            sumCost += cost;
            sumPaid += paid;
            sumPending += pending;

            const estadoLabel = pending <= 0 || p.paygoldStatus === 'garantizado' 
                ? '<span style="color:#15803d; font-weight:700;">✅ Pagado</span>' 
                : (paid > 0 ? \`<span style="color:#0284c7; font-weight:700;">💳 Parcial (\${formatCurrency(paid)})</span>\` : '<span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>');`;

const replacementFinancialBlock = `            const isIncluded = Boolean(p.servicioIncluido);
            const rawPaid = (p.pagos || []).reduce((a, c) => a + (parseFloat(c.amount) || 0), 0) + (parseFloat(p.pagado) || 0);
            const cost = (ad * parseFloat($('inputPriceAdult')?.value || state.currentEvent?.precioAdulto || 0) + 
                          ni * parseFloat($('inputPriceChild')?.value || state.currentEvent?.precioNino || 0));
            const paid = isIncluded ? cost : rawPaid;
            const pending = isIncluded ? 0 : Math.max(0, cost - paid);

            sumCost += cost;
            sumPaid += paid;
            sumPending += pending;

            const estadoLabel = isIncluded
                ? '<span style="color:#0284c7; font-weight:700;">✨ Incluido</span>'
                : (pending <= 0 || p.paygoldStatus === 'garantizado' 
                    ? '<span style="color:#15803d; font-weight:700;">✅ Pagado</span>' 
                    : (paid > 0 ? \`<span style="color:#0284c7; font-weight:700;">💳 Parcial (\${formatCurrency(paid)})</span>\` : '<span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>'));`;

if (js.includes(targetFinancialBlock)) {
  js = js.replace(targetFinancialBlock, replacementFinancialBlock);
  console.log('generateFinancialPdf updated for servicioIncluido.');
} else {
  console.warn('Could not match targetFinancialBlock');
}

fs.writeFileSync('js/grandes-eventos-bundled.js', js, 'utf8');
console.log('Done!');
