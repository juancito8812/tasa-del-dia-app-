import React from 'react';
import TestRenderer from 'react-test-renderer';
import useAutoRefresh from '../useAutoRefresh';

jest.mock('../../constants', () => ({
  API_CONFIG: {
    BASE_URL: 'https://api.cotizave.com',
    API_KEY: 'test-key',
    REFRESH_INTERVAL: 1500000,
  },
  darkTheme: {},
  lightTheme: {},
}));

// Helper component to capture hook state
function HookTest({ hook, render }) {
  const result = hook();
  render(result);
  return null;
}

function renderHook(hookFn) {
  const results = [];
  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(
      <HookTest hook={hookFn} render={(r) => results.push(r)} />
    );
  });
  return { results, renderer };
}

describe('useAutoRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes countdown to REFRESH_INTERVAL / 1000', () => {
    const { results } = renderHook(() => useAutoRefresh(jest.fn()));
    expect(results[0].countdown).toBe(1500);
  });

  it('decrements countdown every second', () => {
    const { results } = renderHook(() => useAutoRefresh(jest.fn()));

    TestRenderer.act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(results[results.length - 1].countdown).toBe(1499);
  });

  it('calls onRefresh after REFRESH_INTERVAL ms', () => {
    const onRefresh = jest.fn();
    renderHook(() => useAutoRefresh(onRefresh));

    TestRenderer.act(() => {
      jest.advanceTimersByTime(1500000);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('resets countdown after refresh', () => {
    const onRefresh = jest.fn();
    const { results } = renderHook(() => useAutoRefresh(onRefresh));

    TestRenderer.act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(results[results.length - 1].countdown).toBe(1495);

    TestRenderer.act(() => {
      jest.advanceTimersByTime(1495000);
    });

    // After refresh, countdown should be reset to max
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('resetCountdown sets countdown back to max', () => {
    const onRefresh = jest.fn();
    const { results } = renderHook(() => useAutoRefresh(onRefresh));

    TestRenderer.act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(results[results.length - 1].countdown).toBe(1490);

    TestRenderer.act(() => {
      results[results.length - 1].resetCountdown();
    });

    expect(results[results.length - 1].countdown).toBe(1500);
  });

  it('prevents countdown from going below 0', () => {
    const onRefresh = jest.fn();
    const { results } = renderHook(() => useAutoRefresh(onRefresh));

    TestRenderer.act(() => {
      jest.advanceTimersByTime(1800000);
    });

    expect(results[results.length - 1].countdown).toBeGreaterThanOrEqual(0);
  });

  it('calls the latest onRefresh callback via ref', () => {
    const onRefresh1 = jest.fn();
    const onRefresh2 = jest.fn();

    // Initial render with onRefresh1
    const { renderer } = renderHook(() => useAutoRefresh(onRefresh1));

    // Re-render with onRefresh2
    TestRenderer.act(() => {
      renderer.update(
        <HookTest hook={() => useAutoRefresh(onRefresh2)} render={() => {}} />
      );
    });

    TestRenderer.act(() => {
      jest.advanceTimersByTime(1500000);
    });

    expect(onRefresh2).toHaveBeenCalledTimes(1);
    expect(onRefresh1).not.toHaveBeenCalled();
  });

  it('cleans up intervals on unmount', () => {
    const onRefresh = jest.fn();
    const { renderer } = renderHook(() => useAutoRefresh(onRefresh));

    TestRenderer.act(() => {
      renderer.unmount();
    });

    TestRenderer.act(() => {
      jest.advanceTimersByTime(1500000);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
