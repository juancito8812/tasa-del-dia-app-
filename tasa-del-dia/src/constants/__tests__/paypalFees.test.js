import { PAYPAL_FEES, calculateNet, calculateGross, calculateBsPurchase } from '../paypalFees';

describe('paypalFees', () => {
  describe('PAYPAL_FEES', () => {
    it('has 2 fee types', () => {
      expect(Object.keys(PAYPAL_FEES)).toHaveLength(2);
    });

    it('has required fields for each fee type', () => {
      Object.values(PAYPAL_FEES).forEach((fee) => {
        expect(fee.key).toBeDefined();
        expect(fee.label).toBeDefined();
        expect(fee.description).toBeDefined();
        expect(typeof fee.percentage).toBe('number');
        expect(typeof fee.fixedFee).toBe('number');
      });
    });
  });

  describe('calculateNet', () => {
    it('calculates net for receive (5.4% + $0.30)', () => {
      // Enviar 100: fee = (100 * 0.054) + 0.30 = 5.70, net = 94.30
      const result = calculateNet(100, 'receive');
      expect(result.fee).toBe(5.7);
      expect(result.net).toBe(94.3);
    });

    it('calculates net for send_payment (5.4% + $0.30)', () => {
      const result = calculateNet(100, 'send_payment');
      expect(result.fee).toBe(5.7);
      expect(result.net).toBe(94.3);
    });

    it('returns zero for invalid fee type', () => {
      const result = calculateNet(100, 'invalid');
      expect(result.net).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('returns zero for zero amount', () => {
      const result = calculateNet(0, 'receive');
      expect(result.net).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('returns zero for negative amount', () => {
      const result = calculateNet(-50, 'receive');
      expect(result.net).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('rounds results to 2 decimals', () => {
      const result = calculateNet(33.33, 'receive');
      expect(result.net).toBe(Math.round(result.net * 100) / 100);
      expect(result.fee).toBe(Math.round(result.fee * 100) / 100);
    });
  });

  describe('calculateGross', () => {
    it('calculates gross for receive (5.4% + $0.30)', () => {
      // Recibir 100: gross = (100 + 0.30) / (1 - 0.054) = 106.03
      const result = calculateGross(100, 'receive');
      expect(result.gross).toBeCloseTo(106.03, 0);
    });

    it('calculates gross for send_payment', () => {
      const result = calculateGross(100, 'send_payment');
      expect(result.gross).toBeCloseTo(106.03, 0);
    });

    it('returns zero for invalid fee type', () => {
      const result = calculateGross(100, 'invalid');
      expect(result.gross).toBe(0);
    });

    it('returns zero for zero net amount', () => {
      const result = calculateGross(0, 'receive');
      expect(result.gross).toBe(0);
    });

    it('gross - fee equals net amount', () => {
      const netAmount = 75.50;
      const result = calculateGross(netAmount, 'receive');
      expect(result.gross - result.fee).toBeCloseTo(netAmount, 1);
    });
  });

  describe('calculateBsPurchase', () => {
    it('calculates the full chain for 1000 Bs @ 37.5', () => {
      const r = calculateBsPurchase(1000, 37.5);
      expect(r.netoUsd).toBe(26.67);
      expect(r.pagoExactoUsd).toBe(28.51);
      expect(r.pagoRecomendadoUsd).toBe(29);
      expect(r.comisionRecomendado).toBe(1.87);
      expect(r.netoRecibidoRecomendado).toBe(27.13);
      expect(r.equivalenteBs).toBe(1017.53);
      expect(r.vueltoBs).toBe(17.52);
    });

    it('calculates for 500 Bs @ 39.5', () => {
      const r = calculateBsPurchase(500, 39.5);
      expect(r.netoUsd).toBe(12.66);
      expect(r.pagoExactoUsd).toBe(13.7);
      expect(r.pagoRecomendadoUsd).toBe(14);
      expect(r.comisionRecomendado).toBe(1.06);
      expect(r.netoRecibidoRecomendado).toBe(12.94);
      expect(r.equivalenteBs).toBe(511.29);
      expect(r.vueltoBs).toBe(11.29);
    });

    it('recommended payment is always a whole dollar (ceil)', () => {
      const r = calculateBsPurchase(500, 39.5);
      expect(Number.isInteger(r.pagoRecomendadoUsd)).toBe(true);
      expect(r.pagoRecomendadoUsd).toBeGreaterThanOrEqual(r.pagoExactoUsd);
    });

    it('returns vuelto 0 when the exact payment is a whole dollar', () => {
      const r = calculateBsPurchase(366.4, 40);
      expect(r.pagoExactoUsd).toBe(10);
      expect(r.pagoRecomendadoUsd).toBe(10);
      expect(r.vueltoBs).toBe(0);
    });

    it('edge: slightly negative vuelto when round2 lands just below a whole dollar', () => {
      const r = calculateBsPurchase(1017.560475, 37.5);
      expect(r.pagoExactoUsd).toBe(29);
      expect(r.pagoRecomendadoUsd).toBe(29);
      expect(r.vueltoBs).toBe(-0.04);
    });

    it('keeps consistency: netoRecibido = recomendado - comision', () => {
      const r = calculateBsPurchase(250, 36.9);
      const feeRate = PAYPAL_FEES.receive.percentage / 100;
      const comisionExacta = r.pagoRecomendadoUsd * feeRate + PAYPAL_FEES.receive.fixedFee;
      expect(r.netoRecibidoRecomendado).toBeCloseTo(r.pagoRecomendadoUsd - comisionExacta, 1);
    });

    it('equivalenteBs matches netoRecibido * tasa', () => {
      const r = calculateBsPurchase(1000, 37.5);
      const feeRate = PAYPAL_FEES.receive.percentage / 100;
      const netoExacto = r.pagoRecomendadoUsd - (r.pagoRecomendadoUsd * feeRate + PAYPAL_FEES.receive.fixedFee);
      expect(r.equivalenteBs).toBeCloseTo(netoExacto * 37.5, 1);
    });

    it('returns null for zero montoBs', () => {
      expect(calculateBsPurchase(0, 37.5)).toBeNull();
    });

    it('returns null for negative montoBs', () => {
      expect(calculateBsPurchase(-50, 37.5)).toBeNull();
    });

    it('returns null for zero tasa', () => {
      expect(calculateBsPurchase(1000, 0)).toBeNull();
    });

    it('returns null for negative tasa', () => {
      expect(calculateBsPurchase(1000, -37.5)).toBeNull();
    });

    it('returns null for NaN inputs', () => {
      expect(calculateBsPurchase(NaN, 37.5)).toBeNull();
      expect(calculateBsPurchase(1000, NaN)).toBeNull();
    });

    it('returns null for Infinity inputs', () => {
      expect(calculateBsPurchase(Infinity, 37.5)).toBeNull();
      expect(calculateBsPurchase(1000, Infinity)).toBeNull();
    });
  });
});
