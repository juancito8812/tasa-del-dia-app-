import {
  parseNumericInput,
  formatBs,
  formatUsd,
  buildResultText,
  buildBsPurchaseText,
} from '../paypalCalculator';
import { calculateBsPurchase, calculateGross } from '../../constants/paypalFees';

describe('parseNumericInput', () => {
  it('returns 0 for empty/invalid input', () => {
    expect(parseNumericInput('')).toBe(0);
    expect(parseNumericInput(undefined)).toBe(0);
    expect(parseNumericInput('abc')).toBe(0);
  });

  it('parses plain numbers', () => {
    expect(parseNumericInput('1000')).toBe(1000);
    expect(parseNumericInput('37.5')).toBe(37.5);
  });

  it('treats es-VE comma as decimal separator', () => {
    expect(parseNumericInput('37,5')).toBe(37.5);
    expect(parseNumericInput('1000,50')).toBe(1000.5);
  });

  it('treats dots before a comma as thousands separators', () => {
    expect(parseNumericInput('1.234,56')).toBe(1234.56);
    expect(parseNumericInput('1.234.567,89')).toBe(1234567.89);
  });
});

describe('formatBs / formatUsd', () => {
  it('formats Bs with es-VE grouping and 2 decimals', () => {
    expect(formatBs(17.52)).toBe('Bs 17,52');
    expect(formatBs(1234.5)).toBe('Bs 1.234,50');
  });

  it('formats USD with en-US grouping and 2 decimals', () => {
    expect(formatUsd(28.51)).toBe('$ 28.51');
    expect(formatUsd(1234.5)).toBe('$ 1,234.50');
  });

  it('returns N/A for null/undefined', () => {
    expect(formatBs(null)).toBe('N/A');
    expect(formatUsd(undefined)).toBe('N/A');
  });
});

describe('buildResultText', () => {
  const result = calculateGross(100, 'receive');
  const equivalents = { bcv: 3750, paralelo: 3950, binance: null, euro: null };

  it('builds the "Para recibir" (net) text with available equivalents only', () => {
    const text = buildResultText({
      feeType: 'receive',
      parsedAmount: 100,
      result,
      equivalents,
      mode: 'net',
    });
    const lines = text.split('\n');
    expect(lines[0]).toBe('PayPal (Recibir pago)');
    expect(lines[1]).toBe('Monto: $100.00');
    expect(lines[2]).toBe('Comisión: $6.03');
    expect(lines[3]).toBe('Recibo: $106.03');
    expect(lines).toContain('BCV: Bs 3.750,00');
    expect(lines).toContain('Paralelo: Bs 3.950,00');
    expect(lines.some((l) => l.startsWith('Binance'))).toBe(false);
    expect(lines.some((l) => l.startsWith('Euro'))).toBe(false);
  });

  it('uses "Cobro" label for gross mode', () => {
    const text = buildResultText({
      feeType: 'receive',
      parsedAmount: 100,
      result,
      equivalents: { bcv: null, paralelo: null, binance: null, euro: null },
      mode: 'gross',
    });
    expect(text).toContain('Cobro: $106.03');
  });
});

describe('buildBsPurchaseText', () => {
  it('builds the BS purchase copy text', () => {
    const bsPurchase = calculateBsPurchase(1000, 37.5);
    const text = buildBsPurchaseText({ bsPurchase, parsedBsAmount: 1000, parsedBsRate: 37.5 });
    const lines = text.split('\n');
    expect(lines[0]).toBe('Pagar compras en BS');
    expect(lines[1]).toBe('Monto a pagar: Bs 1.000,00');
    expect(lines[2]).toBe('Tasa: 37,5 Bs/USD');
    expect(lines).toContain('Transferir en PayPal: $ 28.51');
    expect(lines).toContain('Recomendado: $ 29.00');
    expect(lines).toContain('Vuelto: Bs 17,52');
  });
});
