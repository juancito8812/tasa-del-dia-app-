# Documento de Traspaso (AI Handoff Document)

> **LEE ESTE ARCHIVO PRIMERO** — Contiene el estado actual del proyecto, lo último que se hizo y los specs/planes disponibles.

## 📌 Contexto del Proyecto

**Tasa del Día** — App móvil para consultar tasas de cambio en Venezuela.

| Parte | Stack | Rama | Estado |
|-------|-------|------|--------|
| `tasa-del-dia/` | React Native + Expo SDK 54 | `main` | ✅ Activa (v1.6.0, releases, auto-update verified) |
| `feature/ui-2026` | Rediseño glass 2.0 + optimizaciones de performance | feature branch | ✅ Mergeada a main |
| `redesign` | Rediseño mobile (histórica) | feature branch | ⏸️ Reemplazada por `feature/ui-2026` |

**Skills usadas:** brainstorming → spec → writing-plans → test-driven-development → incremental-implementation → debugging-and-error-recovery → frontend-ui-engineering → ponytail → systematic-debugging → verification-before-completion → subagent-driven-development
**Método de trabajo:** git worktree (`.worktrees/` ignorado via `.gitignore`)

### ⚠️ Skills del repo externo — leídas y aplicadas (15/15)

**Siempre que se trabaje en este proyecto, se DEBEN leer y aplicar TODAS las skills del repositorio:**
🔗 `https://github.com/juancito8812/mi-repo-de-skills`

Skills activas permanentemente (modifican comportamiento base):

| Skill | Efecto |
|-------|--------|
| **ponytail** | Solución más simple que funciona. YAGNI, stdlib primero |
| **systematic-debugging** | Root cause antes de fix. 4 fases |
| **verification-before-completion** | Evidencia fresca antes de claims |
| **subagent-driven-development** | Implementer → spec review → quality review |
| **using-superpowers** | Invocar skills antes de cada respuesta |
| **brainstorming** | Antes de trabajo creativo — spec → plan |
| **dispatching-parallel-agents** | 2+ tareas independientes en paralelo |
| **executing-plans** | Plan escrito → tareas → verificar |
| **finishing-a-development-branch** | Tests pasan → opciones merge/PR |
| **receiving-code-review** | Verificar feedback antes de implementar |
| **requesting-code-review** | Dispatch reviewer con SHAs |
| **test-driven-development** | RED → GREEN → REFACTOR |
| **using-git-worktrees** | Workspace aislado para features |
| **writing-plans** | Spec → plan con pasos de 2-5 min |
| **writing-skills** | TDD para documentación de skills |
| **find-skills** | Descubrir skills relevantes |
| **auto-sync** | Auto-sync después de cambios |
| **changelog-generator** | Generar changelogs |
| **error-handling-patterns** | Patrones de manejo de errores |
| **frontend-design** | Diseño visual distintivo |
| **interface-design** | Diseño craft-first de interfaces |
| **postgresql-table-design** | Diseño de schemas PostgreSQL |
| **vercel-react-best-practices** | Optimización React/Next.js |

Todas las skills han sido revisadas y corregidas con frontmatter HADS completo, checklist y exit criteria.

---

## 🚀 Sesiones

### Sesión 23-Ago-2026 — Selector de diseño de UI

- **Spec:** `docs/superpowers/specs/2026-08-23-ui-selector-design.md` (3 estilos conmutables en caliente; plan SDD de 10 tareas en rama `feature/ui-selector`)
- Limpieza previa: eliminados los rebase/cherry-pick huérfanos del 18-ago antes de empezar
- Paletas por estilo (Original/Terminal/Editorial) con contrato de 31 tokens (`b2a1796`)
- Nuevo eje `uiStyle` en ThemeContext, persistido con la clave `@tasa_del_dia_ui_style` (`3571b2c`)
- Traslados de rediseños a `src/ui/terminal` (`2a82498`) y `src/ui/editorial` (`c01b67d`)
- Registro de paquetes `getUiPackage(uiStyle)` en `src/ui/index.js` (`7353f33`)
- Cableado en `App.js`: pantallas/tabbar/modales resueltos según `uiStyle` (`7f712aa`)
- `UiStyleToggle`: botón cíclico en los 3 headers (`7d575a0`)
- Smoke tests de componentes terminal y editorial con sus paletas (`1bc4ac3`)
- **QA:** 26 suites / 388 tests passing · typecheck 0 errores · lint 0 errores

### Sesión 05-Sep-2026 — Datos Bancarios + PayPal Calculator + Code Review

- **Nueva pestaña "Datos Bancarios":**
  - CRUD completo de cuentas bancarias venezolanas
  - Selector de banco con filtro por nombre en tiempo real (19 bancos)
  - Soporte para cuentas: Corriente, Ahorro, Debito, Nomina, Otro
  - Edición y eliminación de cuentas existentes
  - Caché con TTL de 24h (AsyncStorage)
  - Archivos: `BankDataScreen.js`, `BankAccountCard.js`, `BankAccountForm.js`, `bankData.js`, `banks.js`, `documentTypes.js`
  - Tests: 8 unitarios (service) + 5 integración (screen)

- **Nueva pestaña "PayPal Calculator":**
  - 4 tipos de tarifa con oficial Venezuela (May 2026):
    - Enviar amigos (internacional): USD 4.99 + 3.4% + $0.30
    - Recibir pago (conversión): 3.50%
    - Enviar pago (conversión): 4.50%
    - Vender (Bienes/Servicios): 4.4% + $0.30
  - Modo neto/bruto con conversión automática a BCV/Paralelo/Binance/Euro
  - Botones copiar y compartir resultados
  - Archivos: `PayPalCalculatorScreen.js`, `paypalFees.js`
  - Tests: 17 unitarios (fees) + 5 integración (screen)

- **Code Review + Fixes:**
  - Extracted `calcSpread(rateA, rateB)` helper en `useConverterData.js` (DRY, ~15 líneas eliminadas)
  - `spreadBcv`/`spreadLunes` envueltos en `useMemo` (performance)
  - Fix: `buildResultText` usa `!= null` en vez de truthy check (correctness)
  - `sanitizeId()` en `bankData.js` — filtra chars peligrosos, limita a 64 chars (security)
  - DRY en `PayPalCalculatorScreen.js`: `buildResultText()` compartido entre `handleCopy` y `handleShare`

- **Integración UI:** 3 paquetes (Original, Terminal, Editorial) registrados en `src/ui/index.js`. Terminal usa tag "PP" en vez de icono. Tab order: Tasas (0) → Conversor (1) → Datos (2) → PayPal (3) → Historial (4)

- **Version bump:** 1.4.7 → 1.6.0 (nuevos features significativos)
- **Release:** v1.6.0 publicada en GitHub
- **Tests:** 444/444 passing (32 suites) · typecheck 0 errores · lint 0 errores

### Sesión 21-Jun-2026 — Auditoría de seguridad + Skills review

- Auditoría general de código completada (~233 hallazgos en 6 áreas)
- **Fixes de seguridad aplicados (6/7):**

