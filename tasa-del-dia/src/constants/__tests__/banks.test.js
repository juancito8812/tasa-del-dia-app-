import { BANKS, getBankName, getBankByCode, formatBankDisplay } from '../banks';

describe('banks', () => {
  it('has 28 banks', () => {
    expect(BANKS).toHaveLength(28);
  });

  it('all banks have code, name, and type', () => {
    BANKS.forEach((bank) => {
      expect(bank.code).toBeDefined();
      expect(bank.name).toBeDefined();
      expect(bank.type).toBeDefined();
    });
  });

  it('codes are 4 digits', () => {
    BANKS.forEach((bank) => {
      expect(bank.code).toMatch(/^\d{4}$/);
    });
  });

  it('getBankName returns name for valid code', () => {
    expect(getBankName('0134')).toBe('Banesco');
    expect(getBankName('0102')).toBe('Banco de Venezuela');
  });

  it('getBankName returns code for unknown code', () => {
    expect(getBankName('9999')).toBe('9999');
  });

  it('getBankByCode returns bank object for valid code', () => {
    const bank = getBankByCode('0134');
    expect(bank).toBeDefined();
    expect(bank.name).toBe('Banesco');
    expect(bank.code).toBe('0134');
  });

  it('getBankByCode returns undefined for unknown code', () => {
    expect(getBankByCode('9999')).toBeUndefined();
  });

  it('formatBankDisplay returns formatted string', () => {
    expect(formatBankDisplay('0134')).toBe('Banesco (0134)');
    expect(formatBankDisplay('0102')).toBe('Banco de Venezuela (0102)');
  });

  it('formatBankDisplay returns code for unknown bank', () => {
    expect(formatBankDisplay('9999')).toBe('9999');
  });
});
