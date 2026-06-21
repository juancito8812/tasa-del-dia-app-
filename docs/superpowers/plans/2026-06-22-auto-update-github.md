# Auto-Update desde GitHub Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La app Tasa del Día revise automáticamente si hay una APK más nueva en GitHub Releases y ofrezca descargarla/instalarla.

**Arquitectura:** Dos componentes: (1) GitHub workflow ya modificado para crear Release "latest" con cada build. (2) Servicio `autoUpdate.js` que consulta la GitHub API pública, compara versiones, y si hay nueva disponible, muestra un modal `UpdateModal.js` con botón de descarga.

**Tech Stack:** GitHub API (pública, sin auth), `expo-constants` (versión actual), `expo-file-system` (descarga APK), `expo-linking` (abrir instalador), AsyncStorage (cache de skip version).

---

### Task 1: Crear `src/services/autoUpdate.js`
**Files:**
- Create: `tasa-del-dia/src/services/autoUpdate.js`

- [x] **Step 1: Escribir el servicio autoUpdate.js**

```js
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
 * Retorna { version: string, apkUrl: string, notes: string } o null si falla.
 */
export async function checkLatestRelease() {
  try {
    // Intentar cache primero (30 min TTL para no abusar API)
    const cached = await getCachedUpdateInfo();
    if (cached) return cached;

    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();

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
 * Retorna true si hay una actualización disponible (la versión del release > versión actual).
 * @param {string} currentVersion - Versión actual de la app (ej: "1.0.1")
 * @param {string} latestVersion - Versión del último release (ej: "1.0.2")
 */
export function isUpdateAvailable(currentVersion, latestVersion) {
  if (!currentVersion || !latestVersion) return false;
  return compareVersions(currentVersion, latestVersion) < 0;
}

/**
 * Retorna la versión actual de la app desde app.config.js
 */
export function getCurrentVersion() {
  return Constants.expoConfig?.version || '0.0.0';
}

/**
 * Descarga la APK y la abre con el instalador de Android.
 * Retorna true si se inició la descarga, false si falló.
 */
export async function downloadAndInstall(apkUrl) {
  if (!apkUrl || Platform.OS !== 'android') return false;
  try {
    const fileUri = FileSystem.cacheDirectory + 'TasaDelDia-update.apk';
    const download = FileSystem.createDownloadResumable(apkUrl, fileUri);
    const result = await download.downloadAsync();
    if (result?.uri) {
      // Android 10+ requiere content URI — FileSystem lo maneja
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

// ─── Cache de 30 min para no llamar a GitHub API en cada render ───

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
    if (Date.now() - cache.cachedAt > 30 * 60 * 1000) return null; // expiró
    return cache.info;
  } catch {
    return null;
  }
}
```

- [x] **Step 2: Verificar que se exportan correctamente**
No hay test automatizado para este archivo (depende de APIs externas). Validación manual: `import` statements son correctos.

### Task 2: Crear `src/components/UpdateModal.js`
**Files:**
- Create: `tasa-del-dia/src/components/UpdateModal.js`

- [x] **Step 1: Escribir el componente UpdateModal**

```js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { downloadAndInstall, skipVersion } from '../services/autoUpdate';

export default function UpdateModal({
  visible, onClose, currentVersion, latestVersion, apkUrl, notes, C,
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    const ok = await downloadAndInstall(apkUrl);
    if (ok) {
      setDownloading(false);
      onClose();
    } else {
      setError('No se pudo iniciar la descarga. Intenta de nuevo.');
      setDownloading(false);
    }
  };

  const handleSkip = async () => {
    await skipVersion(latestVersion);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: C.secondary, borderColor: C.cardBorder }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: C.info + '20' }]}>
              <Ionicons name="cloud-download" size={28} color={C.info} />
            </View>
            <Text style={[styles.title, { color: C.textPrimary }]}>Actualización disponible</Text>
          </View>

          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted }]}>Versión actual:</Text>
            <Text style={[styles.versionValue, { color: C.textSecondary }]}>v{currentVersion}</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: C.textMuted }]}>Nueva versión:</Text>
            <Text style={[styles.versionValue, { color: C.info, fontWeight: '700' }]}>v{latestVersion}</Text>
          </View>

          {notes ? (
            <Text style={[styles.notes, { color: C.textSecondary }]} numberOfLines={4}>
              {notes}
            </Text>
          ) : null}

          {error ? (
            <Text style={[styles.errorText, { color: C.highlight }]}>{error}</Text>
          ) : null}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.inputBg, borderColor: C.cardBorder, borderWidth: 1 }]}
              onPress={handleSkip}
              activeOpacity={0.7}
              disabled={downloading}
            >
              <Text style={[styles.buttonText, { color: C.textMuted }]}>Saltar esta versión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: C.info }]}
              onPress={handleDownload}
              activeOpacity={0.8}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#fff', fontWeight: '700' }]}>Descargar APK</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.laterLink}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.laterText, { color: C.textMuted }]}>Más tarde</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  versionLabel: {
    fontSize: 13,
  },
  versionValue: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  notes: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  buttons: {
    gap: 8,
    marginTop: 20,
  },
  button: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  laterLink: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  laterText: {
    fontSize: 12,
  },
});
```

