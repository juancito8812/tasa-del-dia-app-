import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';

const STORAGE_KEY_BCV_LUNES = '@tasa_del_dia/bcv_lunes';
const STORAGE_KEY_REMINDER = '@tasa_del_dia/reminder_enabled';

const { BASE_URL, API_KEY } = API_CONFIG;

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

const headers = {
  'X-API-Key': API_KEY,
  'Accept': 'application/json',
};

/**
 * Fetch all USD rates (BCV, parallel, P2P) in a single call.
 * Returns: { bcv, parallel, binance_p2p, ... }
 */
export async function fetchAllRates() {
  const url = `${BASE_URL}/v1/fx/rates`;
  const response = await fetchWithTimeout(url, { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error HTTP ${response.status}`);
  }

  const data = await response.json();
  const ratesMap = {};

  for (const rate of data.rates) {
    ratesMap[rate.market] = {
      market: rate.market,
      type: rate.type,
      mid: rate.mid,
      ask: rate.ask ?? rate.mid,
      bid: rate.bid ?? rate.mid,
      updatedAt: rate.updated_at,
    };
  }

  return {
    rates: ratesMap,
    fetchedAt: data.fetched_at,
    base: data.base,
    currency: data.currency,
  };
}

/**
 * Fetch BCV non-USD currencies (EUR, CNY, TRY, RUB).
 * Returns: { EUR: 96.45, ... }
 */
export async function fetchBCVCurrencies() {
  const url = `${BASE_URL}/v1/fx/bcv/currencies`;
  const response = await fetchWithTimeout(url, { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Error HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    rates: data.rates,
    referenceDate: data.reference_value_date,
    capturedAt: data.captured_at,
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
    // Compatibilidad: si era un string plano (formato anterior), lo migramos
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
      await AsyncStorage.setItem(STORAGE_KEY_REMINDER, 'false');
    }
  } catch {}
}

/**
 * Fetch all data needed for the app in parallel.
 */
export async function fetchAllData() {
  const [usdRates, bcvCurrencies] = await Promise.all([
    fetchAllRates(),
    fetchBCVCurrencies(),
  ]);

  const result = {
    tasaBCV: usdRates.rates.reference?.mid ?? null,
    tasaParalelo: usdRates.rates.parallel?.mid ?? null,
    tasaBinanceP2P: usdRates.rates.binance?.mid ?? null,
    tasaEuro: bcvCurrencies.rates.EUR ?? null,
    usdFetchedAt: usdRates.fetchedAt,
    eurReferenceDate: bcvCurrencies.referenceDate,
    eurCapturedAt: bcvCurrencies.capturedAt,
  };

  // Save to offline cache on success
  saveCacheRates(result);

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
    // Try loading from cache
    const cache = await loadCacheRates();
    if (cache && (cache.tasaBCV !== null || cache.tasaParalelo !== null)) {
      return {
        data: cache,
        fromCache: true,
        error: error.message || 'Error al obtener las tasas',
        cacheInfo: { cachedAt: cache.cachedAt },
      };
    }
    // No cache available
    return { data: null, fromCache: false, error: error.message || 'Error al obtener las tasas' };
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

// ─── Historial de tasas ─────────────────────────────────────────────

const STORAGE_KEY_HISTORICAL = '@tasa_del_dia/historical_rates';

/**
 * Obtiene el historial completo de tasas guardadas (por fecha).
 * Retorna un objeto { "YYYY-MM-DD": { bcv, paralelo, binance_p2p, euro, fetchedAt }, ... }
 */
export async function getHistoricalRates() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORICAL);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Guarda un conjunto de tasas para una fecha específica.
 * @param {string} dateKey - "YYYY-MM-DD"
 * @param {{ bcv, paralelo, binance_p2p, euro, fetchedAt }} rates
 */
export async function saveHistoricalRate(dateKey, rates) {
  try {
    const all = await getHistoricalRates();
    // Solo sobreescribe si no existe o si los nuevos datos son más completos
    if (!all[dateKey] || rates.bcv !== null) {
      all[dateKey] = {
        bcv: rates.bcv ?? null,
        paralelo: rates.paralelo ?? null,
        binance_p2p: rates.binance_p2p ?? null,
        euro: rates.euro ?? null,
        fetchedAt: rates.fetchedAt ?? new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY_HISTORICAL, JSON.stringify(all));
    }
  } catch {}
}

/**
 * Guarda manualmente las tasas para una fecha (ingreso manual del usuario).
 * @param {string} dateKey - "YYYY-MM-DD"
 * @param {{ bcv, paralelo, binance_p2p, euro }} rates
 */
export async function setManualHistoricalRate(dateKey, rates) {
  try {
    const all = await getHistoricalRates();
    all[dateKey] = {
      bcv: rates.bcv ?? null,
      paralelo: rates.paralelo ?? null,
      binance_p2p: rates.binance_p2p ?? null,
      euro: rates.euro ?? null,
      fetchedAt: new Date().toISOString(),
      manual: true,
    };
    await AsyncStorage.setItem(STORAGE_KEY_HISTORICAL, JSON.stringify(all));
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
 * Convierte fecha en formato DD/MM/AAAA a YYYY-MM-DD.
 */
export function parseDateDDMMYYYY(text) {
  const parts = text.replace(/[^0-9/]/g, '').split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!dd || !mm || !yyyy || dd > 31 || mm > 12 || yyyy < 2020 || yyyy > 2030) return null;
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
