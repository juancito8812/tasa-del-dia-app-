# Documento de Traspaso (AI Handoff Document)

> **LEE ESTE ARCHIVO PRIMERO** — Contiene el estado actual del proyecto, lo último que se hizo y los specs/planes disponibles.

## 📌 Contexto del Proyecto

**Tasa del Día** — App móvil para consultar tasas de cambio en Venezuela.

| Parte | Stack | Rama | Estado |
|-------|-------|------|--------|
| `tasa-del-dia/` | React Native + Expo SDK 54 | `main` | ✅ Activa (Android) |
| `redesign` | Agrega rediseño mobile | feature branch | 🚧 En prueba |

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
- `main` — versión estable publicada en Releases.
- `redesign` — desarrollo activo: rediseño mobile.

### Móvil / Mobile
- **156 tests, 20 suites — 100% passing** ✅
- Fuentes: DolarApi.com (BCV, Paralelo, Euro) + Binance P2P directo
- Dependencias: `expo-blur`, `react-native-pager-view`, `expo-linear-gradient`, `expo-file-system`, `expo-linking`
- `.env`: `COTIZAVE_API_KEY` obsoleta (no se usa en runtime)
- Para desarrollo: `npx expo start --tunnel`
- Build APK: GitHub Action `Build APK (React Native)` (~6 min)
  - Cada build puede crear automáticamente un Release en GitHub con la APK
  - URL de descarga: `https://github.com/juancito8812/tasa-del-dia-app-/releases/latest/download/TasaDelDia.apk`
- Release con changelog: `Release Automático con Changelog` (workflow_dispatch o tags v*)

**Workflows móviles activos (3):**
| Workflow | Trigger | Propósito |
|----------|---------|-----------|
| `build-apk.yml` | Push a main + manual | Build + Auto-release |
| `release-automatic.yml` | Manual + tags v* | Release con changelog + APK |
| `mobile-ci.yml` | Push/PR a main | Tests + lint |

**Workflows eliminados:** `release-apk.yml` y `android-build.yml`

### ✨ Auto-Update desde GitHub
| Componente | Archivo | Detalle |
|------------|---------|---------|
| Auto-update service | `src/services/autoUpdate.js` | Consulta releases versionadas, compara semver, cache 30 min, skip version, descarga APK |
| Update Modal | `src/components/UpdateModal.js` | Modal con botones Descargar / Saltar / Más tarde |
| Integración | `App.js` | Check automático al montar, delay 2s |
| Tests | `src/services/__tests__/autoUpdate.test.js` | 12 tests |

- Skills en `skills/` (~40 skills)
- Config global en `~/.config/opencode/opencode.json`
- Marketplace externo: `wshobson/agents` en `~/agents/`

---

## 📂 Docs de referencia

| Archivo | Qué contiene |
|---------|-------------|
| `AI_HANDOFF.md` | **Este archivo** — estado y handoff |
| `docs/superpowers/specs/` | Specs de features diseñadas |
| `docs/superpowers/plans/` | Planes de implementación |

---

## ⏭️ Próximos Pasos Posibles
1. **Probar la APK nueva** — instalar el último build y verificar que la actualización automática funciona
2. Build local APK con EAS
3. Ajustes finos al glassmorphism / UI

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

*Fin del documento de traspaso — Última actualización: 03-Jul-2026*
