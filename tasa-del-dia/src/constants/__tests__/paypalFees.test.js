import { PAYPAL_FEES, calculateNet, calculateGross } from '../paypalFees';

describe('paypalFees', () => {
  describe('PAYPAL_FEES', () => {
    it('has 4 fee types', () => {
      expect(Object.keys(PAYPAL_FEES)).toHaveLength(4);
    });

    it('has required fields for each fee type', () => {
      Object.values(PAYPAL_FEES).forEach((fee) => {
        expect(fee.key).toBeDefined();
        expect(fee.label).toBeDefined();
        expect(fee.description).toBeDefined();
        expect(typeof fee.percentage).toBe('number');
      });
    });
  });

  describe('calculateNet', () => {
    it('calculates net for send_friends (USD 4.99 + 3.4% + $0.30)', () => {
      const result = calculateNet(100, 'send_friends');
      // fee = 4.99 + (100 * 0.034) + 0.30 = 4.99 + 3.40 + 0.30 = 8.69
      expect(result.fee).toBe(8.69);
      expect(result.net).toBe(91.31);
    });

    it('calculates net for receive (3.50%)', () => {
      const result = calculateNet(100, 'receive');
      expect(result.fee).toBe(3.5);
      expect(result.net).toBe(96.5);
    });

    it('calculates net for send_payment (4.50%)', () => {
      const result = calculateNet(100, 'send_payment');
      expect(result.fee).toBe(4.5);
      expect(result.net).toBe(95.5);
    });

    it('calculates net for sell (4.4% + $0.30)', () => {
      const result = calculateNet(100, 'sell');
      // fee = (100 * 0.044) + 0.30 = 4.40 + 0.30 = 4.70
      expect(result.fee).toBe(4.7);
      expect(result.net).toBe(95.3);
    });

    it('returns zero for invalid fee type', () => {
      const result = calculateNet(100, 'invalid');
      expect(result.net).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('returns zero for zero amount', () => {
      const result = calculateNet(0, 'send_friends');
      expect(result.net).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('returns zero for negative amount', () => {
      const result = calculateNet(-50, 'sell');
      expect(result.net).toBe(0);
      expect(result.fee).toBe(0);
    });

    it('rounds results to 2 decimals', () => {
      const result = calculateNet(33.33, 'sell');
      expect(result.net).toBe(Math.round(result.net * 100) / 100);
      expect(result.fee).toBe(Math.round(result.fee * 100) / 100);
    });
  });

  describe('calculateGross', () => {
    it('calculates gross for send_friends', () => {
      const result = calculateGross(91.31, 'send_friends');
      expect(result.gross).toBeCloseTo(100, 0);
    });

    it('calculates gross for receive', () => {
      const result = calculateGross(96.5, 'receive');
      expect(result.gross).toBeCloseTo(100, 0);
    });

    it('calculates gross for send_payment', () => {
      const result = calculateGross(95.5, 'send_payment');
      expect(result.gross).toBeCloseTo(100, 0);
    });

    it('calculates gross for sell', () => {
      const result = calculateGross(95.3, 'sell');
      expect(result.gross).toBeCloseTo(100, 0);
    });

    it('returns zero for invalid fee type', () => {
      const result = calculateGross(100, 'invalid');
      expect(result.gross).toBe(0);
    });

    it('returns zero for zero net amount', () => {
      const result = calculateGross(0, 'send_friends');
      expect(result.gross).toBe(0);
    });

    it('gross - fee equals net amount', () => {
      const netAmount = 75.50;
      const result = calculateGross(netAmount, 'sell');
      expect(result.gross - result.fee).toBeCloseTo(netAmount, 1);
    });
  });
});
