/**
 * Tarifas oficiales de PayPal para Venezuela.
 * Fuente: https://vendercomprardolares.com/herramientas/calculadora-comisiones-paypal.php
 * Porcentaje: 5.4% | Comisión fija: $0.30 USD
 */
export const PAYPAL_FEES = {
  receive: {
    key: 'receive',
    label: 'Recibir pago',
    description: '5.4% + $0.30',
    percentage: 5.4,
    fixedFee: 0.30,
  },
  send_payment: {
    key: 'send_payment',
    label: 'Enviar pago',
    description: '5.4% + $0.30',
    percentage: 5.4,
    fixedFee: 0.30,
  },
};

/**
 * @typedef {{ net: number, fee: number, gross?: number, breakdown?: string }} FeeResult
 */

/**
 * Calcula el monto neto que recibe el usuario después de comisiones.
 * Fórmula: net = gross * (1 - percentage/100) - fixedFee
 * @param {number} amount - Monto bruto en USD
 * @param {string} feeType - Tipo de transacción
 * @returns {FeeResult}
 */
export function calculateNet(amount, feeType) {
  const fee = PAYPAL_FEES[feeType];
  if (!fee || amount <= 0) return { net: 0, fee: 0, breakdown: '' };

  const feeAmount = (amount * fee.percentage / 100) + fee.fixedFee;
  const net = Math.max(0, amount - feeAmount);

  return {
    net: Math.round(net * 100) / 100,
    fee: Math.round(feeAmount * 100) / 100,
    breakdown: fee.description,
  };
}

/** Redondeo a 2 decimales (mismo criterio que calculateNet/calculateGross). */
function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula la compra en Bs: cuánto hay que transferir por PayPal (USD) para
 * cubrir un pago de `montoBs` a la tasa `tasaCambio`, más una recomendación
 * de entero superior con su vuelto.
 *
 * Cadena (comisión PayPal 5.4% + $0.30, derivada de PAYPAL_FEES.receive):
 *   netoUsd                 = montoBs / tasaCambio
 *   pagoExactoUsd           = round2((netoUsd + $0.30) / (1 - 5.4%))
 *   pagoRecomendadoUsd      = Math.ceil(pagoExactoUsd)
 *   comisionRecomendado     = pagoRecomendadoUsd * 5.4% + $0.30
 *   netoRecibidoRecomendado = pagoRecomendadoUsd - comisionRecomendado
 *   equivalenteBs           = netoRecibidoRecomendado * tasaCambio
 *   vueltoBs                = round2(equivalenteBs - montoBs)
 *
 * Nota: si el redondeo de `pagoExactoUsd` cae justo debajo de un entero,
 * el ceil puede dejar un vuelto levemente negativo (centavos).
 *
 * @param {number} montoBs - Monto a pagar en bolívares (debe ser > 0)
 * @param {number} tasaCambio - Tasa Bs/USD (debe ser > 0)
 * @returns {{ netoUsd: number, pagoExactoUsd: number, pagoRecomendadoUsd: number, comisionRecomendado: number, netoRecibidoRecomendado: number, equivalenteBs: number, vueltoBs: number } | null}
 *          `null` si los inputs no son válidos (<= 0 o no finitos).
 */
export function calculateBsPurchase(montoBs, tasaCambio) {
  if (!Number.isFinite(montoBs) || !Number.isFinite(tasaCambio)) return null;
  if (montoBs <= 0 || tasaCambio <= 0) return null;

  const { percentage, fixedFee } = PAYPAL_FEES.receive;
  const feeRate = percentage / 100;

  const netoUsd = montoBs / tasaCambio;
  const pagoExactoUsd = round2((netoUsd + fixedFee) / (1 - feeRate));
  const pagoRecomendadoUsd = Math.ceil(pagoExactoUsd);
  const comisionRecomendado = pagoRecomendadoUsd * feeRate + fixedFee;
  const netoRecibidoRecomendado = pagoRecomendadoUsd - comisionRecomendado;
  const equivalenteBs = netoRecibidoRecomendado * tasaCambio;
  const vueltoBs = round2(equivalenteBs - montoBs);

  return {
    netoUsd: round2(netoUsd),
    pagoExactoUsd,
    pagoRecomendadoUsd,
    comisionRecomendado: round2(comisionRecomendado),
    netoRecibidoRecomendado: round2(netoRecibidoRecomendado),
    equivalenteBs: round2(equivalenteBs),
    vueltoBs,
  };
}

/**
 * Calcula el monto bruto que debe enviar para que el destinatario reciba el monto neto.
 * Fórmula: gross = (net + fixedFee) / (1 - percentage/100)
 * @param {number} netAmount - Monto neto deseado en USD
 * @param {string} feeType - Tipo de transacción
 * @returns {FeeResult}
 */
export function calculateGross(netAmount, feeType) {
  const fee = PAYPAL_FEES[feeType];
  if (!fee || netAmount <= 0) return { net: 0, gross: 0, fee: 0, breakdown: '' };

  const gross = (netAmount + fee.fixedFee) / (1 - fee.percentage / 100);
  const feeAmount = gross - netAmount;

  return {
    net: netAmount,
    gross: Math.round(gross * 100) / 100,
    fee: Math.round(feeAmount * 100) / 100,
    breakdown: fee.description,
  };
}
