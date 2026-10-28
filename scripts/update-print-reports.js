// scripts/update-print-reports.js
const fs = require('fs');

let js = fs.readFileSync('js/grandes-eventos-bundled.js', 'utf8');

// Replace generateParticipantsPdf
const oldParticipantsPdfRegex = /function generateParticipantsPdf\(\) \{[\s\S]*?return `\s*\$\{getPrintHeader\("Listado de Participantes"\)\}[\s\S]*?<\/table>\s*`;\s*\}/;

const newParticipantsPdfCode = `function generateParticipantsPdf() {
        const parts = [...state.participants].filter(p => !p.estado?.startsWith('anulado')).sort((a, b) => {
            if (a.mesa && b.mesa) {
                const nA = parseInt(a.mesa), nB = parseInt(b.mesa);
                if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
                return a.mesa.localeCompare(b.mesa);
            }
            if (a.mesa) return -1;
            if (b.mesa) return 1;
            return (a.secuencia || 0) - (b.secuencia || 0);
        });

        let totalAd = 0;
        let totalNi = 0;
        let totalConfirmed = 0;
        let totalPendingCount = 0;

        const rows = parts.map(p => {
            const ad = parseInt(p.adultos) || 0;
            const ni = parseInt(p.ninos) || 0;
            const totalPax = ad + ni;
            totalAd += ad;
            totalNi += ni;

            const paid = (p.pagos || []).reduce((a, c) => a + (parseFloat(c.amount) || 0), 0) + (parseFloat(p.pagado) || 0);
            const cost = (ad * (parseFloat(state.currentEvent?.precioAdulto) || 0) + ni * (parseFloat(state.currentEvent?.precioNino) || 0));
            const isConfirmed = (cost > 0 && paid >= cost) || (p.paygoldStatus === 'garantizado');

            if (isConfirmed) totalConfirmed++;
            else totalPendingCount++;

            const statusBadge = isConfirmed
                ? '<span style="color:#15803d; font-weight:700;">✅ Confirmado</span>'
                : '<span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>';

            return \`<tr>
                <td style="font-weight:bold; font-size:12px;">\${p.mesa ? 'Mesa ' + p.mesa : '<span style="color:#94a3b8;">Sin mesa</span>'}</td>
                <td>
                    <span class="font-bold">\${p.titular}</span>
                    \${p.referencia ? \`<br><span style="font-size:10px; color:#64748b;">Ref: \${p.referencia}</span>\` : ''}
                </td>
                <td>\${formatPhoneES(p.telefono) || '-'}</td>
                <td class="text-center font-semibold">\${ad}</td>
                <td class="text-center font-semibold">\${ni}</td>
                <td class="text-center font-bold" style="font-size:13px; color:#0f172a;">\${totalPax}</td>
                <td class="text-center">\${statusBadge}</td>
                <td style="font-size:10px; color:#475569;">\${p.observaciones || '-'}</td>
            </tr>\`;
        }).join('');

        return \`
            \${getPrintHeader("Listado de Participantes y Asistencia")}
            
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; margin-bottom:14px; font-size:12px;">
                <span><strong>Total Reservas:</strong> \${parts.length}</span>
                <span><strong>Total Comensales:</strong> \${totalAd + totalNi} (\${totalAd} Adultos / \${totalNi} Niños)</span>
                <span><strong>Confirmados:</strong> <strong style="color:#15803d;">\${totalConfirmed}</strong></span>
                <span><strong>Pendientes:</strong> <strong style="color:#d97706;">\${totalPendingCount}</strong></span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th width="12%">Mesa</th>
                        <th width="26%">Titular</th>
                        <th width="14%">Teléfono</th>
                        <th class="text-center" width="6%">Ad</th>
                        <th class="text-center" width="6%">Ni</th>
                        <th class="text-center" width="7%">Total</th>
                        <th class="text-center" width="13%">Estado</th>
                        <th width="16%">Observaciones</th>
                    </tr>
                </thead>
                <tbody>\${rows}</tbody>
                <tfoot>
                    <tr style="background:#f1f5f9; font-weight:bold;">
                        <td colspan="3" style="text-align:right;">TOTALES:</td>
                        <td class="text-center">\${totalAd}</td>
                        <td class="text-center">\${totalNi}</td>
                        <td class="text-center">\${totalAd + totalNi}</td>
                        <td class="text-center" colspan="2">\${totalConfirmed} Confirmados / \${totalPendingCount} Pendientes</td>
                    </tr>
                </tfoot>
            </table>
        \`;
    }`;

