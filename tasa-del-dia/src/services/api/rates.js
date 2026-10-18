import { API_CONFIG } from '../../constants';
import { fetchWithTimeout } from './network';

const { BASE_URL } = API_CONFIG;

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
 * Fetch Binance P2P USDT/VES rate directly from Binance's public API.
 * Usa POST con JSON body — no requiere API key.
 *
 * Solución robusta vs el endpoint oficial (que no expone P2P):
 * 1. Pide las 10 mejores ofertas BUY en vez de una sola.
 * 2. Descarta el outlier más alto y el más bajo (promedio recortado),
 *    para que una oferta anómala no distorsione la tasa.
 * 3. Envía User-Agent de navegador (Binance rechaza algunos UA de fetch).
 * Retorna el promedio redondeado o null si falla.
 */
const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
const BINANCE_UA = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

async function fetchBinanceOffers(rows = 10) {
  const res = await fetchWithTimeout(
    BINANCE_P2P_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': BINANCE_UA,
      },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: 'VES',
        tradeType: 'BUY',
        rows,
        page: 1,
      }),
    },
  );
  if (!res.ok) return [];
  const json = await res.json();
  return (json?.data || [])
    .map(offer => parseFloat(offer?.adv?.price))
    .filter(price => Number.isFinite(price) && price > 0);
}

export async function fetchBinanceP2P() {
  try {
    const prices = await fetchBinanceOffers(10);
    if (prices.length === 0) return null;

    // Promedio recortado: elimina el mínimo y el máximo para resistir outliers
    prices.sort((a, b) => a - b);
    const trimmed = prices.length >= 4 ? prices.slice(1, -1) : prices;
    const avg = trimmed.reduce((sum, p) => sum + p, 0) / trimmed.length;
    return Math.round(avg * 100) / 100;
  } catch {
    return null;
  }
}
