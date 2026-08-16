import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTodayKey,
  parseDateDDMMYYYY,
  formatDateKey,
  getStoredBCVLunes,
  setStoredBCVLunes,
  getReminderEnabled,
  setReminderEnabled,
  fetchBinanceP2P,
  fetchAllData,
} from '../api';

describe('API Service - Pure Functions', () => {
  describe('getTodayKey', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const result = getTodayKey();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parseDateDDMMYYYY', () => {
    it('should convert DD/MM/YYYY to YYYY-MM-DD', () => {
      expect(parseDateDDMMYYYY('25/12/2024')).toBe('2024-12-25');
      expect(parseDateDDMMYYYY('01/01/2025')).toBe('2025-01-01');
    });

    it('should return null for invalid formats', () => {
      expect(parseDateDDMMYYYY('invalid')).toBe(null);
      expect(parseDateDDMMYYYY('25-12-2024')).toBe('2024-12-25'); // Strips non-numeric chars, same as 25122024
      expect(parseDateDDMMYYYY('32/01/2024')).toBe(null);
      expect(parseDateDDMMYYYY('01/13/2024')).toBe(null);
    });

    it('should validate real days per month', () => {
      expect(parseDateDDMMYYYY('30/02/2024')).toBe(null);
      expect(parseDateDDMMYYYY('31/04/2024')).toBe(null);
      expect(parseDateDDMMYYYY('31/06/2024')).toBe(null);
      expect(parseDateDDMMYYYY('29/02/2024')).toBe('2024-02-29'); // año bisiesto
      expect(parseDateDDMMYYYY('29/02/2023')).toBe(null); // no bisiesto
    });
  });

  describe('formatDateKey', () => {
    it('should convert YYYY-MM-DD to DD/MM/AAAA', () => {
      expect(formatDateKey('2024-12-25')).toBe('25/12/2024');
      expect(formatDateKey('2025-01-01')).toBe('01/01/2025');
    });

    it('should return empty string for empty input', () => {
      expect(formatDateKey('')).toBe('');
      expect(formatDateKey(null)).toBe('');
    });
  });
});

describe('API Service - AsyncStorage Interactions', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('BCV Lunes Storage', () => {
    it('should get null values when empty', async () => {
      const result = await getStoredBCVLunes();
      expect(result).toEqual({ value: null, updatedAt: null });
    });

    it('should save and retrieve BCV Lunes', async () => {
      await setStoredBCVLunes(36.5);
      const result = await getStoredBCVLunes();
      expect(result.value).toBe(36.5);
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should remove BCV Lunes when setting null', async () => {
      await setStoredBCVLunes(36.5);
      await setStoredBCVLunes(null);
      const result = await getStoredBCVLunes();
      expect(result.value).toBe(null);
    });
  });

  describe('Reminder Enabled Storage', () => {
    it('should return false by default', async () => {
      const result = await getReminderEnabled();
      expect(result).toBe(false);
    });
    it('should save and retrieve reminder status', async () => {
      await setReminderEnabled(true);
      expect(await getReminderEnabled()).toBe(true);
      await setReminderEnabled(false);
      expect(await getReminderEnabled()).toBe(false);
    });
  });
});

describe('API Service - Binance P2P', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('returns the trimmed average of the best offers', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { adv: { price: '80' } },
          { adv: { price: '82' } },
          { adv: { price: '84' } },
          { adv: { price: '90' } }, // outlier
          { adv: { price: '83' } },
        ],
      }),
    });

    const price = await fetchBinanceP2P();

    // Sorted: [80,82,83,84,90] → trimmed: [82,83,84] → avg = 83
    expect(price).toBe(83);
  });

  it('requests 10 offers in one call', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ adv: { price: '80' } }] }),
    });

    await fetchBinanceP2P();

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.rows).toBe(10);
    expect(body.tradeType).toBe('BUY');
    expect(global.fetch.mock.calls[0][1].headers['User-Agent']).toBeDefined();
  });

  it('returns null when there are no valid offers', async () => {
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });

    expect(await fetchBinanceP2P()).toBeNull();
  });

  it('returns null when the request fails', async () => {
    global.fetch.mockRejectedValue(new Error('Network request failed'));

    expect(await fetchBinanceP2P()).toBeNull();
  });
});

describe('API Service - fetchAllData dedupe', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('dedupes concurrent calls into a single network request', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ promedio: 80, fechaActualizacion: '2026-01-01T00:00:00Z' }),
    });

    const [a, b] = await Promise.all([fetchAllData(), fetchAllData()]);

    expect(a.tasaBCV).toBe(80);
    expect(b.tasaBCV).toBe(80);
    // 2 (oficial + paralelo) + 1 (euro) + 1 (binance) = 4 fetches en total,
    // no 8: la segunda llamada reutiliza la petición en vuelo.
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('does not dedupe sequential calls', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ promedio: 80, fechaActualizacion: '2026-01-01T00:00:00Z' }),
    });

    await fetchAllData();
    await fetchAllData();

    expect(global.fetch).toHaveBeenCalledTimes(8);
  });
});