if (oldParticipantsPdfRegex.test(js)) {
  js = js.replace(oldParticipantsPdfRegex, newParticipantsPdfCode);
  console.log('generateParticipantsPdf updated successfully.');
} else {
  console.warn('Could not match oldParticipantsPdfRegex');
}

// Replace generateTablesPdf
const oldTablesPdfRegex = /function generateTablesPdf\(\) \{[\s\S]*?return content;\s*\}/;

const newTablesPdfCode = `function generateTablesPdf() {
        const tables = {};
        state.participants.filter(p => !p.estado?.startsWith('anulado')).forEach(p => {
            const m = p.mesa || "Sin Asignar";
            if (!tables[m]) tables[m] = [];
            tables[m].push(p);
        });

        const keys = Object.keys(tables).sort((a, b) => {
            if (a === "Sin Asignar") return 1;
            if (b === "Sin Asignar") return -1;
            const nA = parseInt(a), nB = parseInt(b);
            if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
            return a.localeCompare(b);
        });

        let totalAssignedPax = 0;
        let content = getPrintHeader("Distribución de Mesas y Sala");
        content += \`<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">\`;

        keys.forEach(k => {
            const group = tables[k];
            const totalAd = group.reduce((a, c) => a + (parseInt(c.adultos) || 0), 0);
            const totalCh = group.reduce((a, c) => a + (parseInt(c.ninos) || 0), 0);
            const tablePax = totalAd + totalCh;
            totalAssignedPax += tablePax;

            let tableContent = \`
                <div class="summary-box">
                    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:5px; margin-bottom:10px;">
                        <span class="font-bold" style="font-size:16px; color:#0f172a;">\${k === 'Sin Asignar' ? '⚠️ Sin Asignar' : 'Mesa ' + k}</span>
                        <span style="font-size:12px; color:#64748b; font-weight:bold;">\${tablePax} Pax (\${totalAd} Ad / \${totalCh} Ni)</span>
                    </div>
                    <table style="margin-top:0;">
                        <tbody>
                            \${group.map(p => \`
                                <tr>
                                    <td style="padding:4px 0; border:none;">
                                        <strong>\${p.titular}</strong>
                                        \${p.observaciones ? \`<br><span style="font-size:10px; color:#b45309; font-style:italic;">⚠️ \${p.observaciones}</span>\` : ''}
                                    </td>
                                    <td style="padding:4px 0; border:none; text-align:right; font-weight:bold;">
                                        \${(parseInt(p.adultos) || 0) + (parseInt(p.ninos) || 0)} Pax
                                    </td>
                                </tr>
                            \`).join('')}
                        </tbody>
                    </table>
                </div>
             \`;
            content += tableContent;
        });

        content += \`</div>\`;
        return content;
    }`;

if (oldTablesPdfRegex.test(js)) {
  js = js.replace(oldTablesPdfRegex, newTablesPdfCode);
  console.log('generateTablesPdf updated successfully.');
} else {
  console.warn('Could not match oldTablesPdfRegex');
}

// Replace generateFinancialPdf
const oldFinancialPdfRegex = /function generateFinancialPdf\(\) \{[\s\S]*?return `[\s\S]*?<\/table>\s*`;\s*\}/;

