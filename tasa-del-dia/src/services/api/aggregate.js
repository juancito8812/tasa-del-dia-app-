import { fetchAllRates, fetchBCVCurrencies, fetchBinanceP2P } from './rates';
import { saveCacheRates, loadCacheRates } from './storage';

/**
 * Fetch all data needed for the app in parallel.
 * Uses allSettled so one endpoint failing doesn't kill the other.
 * Deduplica llamadas concurrentes: si RatesScreen y ConverterScreen
 * montan al mismo tiempo, comparten una sola petición de red.
 */
let fetchAllDataInFlight = null;

async function doFetchAllData() {
  const [usdResult, bcvResult, binanceResult] = await Promise.allSettled([
    fetchAllRates(),
    fetchBCVCurrencies(),
    fetchBinanceP2P(),
  ]);

  const usdRates = usdResult.status === 'fulfilled' ? usdResult.value : null;
  const bcvCurrencies = bcvResult.status === 'fulfilled' ? bcvResult.value : null;
  const tasaBinanceP2P = binanceResult.status === 'fulfilled' ? binanceResult.value : null;
  const usdError = usdResult.status === 'rejected' ? usdResult.reason : null;

  if (!usdRates) {
    throw new Error(usdError?.message || 'Error al obtener tasas USD');
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

export async function fetchAllData() {
  if (fetchAllDataInFlight) return fetchAllDataInFlight;
  fetchAllDataInFlight = doFetchAllData();
  try {
    return await fetchAllDataInFlight;
  } finally {
    fetchAllDataInFlight = null;
  }
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
