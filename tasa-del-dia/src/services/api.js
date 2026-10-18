/**
 * Fachada pública del servicio de API.
 *
 * El módulo se dividió por dominio en `src/services/api/`:
 *   - network.js    → fetch base con timeout (AbortController)
 *   - rates.js      → tasas BCV / paralelo / EUR / Binance P2P
 *   - storage.js    → cache local (AsyncStorage) y suscripción BCV Lunes
 *   - history.js    → histórico de tasas (DolarApi + local)
 *   - aggregate.js  → fetchAllData y fallback offline
 *
 * Este archivo re-exporta TODO lo que exportaba antes, para que los
 * imports existentes ('../services/api', './api') sigan sin cambios.
 */

export { fetchAllRates, fetchBCVCurrencies, fetchBinanceP2P } from './api/rates';

export {
  getStoredBCVLunes,
  setStoredBCVLunes,
  subscribeBcvLunes,
  emitBcvLunesChanged,
  getReminderEnabled,
  setReminderEnabled,
  saveCacheRates,
  loadCacheRates,
} from './api/storage';

export {
  getHistoricalRates,
  saveHistoricalRate,
  getTodayKey,
  parseDateDDMMYYYY,
  formatDateKey,
} from './api/history';

export { fetchAllData, fetchWithOfflineFallback } from './api/aggregate';
