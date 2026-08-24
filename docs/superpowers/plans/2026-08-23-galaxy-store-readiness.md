# Galaxy Store Readiness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare Tasa del Día for Samsung Galaxy Store publication without breaking the existing GitHub auto-update distribution channel.

**Architecture:** Conditional distribution strategy — the app detects its distribution channel (Galaxy Store vs GitHub) at runtime and adjusts behavior accordingly. Galaxy Store builds get auto-update disabled and restricted permissions; GitHub builds keep full functionality. A new `DistributionProvider` context determines the active channel.

**Tech Stack:** React Native + Expo SDK 54, expo-constants, AsyncStorage, React Context

**Spec:** N/A — this plan is derived from the Galaxy Store requirements analysis in the session conversation.

---

## Global Constraints

- **DO NOT** break existing GitHub auto-update — it must continue working for users who install via APK
- **DO NOT** change the signing key (SHA-256 `299073e3…`)
- **DO NOT** modify `versionCode` calculation logic
- **DO NOT** change the package name `com.tasadeldia.app`
- All existing tests must continue passing (186/186)
- Lint must remain at 0 errors / 0 warnings
- Typecheck must remain at 0 errors

---

## Task 1: Create Privacy Policy Page

**Files:**
- Create: `docs/privacy-policy.md`
- Create: `docs/privacy-policy.html`

**Interfaces:**
- Consumes: None
- Produces: Static privacy policy documents that can be hosted on GitHub Pages

- [ ] **Step 1: Create the markdown privacy policy**

Create `docs/privacy-policy.md` with the following content:

```markdown
# Política de Privacidad — Tasa del Día

**Última actualización:** 23 de agosto de 2026

## Datos que recopila esta app

Tasa del Día es una aplicación gratuita que consulta tasas de cambio en Venezuela. La app **no recopila ni transmite datos personales identificables**.

### Datos almacenados localmente en tu dispositivo

- **Tasas de cambio guardadas:** La almacena la tasa del BCV (Lunes) que el usuario ingresa manualmente.
- **Preferencias de tema:** Oscuro / Claro / Sistema.
- **Estado del recordatorio:** Activo / Inactivo (no los contenido de notificaciones).
- **Versión saltada:** Si el usuario elige "Saltar esta versión" en actualizaciones.
- **Caché de datos:** Tasas de cambio para funcionamiento offline.

Todos estos datos se almacenan exclusivamente en el dispositivo del usuario mediante AsyncStorage. **No se envían a servidores externos.**

### Datos que la app accede (pero no recopila)

- **Tasas de cambio en vivo:** La app consulta las siguientes APIs públicas al momento de consultar las tasas:
  - [DolarApi.com](https://ve.dolarapi.com) — Tasas oficiales BCV y paralelo
  - [Binance P2P API](https://p2p.binance.com) — Tasa paralela crypto (USDT/VES)
- **Notificaciones push:** Si el usuario activa el recordatorio de los viernes, la app programa notificaciones locales del sistema operativo. No se envían datos a servicios de terceros.

## Permisos de la app

| Permiso | Uso |
|---------|-----|
| `POST_NOTIFICATIONS` | Mostrar recordatorio semanal de ingresar tasa del BCV (solo si el usuario lo activa) |

## Actualizaciones

La app puede verificar actualizaciones desde GitHub Releases cuando se instala directamente (fuera de tiendas de aplicaciones). Esta función se desactiva automáticamente cuando la app se instala desde Samsung Galaxy Store.

## Servicios de terceros

- **DolarApi.com:** La app consulta tasas de cambio públicas. No se envía información del usuario a este servicio.
- **Binance P2P API:** La app consulta tasas de cambio públicas. No se envía información del usuario a este servicio.

## Seguridad

- La app no utiliza `eval()` ni ejecuta código dinámico.
- Todas las conexiones de red se realizan exclusivamente por HTTPS.
- No se almacenan credenciales, tokens de acceso ni datos bancarios.

## Cambios en esta política

Si se realizan cambios significativos en esta política, se notificará a través de una actualización de la app.

## Contacto

Si tenés preguntas sobre esta política de privacidad, podés contactarnos a través de:
- GitHub: [github.com/juancito8812/tasa-del-dia-app-/issues](https://github.com/juancito8812/tasa-del-dia-app-/issues)
```

