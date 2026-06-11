import { useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../constants';

const REFRESH_SECONDS = API_CONFIG.REFRESH_INTERVAL / 1000; // 1500 seconds = 25 min

/**
 * Custom hook that auto-refreshes data at a fixed interval and tracks
 * a countdown (in seconds) until the next refresh.
 *
 * @param {Function} onRefresh - Callback to invoke on each auto-refresh.
 *                               Typically a function that calls loadRates(true).
 * @returns {{ countdown: number, resetCountdown: () => void }}
 */
export default function useAutoRefresh(onRefresh) {
  const [countdown, setCountdown] = useState(REFRESH_SECONDS);
  const savedCallback = useRef(onRefresh);

  // Keep the ref in sync so stale closures don't bite us
  useEffect(() => {
    savedCallback.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    // Initialise countdown
    setCountdown(REFRESH_SECONDS);

    // Actual refresh every REFRESH_INTERVAL ms
    const refreshId = setInterval(() => {
      savedCallback.current?.();
      setCountdown(REFRESH_SECONDS);
    }, API_CONFIG.REFRESH_INTERVAL);

    // Countdown tick every second
    const tickId = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(refreshId);
      clearInterval(tickId);
    };
    // Intentionally empty – we want a single stable interval for the
    // lifetime of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCountdown = () => {
    setCountdown(REFRESH_SECONDS);
  };

  return { countdown, resetCountdown };
}
