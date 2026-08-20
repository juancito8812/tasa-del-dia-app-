import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import useRatesData from '../useRatesData';
import {
  fetchWithOfflineFallback,
  getStoredBCVLunes,
  setStoredBCVLunes,
  getReminderEnabled,
  setReminderEnabled as persistReminderEnabled,
  saveHistoricalRate,
  subscribeBcvLunes,
} from '../../services/api';
import {
  scheduleFridayReminder,
  cancelFridayReminder,
} from '../../services/notifications';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  fetchWithOfflineFallback: jest.fn(),
  getStoredBCVLunes: jest.fn(),
  setStoredBCVLunes: jest.fn(),
  getReminderEnabled: jest.fn(),
  setReminderEnabled: jest.fn(),
  saveHistoricalRate: jest.fn(),
}));

jest.mock('../../services/notifications', () => ({
  ...jest.requireActual('../../services/notifications'),
  scheduleFridayReminder: jest.fn(),
  cancelFridayReminder: jest.fn(),
  ensureReminderScheduled: jest.fn(),
}));

const mockData = {
  data: {
    tasaBCV: 80, tasaParalelo: 95, tasaEuro: 85, tasaBinanceP2P: 92,
    usdFetchedAt: '2026-06-21T12:00:00Z', eurCapturedAt: '2026-06-21T12:00:00Z',
  },
  fromCache: false, error: null, cacheInfo: null,
};

function TestComp({ onReady }) {
  const h = useRatesData();
  useEffect(() => { onReady?.(h); }, [h, onReady]);
  return null;
}

describe('useRatesData - Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    fetchWithOfflineFallback.mockResolvedValue(mockData);
    getStoredBCVLunes.mockResolvedValue({ value: 78, updatedAt: '2026-06-20T10:00:00Z' });
    getReminderEnabled.mockResolvedValue(false);
    scheduleFridayReminder.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should load rates and stored values on mount', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    // Flush all pending promises
    await act(async () => {});
    await act(async () => { jest.runAllTimers(); });

    expect(fetchWithOfflineFallback).toHaveBeenCalledTimes(1);
    expect(getStoredBCVLunes).toHaveBeenCalledTimes(1);
    expect(getReminderEnabled).toHaveBeenCalledTimes(1);
    expect(hook.data.tasaBCV).toBe(80);
    expect(hook.data.tasaParalelo).toBe(95);
    expect(hook.tasaBCVLunes).toBe(78);
    expect(hook.reminderEnabled).toBe(false);
  });

  it('should calculate brecha from BCV and Paralelo', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    // Paralelo 95, BCV 80 → (95-80)/80 * 100 = 18.75%
    expect(hook.brecha).toBeCloseTo(18.75, 1);
  });

  it('should calculate brechaLunes from BCV Lunes and Paralelo', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    // Paralelo 95, BCV Lunes 78 → (95-78)/78 * 100 = 21.79%
    expect(hook.brechaLunes).toBeCloseTo(21.79, 1);
  });

  it('should return null brecha when rates missing', async () => {
    fetchWithOfflineFallback.mockResolvedValue({
      data: { tasaBCV: null, tasaParalelo: null, tasaEuro: null, tasaBinanceP2P: null },
      fromCache: false, error: null,
    });
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    expect(hook.brecha).toBeNull();
    expect(hook.brechaLunes).toBeNull();
  });

  it('should save BCV Lunes and update state', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    act(() => { hook.handleSaveBCVLunes('82,50'); });
    expect(hook.tasaBCVLunes).toBe(82.5);
    expect(setStoredBCVLunes).toHaveBeenCalledWith(82.5);
    expect(saveHistoricalRate).toHaveBeenCalled();
  });

  it('should emit BcvLunes change so other tabs update instantly', async () => {
    const received = [];
    const unsubscribe = subscribeBcvLunes((value) => received.push(value));
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    act(() => { hook.handleSaveBCVLunes('82,50'); });
    act(() => { hook.handleSaveBCVLunes('0'); });
    expect(received).toEqual([82.5, null]);
    unsubscribe();
  });

  it('should clear BCV Lunes when invalid input', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    act(() => { hook.handleSaveBCVLunes('0'); });
    expect(hook.tasaBCVLunes).toBeNull();
    expect(setStoredBCVLunes).toHaveBeenCalledWith(null);
  });

  it('should enable reminder when schedule succeeds', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    await act(async () => { hook.handleToggleReminder(true); });
    expect(scheduleFridayReminder).toHaveBeenCalled();
    expect(hook.reminderEnabled).toBe(true);
    expect(persistReminderEnabled).toHaveBeenCalledWith(true);
  });

  it('should disable reminder', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    await act(async () => { hook.handleToggleReminder(false); });
    expect(cancelFridayReminder).toHaveBeenCalled();
    expect(hook.reminderEnabled).toBe(false);
  });

  it('should detect offline mode from cache', async () => {
    fetchWithOfflineFallback.mockResolvedValue({
      data: { tasaBCV: 80, tasaParalelo: 95, tasaEuro: null, tasaBinanceP2P: null },
      fromCache: true, error: 'Sin conexión — mostrando datos guardados',
      cacheInfo: { cachedAt: '2026-06-21T10:00:00Z' },
    });
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    expect(hook.offlineMode).toBe(true);
    expect(hook.offlineCachedAt).toBe('2026-06-21T10:00:00Z');
  });

  it('should format edit time for recent timestamps', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    const now = new Date().toISOString();
    expect(hook.formatEditTime(now)).toBe('Ahora');

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(hook.formatEditTime(fiveMinAgo)).toBe('Hace 5 min');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(hook.formatEditTime(twoHoursAgo)).toBe('Hace 2h');
  });

  it('should auto-save historical rates when data loads', async () => {
    await act(async () => {
      TestRenderer.create(<TestComp onReady={() => {}} />);
    });
    await act(async () => {});
    expect(saveHistoricalRate).toHaveBeenCalled();
  });
});