- [ ] **Step 2: Run lint on new file**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git status`
Expected: The new file appears in untracked files

- [ ] **Step 3: Verify tests still pass**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npm test`
Expected: 186/186 passing

- [ ] **Step 4: Commit**

```bash
cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git add docs/privacy-policy.md && git commit -m "docs: add privacy policy for Galaxy Store submission"
```

---

## Task 2: Create Distribution Channel Detection

**Files:**
- Create: `src/context/DistributionContext.js`
- Modify: `App.js:1-14` (add import)
- Modify: `App.js:197-211` (wrap with provider)

**Interfaces:**
- Consumes: `expo-constants` (already in dependencies)
- Produces: `useDistribution()` hook returning `{ isGalaxyStore: boolean, isDirectInstall: boolean }`

- [ ] **Step 1: Write the DistributionContext**

Create `src/context/DistributionContext.js`:

```js
import React, { createContext, useContext, useMemo } from 'react';
import Constants from 'expo-constants';

const DistributionContext = createContext({
  isGalaxyStore: false,
  isDirectInstall: true,
});

/**
 * Detects the distribution channel based on the installer package name.
 * Galaxy Store installs report "com.sec.android.app.samsungapps" as installer.
 * Direct APK installs report null or unknown installer.
 */
function getDistributionChannel() {
  try {
    const installerPackageName = Constants.expoConfig?.android?.installerPackageName
      || Constants.manifest?.android?.installerPackageName
      || null;

    const isGalaxyStore = installerPackageName === 'com.sec.android.app.samsungapps';

    return {
      isGalaxyStore,
      isDirectInstall: !isGalaxyStore,
    };
  } catch {
    return { isGalaxyStore: false, isDirectInstall: true };
  }
}

export function DistributionProvider({ children }) {
  const value = useMemo(() => getDistributionChannel(), []);

  return (
    <DistributionContext.Provider value={value}>
      {children}
    </DistributionContext.Provider>
  );
}

export function useDistribution() {
  return useContext(DistributionContext);
}
```

- [ ] **Step 2: Import DistributionProvider in App.js**

Add to `App.js` imports (after line 6):

```js
import { DistributionProvider } from './src/context/DistributionContext';
```

- [ ] **Step 3: Wrap the app with DistributionProvider**

In `App.js`, modify the `App` function (around line 203) to wrap with DistributionProvider:

```js
function App() {
  useEffect(() => {
    registerBackgroundFetchAsync().catch(console.warn);
    ensureReminderScheduled();
  }, []);

  return (
    <SafeAreaProvider>
      <DistributionProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AnimatedAppContent />
          </ErrorBoundary>
        </ThemeProvider>
      </DistributionProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 4: Verify tests still pass**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npm test`
Expected: 186/186 passing

- [ ] **Step 5: Verify typecheck passes**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 6: Verify lint passes**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npx expo lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 7: Commit**

```bash
cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git add src/context/DistributionContext.js App.js && git commit -m "feat: add distribution channel detection (Galaxy Store vs direct install)"
```

---

## Task 3: Conditionally Disable Auto-Update for Galaxy Store

**Files:**
- Modify: `App.js:66-91` (auto-update useEffect)
- Test: `src/services/__tests__/autoUpdate.test.js` (add distribution-aware tests)

**Interfaces:**
- Consumes: `useDistribution()` from Task 2
- Produces: Auto-update check skipped when `isGalaxyStore === true`

- [ ] **Step 1: Import useDistribution in App.js**

Add to `App.js` imports (inside `AnimatedAppContent` function, not at file top):

```js
// Inside AnimatedAppContent, add:
const { isGalaxyStore } = useDistribution();
```

- [ ] **Step 2: Gate the auto-update useEffect**

Modify the auto-update `useEffect` in `App.js` (around line 67) to early-return for Galaxy Store:

```js
const { isGalaxyStore } = useDistribution();

// Auto-update: check on mount, delay so it doesn't interrupt first render
useEffect(() => {
  // Galaxy Store manages its own updates — skip our auto-update check
  if (isGalaxyStore) return;

  let showTimer = null;
  let interactionTask = null;
  const check = async () => {
    try {
      const release = await checkLatestRelease();
      if (!release) return;
      const current = getCurrentVersion();
      if (!isUpdateAvailable(current, release.version)) return;
      const skipped = await isVersionSkipped(release.version);
      if (skipped) return;
      setUpdateInfo(release);
      showTimer = setTimeout(() => setShowUpdate(true), 2000);
    } catch (err) {
      if (__DEV__) console.warn('[AutoUpdate] Check failed:', err);
    }
  };
  // Diferir el check hasta que terminen las interacciones iniciales,
  // para no competir con el primer render y el fetch de tasas.
  interactionTask = InteractionManager.runAfterInteractions(() => { check(); });
  return () => {
    interactionTask?.cancel();
    if (showTimer) clearTimeout(showTimer);
  };
}, [isGalaxyStore]);
```

