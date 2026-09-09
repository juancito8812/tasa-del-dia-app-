import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAccounts,
  saveAccount,
  deleteAccount,
  formatAccountText,
  formatSectionText,
  hasPagoMovil,
  hasTransferencia,
  hasZelle,
  hasPayPal,
  hasBinance,
  hasFacebank,
  hasZinli,
  hasWally,
  hasDigital,
} from '../bankData';

beforeEach(() => {
  AsyncStorage.clear();
});

const mockAccountComplete = {
  tipoDocumento: 'V',
  numeroDocumento: '5624208',
  titular: 'Luis Romero',
  banco: '0105',
  telefono: '04143451767',
  tipoCuenta: 'ahorro',
  numeroCuenta: '0105123456789012',
  email: 'juan@email.com',
  emailPayPal: 'paypal@ejemplo.com',
  binanceWallet: 'TBinanc3Wallet',
  binanceEmail: 'binance@ejemplo.com',
  binanceId: '12345678',
  facebankEmail: 'face@email.com',
  facebankAccount: '0105987654321098',
  zinliEmail: 'zinli@email.com',
  wallyEmail: 'wally@email.com',
};

const mockPagoMovilOnly = {
  tipoDocumento: 'V',
  numeroDocumento: '5624208',
  titular: 'Luis Romero',
  banco: '0105',
  telefono: '04143451767',
};

