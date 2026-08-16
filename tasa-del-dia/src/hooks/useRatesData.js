import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { API_CONFIG } from '../constants';
import {
  fetchWithOfflineFallback,
  loadCacheRates,
  getStoredBCVLunes,
  setStoredBCVLunes,
  getReminderEnabled,
  setReminderEnabled as persistReminderEnabled,
  saveHistoricalRate,
  getTodayKey,
} from '../services/api';
import {
  scheduleFridayReminder,
  cancelFridayReminder,
  ensureReminderScheduled,
} from '../services/notifications';

/**
 * @typedef {object} RatesData
 * @property {number|null} tasaBCV
 * @property {number|null} tasaParalelo
 * @property {number|null} tasaEuro
 * @property {number|null} tasaBinanceP2P
 * @property {string|null} usdFetchedAt
 * @property {string|null} eurCapturedAt
 */

export default function useRatesData() {
  /** @type {RatesData} */
  const initialData = {
    tasaBCV: null,
    tasaParalelo: null,
    tasaEuro: null,
    tasaBinanceP2P: null,
    usdFetchedAt: null,
    eurCapturedAt: null,
  };
  const [data, setData] = useState(initialData);
  const [tasaBCVLunes, setTasaBCVLunes] = useState(null);
  const [bcvLunesUpdatedAt, setBcvLunesUpdatedAt] = useState(null);
  const [reminderEnabled, setReminderEnabledLocal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineCachedAt, setOfflineCachedAt] = useState(null);

  // SWR (stale-while-revalidate): mientras se muestra la caché guardada,
  // no guardar historial con datos viejos como si fueran de hoy.
  const staleRef = useRef(false);

  const loadRates = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      // Fase 1 — mostrar la caché guardada al instante (sin banner offline),
      // mientras la red revalida en background. Mejora el primer pintado
      // en conexiones lentas: el usuario ve tasas de inmediato.
      const cache = await loadCacheRates();
      if (cache && (cache.tasaBCV !== null || cache.tasaParalelo !== null)) {
        staleRef.current = true;
        setData(cache);
        setLoading(false);
        setRefreshing(false);
      }

      const { data: result, fromCache, error: fetchError, cacheInfo } = await fetchWithOfflineFallback();
      staleRef.current = false;

      if (fromCache && result) {
        setData(result);
        setOfflineMode(true);
        setOfflineCachedAt(cacheInfo?.cachedAt || null);
      } else if (result) {
        setData(result);
        setOfflineMode(false);
        setOfflineCachedAt(null);
      }

      if (fetchError && !fromCache) {
        setError(fetchError);
      }
    } catch (err) {
      setError(err.message || 'Error al obtener las tasas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    const mounted = { current: true };
    loadRates();
    getStoredBCVLunes().then((d) => {
      if (mounted.current) {
        setTasaBCVLunes(d.value);
        setBcvLunesUpdatedAt(d.updatedAt);
      }
    }).catch((err) => { if (__DEV__) console.warn('[Rates] getStoredBCVLunes error:', err); });
    getReminderEnabled().then((enabled) => {
      if (mounted.current) {
        setReminderEnabledLocal(enabled);
        if (enabled) ensureReminderScheduled();
      }
    }).catch((err) => { if (__DEV__) console.warn('[Rates] getReminderEnabled error:', err); });
    return () => { mounted.current = false; };
  }, [loadRates]);

  // Auto-guardar tasas de hoy (solo cuando los datos vinieron de la red;
  // si se está mostrando caché mientras se revalida, no contaminar el historial)
  useEffect(() => {
    if (staleRef.current) return;
    if (data.tasaBCV !== null || data.tasaParalelo !== null) {
      saveHistoricalRate(getTodayKey(), {
        bcv: data.tasaBCV,
        paralelo: data.tasaParalelo,
        binance_p2p: data.tasaBinanceP2P,
        euro: data.tasaEuro,
        fetchedAt: data.usdFetchedAt,
      });
    }
  }, [data.tasaBCV, data.tasaParalelo, data.tasaBinanceP2P, data.tasaEuro, data.usdFetchedAt]);

  // Retry automático cuando offline
  const retryRef = useRef(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    if (offlineMode) {
      retryCountRef.current = 0;
      const maxRetries = API_CONFIG.OFFLINE_RETRY_MAX_ATTEMPTS;
      const initialDelay = API_CONFIG.OFFLINE_RETRY_INITIAL_DELAY;
      const maxDelay = API_CONFIG.OFFLINE_RETRY_MAX_DELAY;
      const tryReconnect = async () => {
        retryCountRef.current++;
        if (retryCountRef.current > maxRetries) return;
        try {
          const { data: result, fromCache } = await fetchWithOfflineFallback();
          if (result && !fromCache && !cancelled) {
            setData(result);
            setOfflineMode(false);
            setOfflineCachedAt(null);
            setError(null);
            retryCountRef.current = 0;
          }
        } catch (err) {
          if (__DEV__) console.warn('[Rates] retry fetch error:', err);
        }
        if (cancelled) return;
        const delay = Math.min(initialDelay * 1.5 ** (retryCountRef.current - 1), maxDelay);
        retryRef.current = setTimeout(tryReconnect, delay);
      };
      retryRef.current = setTimeout(tryReconnect, initialDelay);
    }
    return () => {
      cancelled = true;
      if (retryRef.current) { clearTimeout(retryRef.current); retryRef.current = null; }
      retryCountRef.current = 0;
    };
  }, [offlineMode]);

  // Handlers (estables: se pasan a componentes memoizados como BCVModal/RateCard)
  const onRefresh = useCallback(() => loadRates(true), [loadRates]);

  const handleSaveBCVLunes = useCallback((editValue) => {
    const normalized = editValue.includes(',')
      ? editValue.replace(/\./g, '').replace(',', '.')
      : editValue.replace(',', '.');
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed > 0) {
      setTasaBCVLunes(parsed);
      const now = new Date().toISOString();
      setBcvLunesUpdatedAt(now);
      setStoredBCVLunes(parsed);
      saveHistoricalRate(getTodayKey(), { bcv: parsed });
    } else {
      setTasaBCVLunes(null);
      setBcvLunesUpdatedAt(null);
      setStoredBCVLunes(null);
    }
  }, []);

  const handleToggleReminder = useCallback(async (value) => {
    if (value) {
      const success = await scheduleFridayReminder();
      if (success) {
        setReminderEnabledLocal(true);
        persistReminderEnabled(true);
      } else {
        Alert.alert(
          'Permiso requerido',
          'Para activar el recordatorio, debes permitir las notificaciones en la configuración del dispositivo.'
        );
      }
    } else {
      await cancelFridayReminder();
      setReminderEnabledLocal(false);
      persistReminderEnabled(false);
    }
  }, []);

  const formatEditTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMin < 1) return 'Ahora';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `Hace ${diffHour}h`;
      return d.toLocaleString('es-VE', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Valores derivados
  const bcv = Number(data.tasaBCV);
  const paralelo = Number(data.tasaParalelo);
  const lunes = Number(tasaBCVLunes);
  const brecha = data.tasaBCV != null && data.tasaParalelo != null && bcv > 0
    ? ((paralelo - bcv) / bcv) * 100
    : null;

  const brechaLunes = tasaBCVLunes != null && data.tasaParalelo != null && lunes > 0
    ? ((paralelo - lunes) / lunes) * 100
    : null;

  return {
    data, tasaBCVLunes, bcvLunesUpdatedAt, reminderEnabled,
    loading, refreshing, error, offlineMode, offlineCachedAt,
    onRefresh, handleSaveBCVLunes, handleToggleReminder, formatEditTime,
    brecha, brechaLunes,
  };
}
