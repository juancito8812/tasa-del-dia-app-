import AsyncStorage from '@react-native-async-storage/async-storage';
// IMPORTANTE: desde expo-file-system v19 (SDK 54) la API legacy solo está
// disponible vía el subpath '/legacy'. El import por defecto exporta la nueva
// API (File/Directory) y wrappers que lanzan error en runtime.
import * as FileSystem from 'expo-file-system/legacy';
import * as Linking from 'expo-linking';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_CONFIG } from '../constants';

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
 * Obtiene la última release semver desde GitHub,
 * sin depender de /releases/latest.
 */
function parseSemver(tag) {
  return tag.replace(/^v/i, '').match(/^(\d+\.\d+\.\d+)$/)?.[1] || null;
}

export async function checkLatestRelease() {
  try {
    const cached = await getCachedUpdateInfo();
    if (cached) return cached;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let data;
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`,
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

    if (!Array.isArray(data) || data.length === 0) return null;

    const releases = data
      .map(release => ({
        tag_name: release.tag_name || '',
        version: parseSemver(release.tag_name || ''),
        assets: release.assets || [],
        body: release.body || '',
        published_at: release.published_at || null,
      }))
      .filter(release => Boolean(release.version));

    if (releases.length === 0) return null;

    releases.sort((a, b) => compareVersions(a.version, b.version));

    // Iterar de la más nueva a la más vieja: devolver la primera con APK,
    // aunque la release más nueva no tenga asset (evita perder updates).
    for (let i = releases.length - 1; i >= 0; i--) {
      const release = releases[i];
      const apkAsset = release.assets.find(a => a.name?.endsWith('.apk'));
      if (!apkAsset) continue;

      const info = {
        version: release.version,
        apkUrl: apkAsset.browser_download_url,
        notes: release.body,
        publishedAt: release.published_at,
      };

      await cacheUpdateInfo(info);
      return info;
    }

    return null;
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
      // En Android 7+ no se puede abrir file:// directamente
      // (FileUriExposedException): hay que pedir un content:// URI.
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      // FLAG_GRANT_READ_URI_PERMISSION (0x1): sin este flag el PackageInstaller
      // crashea con SecurityException "UID does not have permission" (bug 1.4.0).
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
      });
      return true;
    }
    return false;
  } catch {
    // Fallback: abrir la URL en el navegador
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
    if (Date.now() - cache.cachedAt > API_CONFIG.UPDATE_CACHE_TTL) return null;
    return cache.info;
  } catch {
    return null;
  }
}

// ─── Exponer compareVersions para tests ───
export { compareVersions };
