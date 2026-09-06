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
