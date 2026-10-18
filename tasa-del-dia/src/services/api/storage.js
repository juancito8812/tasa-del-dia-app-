import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_BCV_LUNES = '@tasa_del_dia/bcv_lunes';
const STORAGE_KEY_REMINDER = '@tasa_del_dia/reminder_enabled';
const STORAGE_KEY_CACHE = '@tasa_del_dia/cache_rates';

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

// ─── Suscripción a cambios de BCV Lunes ────────────────────────────
// Permite que hooks ya montados (ej. useConverterData, cuyas pestañas
// son lazy-mount) se enteren al instante cuando se guarda la tasa del
// lunes desde Tasas, sin tener que re-montar ni re-fetchear.
const bcvLunesListeners = new Set();

export function subscribeBcvLunes(fn) {
  bcvLunesListeners.add(fn);
  return () => { bcvLunesListeners.delete(fn); };
}

export function emitBcvLunesChanged(value) {
  bcvLunesListeners.forEach((fn) => {
    try { fn(value); } catch {}
  });
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

// ─── Caché Offline ────────────────────────────────────────────────

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
