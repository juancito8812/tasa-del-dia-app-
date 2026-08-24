# Plan: Repo nuevo privado para Galaxy Store

> **Objetivo:** Crear un repo privado `tasa-del-dia-app-galaxy-store` como fork del actual, optimizado exclusivamente para publicación en Samsung Galaxy Store.

## Contexto

- **Repo actual** (`tasa-del-dia-app-`): distribución directa por APK/GitHub con auto-update
- **Repo nuevo** (`tasa-del-dia-app-galaxy-store`): distribución exclusiva por Galaxy Store, sin auto-update
- El repo nuevo es un fork del actual, pero se limpia todo lo relacionado con GitHub/auto-update

---

## Fase 1: Crear repo y fork

### Task 1.1: Crear repo privado en GitHub

```bash
gh repo create juancito8812/tasa-del-dia-app-galaxy-store --private --fork juancito8812/tasa-del-dia-app-
```

### Task 1.2: Clonar el repo nuevo

```bash
cd ~/Documentos/programacion
git clone git@github.com:juancito8812/tasa-del-dia-app-galaxy-store.git
cd tasa-del-dia-app-galaxy-store
```

### Task 1.3: Crear rama de trabajo

```bash
git checkout -b galaxy-store-setup
```

---

## Fase 2: Limpiar código de GitHub/auto-update

### Task 2.1: Eliminar sistema de auto-update

**Archivos a eliminar:**
- `tasa-del-dia/src/services/autoUpdate.js`
- `tasa-del-dia/src/services/__tests__/autoUpdate.test.js`
- `tasa-del-dia/src/components/UpdateModal.js`
- `tasa-del-dia/src/components/__tests__/UpdateModal.test.js`

**Archivos a modificar:**
- `App.js` — Eliminar import y uso de `autoUpdate.js`, `UpdateModal`, `checkLatestRelease`, `isUpdateAvailable`, `getCurrentVersion`, `isVersionSkipped`
- `App.js` — Eliminar el `useEffect` de auto-update (líneas 66-91)
- `App.js` — Eliminar estado `updateInfo`, `showUpdate`, `handleCloseUpdate`
- `App.js` — Eliminar el componente `UpdateModal` del render

### Task 2.2: Eliminar permiso REQUEST_INSTALL_PACKAGES

**Archivo:** `tasa-del-dia/app.config.js`

**Cambiar:**
```js
// ANTES (condicional)
permissions: IS_GALAXY_STORE
  ? ['POST_NOTIFICATIONS']
  : ['POST_NOTIFICATIONS', 'REQUEST_INSTALL_PACKAGES'],

// DESPUÉS (siempre solo POST_NOTIFICATIONS)
permissions: ['POST_NOTIFICATIONS'],
```

**Eliminar:** La constante `IS_GALAXY_STORE` y el check de env var (línea 6)

### Task 2.3: Simplificar DistributionContext

**Archivo:** `tasa-del-dia/src/context/DistributionContext.js`

Dado que este repo ES Galaxy Store, el contexto siempre retorna `isGalaxyStore: true`. Simplificar:

```js
import React, { createContext, useContext, useMemo } from 'react';

const DistributionContext = createContext({
  isGalaxyStore: true,
  isDirectInstall: false,
});

export function DistributionProvider({ children }) {
  return (
    <DistributionContext.Provider value={{ isGalaxyStore: true, isDirectInstall: false }}>
      {children}
    </DistributionContext.Provider>
  );
}

export function useDistribution() {
  return useContext(DistributionContext);
}
```

### Task 2.4: Limpiar EAS config

**Archivo:** `tasa-del-dia/eas.json`

Eliminar perfiles que no aplican:
- `development` — no aplica para Galaxy Store
- `preview` — era para APK directa
- `galaxy-store` — ya no es condicional, es el default

Quedaría:
```json
{
  "cli": {
    "version": ">= 20.1.0",
    "appVersionSource": "local"
  },
  "build": {
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Task 2.5: Eliminar workflows de GitHub

**Archivos a eliminar:**
- `.github/workflows/auto-sync.yml` — Auto-sync no aplica
- `.github/workflows/build-apk.yml` — Build para GitHub releases
- `.github/workflows/release-automatic.yml` — Releases de GitHub
- `.github/workflows/mobile-ci.yml` — Este SÍ se puede mantener (CI básico)

**Decisión:** Mantener solo `mobile-ci.yml` para validación de tests/lint/typecheck.

---

## Fase 3: Actualizar documentación

### Task 3.1: Actualizar README.md

**Reemplazar contenido** con versión enfocada en Galaxy Store:

```markdown
# 💱 Tasa del Día — Galaxy Store

<div align="center">

**App para consultar la tasa de cambio del BCV, dólar paralelo, euro y Binance P2P, con conversor Bs/USD en tiempo real.**

**Distribución:** Samsung Galaxy Store

</div>

---

## 📱 Info de la app

| Detalle | Valor |
|---------|-------|
| Plataforma | Android |
| Stack | React Native 0.81 + Expo SDK 54 |
| Versión actual | **1.4.7** (versionCode 10407) |
| Estado | ✅ Lista para Galaxy Store |
| Package | `com.tasadeldia.app` |
| Fuente de datos | DolarApi.com + Binance P2P |
| Tests | 186/186 passing |
| Lint | 0 errors, 0 warnings |
| Typecheck | 0 errores |

---

## 🏗️ Build para Galaxy Store

```bash
cd tasa-del-dia
npm install --legacy-peer-deps
eas build --platform android --profile production --local
```

**Requisitos:** Node.js 22+, Java 17, EXPO_TOKEN configurado

> ⚠️ **NUNCA uses `gradlew assembleRelease`** — usa siempre `eas build --local`

