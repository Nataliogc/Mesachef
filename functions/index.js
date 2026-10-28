// functions/index.js
// Cloud Function (2nd Gen) para recibir notificaciones online de Eurocaja Rural / Redsys (PayGold)
// Proyecto MesaChef - Sercotel Guadiana

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const {
  decodeMerchantParameters,
  parseRedsysResponse,
  parseCardBrand,
  formatExpiryDate,
  verifySignature
} = require('./redsys');

admin.initializeApp();
const db = admin.firestore();

// Opciones globales: región europea (cercana a Redsys España) y límite de instancias
setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 10
});

// Clave secreta opcional para verificación de firma HMAC SHA-256
const REDSYS_SECRET_KEY = process.env.REDSYS_SECRET_KEY || null;

/**
 * Webhook HTTP para notificaciones online de Redsys / PayGold Eurocaja
 * URL esperada: https://europe-west1-mesa-chef-prod.cloudfunctions.net/redsysWebhook
 */
exports.redsysWebhook = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  // Manejo de peticiones GET para comprobación de salud / estado
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'MesaChef Redsys PayGold Webhook (2nd Gen)',
      timestamp: new Date().toISOString(),
      fucExpected: '168355840',
      terminalExpected: '001'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const body = req.body || {};
    const merchantParamsRaw = body.Ds_MerchantParameters;
    const receivedSignature = body.Ds_Signature;

    if (!merchantParamsRaw) {
      console.warn('[PayGold Webhook] Petición POST recibida sin Ds_MerchantParameters');
      return res.status(400).send('Falta Ds_MerchantParameters');
    }

    // 1. Decodificar parámetros de Redsys
    const params = decodeMerchantParameters(merchantParamsRaw);
    const order = (params.Ds_Order || '').trim();
    const amountCents = parseInt(params.Ds_Amount, 10) || 0;
    const amountEuros = amountCents / 100;
    const responseCode = params.Ds_Response;
    const authCode = params.Ds_AuthorisationCode || '';
    const merchantCode = params.Ds_MerchantCode;
    const terminal = params.Ds_Terminal;
    const cardRaw = params.Ds_Card_Number || '';
    const brandCode = params.Ds_Card_Brand || '';
    const expiryRaw = params.Ds_ExpiryDate || '';

    console.log(`[PayGold Webhook] Notificación recibida para Pedido: ${order}, Importe: ${amountEuros}€, FUC: ${merchantCode}, Resp: ${responseCode}`);

    // 2. Comprobar firma si la clave secreta está configurada
    if (REDSYS_SECRET_KEY) {
      const sigCheck = verifySignature(merchantParamsRaw, receivedSignature, REDSYS_SECRET_KEY, order);
      if (!sigCheck.verified) {
        console.error('[PayGold Webhook] Error en la verificación de firma Redsys:', sigCheck);
        return res.status(403).send('Firma no válida');
      }
    }

    // 3. Evaluar respuesta del banco (0000 - 0099 = Aprobado)
    const result = parseRedsysResponse(responseCode);

    // 4. Buscar la reserva / participante en Firestore (participantes_eventos)
    const participantesRef = db.collection('participantes_eventos');
    let matchedDoc = null;

    // Estrategia de búsqueda flexible: coincidencia exacta, sufijos de versión (-2, -3), con prefijo GE- o sin prefijo
    const baseOrder = order.replace(/-\d+$/, '');
    const candidates = [
      order,
      order.startsWith('GE-') ? order.replace('GE-', '') : `GE-${order}`,
      baseOrder,
      baseOrder.startsWith('GE-') ? baseOrder.replace('GE-', '') : `GE-${baseOrder}`,
      order.replace(/\D/g, '') // Solo dígitos si aplica
    ].filter(Boolean);

    for (const refCandidate of candidates) {
      const snap = await participantesRef.where('paygoldRef', '==', refCandidate).limit(1).get();
      if (!snap.empty) {
        matchedDoc = snap.docs[0];
        break;
      }
    }

    // Si aún no se encuentra, buscar por el campo 'referencia' o por ID de documento
    if (!matchedDoc) {
      for (const refCandidate of candidates) {
        const snap = await participantesRef.where('referencia', '==', refCandidate).limit(1).get();
        if (!snap.empty) {
          matchedDoc = snap.docs[0];
          break;
        }
      }
    }

    // 5. Registrar siempre en la colección de auditoría
    await db.collection('auditoria_paygold').add({
      order,
      amount: amountEuros,
      responseCode,
      success: result.success,
      description: result.description,
      authCode,
      merchantCode,
      terminal,
      participantId: matchedDoc ? matchedDoc.id : null,
      eventoId: matchedDoc ? (matchedDoc.data().eventoId || null) : null,
      titular: matchedDoc ? (matchedDoc.data().titular || null) : null,
      rawParams: params,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 6. Actualizar el participante si fue encontrado
    if (matchedDoc) {
      const pData = matchedDoc.data();
      const cardLast4 = cardRaw ? cardRaw.slice(-4) : (pData.cardLast4 || '');
      const cardBrand = parseCardBrand(brandCode) || (pData.cardBrand || 'Visa');
      const cardExpiry = formatExpiryDate(expiryRaw) || (pData.cardExpiry || '');

      if (result.success) {
        // Pago o garantía aprobada
        const currentPagos = Array.isArray(pData.pagos) ? [...pData.pagos] : [];
        const alreadyRecorded = currentPagos.some(p => p.authCode === authCode && p.order === order);

        if (!alreadyRecorded) {
          const todayIso = new Date().toISOString().split('T')[0];
          currentPagos.push({
            date: todayIso,
            amount: amountEuros,
            method: 'PayGold Eurocaja',
            authCode: authCode,
            order: order,
            notes: `Pago automático Redsys (${result.description})`
          });
        }

        await matchedDoc.ref.update({
          paygoldStatus: 'garantizado',
          pagos: currentPagos,
          cardLast4: cardLast4,
          cardBrand: cardBrand,
          cardExpiry: cardExpiry,
          paygoldConfirmedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastPaygoldResult: {
            code: responseCode,
            authCode: authCode,
            amount: amountEuros,
            order: order,
            updatedAt: new Date().toISOString()
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[PayGold Webhook] Participante ${matchedDoc.id} (${pData.titular}) actualizado con éxito a GARANTIZADO`);
      } else {
        // Pago denegado o cancelado por el cliente
        await matchedDoc.ref.update({
          paygoldStatus: 'denegado',
          paygoldLastError: {
            code: responseCode,
            description: result.description,
            order: order,
            attemptedAt: new Date().toISOString()
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.warn(`[PayGold Webhook] Participante ${matchedDoc.id} marcado como DENEGADO: ${result.description}`);
      }
    } else {
      console.warn(`[PayGold Webhook] No se encontró participante en Firestore para el pedido: ${order}`);
    }

    // Redsys requiere respuesta HTTP 200 con "OK"
    return res.status(200).send('OK');
  } catch (error) {
    console.error('[PayGold Webhook] Error interno procesando notificación Redsys:', error);
    return res.status(200).send('OK');
  }
});