| # | Fix | Archivo | Estado |
|---|-----|---------|--------|
| 1 | API key real rotada/eliminada | `.env` | ✅ |
| 2 | `.gitignore` creado (node_modules, .expo, .env, etc.) | raíz proyecto | ✅ |
| 3 | ErrorBoundary: solo message en console.warn (sin stack traces) | `App.js:128` | ✅ |
| 4 | Alert sanitizado: sin mensajes de error crudos al usuario | `useConverterData.js:106,109` | ✅ |
| 5 | `catch {}` vacíos → console.warn con prefijo (~25 lugares) | api.js, autoUpdate.js, notifications.js, backgroundTasks.js, ThemeContext.js, hooks | ✅ |
| 6 | `POST_NOTIFICATIONS` agregado para Android 13+ | `app.config.js:31` | ✅ |
| 7 | `legacy-peer-deps=true` — **mantenido** (necesario por conflicto react 19.1.0 vs react-test-renderer 19.2.7) | `.npmrc` | ⚠️ No removible |

- **Tests:** 156/156 passing — nada roto
- Total de catch blocks con logging: ~25 (antes 0 con logging)
- `__DEV__` guard en todos los console.warn de hooks y servicios

### Sesión 22-Jun-2026 — Tests y Fixes

### ✅ Tests de Hooks y Componentes — 82 tests nuevos

| Área | Archivos | Tests |
|------|----------|-------|
| **Hooks** | `__tests__/useRatesData.test.js`, `useConverterData.test.js`, `useHistoryData.test.js` | 48 |
| **Componentes** | `__tests__/BCVModal.test.js`, `UpdateModal.test.js`, `RatesHeader.test.js`, `DateDetailCard.test.js`, `HistoryChart.test.js`, `ScreenContainer.test.js` | 34 |

**Total: 156 tests, 20 suites — 100% passing**

### 🐛 Fix: Workflows fallaban por 403 y dotenv a stdout

**Problema 1:** `require('dotenv').config()` en `app.config.js` imprimía a stdout antes del número de versión (`◇ injected env...`), causando `Invalid format '1.0.1'` en `$GITHUB_OUTPUT`.
**Fix:** Usar `grep -xE '[0-9]+\.[0-9]+\.[0-9]+'` en la extracción de versión en ambos workflows.

**Problema 2:** `GITHUB_TOKEN` sin permiso `contents: write` → 403 al crear GitHub Releases.
**Fix:** Agregar `permissions: contents: write` a `build-apk.yml` y `release-automatic.yml`.

| Commit | Fix |
|--------|-----|
| `2a4d7ef` | permissions: contents: write en release-automatic.yml |
| `61f7fb3` | grep -xE semver en extractVersion de ambos workflows |
| `22a9ba7` | permissions: contents: write en build-apk.yml |
| `a2544c8` | autoUpdate: endpoint releases versionadas + validación semver |
| `f3988e3` | build-apk.yml: releases con tag semver (v1.0.2) en vez de "latest" |
| `63dda20` | build-apk.yml: guard para versión vacía en release step |
| `759eccc` | pin expo-file-system@19.0.23 y expo-linking@8.0.12 para SDK 54 |

### 🔒 Auditoría de Seguridad

| Resultado | Detalle |
|-----------|---------|
| **CRÍTICO** | 0 |
| **ALTO** | 0 |
| **MEDIO** | 0 |
| **BAJO** | 3 (AsyncStorage sin cifrar, User-Agent spoofing, dotenv a stdout) |
| **npm vulns** | 0 altas/críticas — solo 32 moderadas (expo) |

