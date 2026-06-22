import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';

const STORAGE_KEY_BCV_LUNES = '@tasa_del_dia/bcv_lunes';
const STORAGE_KEY_REMINDER = '@tasa_del_dia/reminder_enabled';

const { BASE_URL } = API_CONFIG;

/**
 * Wrapper around fetch with AbortController timeout.
 * Aborts the request if it takes longer than timeoutMs.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch USD rates (BCV oficial and paralelo) from DolarApi.com.
 */
export async function fetchAllRates() {
  const [oficialRes, paraleloRes] = await Promise.all([
    fetchWithTimeout(`${BASE_URL}/dolares/oficial`),
    fetchWithTimeout(`${BASE_URL}/dolares/paralelo`),
  ]);

  if (!oficialRes.ok || !paraleloRes.ok) {
    throw new Error('Error al obtener tasas USD');
  }

  const oficial = await oficialRes.json();
  const paralelo = await paraleloRes.json();

  return {
    rates: {
      reference: { mid: oficial.promedio, updatedAt: oficial.fechaActualizacion },
      parallel: { mid: paralelo.promedio, updatedAt: paralelo.fechaActualizacion },
    },
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch EUR rate (BCV oficial) from DolarApi.com.
 */
export async function fetchBCVCurrencies() {
  const res = await fetchWithTimeout(`${BASE_URL}/euros/oficial`);
  if (!res.ok) {
    throw new Error('Error al obtener tasa EUR');
  }
  const data = await res.json();
  return {
    rates: { EUR: data.promedio },
    referenceDate: data.fechaActualizacion,
    capturedAt: data.fechaActualizacion,
  };
}

/**
 * Obtiene la tasa de BCV Lunes almacenada localmente.
 * Retorna: { value: number | null, updatedAt: string | null }
 */
export async function getStoredBCVLunes() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_BCV_LUNES);
    if (!raw) return { value: null, updatedAt: null };
    const parsed = JSON.parse(raw);
    // Compatibilidad: si era un número raw (formato anterior)
    if (typeof parsed === 'number') {
      return { value: parsed, updatedAt: null };
    }
    return { value: parsed?.value ?? null, updatedAt: parsed?.updatedAt ?? null };
  } catch {
    return { value: null, updatedAt: null };
  }
}

/**
 * Guarda la tasa de BCV Lunes en almacenamiento local junto con la fecha/hora.
 */
export async function setStoredBCVLunes(value) {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(STORAGE_KEY_BCV_LUNES);
    } else {
      await AsyncStorage.setItem(STORAGE_KEY_BCV_LUNES, JSON.stringify({ value, updatedAt: new Date().toISOString() }));
    }
  } catch {}
}

/**
 * Obtiene si el recordatorio de los viernes está activado.
 */
export async function getReminderEnabled() {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY_REMINDER);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Activa o desactiva el recordatorio de los viernes.
 */
export async function setReminderEnabled(enabled) {
  try {
    if (enabled) {
      await AsyncStorage.setItem(STORAGE_KEY_REMINDER, 'true');
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_REMINDER);
    }
  } catch {}
}

/**
 * Fetch Binance P2P USDT/VES rate directly from Binance's public API.
 * Uses POST with JSON body — no API key required.
 * Returns the best sell offer price or null on failure.
 */
