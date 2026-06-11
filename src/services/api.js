import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';

const STORAGE_KEY_BCV_LUNES = '@tasa_del_dia/bcv_lunes';
const STORAGE_KEY_REMINDER = '@tasa_del_dia/reminder_enabled';

const { BASE_URL, API_KEY } = API_CONFIG;

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
  const response = await fetch(url, { headers });

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
  const response = await fetch(url, { headers });

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

  return {
    tasaBCV: usdRates.rates.reference?.mid ?? null,
    tasaParalelo: usdRates.rates.parallel?.mid ?? null,
    tasaBinanceP2P: usdRates.rates.binance?.mid ?? null,
    tasaEuro: bcvCurrencies.rates.EUR ?? null,
    usdFetchedAt: usdRates.fetchedAt,
    eurReferenceDate: bcvCurrencies.referenceDate,
    eurCapturedAt: bcvCurrencies.capturedAt,
  };
}
