import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const GITHUB_REPO = 'juancito8812/tasa-del-dia-app-';
const STORAGE_KEY_SKIP = '@tasa_del_dia/skip_version';
const STORAGE_KEY_UPDATE_CACHE = '@tasa_del_dia/update_cache';

/**
 * Compara dos versiones semver (ej: "1.0.1" vs "1.0.2").
 * Retorna: -1 si a < b, 0 si igual, 1 si a > b.
 * ponytail: split-map-compare en 10 líneas, sin dependencias externas.
 */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] || 0;
    const vb = pb[i] || 0;
    if (va !== vb) return va < vb ? -1 : 1;
  }
  return 0;
}

/**
 * Fetch latest release info desde GitHub API pública.
 * Retorna { version, apkUrl, notes, publishedAt } o null si falla.
 */
export async function checkLatestRelease() {
  try {
    // Intentar cache primero (30 min TTL para no abusar API)
    const cached = await getCachedUpdateInfo();
    if (cached) return cached;

    // AbortController wrapper (Hermes-safe, mismo patrón que api.js)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let data;
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/latest`,
        {
          headers: { Accept: 'application/vnd.github.v3+json' },
          signal: controller.signal,
        },
      );
      if (!res.ok) return null;
      data = await res.json();
    } finally {
      clearTimeout(timeoutId);
    }

    const tagName = data.tag_name || '';
    const version = tagName.replace(/^v/i, '');
    const apkAsset = data.assets?.find(a => a.name?.endsWith('.apk'));
    if (!version || !apkAsset) return null;

    const info = {
      version,
      apkUrl: apkAsset.browser_download_url,
      notes: data.body || '',
      publishedAt: data.published_at,
    };

    // Cachear por 30 min
    await cacheUpdateInfo(info);
    return info;
  } catch {
    return null;
  }
}

/**
 * Retorna true si hay una actualización disponible (versión release > versión actual).
 */
export function isUpdateAvailable(currentVersion, latestVersion) {
  if (!currentVersion || !latestVersion) return false;
  return compareVersions(currentVersion, latestVersion) < 0;
}

/**
 * Retorna la versión actual de la app desde app.config.js via expo-constants.
 */
export function getCurrentVersion() {
  return Constants.expoConfig?.version || '0.0.0';
}

/**
 * Descarga la APK y la abre con el instalador de Android.
 * Fallback: abre la URL en el navegador si falla la descarga directa.
 */
export async function downloadAndInstall(apkUrl) {
  if (!apkUrl || Platform.OS !== 'android') return false;
  try {
    const fileUri = FileSystem.cacheDirectory + 'TasaDelDia-update.apk';
    const download = FileSystem.createDownloadResumable(apkUrl, fileUri);
    const result = await download.downloadAsync();
    if (result?.uri) {
      await Linking.openURL(result.uri);
      return true;
    }
    return false;
  } catch {
    // Fallback: abrir URL en navegador
    try {
      await Linking.openURL(apkUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Guarda una versión para saltar (skip this version).
 */
export async function skipVersion(version) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SKIP, version);
  } catch {}
}

/**
 * Verifica si una versión fue saltada por el usuario.
 */
export async function isVersionSkipped(version) {
  try {
    const skipped = await AsyncStorage.getItem(STORAGE_KEY_SKIP);
    return skipped === version;
  } catch {
    return false;
  }
}

// ─── Cache de 30 min para evitar llamadas repetidas a GitHub API ───

async function cacheUpdateInfo(info) {
  try {
    const cache = { info, cachedAt: Date.now() };
    await AsyncStorage.setItem(STORAGE_KEY_UPDATE_CACHE, JSON.stringify(cache));
  } catch {}
}

async function getCachedUpdateInfo() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_UPDATE_CACHE);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    if (Date.now() - cache.cachedAt > 30 * 60 * 1000) return null;
    return cache.info;
  } catch {
    return null;
  }
}

// ─── Exponer compareVersions para tests ───
export { compareVersions };
