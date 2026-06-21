import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { API_CONFIG } from '../constants';

export default function useAutoRefresh(onRefresh) {
  const savedCallback = useRef(onRefresh);
  const intervalRef = useRef(null);

  useEffect(() => {
    savedCallback.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const startInterval = () => {
      intervalRef.current = setInterval(() => {
        savedCallback.current?.();
      }, API_CONFIG.REFRESH_INTERVAL);
    };

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        clearInterval(intervalRef.current);
        startInterval();
      } else {
        clearInterval(intervalRef.current);
      }
    });

    startInterval();

    return () => {
      clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, []);
}
