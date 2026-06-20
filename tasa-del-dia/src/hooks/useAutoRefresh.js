import { useEffect, useRef } from 'react';
import { API_CONFIG } from '../constants';

export default function useAutoRefresh(onRefresh) {
  const savedCallback = useRef(onRefresh);

  useEffect(() => {
    savedCallback.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const refreshId = setInterval(() => {
      savedCallback.current?.();
    }, API_CONFIG.REFRESH_INTERVAL);
    return () => clearInterval(refreshId);
  }, []);
}