- [x] **Step 2: Verificar imports y exports**
Validar que el componente se exporta como default y recibe las props correctas.

### Task 3: Integrar auto-update en App.js
**Files:**
- Modify: `tasa-del-dia/App.js`

- [x] **Step 1: Agregar el check de actualización en App.js**

Agregar estos imports al inicio de `App.js`:
```js
import { useState } from 'react';
import UpdateModal from './src/components/UpdateModal';
import { checkLatestRelease, isUpdateAvailable, getCurrentVersion, isVersionSkipped } from './src/services/autoUpdate';
```

Agregar el estado y efecto en la función `App()`:
```js
function App() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    registerBackgroundFetchAsync().catch(console.warn);
    ensureReminderScheduled();
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const release = await checkLatestRelease();
      if (!release) return;
      const current = getCurrentVersion();
      if (!isUpdateAvailable(current, release.version)) return;
      const skipped = await isVersionSkipped(release.version);
      if (skipped) return;
      setUpdateInfo(release);
      // Pequeño delay para que no aparezca inmediatamente al abrir la app
      setTimeout(() => setShowUpdate(true), 2000);
    } catch {}
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AnimatedAppContent />
          <UpdateModal
            visible={showUpdate}
            onClose={() => setShowUpdate(false)}
            currentVersion={getCurrentVersion()}
            latestVersion={updateInfo?.version || ''}
            apkUrl={updateInfo?.apkUrl || ''}
            notes={updateInfo?.notes || ''}
          />
        </ErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

- [x] **Step 2: Verificar que se pasa `colors` al modal**

El `UpdateModal` necesita la prop `C` (colores del theme). Como el modal se renderiza dentro de `ThemeProvider` pero fuera de `AnimatedAppContent`, necesitamos:

Opción A: Crear un wrapper que use `useTheme()` y renderice el modal (más complejo)
Opción B: Pasar colors fijos al modal (ponytail: más simple, el modal usa secondary/inputBg que son casi iguales en modo oscuro)

Usar Opción B es más simple. Cambiar los colores del modal a valores fijos del dark theme:

```jsx
// En App.js, pasar colors fijos (dark theme) al modal
<UpdateModal
  C={{
    secondary: '#0f0f1e',
    cardBorder: 'rgba(255,255,255,0.08)',
    textPrimary: '#ffffff',
    textSecondary: '#a0aec0',
    textMuted: '#636e82',
    info: '#4fc3f7',
    highlight: '#e94560',
    inputBg: 'rgba(255,255,255,0.04)',
  }}
  ...
/>
```

### Task 4: Verificar tests y code review
**Files:**
- `tasa-del-dia/`

- [x] **Step 1: Ejecutar tests existentes**
Run: `cd tasa-del-dia && npm test -- --ci 2>&1`
Expected: 62/62 pass (los tests existentes no deberían romperse)

- [x] **Step 2: Code review**
Ejecutar code-reviewer-deepseek-flash para revisar todos los archivos modificados/creados.

### Task 5: Actualizar AI_HANDOFF.md
**Files:**
- Modify: `AI_HANDOFF.md`

- [x] **Step 1: Agregar sección de auto-update**
Documentar:
- GitHub Release "latest" se crea automáticamente con cada build
- Auto-update service en `src/services/autoUpdate.js`
- Modal UpdateModal en `src/components/UpdateModal.js`
- URL de descarga: `https://github.com/juancito8812/tasa-del-dia-app-/releases/latest/download/TasaDelDia.apk`