const newFinancialPdfCode = `function generateFinancialPdf() {
        const stats = calculateStats(state.participants, 0);
        let sumCost = 0;
        let sumPaid = 0;
        let sumPending = 0;

        const rows = state.participants.filter(p => !p.estado?.startsWith('anulado')).map(p => {
            const ad = parseInt(p.adultos) || 0;
            const ni = parseInt(p.ninos) || 0;
            const pax = ad + ni;
            const paid = (p.pagos || []).reduce((a, c) => a + (parseFloat(c.amount) || 0), 0) + (parseFloat(p.pagado) || 0);
            const cost = (ad * parseFloat($('inputPriceAdult')?.value || state.currentEvent?.precioAdulto || 0) + 
                          ni * parseFloat($('inputPriceChild')?.value || state.currentEvent?.precioNino || 0));
            const pending = Math.max(0, cost - paid);

            sumCost += cost;
            sumPaid += paid;
            sumPending += pending;

            const estadoLabel = pending <= 0 || p.paygoldStatus === 'garantizado' 
                ? '<span style="color:#15803d; font-weight:700;">✅ Pagado</span>' 
                : (paid > 0 ? \`<span style="color:#0284c7; font-weight:700;">💳 Parcial (\${formatCurrency(paid)})</span>\` : '<span style="color:#d97706; font-weight:700;">⏳ Pendiente</span>');

            return \`<tr>
                <td>\${p.referencia || p.paygoldRef || '-'}</td>
                <td><span class="font-bold">\${p.titular}</span></td>
                <td class="text-center">\${pax} (\${ad}Ad/\${ni}Ni)</td>
                <td class="text-right font-bold">\${formatCurrency(cost)}</td>
                <td class="text-right text-green-700">\${formatCurrency(paid)}</td>
                <td class="text-right \${pending > 0 ? 'text-red-600' : ''}">\${pending > 0 ? formatCurrency(pending) : '-'}</td>
                <td class="text-center">\${estadoLabel}</td>
            </tr>\`;
        }).join('');

        return \`
            \${getPrintHeader("Informe Económico y Financiero")}
            
            <div class="summary-box" style="margin-bottom:24px;">
                <h3 style="margin-top:0;">Resumen Global de Recaudación</h3>
                <table style="width: auto; min-width: 60%;">
                    <tr><td style="border:none; padding:4px 0;">Total Comensales:</td><td style="border:none; padding:4px 0; font-weight:bold;">\${stats.totalPax} (\${stats.totalAdults} Adultos / \${stats.totalKids} Niños)</td></tr>
                    <tr><td style="border:none; padding:4px 0;">Total Facturación Prevista:</td><td style="border:none; padding:4px 0; font-weight:bold; font-size:14px;">\${formatCurrency(sumCost)}</td></tr>
                    <tr><td style="border:none; padding:4px 0;">Total Cobrado / Recaudado:</td><td style="border:none; padding:4px 0; font-weight:bold; color:#15803d; font-size:14px;">\${formatCurrency(sumPaid)}</td></tr>
                    <tr><td style="border:none; padding:4px 0;">Total Pendiente de Cobro:</td><td style="border:none; padding:4px 0; font-weight:bold; color:#b91c1c; font-size:14px;">\${formatCurrency(sumPending)}</td></tr>
                    \${stats.totalCancelledAmount > 0 ? \`<tr><td style="border:none; padding:4px 0;">Cancelado/Devuelto:</td><td style="border:none; padding:4px 0; font-weight:bold; color:#64748b;">\${formatCurrency(stats.totalCancelledAmount)}</td></tr>\` : ''}
                </table>
            </div>

            <h3>Desglose Detallado por Reserva</h3>
            <table>
                <thead>
                    <tr>
                        <th width="14%">Ref / Pedido</th>
                        <th>Titular</th>
                        <th class="text-center" width="12%">Pax</th>
                        <th class="text-right" width="13%">Total</th>
                        <th class="text-right" width="13%">Pagado</th>
                        <th class="text-right" width="13%">Pendiente</th>
                        <th class="text-center" width="14%">Estado Cobro</th>
                    </tr>
                </thead>
                <tbody>\${rows}</tbody>
                <tfoot>
                    <tr style="background:#f1f5f9; font-weight:bold;">
                        <td colspan="3" style="text-align:right;">TOTALES GENERALES:</td>
                        <td class="text-right">\${formatCurrency(sumCost)}</td>
                        <td class="text-right text-green-700">\${formatCurrency(sumPaid)}</td>
                        <td class="text-right text-red-600">\${formatCurrency(sumPending)}</td>
                        <td class="text-center">\${sumPending === 0 ? '100% Cobrado' : ''}</td>
                    </tr>
                </tfoot>
            </table>
        \`;
    }`;

if (oldFinancialPdfRegex.test(js)) {
  js = js.replace(oldFinancialPdfRegex, newFinancialPdfCode);
  console.log('generateFinancialPdf updated successfully.');
} else {
  console.warn('Could not match oldFinancialPdfRegex');
}

fs.writeFileSync('js/grandes-eventos-bundled.js', js, 'utf8');
console.log('Done updating print reports in js/grandes-eventos-bundled.js');