describe('bankData', () => {
  describe('getAccounts', () => {
    it('returns empty array when no data', async () => {
      const accounts = await getAccounts();
      expect(accounts).toEqual([]);
    });

    it('returns stored accounts', async () => {
      await AsyncStorage.setItem('@bank_accounts', JSON.stringify([mockAccountComplete]));
      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].titular).toBe('Luis Romero');
    });
  });

  describe('saveAccount', () => {
    it('creates a new account with ID', async () => {
      const saved = await saveAccount(mockAccountComplete);
      expect(saved.id).toBeDefined();
      expect(saved.titular).toBe('Luis Romero');

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
    });

    it('updates existing account', async () => {
      const saved = await saveAccount(mockAccountComplete);
      await saveAccount({ ...saved, titular: 'María López' });

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].titular).toBe('María López');
    });
  });

  describe('deleteAccount', () => {
    it('deletes account by ID', async () => {
      const saved = await saveAccount(mockAccountComplete);
      const result = await deleteAccount(saved.id);
      expect(result).toBe(true);

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(0);
    });

    it('returns true even if ID not found', async () => {
      const result = await deleteAccount('nonexistent');
      expect(result).toBe(true);
    });
  });

  describe('formatAccountText (copy all — con labels)', () => {
    it('formats complete account with labels', () => {
      const text = formatAccountText(mockAccountComplete);

      expect(text).toContain('Cédula: 5624208');
      expect(text).toContain('Teléfono: 04143451767');
      expect(text).toContain('Banco: Mercantil (0105)');
      expect(text).toContain('Cuenta: 0105123456789012');
      expect(text).toContain('Tipo: Ahorro');
      expect(text).toContain('Zelle: juan@email.com');
      expect(text).toContain('PayPal: paypal@ejemplo.com');
      expect(text).toContain('Binance Wallet: TBinanc3Wallet');
      expect(text).toContain('Binance Email: binance@ejemplo.com');
      expect(text).toContain('Binance ID: 12345678');
      expect(text).toContain('Facebank: face@email.com');
      expect(text).toContain('Facebank Cuenta: 0105987654321098');
      expect(text).toContain('Zinli: zinli@email.com');
      expect(text).toContain('Wally: wally@email.com');
    });

    it('formats pago_movil-only account with labels', () => {
      const text = formatAccountText(mockPagoMovilOnly);
      const lines = text.split('\n').filter(Boolean);

      expect(lines[0]).toBe('Cédula: 5624208');
      expect(lines[1]).toBe('Teléfono: 04143451767');
      expect(lines[2]).toBe('Banco: Mercantil (0105)');

      // No other sections
      expect(text).not.toContain('Cuenta:');
      expect(text).not.toContain('Zelle:');
      expect(text).not.toContain('PayPal:');
      expect(text).not.toContain('Binance');
      expect(text).not.toContain('Facebank');
      expect(text).not.toContain('Zinli');
      expect(text).not.toContain('Wally');
    });

    it('formats account without digital sections', () => {
      const account = {
        ...mockAccountComplete,
        email: '',
        emailPayPal: '',
        binanceWallet: '',
        binanceEmail: '',
        binanceId: '',
        facebankEmail: '',
        facebankAccount: '',
        zinliEmail: '',
        wallyEmail: '',
      };
      const text = formatAccountText(account);

      expect(text).toContain('Cédula: 5624208');
      expect(text).toContain('Cuenta: 0105123456789012');
      expect(text).not.toContain('Zelle:');
      expect(text).not.toContain('PayPal:');
      expect(text).not.toContain('Binance');
      expect(text).not.toContain('Facebank');
      expect(text).not.toContain('Zinli');
      expect(text).not.toContain('Wally');
    });
  });

  describe('formatSectionText (copy section — sin labels, compacto)', () => {
    it('formats pago_movil section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'pago_movil');
      const lines = text.split('\n').filter(Boolean);

      expect(lines[0]).toBe('5624208');
      expect(lines[1]).toBe('04143451767');
      expect(lines[2]).toBe('Mercantil 0105');

      expect(text).not.toContain('Cédula:');
      expect(text).not.toContain('Teléfono:');
      expect(text).not.toContain('Banco:');
    });

    it('formats transferencia section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'transferencia');
      const lines = text.split('\n').filter(Boolean);

      expect(lines[0]).toBe('0105123456789012');
      expect(lines[1]).toBe('Mercantil 0105');
      expect(lines[2]).toBe('Ahorro');

      expect(text).not.toContain('Cuenta:');
      expect(text).not.toContain('Tipo:');
    });

    it('formats zelle section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'zelle');
      expect(text).toBe('juan@email.com');
      expect(text).not.toContain('Zelle:');
    });

    it('formats paypal section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'paypal');
      expect(text).toBe('paypal@ejemplo.com');
      expect(text).not.toContain('PayPal:');
    });

    it('formats binance section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'binance');
      const lines = text.split('\n').filter(Boolean);

      expect(lines[0]).toBe('TBinanc3Wallet');
      expect(lines[1]).toBe('binance@ejemplo.com');
      expect(lines[2]).toBe('12345678');

      expect(text).not.toContain('Wallet:');
      expect(text).not.toContain('Email:');
      expect(text).not.toContain('ID:');
    });

    it('formats facebank section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'facebank');
      const lines = text.split('\n').filter(Boolean);

      expect(lines[0]).toBe('face@email.com');
      expect(lines[1]).toBe('0105987654321098');

      expect(text).not.toContain('Facebank:');
    });

    it('formats zinli section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'zinli');
      expect(text).toBe('zinli@email.com');
      expect(text).not.toContain('Zinli:');
    });

    it('formats wally section compacto', () => {
      const text = formatSectionText(mockAccountComplete, 'wally');
      expect(text).toBe('wally@email.com');
      expect(text).not.toContain('Wally:');
    });
  });

  describe('hasPagoMovil', () => {
    it('returns true when has banco and telefono', () => {
      expect(hasPagoMovil(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing telefono', () => {
      expect(hasPagoMovil({ ...mockAccountComplete, telefono: '' })).toBe(false);
    });
  });

  describe('hasTransferencia', () => {
    it('returns true when has banco and numeroCuenta', () => {
      expect(hasTransferencia(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing numeroCuenta', () => {
      expect(hasTransferencia({ ...mockAccountComplete, numeroCuenta: '' })).toBe(false);
    });
  });

  describe('hasZelle', () => {
    it('returns true when has email', () => {
      expect(hasZelle(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing email', () => {
      expect(hasZelle({ ...mockAccountComplete, email: '' })).toBe(false);
    });
  });

  describe('hasPayPal', () => {
    it('returns true when has emailPayPal', () => {
      expect(hasPayPal(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing emailPayPal', () => {
      expect(hasPayPal({ ...mockAccountComplete, emailPayPal: '' })).toBe(false);
    });
  });

  describe('hasBinance', () => {
    it('returns true when has binanceWallet', () => {
      expect(hasBinance(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing all binance fields', () => {
      expect(
        hasBinance({
          ...mockAccountComplete,
          binanceWallet: '',
          binanceEmail: '',
          binanceId: '',
        })
      ).toBe(false);
    });
  });

  describe('hasFacebank', () => {
    it('returns true when has facebankEmail', () => {
      expect(hasFacebank(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing all facebank fields', () => {
      expect(
        hasFacebank({
          ...mockAccountComplete,
          facebankEmail: '',
          facebankAccount: '',
        })
      ).toBe(false);
    });
  });

  describe('hasZinli', () => {
    it('returns true when has zinliEmail', () => {
      expect(hasZinli(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing zinliEmail', () => {
      expect(hasZinli({ ...mockAccountComplete, zinliEmail: '' })).toBe(false);
    });
  });

  describe('hasWally', () => {
    it('returns true when has wallyEmail', () => {
      expect(hasWally(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing wallyEmail', () => {
      expect(hasWally({ ...mockAccountComplete, wallyEmail: '' })).toBe(false);
    });
  });

  describe('hasDigital', () => {
    it('returns true when has any digital field', () => {
      expect(hasDigital(mockAccountComplete)).toBe(true);
    });

    it('returns false when missing all digital fields', () => {
      expect(
        hasDigital({
          ...mockAccountComplete,
          email: '',
          emailPayPal: '',
          binanceWallet: '',
          facebankEmail: '',
          zinliEmail: '',
          wallyEmail: '',
        })
      ).toBe(false);
    });
  });
});
