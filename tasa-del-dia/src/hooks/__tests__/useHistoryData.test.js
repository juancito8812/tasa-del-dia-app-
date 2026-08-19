import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import useHistoryData, { formatDateKey } from '../useHistoryData';
import { formatCurrency, getWeekDay, getMonthAbbr, getDay } from '../../utils/formatting';
import { getHistoricalRates } from '../../services/api';

// Mock api
jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  getHistoricalRates: jest.fn(),
}));

function TestComp({ onReady }) {
  const h = useHistoryData();
  useEffect(() => { onReady?.(h); }, [h, onReady]);
  return null;
}

const mockRates = {
  '2026-06-21': { bcv: 80, paralelo: 95, binance_p2p: 92, euro: 85, fetchedAt: '2026-06-21T12:00:00Z' },
  '2026-06-20': { bcv: 79, paralelo: 94, euro: 84, fetchedAt: '2026-06-20T12:00:00Z' },
  '2026-06-19': { bcv: 78, paralelo: 93, fetchedAt: '2026-06-19T12:00:00Z' },
};

describe('useHistoryData - Pure Functions', () => {
  describe('formatCurrency', () => {
    it('should format numeric values with locale es-VE', () => {
      const result = formatCurrency(80);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('80');
    });

    it('should return "—" for null/undefined', () => {
      expect(formatCurrency(null)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
    });
  });

  describe('getWeekDay', () => {
    it('should return correct day name', () => {
      expect(getWeekDay('2026-06-21')).toBe('Dom');
      expect(getWeekDay('2026-06-22')).toBe('Lun');
      expect(getWeekDay('2026-06-20')).toBe('Sáb');
    });
  });

  describe('getMonthAbbr', () => {
    it('should return month abbreviation', () => {
      expect(getMonthAbbr('2026-01-15')).toBe('Ene');
      expect(getMonthAbbr('2026-06-15')).toBe('Jun');
      expect(getMonthAbbr('2026-12-25')).toBe('Dic');
    });
  });

  describe('getDay', () => {
    it('should extract day from dateKey', () => {
      expect(getDay('2026-06-21')).toBe('21');
      expect(getDay('2026-01-01')).toBe('01');
    });
  });

  describe('formatDateKey (re-exported from api)', () => {
    it('should convert YYYY-MM-DD to DD/MM/AAAA', () => {
      expect(formatDateKey('2026-06-21')).toBe('21/06/2026');
    });
  });
});

describe('useHistoryData - Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getHistoricalRates.mockResolvedValue(mockRates);
  });

  it('should load historical rates on mount', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    // Wait for async load
    await act(async () => {});
    expect(hook.ratesData.length).toBe(3);
    // Should be sorted descending by date
    expect(hook.ratesData[0].dateKey).toBe('2026-06-21');
    expect(hook.ratesData[2].dateKey).toBe('2026-06-19');
  });

  it('should select a date', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    act(() => { hook.handleSelectDate('2026-06-21'); });
    expect(hook.selectedDateKey).toBe('2026-06-21');
    expect(hook.selectedData.bcv).toBe(80);
  });

  it('should deselect when clicking same date', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    act(() => { hook.handleSelectDate('2026-06-21'); });
    act(() => { hook.handleSelectDate('2026-06-21'); });
    expect(hook.selectedDateKey).toBeNull();
  });

  it('should provide last5 as slice of sorted rates', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    expect(hook.last10.length).toBe(3); // Only 3 entries total
    expect(hook.last10[0].dateKey).toBe('2026-06-21');
  });

  it('should generate chartInfo from last 5 reversed entries', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    expect(hook.chartInfo).not.toBeNull();
    expect(hook.chartInfo.labels.length).toBe(3);
    expect(hook.chartInfo.data[0].length).toBe(3); // BCV data
    expect(hook.chartInfo.data[1].length).toBe(3); // Paralelo data
  });

  it('should return null chartInfo with fewer than 2 entries', async () => {
    getHistoricalRates.mockResolvedValue({ '2026-06-21': { bcv: 80 } });
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    expect(hook.chartInfo).toBeNull();
  });

  it('should start with showCustomInput false', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    expect(hook.showCustomInput).toBe(false);
  });

  it('should toggle showCustomInput', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    act(() => { hook.setShowCustomInput(true); });
    expect(hook.showCustomInput).toBe(true);
  });
});