- [ ] **Step 3: Verify tests still pass**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npm test`
Expected: 186/186 passing (auto-update tests still pass because they mock `useDistribution`)

- [ ] **Step 4: Verify lint passes**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npx expo lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 5: Commit**

```bash
cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git add App.js && git commit -m "feat: disable auto-update check for Galaxy Store distribution"
```

---

## Task 4: Remove REQUEST_INSTALL_PACKAGES from Galaxy Store Builds

**Files:**
- Modify: `app.config.js:43`

**Interfaces:**
- Consumes: None
- Produces: Galaxy Store builds without REQUEST_INSTALL_PACKAGES permission

- [ ] **Step 1: Make permissions conditional**

Modify `app.config.js` to conditionally include the permission:

```js
const VERSION = '1.4.7';

// Detect if building for Galaxy Store via env var
const IS_GALAXY_STORE = process.env.DISTRIBUTION === 'galaxy-store';

// ... (keep existing versionCode calculation) ...

module.exports = {
  expo: {
    // ... (keep existing config) ...
    android: {
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-foreground.png",
        backgroundColor: "#1a1a2e",
      },
      package: "com.tasadeldia.app",
      versionCode: ANDROID_VERSION_CODE,
      permissions: IS_GALAXY_STORE
        ? ['POST_NOTIFICATIONS']
        : ['POST_NOTIFICATIONS', 'REQUEST_INSTALL_PACKAGES'],
    },
    // ... (keep rest of config) ...
  },
};
```

- [ ] **Step 2: Verify default behavior unchanged**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && node -p "require('./app.config.js').expo.android.permissions"`
Expected: `['POST_NOTIFICATIONS', 'REQUEST_INSTALL_PACKAGES']` (default includes both)

- [ ] **Step 3: Verify Galaxy Store behavior**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && DISTRIBUTION=galaxy-store node -p "require('./app.config.js').expo.android.permissions"`
Expected: `['POST_NOTIFICATIONS']` (Galaxy Store omits REQUEST_INSTALL_PACKAGES)

- [ ] **Step 4: Verify tests still pass**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npm test`
Expected: 186/186 passing

- [ ] **Step 5: Commit**

```bash
cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git add app.config.js && git commit -m "feat: conditional permissions for Galaxy Store (omit REQUEST_INSTALL_PACKAGES)"
```

---

## Task 5: Create EAS Build Profile for Galaxy Store

**Files:**
- Modify: `eas.json`

**Interfaces:**
- Consumes: Task 4 (env var DISTRIBUTION)
- Produces: `galaxy-store` build profile

- [ ] **Step 1: Add galaxy-store build profile**

Modify `eas.json` to add a new build profile:

```json
{
  "cli": {
    "version": ">= 20.1.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "galaxy-store": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "DISTRIBUTION": "galaxy-store"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {},
    "galaxy-store": {}
  }
}
```

- [ ] **Step 2: Verify the profile is recognized**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npx eas build:list --platform android --limit 1`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git add eas.json && git commit -m "feat: add galaxy-store build profile to EAS"
```

---

## Task 6: Create Galaxy Store Submission Checklist

**Files:**
- Create: `docs/galaxy-store-checklist.md`

**Interfaces:**
- Consumes: All previous tasks
- Produces: Human-readable checklist for Samsung Seller Office submission

- [ ] **Step 1: Create the checklist document**

Create `docs/galaxy-store-checklist.md`:

```markdown
# Galaxy Store Submission Checklist — Tasa del Día

## Pre-submission (before requesting review)

- [ ] Privacy Policy published at a public URL (GitHub Pages recommended)
- [ ] Package name `com.tasadeldia.app` registered in Samsung Seller Office
- [ ] App icon: 512x512px PNG (no transparency)
- [ ] Feature graphic: 1024x500px PNG
- [ ] Screenshots: minimum 2, resolution 1080x2340px (FHD+)
- [ ] App description (mínimo 40 caracteres, máximo 4000)
- [ ] Short description (mínimo 80 caracteres, máximo 800)
- [ ] What's new text for first version

## Build

- [ ] Build with: `eas build --platform android --profile galaxy-store --local`
- [ ] APK signed with EAS keystore (SHA-256: `299073e3…`)
- [ ] `REQUEST_INSTALL_PACKAGES` permission NOT present in APK manifest
- [ ] Auto-update check disabled (Galaxy Store manages updates)

## Samsung Seller Office

- [ ] Create new app listing
- [ ] Upload APK
- [ ] Complete Content Rating (IARC) questionnaire
- [ ] Complete Data Safety form:
  - [ ] "Does this app collect or share any user data?" → No
  - [ ] "Does this app collect location data?" → No
  - [ ] "Is this app designed for children?" → No
- [ ] Set Privacy Policy URL
- [ ] Set category: Finance / Tools
- [ ] Set price: Free
- [ ] Add screenshots and descriptions

## Post-submission

- [ ] Review typically takes 3-5 business days
- [ ] Common rejection reasons to avoid:
  - Missing privacy policy
  - Misleading app description
  - Broken functionality on Samsung devices
  - Missing content rating

## Version Management

- Galaxy Store version: build with `DISTRIBUTION=galaxy-store` env var
- GitHub version: build with default (no env var)
- Both share the same `versionCode` scheme (major*10000 + minor*100 + patch)
- Galaxy Store APK will NOT have auto-update — users update through Galaxy Store
- GitHub APK will continue to auto-update from GitHub Releases
```

- [ ] **Step 2: Commit**

```bash
cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git add docs/galaxy-store-checklist.md && git commit -m "docs: add Galaxy Store submission checklist"
```

---

## Task 7: Verify Everything Works End-to-End

**Files:** None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npm test`
Expected: 186/186 passing

- [ ] **Step 2: Run lint**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npx expo lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 3: Run typecheck**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 4: Verify default build has both permissions**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && node -p "require('./app.config.js').expo.android.permissions"`
Expected: `['POST_NOTIFICATIONS', 'REQUEST_INSTALL_PACKAGES']`

- [ ] **Step 5: Verify Galaxy Store build omits restricted permission**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app-/tasa-del-dia && DISTRIBUTION=galaxy-store node -p "require('./app.config.js').expo.android.permissions"`
Expected: `['POST_NOTIFICATIONS']`

- [ ] **Step 6: Verify git status is clean**

Run: `cd /home/jr/Documentos/programacion/tasa-del-dia-app- && git status`
Expected: Clean working tree (all changes committed)

---

## Summary of Changes

| Task | Files | Impact |
|------|-------|--------|
| 1. Privacy Policy | `docs/privacy-policy.md` | New file — documentation only |
| 2. Distribution Detection | `src/context/DistributionContext.js`, `App.js` | New context + provider — zero impact on existing behavior |
| 3. Gate Auto-Update | `App.js` | Conditional `useEffect` — existing behavior preserved for direct installs |
| 4. Conditional Permissions | `app.config.js` | Env-gated — default unchanged |
| 5. EAS Profile | `eas.json` | New build profile — no impact on existing profiles |
| 6. Checklist | `docs/galaxy-store-checklist.md` | New file — documentation only |
| 7. Verification | None | Validation step |

## Risk Assessment

- **Breaking GitHub auto-update:** LOW — `useDistribution()` returns `isGalaxyStore: false` by default, so the existing code path is untouched
- **Breaking existing builds:** LOW — all changes are additive or conditional; default behavior is preserved
- **Test failures:** LOW — new code is behind a context provider that's trivially mockable
- **Lint/typecheck regression:** LOW — new files follow existing patterns

## What NOT to Change (Yet)

These changes should only be applied AFTER Galaxy Store approval:

1. **Do not remove `REQUEST_INSTALL_PACKAGES` permanently** — it's needed for GitHub auto-update
2. **Do not disable auto-update permanently** — it's needed for GitHub distribution
3. **Do not change the package name** — it's already registered
4. **Do not modify the signing key** — it's verified and consistent

## Post-Approval Steps (not in this plan)

Once Galaxy Store approves the listing:

1. Build APK: `eas build --platform android --profile galaxy-store --local`
2. Upload to Samsung Seller Office
3. Set Privacy Policy URL in the listing
4. Monitor review status (typically 3-5 business days)
