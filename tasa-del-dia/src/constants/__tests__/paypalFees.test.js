import { PAYPAL_FEES, calculateNet, calculateGross } from '../paypalFees';

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
});