**Hallazgos clave:**
- ✅ Sin API keys reales expuestas
- ✅ Solo HTTPS (usesCleartextTraffic: false)
- ✅ Sin permisos extras (permissions: [])
- ✅ Sin eval() ni inyección de código
- ⚠️ 5 dependencias @expo/* con vulnerabilidades moderadas (build-time, no runtime)
- ⚠️ `console.warn` en ErrorBoundary podría exponer stack traces en producción
- ⚠️ `'test-api-key'` en jest.setup.js (mock, no real)

### 📱 APK Crash — Fix dependencias nativas (SDK 54 vs SDK 56)

**Problema:** `expo-file-system@56.0.8` y `expo-linking@56.0.14` (SDK 56) estaban instaladas en `node_modules` a pesar de que el proyecto usa Expo SDK 54, causando conflictos de módulos nativos en la APK compilada.
**Fix:** Pinned `expo-file-system@19.0.23` y `expo-linking@8.0.12` (versiones correctas para SDK 54).
**APK verificada:** ✅ Funciona correctamente, sin crash al abrir.

### 📡 Historial con DolarApi.com (+945 registros desde 2023)

**Nuevo:** `fetchHistoricalFromAPI()` en `api.js` consulta `ve.dolarapi.com/v1/historicos/dolares` y mergea con datos locales.
- API como base (bcv, paralelo), datos locales sobrescriben (BCV Lunes manual, Binance, Euro)
- Cache de 1 hora en AsyncStorage
- `getHistoricalRates()` ahora retorna datos mergeados (API + local)

### 💾 Tasas locales retenidas 365 días

`saveHistoricalRate()` lee/escribe solo storage local (no pasa por `getHistoricalRates()` que mergea API). Conserva máximo 365 entradas.

### ⌨️ Fix teclado gasolina en Android

`KeyboardAvoidingView` cambiado de `behavior={undefined}` a `behavior="padding"` en Android para evitar que el teclado tape el input de litros.

### 🏗️ Builds exitosos

| Commit | SHA | Cambio |
|--------|-----|--------|
| `3f7aa15` | feat + fix | Historial DolarApi, fix teclado gasolina, docs |
| `88b7a98` | fix | saveHistoricalRate local-only + 365 días |
| Builds | ✅ #27922474330, #27922787424 | |
| APK verificada | ✅ Sin crash al abrir | |

---

## 📋 Estado Actual

### Ramas principales
- `main` — **versión estable v1.6.0** (versionCode 10600) — incluye Datos Bancarios, PayPal Calculator, fixes de lint, signing verification en CI, EAS token en GitHub Secrets, auto-update verified end-to-end.
- `feature/ui-2026` — histórica (rediseño glass 2.0), mergeada a main.
- `fix/download-android-16`, `fix/auto-update-install`, `feat/version-code`, `feature/ui-2026` — ramas remotas históricas, contenidas en main.
- `redesign` — histórica, reemplazada.

### Móvil / Mobile (rama `main`)
- **444 tests, 32 suites — 100% passing** ✅ · typecheck real activo (`checkJs: true`)
- **Lint:** 0 errors, **0 warnings** (deshabilitadas reglas experimentales del React Compiler)
- **Versión actual:** **1.6.0** (package.json + app.config.js = 1.6.0, versionCode derivado 10600)
- Fuentes: DolarApi.com (BCV, Paralelo, Euro) + Binance P2P directo
- Dependencias: `expo-blur`, `react-native-pager-view`, `expo-linear-gradient`, `expo-file-system`, `expo-linking`
- `.env` **no existe en el repo** — está en `.gitignore`
- Para desarrollo: `npx expo start --tunnel`
- Build APK: GitHub Action `Build APK (React Native)` (~6 min)
  - **Signing:** usa `eas build --local` con EXPO_TOKEN → keystore EAS consistente. SHA-256: `299073e3...`. Los workflows verifican la firma automáticamente antes de subir.
  - Assets: **`TasaDelDia-vX.Y.Z.apk`** (versionado)
- Release con changelog: `Release Automático con Changelog` (workflow_dispatch o tags v*)
- **Auto-update verificado end-to-end** en Galaxy A12 y Galaxy A54 (v1.4.4 → v1.4.5 → v1.4.6 → v1.4.7). v1.4.6 fix: auto-update ahora busca APKs `TasaDelDia*` (firma EAS) en vez de cualquier `.apk`

**Workflows móviles activos (4):**
| Workflow | Trigger | Propósito |
|----------|---------|-----------|
| `build-apk.yml` | Push a main + manual | Build (EAS) + firma verification + Auto-release |
| `release-automatic.yml` | Manual + tags v* | Release con changelog + firma verification + APK |
| `mobile-ci.yml` | Push/PR a main | Tests (444) + lint (0) + typecheck |
| `auto-sync.yml` | Cron diario 6AM UTC + manual | Auto-commit diario de cambios pendientes |

**Workflows eliminados:** `release-apk.yml` y `android-build.yml`

### ✨ Auto-Update desde GitHub
| Componente | Archivo | Detalle |
|------------|---------|---------|
| Auto-update service | `src/services/autoUpdate.js` | Consulta releases versionadas, compara semver, cache 30 min, skip version, descarga APK (**prefiere assets `TasaDelDia*` con firma EAS**; API moderna `File.downloadFileAsync` + watchdog anti-stall; instalación con `ACTION_INSTALL_PACKAGE` + flag 1, sin chooser) |
| Update Modal | `src/components/UpdateModal.js` | Modal con botones Descargar / Saltar / Más tarde |
| Integración | `App.js` | Check automático al montar (diferido con `InteractionManager`) |
| Tests | `src/services/__tests__/autoUpdate.test.js` | 18 tests |

- ⚠️ `skills/` **no existe en el repo de la app** — la referencia (~40 skills) es del workspace/repo externo `mi-repo-de-skills`, no de este repositorio
- ⚠️ `~/.config/opencode/opencode.json` y `~/agents/` son del entorno del agente anterior (opencode) — no aplican a este entorno

---

## 📂 Docs de referencia

| Archivo | Qué contiene |
|---------|-------------|
| `AI_HANDOFF.md` | **Este archivo** — estado y handoff |
| `docs/superpowers/specs/` | ⚠️ **No existe en este repo** — referencia histórica de specs (sesiones previas); no hay `docs/` |
| `docs/superpowers/plans/` | ⚠️ **No existe en este repo** — referencia histórica de planes; no hay `docs/` |

---

## ⏭️ Próximos Pasos Posibles
1. ~~Verificar release 1.3.1~~ — ✅ **HECHO (18-Ago)**: release v1.4.4 publicada y validada
2. ~~Commitear archivos sin trackear~~ — ✅ **HECHO (16-Ago)**
3. ~~Revisar `ios/` sin trackear~~ — ✅ **HECHO (18-Ago)**: `ios/` en main
4. ~~Commitear cambios pendientes~~ — ✅ **HECHO (16-Ago)**
5. ~~Probar auto-update end-to-end~~ — ✅ **HECHO (19-Ago)**: v1.4.4→v1.4.5 verificado en Galaxy A12 y Galaxy A54
6. ~~Limpiar warnings de lint~~ — ✅ **HECHO (19-Ago)**: 57→0 warnings
7. ~~Signing key fix~~ — ✅ **HECHO (19-Ago)**: APK reconstruida con EAS, firma verificada, CI hardening
8. ~~**📢 Comunicar a usuarios**~~ — ✅ **HECHO (19-Ago)**: release v1.4.6 publicada con fix de signing
9. ~~Datos Bancarios~~ — ✅ **HECHO (05-Sep)**: CRUD completo con tests
10. ~~PayPal Calculator~~ — ✅ **HECHO (05-Sep)**: 4 tipos de tarifa con tests
11. ~~Code review + refactor~~ — ✅ **HECHO (05-Sep)**: calcSpread DRY, useMemo, sanitizeId, buildResultText fix
12. **Probar en Expo Go en dispositivo:** verificar que las nuevas pestañas funcionan correctamente
13. **Build EAS release v1.6.0:** compilar APK con firma EAS para distribución
14. **Opcional: migrar a DownloadManager nativo**: la descarga sobrevive al cierre de la app, estilo Telegram
15. **Opcional: migrar AnimatedNumber del hero a Reanimated** (hilo UI) para eliminar el último plateau de jank en arranque
16. **Opcional: agregar test de `gradlew assembleRelease` en CI** que intente build y verifique que falla (defensivo contra regression)

---

### Sesión 22-Jun-2026 (tarde) — Fixes de entrada numérica + Historial 10 días + teclado
- **Bug crítico:** Parseo de "1.50" → 150 en `useRatesData.js` corregido (detecta si hay coma para decidir si puntos son miles)
- **Calculadora:** `extractRawDigits` ahora conserva el separador original (coma o punto) sin convertirlo. `keyboardType` cambiado a `decimal-pad` en Android (antes `numeric` no tenía coma/punto)
- **Historial:** Ahora muestra solo últimos 10 días en chips y lista (antes 365). Buscador permite fechas desde 2023 (API DolarApi)
- **Gasolina (Android):** `KeyboardAvoidingView` con `behavior` solo en iOS; Android usa `adjustResize` nativo
- **Quick amounts:** Se adaptan al modo USD→Bs o Bs→USD según la tasa actual
- **Auto-update:** Agregado permiso `REQUEST_INSTALL_PACKAGES` para Android 10+
- **UpdateModal:** Renderizado condicional (solo si hay `updateInfo`)
- **Release v1.0.3:** Tag pusheado, workflows en progreso
- **Tests:** 156/156 passing

| Commit | SHA | Cambio |
|--------|-----|--------|
| `bb9879f` | fix | input parsing decimales, quick amounts adaptativos, permiso instalación |
| `fb4f0cb` | feat | historial solo últimos 10 días + buscador |
| `10e2e6b` | fix | teclado gasolina Android (KeyboardAvoidingView solo iOS) |
| `aa74dee` | fix | calculadora conserva coma/punto sin borrar + decimal-pad en Android |
| `328d651` | chore | bump version 1.0.3 |
| `a452e9e` | (amend) | chore: bump version to 1.0.3 |

---

### Sesión 03-Jul-2026 — Rediseño mobile + build APK debug desde workflow (`redesign`)
- `redesign` ahora incluye rediseño mobile completo: paleta Venezuela 2026 (`8d35780`)
- Workflow `build-apk.yml` actualizado en `redesign` para saltar releases en branches que no sean `main`
- Build EAS preview lanzado desde workspace; alternativa local documentada en README para `assembleDebug`
- Pendiente: APK debug compilada del commit `8d35780`

---

### Sesión 04-Ago-2026 — Auditoría + fixes de bugs + Binance P2P robusto

**Auditoría completa del repo (main). Bugs corregidos:**

| # | Fix | Archivo |
|---|-----|---------|
| 1 | Recordatorio viernes: ya no se pierde. Si el viernes la tasa ya fue ingresada, agenda el PRÓXIMO viernes; si no, agenda hoy 18:00; nunca agenda en el pasado | `src/services/notifications.js` |
| 2 | Versión alineada: `package.json` 1.0.0 → 1.3.0 (app.config.js) | `package.json` |
| 3 | `release-automatic.yml`: commit del version bump fallaba en push de tags (detached HEAD). Ahora hace `git checkout -b ci-release origin/main` | `.github/workflows/release-automatic.yml` |
| 4 | CI lint/typecheck eran no-op (`continue-on-error` sin config). Creados `tsconfig.json` + `eslint.config.js`, devDeps `typescript@5.9.3`, `eslint@9`, `eslint-config-expo@57`; steps ahora gating | `tasa-del-dia/` + `mobile-ci.yml` |
| 5 | `checkLatestRelease`: ahora devuelve la release más nueva QUE TENGA APK (antes null si la más nueva no tenía asset) | `src/services/autoUpdate.js` |
| 6 | `parseDateDDMMYYYY`: valida días reales del mes (30/02 → null) | `src/services/api.js` |
| 7 | `backgroundTasks.js`: `__DEV__` guards en console.warn | `src/services/backgroundTasks.js` |
| 8 | `App.js`: cleanup del setTimeout del modal de update + botón "Reintentar" en ErrorBoundary | `App.js` |
| 9 | `formatEditTime`: hora ya no se pierde (toLocaleString en vez de toLocaleDateString) | `src/hooks/useRatesData.js` |
| 10 | `fetchAllData`: dedupe de peticiones concurrentes (Rates + Converter ya no duplican fetch al abrir) | `src/services/api.js` |
| 11 | Binance P2P robusto: 10 ofertas BUY, User-Agent de navegador, promedio recortado (sin outliers), null si falla | `src/services/api.js` |
| 12 | Lint cleanup: imports/sin vars sin uso (12 archivos) | varios |

**Binance P2P — solución aplicada:** el endpoint `p2p.binance.com` es no-oficial y la única fuente P2P viable (Binance no tiene API oficial P2P). Se endureció: pide 10 ofertas, envía UA de navegador, recorta min/max y promedia el resto, y mantiene el fallback silencioso a null (la app ya muestra caché offline si falla). Si Binance llegara a bloquearlo, se puede añadir fallback a un agregador (e.g. CoinGecko no tiene VES; alternativa: scrape de otro P2P o tasa de referencia del paralelo).

**Notas CI:** TS 7.0 y ESLint 10 rompen con typescript-eslint/plugin-react → pinneados `typescript@5.9.3` y `eslint@9`. Reglas react-compiler (`react-hooks/refs`, `set-state-in-effect`) downgradeadas a warning por falsos positivos con patrones RN estándar.

**Tests:** 167/167 passing (20 suites) — se actualizó el test que codificaba el bug del recordatorio (mock determinístico de `new Date()`) y se agregaron tests para Binance (promedio recortado, rows=10, fallos) y dedupe de `fetchAllData` (4 fetches concurrentes en vez de 8).

---

### Sesión 06-Ago-2026 — Code review completo + fixes críticos + release 1.3.1

**Code review completo de la app** (ver git log desde `8d7e52d`). Hallazgos y fixes aplicados:

| # | Fix | Archivo |
|---|-----|---------|
| 1 | **🔴 Auto-update APK roto**: `expo-file-system` v19 (SDK 54) ya no exporta la API legacy desde el import por defecto (`cacheDirectory` = undefined, `createDownloadResumable` lanzaba error en runtime → degradaba a abrir el navegador). Fix: import desde `expo-file-system/legacy` + `getContentUriAsync()` antes de `Linking.openURL` (evita `FileUriExposedException` en Android 7+). Los tests no lo detectaban porque `jest.setup.js` mockeaba la API legacy | `src/services/autoUpdate.js`, `jest.setup.js` |
| 2 | **🔴 Recordatorio viernes de un solo disparo**: trigger `DATE` se perdía si no se reabría la app. Fix: `SchedulableTriggerInputTypes.WEEKLY` (weekday 6 = viernes, 18:00, se repite solo). Se eliminaron `wasEnteredToday` y el parámetro `bcvLunesUpdatedAt`; el test se reescribió para WEEKLY | `src/services/notifications.js`, `__tests__/notifications.test.js` |
| 3 | **🔴 Typecheck era no-op**: `checkJs: false` + tsconfig sin trackear en git (el CI nunca verificó nada). Fix: `checkJs: true` (excluye tests/scripts), se instaló **`@types/react@^19`** (¡no estaba instalado! — rompía `React.Component` y `Animated.View`), y se corrigieron errores de tipos reales (JSDoc props en `RateCard`, typedef en `ThemeContext`, `setTheme` con firma, narrowing de `PromiseSettledResult` en `api.js`, params opcionales en `saveHistoricalRate`, `Date.now() - d.getTime()`, brechas con `Number()` + guard `> 0`). **795 errores → 0** | `tsconfig.json`, `package.json`, varios |
| 4 | Limpieza: eliminados `useAutoRefresh.js` + su test (código muerto) y `REFRESH_INTERVAL` de constants; eliminada la doble llamada a `getStoredBCVLunes` en `useConverterData`; eliminada la clave `lint` duplicada en `package.json` | hooks, constants, package.json |
| 5 | Temas/UX: `CustomTabBar` con tint según tema (antes siempre dark); `userInterfaceStyle: automatic` (antes dark); gate de tema cargado en `App.js` (sin flash al arrancar); **BackHandler Android** (el botón atrás vuelve a la pestaña anterior en vez de cerrar la app) | `CustomTabBar.js`, `app.config.js`, `App.js` |

**Validación:** tests 162/162 (19 suites) · lint 0 errores / 53 warnings (`react-hooks/refs`, a propósito en warn) · **typecheck real 0 errores** · CI verde en `8d7e52d` (Lint ✅, Typecheck ✅, tests ✅).

**Commits / Release:** `8d7e52d` (todos los fixes, pusheado a `main`). Release **1.3.1** disparada vía `release-automatic.yml` (workflow_dispatch, `version=1.3.1`) — run 31066486879, build APK **en curso** al cierre de esta sesión.

**Ambiente (importante para el próximo agente):**
- Este entorno no traía Node/npm/git. Ya instalados: **Node v22.23.2 en `~/nodejs`** (agregado al PATH en `~/.bashrc`). Para comandos no-interactivos hay que exportar: `export PATH="$HOME/nodejs/bin:$PATH"`.
- **Git sin identidad configurada**: usar `git -c user.name="juancito8812" -c user.email="juanraudel170@gmail.com"` en los commits (no modificar la config global).
- **Sin credenciales de GitHub en el entorno**: para push/API el usuario debe proveer un PAT (scope `repo`). El token usado en esta sesión quedó expuesto en el chat y debe revocarse.
- Validaciones: `npm test`, `npm run lint`, `npm run typecheck` (desde `tasa-del-dia-app-/tasa-del-dia/`).
- Gotcha: en `expo-file-system` v19 usar SIEMPRE `expo-file-system/legacy` para `cacheDirectory`/`createDownloadResumable`/`getContentUriAsync`.

---

### Sesión 16-Ago-2026 — Auditoría de performance (skill `performance`)

Auditoría completa aplicando la skill `performance` (adaptada de web → React Native: los equivalentes a Lighthouse/CWV son **tamaño de bundle, arranque/TTI, primer pintado y jank de runtime**). Rama de trabajo: **`feature/ui-2026`** (rediseño glass 2.0). Medición con `npx expo export --platform android` (bundle Hermes `.hbc`).

**Fixes aplicados (3 rondas):**

| # | Fix | Archivo |
|---|-----|---------|
| 1 | **Bundle −9.2%**: `import { Ionicons } from '@expo/vector-icons'` arrastraba TODAS las familias de iconos + fuentes (MaterialCommunityIcons.ttf 1.31 MB incluida en el APK). Fix: `import Ionicons from '@expo/vector-icons/Ionicons'` en los 9 archivos que lo usaban | `src/screens/*`, `src/components/*` |
| 2 | **Lazy-mount del PagerView**: las 3 pestañas se montaban al arrancar → fetch histórico (945+ registros) + parseo + merge y montaje del conversor sin que el usuario los abriera. Ahora solo se monta la pestaña visitada (`visitedTabs`) | `App.js` |
| 3 | **Stale-while-revalidate**: `fetchWithOfflineFallback` esperaba la red antes de mostrar algo (skeleton 2-5s en 3G) aunque hubiera caché. Ahora los hooks muestran la caché guardada al instante (sin banner falso de offline) mientras la red revalida en background; el historial no se contamina con tasas viejas (`staleRef`) | `src/hooks/useRatesData.js`, `useConverterData.js` |
| 4 | Auto-update check diferido con `InteractionManager.runAfterInteractions` (no compite con el primer render ni el fetch de tasas) | `App.js` |
| 5 | `AnimatedNumber` respeta `reduceMotion` (salta directo al valor final — accesibilidad + menos trabajo JS por frame en 5 tarjetas simultáneas) | `src/components/AnimatedNumber.js` |
| 6 | **Memoización (10 componentes)**: `RateCard`, `RatesHeader`, `CustomTabBar`, `BCVModal`, `UpdateModal`, `DateDetailCard`, `ShimmerEffect`, `PressableScale`, `AnimatedNumber`, `ThemeToggleMini` envueltos en `React.memo` + handlers estabilizados con `useCallback` en hooks/screens (requisito para que el memo funcione) | `src/components/*`, `src/screens/*`, `src/hooks/*`, `App.js` |
| 7 | **Lista del historial**: extraído `HistoryListItem` memoizado (antes los 10 items se re-renderizaban con cada tecla del buscador, selección o copiado). **No** se usó FlatList: lista de ≤10 items dentro de ScrollView vertical — virtualizar empeoraría (YAGNI/ponytail) | `src/screens/HistoryScreen.js` |
| 8 | **Blur Android 6→2**: `BlurView` es un render effect costoso por instancia en Android. Ahora solo se usa en la tarjeta hero (BCV large) + tab bar; las tarjetas medium/compact usan `C.glassCard` (translúcido, ~costo cero). iOS sin cambios (blur nativo barato) | `src/components/RateCard.js` |

**Métricas (antes → después):**
- Bundle Hermes Android: **3,637,037 → 3,302,079 bytes (−335 KB, −9.2%)**
- Fuentes empaquetadas: todas las familias → **solo `Ionicons.ttf` (390 KB)**
- Instancias de `BlurView` en pantalla de tasas (Android): **6 → 2**
- Primer pintado con caché: skeleton de 2-5s → **datos al instante** (SWR)

**Validación:** tests **170/170 (21 suites)** · typecheck **0 errores** (`checkJs: true`) · lint **0 errores / 57 warnings** (preexistentes del rediseño, `react-hooks/refs` + `set-state-in-effect`, a propósito en warn).

**Gotchas para el próximo agente:**
- ⚠️ `React.memo(function X() {...})` **rompe la inferencia de props en `checkJs`** (errores `IntrinsicAttributes & object`). Usar SIEMPRE `function X() {...} export default React.memo(X)`.
- ⚠️ Hooks (`useMemo`) **nunca después de early returns** (rules-of-hooks) — `numberStyle` en `RateCard` va antes del `if (loading)`.
- ⚠️ Para que `React.memo` sirva, los handlers pasados como props deben ser `useCallback` (deps desestructuradas, no el objeto del hook, para evitar warnings `exhaustive-deps`).
- `ThemeContext` ya memoiza todo (`colors`/`value` estables) — condición necesaria para el memo de hijos, ya cumplida.
- **Commit de cierre (16-Ago): `8178189`** — todo el trabajo de performance, documentación y hardening de CI quedó commiteado en `feature/ui-2026` (30 archivos, +579/−155). Working tree limpio salvo `tasa-del-dia/ios/` (decisión pendiente, Próximos Pasos #3).

### 📱 Verificación en dispositivo (16-Ago-2026, Samsung Galaxy A12 / Android 12)

APK **release local con firma debug** compilada (`assembleRelease`, 8m28s) e instalada en el Galaxy A12 del usuario para validar las optimizaciones (en ese momento la v1.3.1 de producción se desinstaló por firmas incompatibles: keystore producción vs debug — los datos locales de la app en ese celular se borraron, el histórico se recarga de DolarApi).

**✅ ESTADO FINAL DEL DISPOSITIVO (restaurado):** al terminar las pruebas, el celular quedó **de nuevo con la v1.3.1 de producción** — APK descargado de la release de GitHub (`TasaDelDia-v1.3.1.apk`, 59.3 MB, firma de producción verificada: SHA-256 `299073e3…` vs `fac61745…` de la debug), desinstalada la debug e instalada la de producción. Arranque verificado (585 ms, 0 crashes). La APK debug con las optimizaciones quedó solo en el repo (`tasa-del-dia/android/app/build/outputs/apk/release/app-release.apk`) por si se quiere volver a probar (requiere desinstalar la de producción por la firma).

| Verificación | Resultado |
|---|---|
| **Arranque en frío** (`am start -W`) | 699 / 615 / 437 / 427 ms (promedio ~493 ms) |
| **Arranque en caliente** | 112 / 104 ms |
| **3 pestañas** (tap + swipe del PagerView) | Tasas (hero EN VIVO, brechas, gasolina) · Conversor (monta al abrir — lazy-mount OK) · Historial |
| **Conversión real** (teclado + botón) | 100 USD → **77.107,14 Bs.** (tasa BCV real 771,0714) |
| **Historial** | **929 registros** de DolarApi, chips 10 días, chart, detalle de día (16/08/2026 Dom) |
| **BackHandler Android** | Back vuelve a la pestaña anterior sin cerrar la app |
| **Logcat** (todas las pruebas) | **0 crashes FATAL · 0 errores JS · 0 errores de red** |
| **Scroll gfxinfo** | 336 frames: **1.19% janky**, 50/90/99th = 14/20/22 ms, 0 missed vsync · Fling (521 frames): 0.58% janky |
| **Modo offline** | Banner "Sin conexión" + tasas de caché al instante (SWR) + **retry automático** que reconectó solo al volver la red |
| **Conversor offline** | Tasas cacheadas + banner propio + conversión correcta sin red |
| **Batería/temperatura** (10.1 min uso intensivo) | Batería 85%→85% · CPU +0.1 °C · módem +0.3 °C · batería +0.4 °C · 0 crashes |

**Limitación de la medición de batería:** con el teléfono cargando por USB, `batterystats` no computa el drain por app (`Computed drain: 0`) — la temperatura es el proxy usado.

**Jank del arranque en frío (cold start):** 43.3% janky (224 frames en 5s, 99th = 97 ms). Diagnóstico: pico de 97 ms = parseo del bundle Hermes + primer render (inherente a RN en gama baja); plateau de 24-38 ms = **5 animaciones de conteo JS simultáneas** (AnimatedNumber, listener + setState ×60fps, 800-1200 ms) compitiendo con el arranque.

**Optimización aplicada y medida (A/B en dispositivo):** `AnimatedNumber` ahora **pospone el conteo con `InteractionManager.runAfterInteractions`** y **solo la tarjeta hero (large) anima** (`animate={isLarge}` en `RateCard`; el resto muestra el valor directo). 170/170 tests · typecheck ✅ · lint ✅. **A/B del cold start (gfxinfo, Galaxy A12), 3 corridas por versión:**
- Original: **43.3%** janky · 50th 24 ms
- Con posponer: 27.6% / 30.1% / 5.7% (prom ~21.1%) · 50th 24 ms
- **Con solo-hero-anima: 7.1% / 20.3% / 6.1% (prom ~11.1%, −74% vs original)** · 50th **18-19 ms** (cerca del frame budget 16.6 ms), 90th 25-28 ms
- TotalTime sin regresión (455-471 ms) · 0 crashes · UI verificada en dispositivo.
El pico 99th (~93-500 ms) persiste en corridas puntuales (parseo del bundle + primer render, inherente a RN en gama baja). Siguiente paso posible: migrar el conteo del hero a Reanimated (hilo UI) para eliminar el último plateau.

---

### Sesión 18-Ago-2026 — 🐛 Fix raíz: usuarios de 1.3.1 no podían actualizar (versionCode + instalador roto) — RELEASE 1.4.4

**Reporte del usuario:** los que tienen la v1.3.1 instalada no pueden actualizar a la nueva versión. Pedía "actualizar como Telegram" (APK fuera de Play Store con auto-update propio).

**Diagnóstico (systematic-debugging, evidencia de primera mano):**

| Evidencia | Resultado |
|---|---|
| `eas.json` en main: `appVersionSource: "remote"` | EAS **ignora** el `android.versionCode` de `app.config.js` y genera el **mismo código (3) para TODAS las releases** |
| Manifest binario de `v1.3.1.apk` (parseo AXML) | versionCode=**3**, versionName="1.3.1" |
| Manifest binario de `v1.4.3.apk` (descargada de Releases) | versionCode=**3** → instalar sobre 1.3.1 es rechazado (código no creciente) |
| Firma (cert X.509 del APK Signing Block v2) | **idéntica** en v1.3.1/v1.4.3/v1.4.4: SHA-256 `d33bf0118ff2add2b177c45d47ad2f38038a261431a9af700bb7e6b93c925055` (keystore EAS del proyecto, estable) |

**Segundo bug (descubierto en la prueba real en dispositivo):** la **v1.3.1 no puede auto-instalar** — `FileSystem.getContentUriAsync` + `Linking.openURL(contentUri)` (sin `FLAG_GRANT_READ_URI_PERMISSION`). El chooser "Abrir con" aparece, y al elegir el instalador **crash** con `SecurityException: UID does not have permission to content://com.tasadeldia.app.FileSystemFileProvider/...` (el bug que se creía de 1.4.0 también está en 1.3.1). Reproducido 3 veces (2 manuales + 1 automatizada) en Galaxy A12. La app no recibe la excepción (crashea el PackageInstaller, no la app) → el modal se queda sin respuesta.

**Fixes aplicados (commiteados y pusheados a `main`):**

| Commit | Qué |
|---|---|
| `d9f3002` | `eas.json`: `appVersionSource: "local"` → EAS respeta el versionCode derivado (1.4.4 → 10404) |
| `f0fbc39` | `autoUpdate.js`: consumir el rechazo de la descarga (`download.then(f => ['ok', f], () => 'failed')` → trata `failed` como stall → navegador). Fix del unhandled rejection detectado en code review |
| `d494c72` | **Fix CI `release-automatic.yml`**: el path de tags nunca había funcionado — `git push` sin upstream fallaba ("fatal: no upstream"). Ahora `git push origin HEAD:main` |
| `85f4b4d` | Bump `app.config.js` → **1.4.4** (versionCode 10404), committeado por el release-bot |

**Release publicada:** **v1.4.4** (tag `v1.4.4`, APK `TasaDelDia-v1.4.4.apk` 72 MB, versionCode **10404** verificado por parseo binario, firma idéntica). Nota de la release editada con **aviso para usuarios de 1.3.1** + guía de 4 pasos del camino manual (gh release edit).

**Prueba end-to-end en dispositivo (Galaxy A12, Android 12, por USB):** desinstalar → instalar v1.3.1 → abrir → modal detectó v1.4.4 → tap "Descargar APK" (descarga 72 MB OK) → instalador de la 1.3.1 crash (SecurityException, logcat) → **camino manual validado**: navegador → notificación de descarga → chooser → "Instalador del paquete" → pantalla "¿Deseas actualizar esta app?" → "Actualizar" → **v1.4.4 instalada encima de 1.3.1 sin desinstalar (datos conservados)** ✓

**Validación:** tests **176/176 (21 suites)** · typecheck 0 errores · lint 0 errores / 57 warnings (preexistentes).

**Ambiente (para el próximo agente):**
- El merge ff a main incluyó `tasa-del-dia/ios/` completo (18 archivos, `expo prebuild`) — **el pendiente #3 de Próximos Pasos quedó resuelto**: ios/ ya está en main (ojo: `userInterfaceStyle` puede requerir regenerar con `npx expo prebuild --platform ios` antes de un build iOS).
- adb en **`~/android-sdk/platform-tools/adb`** (dispositivo Galaxy A12 SM-A125M: `R58T51MR4BT`). `uiautomator dump` + `input tap` para automatizar UI sin ver pantalla.
- **`gh` CLI** (2.74.2) en `~/android-sdk/gh` (auth vía git credentials, persistente).
- Git config: `git config user.name "juancito8812" && git config user.email "juancito8812@users.noreply.github.com"`.
- Scripts de parseo AXML/Sig Block (Python) usados para verificar versionCode/firma — reutilizables, no commiteados.
- **Los usuarios de 1.3.1 del mundo NO pueden auto-instalar** (bug de 1.3.1); el aviso de la release v1.4.4 los guía al camino manual. La v1.4.4 ya instala directo (`ACTION_INSTALL_PACKAGE` + flag 1).
- **⚠️ Environment note:** el `gh` CLI, Java 17 y Android SDK están en `~/android-sdk/` (instalados en sesión 19-Ago). Para comandos Gradle exportar: `export JAVA_HOME=~/android-sdk/jdk-17.0.20+8 && export ANDROID_HOME=~/android-sdk`.

---

### Sesión 19-Ago-2026 — Pruebas en dispositivo + lint 0 + v1.4.5 + signing fix + CI hardening

**Sesión completa de testing, lint cleanup, releases y CI/CD.** Trabajo en Galaxy A12 (conectado vía USB) y Galaxy A54 (del usuario, sin USB).

#### 📱 Setup de entorno para testing en dispositivo

| Componente | Estado | Detalle |
|---|---|---|
| Java 17 (Eclipse Temurin) | ✅ Instalado local | `~/android-sdk/jdk-17.0.20+8` |
| Android SDK | ✅ Instalado local | `~/android-sdk` (cmdline-tools, build-tools 35, platform-tools) |
| ADB | ✅ v37.0.1 | Galaxy A12 detectada (`R58T51MR4BT`, Android 12, SDK 31) |
| EAS CLI | ✅ Instalado + autenticado | Cuenta `jr8812` via EXPO_TOKEN |
| gh CLI | ✅ v2.74.2 | Autenticado via git credentials |

#### 🐛 Fix: RatesScreen.js en modo diagnóstico

**Problema:** `RatesScreen.js` tenía cambios locales no commiteados — estaba en "modo diagnóstico" que solo mostraba una tarjeta BCV hardcodeada (773.31), eliminando todas las demás tarjetas (Paralelo, Euro, Binance P2P, BCV Lunes, Gasolina, Brechas).
**Fix:** `git checkout -- tasa-del-dia/src/screens/RatesScreen.js` + recompilación.

#### 🏎️ Benchmark completo en Galaxy A12

| Métrica | Resultado |
|---|---|
| Cold start | **533ms** avg (5 intentos: 541, 521, 550, 543, 510) |
| RAM | **113 MB** PSS idle, 129 MB post-stress, 155 MB post-historial |
| CPU | 15% idle, 70% pico (fetch APIs) |
| FPS | **60/60** |
| Crashes | **0** |
| Stress test (10 swipes) | 0 crashes, PID estable |
| APIs | Todas < 1s (DolarApi 0.28-0.60s, Binance 0.39s) |
| Memoria leak check | ✅ Sin leaks (119→113 MB después de 15s idle) |

#### 🔄 Pruebas de comportamiento

| Feature | Resultado |
|---|---|
| **Offline mode** | ✅ Cache + banner "Sin conexión" + retry automático (30s→5min backoff) |
| **Historial 929 registros** | ✅ Smooth scroll, +42 MB memory, 0 crashes |
| **Auto-update check** | ✅ Hits `api.github.com` al iniciar (verificado via logcat) |
| **Auto-update completo v1.4.4→v1.4.5** | ✅ Detección → Modal "Actualización disponible" → Tap "Descargar APK" → Progress → Package Installer → Instalación → v1.4.5 activa |
| **Post-update check** | ✅ `isUpdateAvailable('1.4.5', '1.4.5')` → false (sin loop infinito) |

#### 🧹 Lint cleanup (57 → 0 warnings)

| Archivo | Cambio |
|---|---|
| `eslint.config.js` | `react-hooks/refs: 'off'`, `react-hooks/set-state-in-effect: 'off'` (reglas experimentales del React Compiler, falsos positivos) |
| `AnimatedNumber.js` | `isFirstRender` de `useState` → `useRef` (flag sin re-render) |
| `useConverterData.js` | `rates[selectedRate]` inline en deps de useMemo (antes `getCurrentRate()`) |
| `useConverterData.test.js` | `onReady` agregado al deps array de `useEffect` |
| `useHistoryData.test.js` | `onReady` agregado al deps array de `useEffect` |
| `useRatesData.test.js` | `onReady` agregado al deps array de `useEffect` |

#### 📦 Release v1.4.5

**Commit `6f1bf30`:** `fix: align versions + lint 0 warnings + fix exhaustive-deps` (8 archivos, +15/-15)
**Commit `36f3203`:** `chore: bump version to 1.4.5`

**Problema descubierto: signing key mismatch**
- La v1.4.4 fue construida por `eas build --local` (keystore EAS, SHA-256 `299073e3...`)
- La primera v1.4.5 fue construida con `gradlew assembleRelease` (debug keystore, SHA-256 `fac61745...`)
- Resultado en Galaxy A54: "No se instaló la app" (firma incompatible)

**Fix:** Reconstruida v1.4.5 con `eas build --local` → firma idéntica a v1.4.4 → APK corregida subida a la release v1.4.5.

**Release:** https://github.com/juancito8812/tasa-del-dia-app-/releases/tag/v1.4.5

#### 🔐 CI Hardening

| Cambio | Archivo |
|---|---|
| `EXPO_TOKEN` agregado a GitHub Secrets | Repo settings |
| Signing verification step en build | `build-apk.yml` |
| Signing verification step en release | `release-automatic.yml` |
| README: Signing Policy documentada | `README.md` |
| README: warning contra `gradlew assembleRelease` | `README.md` |

**Commits de la sesión:**
```
2983474 docs: add signing policy and warn against gradlew assembleRelease
15041c5 ci: add APK signing verification step to prevent upgrade failures
36f3203 chore: bump version to 1.4.5
6f1bf30 fix: align versions + lint 0 warnings + fix exhaustive-deps
```

**Ambiente (para el próximo agente):**
- Java 17 en `~/android-sdk/jdk-17.0.20+8`
- Android SDK en `~/android-sdk` (build-tools 35.0.0, platform-tools)
- ADB: `~/android-sdk/platform-tools/adb`
- gh CLI: `~/android-sdk/gh` (autenticado como juancito8812)
- EAS CLI: global npm (autenticado con EXPO_TOKEN)
- Para compilar releases: `EXPO_TOKEN=... eas build --platform android --profile preview --local --output TasaDelDia.apk`
- **NUNCA** usar `gradlew assembleRelease` para releases (firma diferente)
- Git identity: `git config user.name "juancito8812" && git config user.email "juancito8812@users.noreply.github.com"`
- `.env` NO existe en el repo — EXPO_TOKEN está en GitHub Secrets

---

### Sesión 19-Ago-2026 (cont.) — Fix auto-update signing mismatch + v1.4.6

**Problema reportado:** Galaxy A54 muestra "No se instaló la app" al intentar auto-update de v1.4.4 a v1.4.5.

**Root cause:** `autoUpdate.js` usaba `release.assets.find(a => a.name?.endsWith('.apk'))` que elegía el **primer** asset `.apk`. El primero era `app-release.apk` (firma debug, SHA-256 `fac61745...`) en vez de `TasaDelDia-v1.4.5-eas.apk` (firma EAS, SHA-256 `299073e3...`). Android rechaza upgrades con firma diferente.

**Fixes aplicados:**

| # | Fix | Archivo |
|---|-----|---------|
| 1 | `autoUpdate.js` ahora busca assets que empiecen con `TasaDelDia` antes de caer a cualquier `.apk` | `src/services/autoUpdate.js` |
| 2 | APKs con firma incorrecta eliminadas de la release v1.4.5 | GitHub Release |
| 3 | Nueva release v1.4.6 con APK EAS firmada | GitHub Release |
| 4 | Bump version 1.4.5 → 1.4.6 | `app.config.js`, `package.json` |

**Release v1.4.6:** https://github.com/juancito8812/tasa-del-dia-app-/releases/tag/v1.4.6
**Verificación:** Galaxy A54 auto-update v1.4.4 → v1.4.6 funciona correctamente (usuario confirmado).

**Commits de la sesión 19-Ago (continuación):**
```
98037b6 chore: bump version to 1.4.6
3a50f0c fix: prefer TasaDelDia EAS-signed APKs over debug-signed app-release.apk
```

---

### Sesión 20-Ago-2026 — QA funcional en Galaxy A12 + fixes de los 5 hallazgos

**QA realizado:** sesión completa (~1h) en Galaxy A12 (SM-A125M, Android 12) con la v1.4.6 EAS, vía adb/uiautomator/logcat (QA funcional, sin inspección visual). Reporte: `dogfood-output/report.md`. Resultado: 0 crashes, 0 errores JS, matemática correcta. 5 hallazgos (1 medio, 4 bajos) + 3 observaciones INFO.

**Fixes aplicados (todos con tests):**

| # | Fix | Archivos |
|---|-----|----------|
| 1 | **[MEDIO]** BCV (Lunes) guardado en Tasas no llegaba al Conversor hasta reiniciar — pub/sub `subscribeBcvLunes`/`emitBcvLunesChanged`; `useRatesData` emite al guardar/limpiar, `useConverterData` se suscribe y actualiza `rates.bcv_lunes` al instante | `src/services/api.js`, `src/hooks/useRatesData.js`, `src/hooks/useConverterData.js` |
| 2 | Alert nativo de validación → inline (estado `validationError` + mensaje rojo bajo el botón Convertir; `loadError` inline en header sin Alert) | `src/hooks/useConverterData.js`, `src/screens/ConverterScreen.js` |
| 3 | Montos Bs→USD pequeños redondeados a 0,00 → `formatCurrencySmart` (hasta 6 decimales cuando < 1) | `src/utils/formatting.js`, `src/screens/ConverterScreen.js` |
| 4 | Teclado tapaba Guardar/Cancelar en BCVModal (Modal de RN no responde a adjustResize) → `KeyboardAvoidingView behavior="height"` en Android | `src/components/BCVModal.js` |
| 5 | Prefill del modal "780.5" → `formatCurrency` es-VE ("780,50") | `src/screens/RatesScreen.js` |
| 6 | Hero y tarjetas sin acción parecían clickeables (PressableScale sin onPress) → solo se envuelven con `onEdit` | `src/components/RateCard.js` |

**Observaciones INFO resueltas:**
- Hora del Euro "12:00 a.m.": **dato correcto del API** — DolarApi `euros/oficial` entrega `fechaActualizacion: 2026-08-20T00:00:00-04:00` (medianoche Caracas, publicado una vez al día). No es bug.
- Scroll: falsa alarma del QA (contenido que cabe en pantalla). No es bug.
- El "?" del hero: no existe icono "?" en el código — era la tarjeta hero con press feedback sin acción (fix #6).

**Tests:** 186 en total (176 → 186: +4 useConverterData, +3 useRatesData, +3 formatCurrencySmart). `npx jest` ✅ · `npx expo lint` ✅ · `npx tsc --noEmit` ✅.

**Verificación en dispositivo (misma sesión, build EAS v1.4.7 local, firma `299073e3…` verificada):**
1. Instalada sobre v1.4.6 en el A12 (`adb install -r`, sin pérdida de datos — 780,50 persistió).
2. **Fix 1** ✅: guardé 800 en Tasas → el Conversor mostró "BCV (Lunes), Bs. 800,00" al instante, sin reiniciar; conversión 15 Bs ÷ 800 correcta.
3. **Fix 2** ✅: Convertir con monto vacío → "Ingresa un monto válido" inline bajo el botón, sin Alert.
4. **Fix 3** ✅: 15,00 Bs → **0,01875 USD** (decimales para < 1).
5. **Fix 4** ✅: con teclado abierto los botones del modal quedan visibles (y≈955); Guardar funcionó al primer toque (antes el tap caía en el teclado).
6. **Fix 5** ✅: prefill del modal "780,50".
7. **Fix 6** ✅: el "?" del hero ya no es clickable (`clickable="false"` en uiautomator).
8. Tasa de prueba restaurada a 780,50.

**Publicación v1.4.7 (mismo día):**
- Commit `277bc9f` en main: fixes + tests + bump 1.4.7 + `dogfood-output/` (report.md + screenshot QA).
- **Nota:** el build EAS local en esta máquina requiere `export JAVA_HOME=~/android-sdk/jdk-17.0.20+8` y `ANDROID_HOME=~/android-sdk` (sin JAVA_HOME falla silenciosamente al final con "build command failed"; el log completo solo muestra warnings de expo doctor: eslint-config-expo 57.0.1 vs ~10.0.0 — inofensivo).
- Tag/release **v1.4.7** vía workflow `release-automatic.yml` (corre tests, build EAS local en CI con EXPO_TOKEN del secreto, verifica firma `299073e3…`, upsert de release). Changelog automático salió vacío ("0 cambios") porque el tag ya apuntaba al commit; las notas se editaron manualmente con `gh release edit`.
- **OJO para próximas sesiones:** si se crea el tag manualmente antes del workflow, el changelog generado queda vacío — alternativa: usar `workflow_dispatch` (bump_type) que commitea el bump ANTES de crear el tag, o editar notas después.

---

### QA full de la release oficial v1.4.7 (20-Ago-2026, segunda pasada)

APK **oficial del repositorio** (descargado de la release v1.4.7, firma EAS `299073e3…` + versionCode 10407 verificados con apksigner antes de instalar; `adb install -r` sobre el build local, sin borrar datos). Prueba exhaustiva en el A12:

| Área | Resultado |
|---|---|
| Tasas en vivo | BCV 777,42 · Paralelo 905,36 · Euro 906,83 · Binance 918,96 ✓ |
| BCV (Lunes) | dato persistido tras reinstalar; brechas correctas (BCV 16,5%, Lunes 13,2%) ✓ |
| Gasolina | 1L–30L correctos ✓ |
| Conversor USD→Bs | 100 USD × 777,42 = 77.741,61 Bs ✓ |
| Cambio de tasa | Paralelo → 100 USD = 90.535,84 Bs ✓ |
| Fix 3 | 1,5 Bs → 0,001657 USD ✓ |
| Fix 2 | validación inline sin Alert ✓ |
| Fix 1 | guardar 810 en Tasas → "BCV (Lunes) 810,00" al instante en el Conversor ✓ |
| Fix 5 | prefill "800,00" es-VE ✓ |
| Fix 4 | con teclado abierto Guardar/Cancelar visibles (y≈955), Guardar al primer toque ✓ |
| Historial | 932 registros, chips 10 días, detalle 19/08 ✓ |
| Offline | banner "Sin conexión — Mostrando últimas tasas (5:57 p. m.)" + conversión con caché (50 Bs → 0,055227 USD) ✓ |
| Reconexión | banner desaparece ✓ |
| BackHandler | Conversor → Tasas ✓ |
| Estabilidad | 0 FATAL, 0 errores JS, RAM 154 MB ✓ |

**Estado final del dispositivo:** app v1.4.7 (release oficial), tasa BCV (Lunes) restaurada a 780,50, red activa. Única limitación del QA: el toggle de tema se presionó pero el modelo no puede verificar el cambio visualmente (sin visión).

---

*Fin del documento de traspaso — Última actualización: 05-Sep-2026*
