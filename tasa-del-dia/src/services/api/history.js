import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants';

const STORAGE_KEY_HISTORICAL = '@tasa_del_dia/historical_rates';
const STORAGE_KEY_HISTORICAL_API_CACHE = '@tasa_del_dia/historical_api_cache';

/**
 * Fetch historical rates desde DolarApi.com.
 * Retorna un array de { dateKey, bcv, paralelo } o null si falla.
 * El endpoint devuelve 945+ registros desde 2023 con fuentes "oficial" y "paralelo".
 * Transforma el array plano a dict agrupado por fecha.
 */
async function fetchHistoricalFromAPI() {
  try {
    const cached = await getHistoricalAPICache();
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.HISTORICAL_FETCH_TIMEOUT);

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
    if (Date.now() - cache.cachedAt > API_CONFIG.HISTORICAL_API_CACHE_TTL) return null;
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
 * @param {{ bcv?: number|null, paralelo?: number|null, binance_p2p?: number|null, euro?: number|null, bcv_lunes?: number|null, fetchedAt?: string|null }} rates
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
      // "BCV Lunes" es un valor manual independiente: NO debe escribir sobre
      // `bcv` (la tasa oficial del día), o corrompe el historial/gráfico.
      bcv_lunes: rates.bcv_lunes ?? all[dateKey]?.bcv_lunes ?? null,
      fetchedAt: rates.fetchedAt ?? all[dateKey]?.fetchedAt ?? new Date().toISOString(),
    };

    const maxDays = API_CONFIG.HISTORICAL_LOCAL_RETENTION_DAYS;
    const entries = Object.entries(all);
    if (entries.length > maxDays) {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
      const trimmed = Object.fromEntries(entries.slice(-maxDays));
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
  if (dd < 1 || mm < 1 || mm > 12 || yyyy < 2020 || yyyy > new Date().getFullYear() + 1) return null;
  // Validar días reales del mes (30/02, 31/04, etc.)
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  if (dd > daysInMonth) return null;
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
