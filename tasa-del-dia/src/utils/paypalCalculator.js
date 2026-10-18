import { PAYPAL_FEES } from '../constants/paypalFees';

/**
 * Normaliza un input numérico es-VE: "1.234,56" → 1234.56, "37,5" → 37.5.
 * La coma es separador decimal; los puntos antes de una coma son miles.
 * @param {string} value
 * @returns {number}
 */
export function parseNumericInput(value) {
  if (!value) return 0;
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value.replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Formatea un monto en bolívares. Devuelve 'N/A' si el valor es nulo.
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatBs(value) {
  if (value == null) return 'N/A';
  return `Bs ${value.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formatea un monto en dólares. Devuelve 'N/A' si el valor es nulo.
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatUsd(value) {
  if (value == null) return 'N/A';
  return `$ ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Construye el texto plano del resultado de la calculadora principal (para
 * copiar/compartir).
 * @param {object} params
 * @param {string} params.feeType
 * @param {number} params.parsedAmount
 * @param {{ net: number, gross?: number, fee: number }} params.result
 * @param {{ bcv: number|null, paralelo: number|null, binance: number|null, euro: number|null }} params.equivalents
 * @param {string} params.mode
 * @returns {string}
 */
export function buildResultText({ feeType, parsedAmount, result, equivalents, mode }) {
  const usdAmount = result.gross ?? result.net;
  const lines = [
    `PayPal (${PAYPAL_FEES[feeType].label})`,
    `Monto: $${parsedAmount.toFixed(2)}`,
    `Comisión: $${result.fee.toFixed(2)}`,
    `${mode === 'net' ? 'Recibo' : 'Cobro'}: $${usdAmount.toFixed(2)}`,
    '',
  ];
  if (equivalents.bcv != null) lines.push(`BCV: ${formatBs(equivalents.bcv)}`);
  if (equivalents.paralelo != null) lines.push(`Paralelo: ${formatBs(equivalents.paralelo)}`);
  if (equivalents.binance != null) lines.push(`Binance: ${formatBs(equivalents.binance)}`);
  if (equivalents.euro != null) lines.push(`Euro: ${formatBs(equivalents.euro)}`);
  return lines.join('\n');
}

/**
 * Construye el texto plano del resultado de "Pagar compras en BS" (para
 * copiar/compartir).
 * @param {object} params
 * @param {{ pagoExactoUsd: number, netoUsd: number, pagoRecomendadoUsd: number, equivalenteBs: number, vueltoBs: number }} params.bsPurchase
 * @param {number} params.parsedBsAmount
 * @param {number} params.parsedBsRate
 * @returns {string}
 */
export function buildBsPurchaseText({ bsPurchase, parsedBsAmount, parsedBsRate }) {
  const lines = [
    'Pagar compras en BS',
    `Monto a pagar: ${formatBs(parsedBsAmount)}`,
    `Tasa: ${parsedBsRate.toLocaleString('es-VE', { maximumFractionDigits: 2 })} Bs/USD`,
    '',
    `Transferir en PayPal: ${formatUsd(bsPurchase.pagoExactoUsd)}`,
    `Comisión incluida: ${formatUsd(bsPurchase.pagoExactoUsd - bsPurchase.netoUsd)}`,
    `Recomendado: ${formatUsd(bsPurchase.pagoRecomendadoUsd)}`,
    `Equivale a: ${formatBs(bsPurchase.equivalenteBs)}`,
    `Vuelto: ${formatBs(bsPurchase.vueltoBs)}`,
  ];
  return lines.join('\n');
}
