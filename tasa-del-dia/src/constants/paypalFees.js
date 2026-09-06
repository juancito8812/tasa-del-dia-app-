/**
 * Tarifas oficiales de PayPal para Venezuela.
 * Fuente: https://www.paypal.com/ve/digital-wallet/paypal-consumer-fees
 * Última actualización: 28 mayo 2026
 */
export const PAYPAL_FEES = {
  send_friends: {
    key: 'send_friends',
    label: 'Enviar a amigos',
    description: 'USD 4.99 + 3.4% + $0.30',
    fixed: 4.99,
    percentage: 3.4,
    fixedFee: 0.30,
  },
  receive: {
    key: 'receive',
    label: 'Recibir pago',
    description: '3.50% (conversión)',
    percentage: 3.5,
  },
  send_payment: {
    key: 'send_payment',
    label: 'Enviar pago',
    description: '4.50% (conversión)',
    percentage: 4.5,
  },
  sell: {
    key: 'sell',
    label: 'Vender (Goods & Services)',
    description: '4.4% + $0.30',
    percentage: 4.4,
    fixedFee: 0.30,
  },
};

/**
 * @typedef {{ net: number, fee: number, gross?: number, breakdown?: string }} FeeResult
 */

/**
 * Calcula el monto neto que recibe el usuario después de comisiones.
 * @param {number} amount - Monto en USD
 * @param {string} feeType - Tipo de transacción
 * @returns {FeeResult}
 */
export function calculateNet(amount, feeType) {
  const fee = PAYPAL_FEES[feeType];
  if (!fee || amount <= 0) return { net: 0, fee: 0, breakdown: '' };

  let feeAmount = 0;

  if (feeType === 'send_friends') {
    // USD 4.99 + 3.4% + $0.30
    feeAmount = fee.fixed + (amount * fee.percentage / 100) + fee.fixedFee;
  } else if (feeType === 'sell') {
    // 4.4% + $0.30
    feeAmount = (amount * fee.percentage / 100) + fee.fixedFee;
  } else if (feeType === 'receive' || feeType === 'send_payment') {
    // Solo porcentaje
    feeAmount = amount * fee.percentage / 100;
  }

  const net = Math.max(0, amount - feeAmount);

  return {
    net: Math.round(net * 100) / 100,
    fee: Math.round(feeAmount * 100) / 100,
    breakdown: fee.description,
  };
}

/**
 * Calcula el monto bruto que debe cobrar para recibir el monto neto deseado.
 * @param {number} netAmount - Monto neto deseado en USD
 * @param {string} feeType - Tipo de transacción
 * @returns {FeeResult}
 */
export function calculateGross(netAmount, feeType) {
  const fee = PAYPAL_FEES[feeType];
  if (!fee || netAmount <= 0) return { net: 0, gross: 0, fee: 0, breakdown: '' };

  let gross = 0;

  if (feeType === 'send_friends') {
    // net = gross - 4.99 - (gross * 0.034) - 0.30
    // net = gross * (1 - 0.034) - 5.29
    // gross = (net + 5.29) / (1 - 0.034)
    gross = (netAmount + fee.fixed + fee.fixedFee) / (1 - fee.percentage / 100);
  } else if (feeType === 'sell') {
    // net = gross - (gross * 0.044) - 0.30
    // net = gross * (1 - 0.044) - 0.30
    // gross = (net + 0.30) / (1 - 0.044)
    gross = (netAmount + fee.fixedFee) / (1 - fee.percentage / 100);
  } else if (feeType === 'receive' || feeType === 'send_payment') {
    // net = gross * (1 - percentage/100)
    // gross = net / (1 - percentage/100)
    gross = netAmount / (1 - fee.percentage / 100);
  }

  const feeAmount = gross - netAmount;

  return {
    net: netAmount,
    gross: Math.round(gross * 100) / 100,
    fee: Math.round(feeAmount * 100) / 100,
    breakdown: fee.description,
  };
}
