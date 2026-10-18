import { API_CONFIG } from '../../constants';

/**
 * fetch con timeout basado en AbortController.
 * Base compartida por todos los módulos de red de la API.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = API_CONFIG.FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