export async function fetchBinanceP2P() {
  try {
    const res = await fetchWithTimeout(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: 'USDT',
          fiat: 'VES',
          tradeType: 'BUY',
          rows: 1,
          page: 1,
        }),
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const price = json?.data?.[0]?.adv?.price;
    return price ? parseFloat(price) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch all data needed for the app in parallel.
 * Uses allSettled so one endpoint failing doesn't kill the other.
 */
export async function fetchAllData() {
  const [usdResult, bcvResult, binanceResult] = await Promise.allSettled([
    fetchAllRates(),
    fetchBCVCurrencies(),
    fetchBinanceP2P(),
  ]);

  const usdRates = usdResult.status === 'fulfilled' ? usdResult.value : null;
  const bcvCurrencies = bcvResult.status === 'fulfilled' ? bcvResult.value : null;
  const tasaBinanceP2P = binanceResult.status === 'fulfilled' ? binanceResult.value : null;

  if (!usdRates) {
    throw new Error(usdResult.reason?.message || 'Error al obtener tasas USD');
  }

  const result = {
    tasaBCV: usdRates.rates.reference?.mid ?? null,
    tasaParalelo: usdRates.rates.parallel?.mid ?? null,
    tasaBinanceP2P,
    tasaEuro: bcvCurrencies?.rates?.EUR ?? null,
    usdFetchedAt: usdRates.fetchedAt,
    eurReferenceDate: bcvCurrencies?.referenceDate ?? null,
    eurCapturedAt: bcvCurrencies?.capturedAt ?? null,
  };

  await saveCacheRates(result);

  return result;
}

/**
 * Intenta cargar datos desde la API. Si falla, intenta cargar desde caché.
 * Retorna { data, fromCache, cacheInfo } indicando si vino de caché.
 */
export async function fetchWithOfflineFallback() {
  try {
    const data = await fetchAllData();
    return { data, fromCache: false, error: null };
  } catch (error) {
    const msg = error.message || '';
    const isNetworkError = msg.includes('abort') || msg.includes('Network request failed') || msg.includes('fetch');
    const cache = await loadCacheRates();
    if (cache && (cache.tasaBCV !== null || cache.tasaParalelo !== null)) {
      return {
        data: cache,
        fromCache: true,
        error: isNetworkError ? 'Sin conexión — mostrando datos guardados' : `Error de API: ${msg}`,
        cacheInfo: { cachedAt: cache.cachedAt },
      };
    }
    return { data: null, fromCache: false, error: msg || 'Error al obtener las tasas' };
  }
}

// ─── Caché Offline ────────────────────────────────────────────────

const STORAGE_KEY_CACHE = '@tasa_del_dia/cache_rates';

/**
 * Guarda las tasas en caché para uso offline.
 */
export async function saveCacheRates(data) {
  try {
    const cache = {
      tasaBCV: data.tasaBCV,
      tasaParalelo: data.tasaParalelo,
      tasaBinanceP2P: data.tasaBinanceP2P,
      tasaEuro: data.tasaEuro,
      usdFetchedAt: data.usdFetchedAt,
      eurCapturedAt: data.eurCapturedAt,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(cache));
    return true;
  } catch {
    return false;
  }
}

/**
 * Carga las tasas desde el caché offline.
 * Retorna null si no hay caché.
 */
export async function loadCacheRates() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CACHE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Historial de tasas (DolarApi + local) ────────────────────────────

const STORAGE_KEY_HISTORICAL = '@tasa_del_dia/historical_rates';
const STORAGE_KEY_HISTORICAL_API_CACHE = '@tasa_del_dia/historical_api_cache';

/**
 * Fetch historical rates desde DolarApi.com.
 * Retorna un array de { dateKey, bcv, paralelo } o null si falla.
 * El endpoint devuelve 945+ registros desde 2023 con fuentes "oficial" y "paralelo".
 * ponytail: transformar el array plano a dict agrupado por fecha.
 */
async function fetchHistoricalFromAPI() {
  try {
    // Intentar cache primero (1 hora TTL)
    const cached = await getHistoricalAPICache();
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let data;
    try {
      const res = await fetch('https://ve.dolarapi.com/v1/historicos/dolares', {
        signal: controller.signal,
      });
      if (!res.ok) return null;
      data = await res.json();
    } finally {
      clearTimeout(timeoutId);
    }

    if (!Array.isArray(data) || data.length === 0) return null;

    // Agrupar por fecha: un entry por día con bcv (oficial) y paralelo
    const grouped = {};
    for (const entry of data) {
      const date = entry.fecha; // "YYYY-MM-DD"
      if (!date) continue;
      if (!grouped[date]) grouped[date] = { bcv: null, paralelo: null };
      if (entry.fuente === 'oficial' && entry.promedio != null) {
        grouped[date].bcv = entry.promedio;
      } else if (entry.fuente === 'paralelo' && entry.promedio != null) {
        grouped[date].paralelo = entry.promedio;
      }
    }

    // Cachear por 1 hora
    await setHistoricalAPICache(grouped);

    return grouped;
  } catch {
    return null;
  }
}

async function getHistoricalAPICache() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORICAL_API_CACHE);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > 60 * 60 * 1000) return null; // 1 hora
    return cache.data;
  } catch {
    return null;
  }
}

