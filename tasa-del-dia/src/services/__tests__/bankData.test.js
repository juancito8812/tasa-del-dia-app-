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
  hasDigital,
} from '../bankData';

beforeEach(() => {
  AsyncStorage.clear();
});

const mockAccount = {
  tipoDocumento: 'V',
  numeroDocumento: '12345678',
  titular: 'Juan Pérez',
  banco: '0134',
  telefono: '0412-1234567',
  tipoCuenta: 'ahorro',
  numeroCuenta: '0134-12-1234567890',
  email: 'juan@email.com',
  emailPayPal: 'paypal@ejemplo.com',
  binanceWallet: 'TBinanc3Wallet',
  binanceEmail: 'binance@ejemplo.com',
  binanceId: '12345678',
};

describe('bankData', () => {
  describe('getAccounts', () => {
    it('returns empty array when no data', async () => {
      const accounts = await getAccounts();
      expect(accounts).toEqual([]);
    });

    it('returns stored accounts', async () => {
      await AsyncStorage.setItem('@bank_accounts', JSON.stringify([mockAccount]));
      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].titular).toBe('Juan Pérez');
    });
  });

  describe('saveAccount', () => {
    it('creates a new account with ID', async () => {
      const saved = await saveAccount(mockAccount);
      expect(saved.id).toBeDefined();
      expect(saved.titular).toBe('Juan Pérez');

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
    });

    it('updates existing account', async () => {
      const saved = await saveAccount(mockAccount);
      await saveAccount({ ...saved, titular: 'María López' });

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].titular).toBe('María López');
    });
  });

  describe('deleteAccount', () => {
    it('deletes account by ID', async () => {
      const saved = await saveAccount(mockAccount);
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

  describe('formatAccountText', () => {
    it('formats complete account', () => {
      const text = formatAccountText(mockAccount);
      expect(text).toContain('Juan Pérez');
      expect(text).toContain('V-12345678');
      expect(text).toContain('Banesco (0134)');
      expect(text).toContain('0412-1234567');
      expect(text).toContain('0134-12-1234567890');
      expect(text).toContain('juan@email.com');
    });

    it('formats account without digital', () => {
      const account = { ...mockAccount, email: '', walletAddress: '' };
      const text = formatAccountText(account);
      expect(text).not.toContain('Digital');
    });
  });

  describe('formatSectionText', () => {
    it('formats pago movil section', () => {
      const text = formatSectionText(mockAccount, 'pago_movil');
      expect(text).toContain('Juan Pérez');
      expect(text).toContain('Banesco (0134)');
      expect(text).toContain('0412-1234567');
      expect(text).not.toContain('Transferencia');
    });

    it('formats transferencia section', () => {
      const text = formatSectionText(mockAccount, 'transferencia');
      expect(text).toContain('Juan Pérez');
      expect(text).toContain('0134-12-1234567890');
      expect(text).not.toContain('Pago Móvil');
    });

    it('formats zelle section', () => {
      const text = formatSectionText(mockAccount, 'zelle');
      expect(text).toContain('juan@email.com');
    });

    it('formats paypal section', () => {
      const text = formatSectionText(mockAccount, 'paypal');
      expect(text).toContain('paypal@ejemplo.com');
    });

    it('formats binance section', () => {
      const text = formatSectionText(mockAccount, 'binance');
      expect(text).toContain('TBinanc3Wallet');
      expect(text).toContain('binance@ejemplo.com');
      expect(text).toContain('12345678');
    });
  });

  describe('hasPagoMovil', () => {
    it('returns true when has banco and telefono', () => {
      expect(hasPagoMovil(mockAccount)).toBe(true);
    });

    it('returns false when missing telefono', () => {
      expect(hasPagoMovil({ ...mockAccount, telefono: '' })).toBe(false);
    });
  });

  describe('hasTransferencia', () => {
    it('returns true when has banco and numeroCuenta', () => {
      expect(hasTransferencia(mockAccount)).toBe(true);
    });

    it('returns false when missing numeroCuenta', () => {
      expect(hasTransferencia({ ...mockAccount, numeroCuenta: '' })).toBe(false);
    });
  });

  describe('hasZelle', () => {
    it('returns true when has email', () => {
      expect(hasZelle(mockAccount)).toBe(true);
    });

    it('returns false when missing email', () => {
      expect(hasZelle({ ...mockAccount, email: '' })).toBe(false);
    });
  });

  describe('hasPayPal', () => {
    it('returns true when has emailPayPal', () => {
      expect(hasPayPal(mockAccount)).toBe(true);
    });

    it('returns false when missing emailPayPal', () => {
      expect(hasPayPal({ ...mockAccount, emailPayPal: '' })).toBe(false);
    });
  });

  describe('hasBinance', () => {
    it('returns true when has binanceWallet', () => {
      expect(hasBinance(mockAccount)).toBe(true);
    });

    it('returns false when missing all binance fields', () => {
      expect(hasBinance({ ...mockAccount, binanceWallet: '', binanceEmail: '', binanceId: '' })).toBe(false);
    });
  });

  describe('hasDigital', () => {
    it('returns true when has any digital field', () => {
      expect(hasDigital(mockAccount)).toBe(true);
    });

    it('returns false when missing all digital fields', () => {
      expect(hasDigital({ ...mockAccount, email: '', emailPayPal: '', binanceWallet: '' })).toBe(false);
    });
  });
});
