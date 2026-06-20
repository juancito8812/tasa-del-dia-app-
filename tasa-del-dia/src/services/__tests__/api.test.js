import { getTodayKey, parseDateDDMMYYYY, formatDateKey } from '../api';

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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredBCVLunes, setStoredBCVLunes, getReminderEnabled, setReminderEnabled } from '../api';

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