async function setHistoricalAPICache(data) {
  try {
    const cache = { data, cachedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY_HISTORICAL_API_CACHE, JSON.stringify(cache));
  } catch {}
}

/**
 * Obtiene el historial completo:
 * 1. Intenta DolarApi (con cache de 1h)
 * 2. Merge con datos locales (BCV Lunes manual, Binance, Euro)
 * 3. Los datos locales tienen prioridad (sobrescriben bcv si el usuario editó manualmente)
 */
export async function getHistoricalRates() {
  try {
    // Cargar datos locales (siempre disponibles)
    const localRaw = await AsyncStorage.getItem(STORAGE_KEY_HISTORICAL);
    const local = localRaw ? JSON.parse(localRaw) : {};

    // Intentar datos de DolarApi (pueden fallar por red)
    const apiData = await fetchHistoricalFromAPI();

    if (!apiData) {
      // Sin API: devolver solo datos locales
      return local;
    }

    // Merge: API como base, local sobrescribe
    const merged = { ...apiData };
    for (const [dateKey, localEntry] of Object.entries(local)) {
      if (merged[dateKey]) {
        // Local sobrescribe campos específicos, conserva paralelo de API si local no lo tiene
        merged[dateKey] = {
          ...merged[dateKey],
          ...localEntry,
          bcv: localEntry.bcv ?? merged[dateKey].bcv,
          paralelo: localEntry.paralelo ?? merged[dateKey].paralelo,
        };
      } else {
        // Fecha que no existe en API (datos manuales del usuario)
        merged[dateKey] = localEntry;
      }
    }

    return merged;
  } catch {
    // Fallback total: solo locales
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORICAL);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}

/**
 * Guarda un conjunto de tasas para una fecha específica.
 * Lee/escribe SOLO el storage local (no pasa por getHistoricalRates que mergea API).
 * Conserva máximo 365 días de historial local.
 * @param {string} dateKey - "YYYY-MM-DD"
 * @param {{ bcv, paralelo, binance_p2p, euro, fetchedAt }} rates
 */
export async function saveHistoricalRate(dateKey, rates) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORICAL);
    const all = raw ? JSON.parse(raw) : {};

    all[dateKey] = {
      ...all[dateKey],
      bcv: rates.bcv ?? all[dateKey]?.bcv ?? null,
      paralelo: rates.paralelo ?? all[dateKey]?.paralelo ?? null,
      binance_p2p: rates.binance_p2p ?? all[dateKey]?.binance_p2p ?? null,
      euro: rates.euro ?? all[dateKey]?.euro ?? null,
      fetchedAt: rates.fetchedAt ?? all[dateKey]?.fetchedAt ?? new Date().toISOString(),
    };

    // Mantener solo los últimos 365 días
    const entries = Object.entries(all);
    if (entries.length > 365) {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      const trimmed = Object.fromEntries(entries.slice(-365));
      await AsyncStorage.setItem(STORAGE_KEY_HISTORICAL, JSON.stringify(trimmed));
    } else {
      await AsyncStorage.setItem(STORAGE_KEY_HISTORICAL, JSON.stringify(all));
    }
  } catch {}
}

/**
 * Retorna el key de fecha de hoy en formato "YYYY-MM-DD".
 */
export function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte DDMMAAAA o DD/MM/AAAA a YYYY-MM-DD.
 */
export function parseDateDDMMYYYY(text) {
  const cleaned = text.replace(/[^0-9]/g, '');
  if (cleaned.length !== 8) return null;
  const dd = parseInt(cleaned.slice(0, 2), 10);
  const mm = parseInt(cleaned.slice(2, 4), 10);
  const yyyy = parseInt(cleaned.slice(4, 8), 10);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 2020 || yyyy > new Date().getFullYear() + 1) return null;
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

/**
 * Formatea YYYY-MM-DD a DD/MM/AAAA para mostrar.
 */
export function formatDateKey(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-');
  return `${d}/${m}/${y}`;
}
