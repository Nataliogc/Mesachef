// functions/redsys.js
// Utilidades oficiales para decodificar, validar y verificar notificaciones de Redsys / PayGold Eurocaja Rural
const crypto = require('crypto');

/**
 * Decodifica el parámetro Ds_MerchantParameters enviado por Redsys en Base64.
 * Soporta tanto Base64 estándar como URL-safe Base64.
 */
function decodeMerchantParameters(encodedStr) {
  if (!encodedStr || typeof encodedStr !== 'string') {
    throw new Error('Ds_MerchantParameters vacío o no válido.');
  }
  let base64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const decodedJson = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(decodedJson);
}

/**
 * Mapeo de códigos de respuesta Redsys
 */
function parseRedsysResponse(responseStr) {
  const code = parseInt(responseStr, 10);
  if (isNaN(code)) {
    return {
      success: false,
      code: responseStr,
      description: 'Código de respuesta desconocido'
    };
  }

  // 0000 a 0099: Transacción autorizada
  if (code >= 0 && code <= 99) {
    return {
      success: true,
      code: responseStr,
      description: 'Transacción autorizada con éxito (Garantía/Pago completado)'
    };
  }

  const errorMap = {
    101: 'Tarjeta caducada',
    102: 'Tarjeta en excepción transitoria o bajo sospecha de fraude',
    106: 'Intentos de PIN excedidos',
    125: 'Tarjeta no efectiva',
    129: 'Código de seguridad (CVV2/CVC2) incorrecto',
    180: 'Tarjeta ajena al servicio',
    184: 'Error en la autenticación del titular (3D Secure)',
    190: 'Denegación sin especificar motivo',
    191: 'Fecha de caducidad errónea',
    904: 'Comercio no registrado en FUC',
    912: 'Emisor no disponible',
    913: 'Pedido repetido',
    9912: 'Emisor no disponible',
    9913: 'Error en confirmación de pago',
    9914: 'Confirmación fuera de plazo / Enlace caducado',
    9915: 'Pago cancelado por el usuario'
  };

  return {
    success: false,
    code: responseStr,
    description: errorMap[code] || `Operación no autorizada (Código ${responseStr})`
  };
}

/**
 * Mapeo de marca de tarjeta Redsys
 */
function parseCardBrand(brandCode) {
  const brands = {
    '1': 'Visa',
    '2': 'Mastercard',
    '6': 'Diners Club',
    '7': 'Privada',
    '8': 'Euro6000',
    '9': 'Maestro',
    '22': 'JCB'
  };
  return brands[brandCode] || 'Tarjeta';
}

/**
 * Formatea la caducidad Redsys (AAMM -> MM/AA)
 */
function formatExpiryDate(expiryRaw) {
  if (!expiryRaw || expiryRaw.length < 4) return '';
  const yy = expiryRaw.slice(0, 2);
  const mm = expiryRaw.slice(2, 4);
  return `${mm}/${yy}`;
}

/**
 * Verifica la firma HMAC_SHA256_V1 de Redsys si se provee la clave secreta del comercio.
 */
function verifySignature(merchantParameters, receivedSignature, base64SecretKey, order) {
  if (!base64SecretKey) {
    return { verified: false, reason: 'No secret key configured' };
  }
  try {
    const key = Buffer.from(base64SecretKey, 'base64');
    const iv = Buffer.alloc(8, 0); // IV de 8 bytes a cero
    
    // Rellenar orden a múltiplo de 8 bytes con padding de ceros
    const orderBuf = Buffer.from(order || '', 'utf8');
    const padLen = (8 - (orderBuf.length % 8)) % 8;
    const paddedOrder = Buffer.concat([orderBuf, Buffer.alloc(padLen, 0)]);

    const cipher = crypto.createCipheriv('des-ede3-cbc', key, iv);
    cipher.setAutoPadding(false);
    const diversifiedKey = Buffer.concat([cipher.update(paddedOrder), cipher.final()]);

    const hmac = crypto.createHmac('sha256', diversifiedKey);
    hmac.update(merchantParameters);
    const calculatedSignature = hmac.digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const cleanReceived = (receivedSignature || '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const matches = crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(cleanReceived)
    );

    return { verified: matches };
  } catch (err) {
    return { verified: false, error: err.message };
  }
}

module.exports = {
  decodeMerchantParameters,
  parseRedsysResponse,
  parseCardBrand,
  formatExpiryDate,
  verifySignature
};