---

## 📲 Publicar en Galaxy Store

1. Subir APK a [Samsung Seller Office](https://seller.samsungapps.com)
2. Completar Content Rating (IARC)
3. Completar Data Safety form
4. Agregar Privacy Policy URL
5. Agregar screenshots (1080x2340)

Ver `docs/galaxy-store-checklist.md` para el checklist completo.

---

## 🔐 Privacy Policy

Ver `docs/privacy-policy.md`

---

## 📂 Estructura

```
tasa-del-dia-app-galaxy-store/
├── tasa-del-dia/
│   ├── App.js
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/          # api.js, notifications.js, backgroundTasks.js
│   │   ├── hooks/
│   │   ├── context/           # ThemeContext, DistributionContext
│   │   └── utils/
│   └── app.config.js
├── .github/workflows/         # mobile-ci.yml (tests)
├── docs/
│   ├── privacy-policy.md
│   └── galaxy-store-checklist.md
└── README.md
```

---

## 🛠️ Stack

- React Native 0.81 + Expo SDK 54
- AsyncStorage + expo-notifications + expo-background-fetch
- DolarApi.com + Binance P2P directo
- TypeScript (checkJs: true)

---

<div align="center">
  <p>Hecho con ❤️ para Venezuela</p>
</div>
```

### Task 3.2: Actualizar AI_HANDOFF.md

**Reemplazar** con contexto del repo Galaxy Store:

```markdown
# Documento de Traspaso — Galaxy Store

> **LEE ESTE ARCHIVO PRIMERO**

## Contexto

**Tasa del Día (Galaxy Store)** — Versión de la app para Samsung Galaxy Store.

| Parte | Valor |
|-------|-------|
| Repo | `tasa-del-dia-app-galaxy-store` (privado) |
| Fork de | `tasa-del-dia-app-` (repo original) |
| Distribución | Samsung Galaxy Store |
| Package | `com.tasadeldia.app` |
| Versión | 1.4.7 |

## Diferencias con el repo original

| Feature | Repo original | Este repo (Galaxy Store) |
|---------|---------------|--------------------------|
| Auto-update | ✅ Activo | ❌ Eliminado |
| `REQUEST_INSTALL_PACKAGES` | ✅ Incluido | ❌ Eliminado |
| Build profile | `preview` | `production` |
| Distribución | GitHub Releases | Samsung Galaxy Store |

## Cómo build

```bash
cd tasa-del-dia
eas build --platform android --profile production --local
```

## Documentación

- `docs/privacy-policy.md` — Política de privacidad
- `docs/galaxy-store-checklist.md` — Checklist de submission
```

### Task 3.3: Verificar privacy policy

**Archivo:** `docs/privacy-policy.md` — Ya creado, verificar que esté completo.

### Task 3.4: Verificar checklist

**Archivo:** `docs/galaxy-store-checklist.md` — Ya creado, verificar que esté completo.

---

## Fase 4: Configurar proyecto

### Task 4.1: Verificar dependencias

```bash
cd tasa-del-dia
npm install --legacy-peer-deps
```

### Task 4.2: Ejecutar tests

```bash
npm test
```

Esperado: 186/186 passing

### Task 4.3: Ejecutar lint

```bash
npx expo lint
```

Esperado: 0 errores, 0 warnings

### Task 4.4: Ejecutar typecheck

```bash
npx tsc --noEmit
```

Esperado: 0 errores

### Task 4.5: Crear EAS project

```bash
npx eas init
```

Asociar con el proyecto de Expo para Galaxy Store.

---

## Fase 5: Commit y push

### Task 5.1: Commit de limpieza

```bash
git add -A
git commit -m "feat: Galaxy Store setup — remove auto-update, simplify permissions, clean config"
```

### Task 5.2: Push a GitHub

```bash
git push origin galaxy-store-setup
```

### Task 5.3: Merge a main

```bash
git checkout main
git merge galaxy-store-setup
git push origin main
```

### Task 5.4: Eliminar rama

```bash
git branch -d galaxy-store-setup
git push origin --delete galaxy-store-setup
```

---

## Resumen de archivos

### Archivos a eliminar (5)
- `tasa-del-dia/src/services/autoUpdate.js`
- `tasa-del-dia/src/services/__tests__/autoUpdate.test.js`
- `tasa-del-dia/src/components/UpdateModal.js`
- `tasa-del-dia/src/components/__tests__/UpdateModal.test.js`
- `.github/workflows/auto-sync.yml`
- `.github/workflows/build-apk.yml`
- `.github/workflows/release-automatic.yml`

### Archivos a modificar (5)
- `App.js` — Eliminar auto-update
- `app.config.js` — Permisos directos (sin condicional)
- `eas.json` — Solo perfil production
- `README.md` — Versión Galaxy Store
- `AI_HANDOFF.md` — Contexto Galaxy Store

### Archivos a mantener (2)
- `docs/privacy-policy.md` — Ya creado
- `docs/galaxy-store-checklist.md` — Ya creado

---

## Riesgo

| Riesgo | Mitigación |
|--------|------------|
| Romper funcionalidad al eliminar auto-update | Solo eliminar archivos relacionados, no tocar lógica core |
| Tests fallen después de eliminar | Ejecutar tests después de cada cambio |
| EAS project ID conflicte | Crear nuevo project para Galaxy Store |

---

## Verification

1. ✅ Tests: 186/186 passing (sin autoUpdate tests = ~178)
2. ✅ Lint: 0 errores
3. ✅ Typecheck: 0 errores
4. ✅ Build: `eas build --platform android --profile production --local` exitoso
5. ✅ APK: Instalar en dispositivo y verificar que funciona
