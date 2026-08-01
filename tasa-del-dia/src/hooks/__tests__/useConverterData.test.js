import React, { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import useConverterData from '../useConverterData';
import { extractRawDigits, formatRawDisplay, QUICK_USD, formatCurrency } from '../../utils/formatting';
import { fetchWithOfflineFallback, getStoredBCVLunes } from '../../services/api';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  fetchWithOfflineFallback: jest.fn(),
  getStoredBCVLunes: jest.fn(),
}));

const mockRates = {
  data: { tasaBCV: 80, tasaParalelo: 95, tasaEuro: 85, tasaBinanceP2P: 92, usdFetchedAt: '2026-06-21T12:00:00Z' },
  fromCache: false, error: null, cacheInfo: null,
};

function TestComp({ onReady }) {
  const h = useConverterData();
  useEffect(() => { onReady?.(h); }, [h]);
  return null;
}

describe('useConverterData - Pure Functions', () => {
  describe('extractRawDigits', () => {
    it('should keep comma as decimal separator', () => {
      expect(extractRawDigits('28028,33')).toBe('28028,33');
    });

    it('should handle thousands dots with comma decimal', () => {
      expect(extractRawDigits('28.028,33')).toBe('28028,33');
    });

    it('should handle plain numbers without separators', () => {
      expect(extractRawDigits('28028')).toBe('28028');
    });

    it('should handle integer with comma', () => {
      expect(extractRawDigits('1000,00')).toBe('1000,00');
    });

    it('should strip non-numeric characters (Venezuelan format)', () => {
      // Con coma decimal + punto miles: "$1.234,56" → "1234,56"
      expect(extractRawDigits('$1.234,56')).toBe('1234,56');
    });

    it('should return empty string for null/undefined', () => {
      expect(extractRawDigits(null)).toBe('');
      expect(extractRawDigits(undefined)).toBe('');
    });

    it('should return empty string for empty input', () => {
      expect(extractRawDigits('')).toBe('');
    });
  });

  describe('formatRawDisplay', () => {
    it('should format raw decimal number with Venezuelan locale', () => {
      const result = formatRawDisplay('28028.33');
      expect(result).toBe('28.028,33');
    });

    it('should format integer without decimals', () => {
      expect(formatRawDisplay('1000')).toBe('1.000');
    });

    it('should keep trailing comma for unfinished decimal input', () => {
      // rawAmount con punto decimal (ej: usuario escribe "1000," → extractRawDigits "1000,")
      expect(formatRawDisplay('1000,')).toBe('1.000,');
    });

    it('should handle zero', () => {
      expect(formatRawDisplay('0')).toBe('0');
    });
  });

  describe('QUICK_USD', () => {
    it('should be an array of preset USD amounts', () => {
      expect(Array.isArray(QUICK_USD)).toBe(true);
      expect(QUICK_USD.length).toBe(6);
      expect(QUICK_USD[0]).toBe(100);
      expect(QUICK_USD[5]).toBe(50000);
    });
  });

  describe('formatCurrency', () => {
    it('should format with locale es-VE', () => {
      const result = formatCurrency(80);
      expect(typeof result).toBe('string');
    });
  });
});

describe('useConverterData - Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchWithOfflineFallback.mockResolvedValue(mockRates);
    getStoredBCVLunes.mockResolvedValue({ value: 78, updatedAt: null });
  });

  it('should load rates on mount', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {}); // flush effects
    expect(hook.rates.bcv).toBe(80);
    expect(hook.rates.paralelo).toBe(95);
    expect(hook.rates.euro).toBe(85);
    expect(hook.rates.binance_p2p).toBe(92);
  });

  it('should start with "bcv" as selected rate', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    expect(hook.selectedRate).toBe('bcv');
  });

  it('should start in usd-to-bs mode', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    expect(hook.mode).toBe('usd-to-bs');
  });

  it('should convert USD to BS when handleConvert is called', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    act(() => { hook.setRawAmount('100'); });
    act(() => { hook.handleConvert(); });
    // 100 USD * 80 BCV rate = 8000 BS
    expect(hook.result).not.toBeNull();
    expect(hook.result.converted).toBe(8000);
  });

  it('should swap conversion mode', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    act(() => { hook.setRawAmount('123.45'); });
    act(() => { hook.handleSwapMode(); });
    expect(hook.mode).toBe('bs-to-usd');
    expect(hook.result).toBeNull();
    expect(hook.rawAmount).toBe('123.45');
  });

  it('should clear stale result on swap but keep amount', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    act(() => { hook.setRawAmount('10'); });
    act(() => { hook.setMode('usd-to-bs'); });
    // simulate a previous conversion result
    act(() => { hook.setResult({ amount: 10, rate: 100, converted: 1000 }); });
    act(() => { hook.handleSwapMode(); });
    expect(hook.mode).toBe('bs-to-usd');
    expect(hook.rawAmount).toBe('10');
    expect(hook.result).toBeNull();
  });

  it('should change selected rate', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    act(() => { hook.setSelectedRate('paralelo'); });
    expect(hook.selectedRate).toBe('paralelo');
  });

  it('should set quick amount', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    act(() => { hook.handleQuickAmount(500); });
    expect(hook.rawAmount).toBe('500');
  });

  it('should extract digits when text changes', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    act(() => { hook.handleChangeText('28.028,33'); });
    expect(hook.rawAmount).toBe('28028,33');
  });

  it('should calculate spreadBCV when both rates exist', async () => {
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    expect(hook.spreadBcv).not.toBeNull();
    // Paralelo 95, BCV 80 → diff = 15, diffPercent = (15/80)*100 = 18.75
    expect(hook.spreadBcv.diffPercent).toBeCloseTo(18.75, 1);
    expect(hook.spreadBcv.barColor).toBe('highlight'); // > 15%
  });

  it('should return null spreadBCV when rates missing', async () => {
    fetchWithOfflineFallback.mockResolvedValue({
      ...mockRates,
      data: { tasaBCV: null, tasaParalelo: null, tasaEuro: null, tasaBinanceP2P: null },
    });
    let hook;
    await act(async () => {
      TestRenderer.create(<TestComp onReady={(h) => { hook = h; }} />);
    });
    await act(async () => {});
    expect(hook.spreadBcv).toBeNull();
  });
});
