# Documento de Traspaso (AI Handoff Document)

> **LEE ESTE ARCHIVO PRIMERO** — Contiene el estado actual del proyecto, lo último que se hizo y los specs/planes disponibles.

## 📌 Contexto del Proyecto

**Tasa del Día** — App multiplataforma para consultar tasas de cambio en Venezuela.

| Parte | Stack | Rama | Estado |
|-------|-------|------|--------|
| `tasa-del-dia/` | React Native + Expo SDK 54 | `main` | ✅ Activa (Android) |
| `tasa-del-dia-desktop/` | Python + Flet 0.85.3 | `main` | ✅ Activa |

API Mobile: `https://ve.dolarapi.com/v1` + Binance P2P directo
API Desktop: `https://ve.dolarapi.com/v1` + Binance P2P directo

**Skills usadas:** brainstorming → spec → writing-plans → test-driven-development → incremental-implementation → debugging-and-error-recovery → frontend-ui-engineering → ponytail → systematic-debugging → verification-before-completion → subagent-driven-development
**Método de trabajo:** git worktree (`.worktrees/` ignorado via `.gitignore`)

### ⚠️ Skills del repo externo — leídas y aplicadas (15/15)

**Siempre que se trabaje en este proyecto, se DEBEN leer y aplicar todas las skills del repositorio:**  
🔗 `https://github.com/juancito8812/mi-repo-de-skills`

Skills activas permanentemente (modifican comportamiento base):

| Skill | Efecto |
|-------|--------|
| **ponytail** | Solución más simple que funciona. YAGNI, stdlib primero, marcar con `ponytail:` |
| **systematic-debugging** | Root cause antes de fix. 4 fases: investigar → analizar → hipótesis → implementar |
| **verification-before-completion** | Evidencia fresca antes de claims. NO decir "debería funcionar" sin verificar |
| **subagent-driven-development** | Flujo: implementer → spec review → quality review por cada tarea |
| **using-superpowers** | Invocar skills relevantes antes de cada respuesta. Si hay 1% de posibilidad, invocar |

Skills leídas (aplicar cuando corresponda):

| Skill | Cuándo aplicar |
|-------|---------------|
| **brainstorming** | Antes de cualquier trabajo creativo — diseño → spec → plan, nunca implementar sin diseño aprobado |
| **dispatching-parallel-agents** | 2+ fallos independientes → 1 agente por dominio en paralelo |
| **executing-plans** | Tener un plan escrito → revisar → ejecutar tareas → verificar |
| **finishing-a-development-branch** | Tests pasan → detectar entorno → presentar opciones (merge/PR/keep/discard) |
| **receiving-code-review** | Recibir feedback → verificar antes de implementar, no performative agreement |
| **requesting-code-review** | Después de cada tarea → dispatch reviewer con SHAs y contexto |
| **test-driven-development** | RED (test fallido) → GREEN (código mínimo) → REFACTOR. Nunca código sin test fallido primero |
| **using-git-worktrees** | Antes de features — workspace aislado via herramienta nativa o git worktree |
| **writing-plans** | Spec aprobado → plan con pasos de 2-5 min, código completo en cada paso |
| **writing-skills** | Crear skills nuevas → TDD aplicado a documentación (baseline → skill → verify) |

---

## 🚀 Últimos Cambios (Sesión 22-Jun-2026)

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
| `a2544c8` | autoUpdate: endpoint /releases/latest + validación semver |
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

### 📦 Archivos creados en esta sesión

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/__tests__/useRatesData.test.js` | 11 tests: carga tasas, BCV Lunes, brecha, offline |
| `src/hooks/__tests__/useConverterData.test.js` | 19 tests: extractRawDigits (7 formatos), conversión, swap, spreads |
| `src/hooks/__tests__/useHistoryData.test.js` | 18 tests: formatCurrency, historial, chartInfo, fechas |
| `src/components/__tests__/BCVModal.test.js` | 5 tests: visibilidad, edición, guardar |
| `src/components/__tests__/UpdateModal.test.js` | 7 tests: versión, botones, skip, release notes |
| `src/components/__tests__/RatesHeader.test.js` | 5 tests: título, banners, offline |
| `src/components/__tests__/DateDetailCard.test.js` | 7 tests: date badge, copy, copied state |
| `src/components/__tests__/HistoryChart.test.js` | 6 tests: null chart, legend, bar values, plural |
| `src/components/__tests__/ScreenContainer.test.js` | 3 tests: dark/light mode, children |

### 🗑️ Workflows consolidados

| Workflow | Estado | Motivo |
|----------|--------|--------|
| `release-apk.yml` | ❌ Eliminado | Reemplazado por release-automatic.yml (con changelog) |
| `android-build.yml` | ❌ Eliminado | Redundante con build-apk.yml |
| `build-apk.yml` | ✅ Activo | Build APK local + Release "latest" → ahora tags semver |
| `release-automatic.yml` | ✅ Activo | Release con changelog automático |
| `mobile-ci.yml` | ✅ Activo | Tests + lint en push/PR |

### 🖥️ Desktop — Fix scroll vertical y thread-safe refresh

**Problema 1:** Scroll vertical no funcionaba dentro de las tabs con `ft.ListView`.

**Fix:** Reemplazar `ft.ListView(expand=True, scroll=AUTO)` por `ft.Column(scroll=AUTO, expand=True)` en las 3 tabs. En historial, chips cambiaron de `scroll=AUTO` a `wrap=True` para evitar que el scroll anidado intercepte clicks.

**Problema 2:** `threading.Timer` en PyInstaller EXE no actualizaba la UI (tarjetas mostraban "—").

**Fix:** Reemplazar `threading.Timer(0.1, init_app)` por `page.run_thread(init_app)` — API thread-safe de Flet 0.85. Agregado feedback visual inmediato "🔄 Conectando con el servidor..." y logging detallado.

**Build:** `python build_flet.py --quick` → `dist/TasaDelDiaFlet.exe` (80.5 MB, 1m 36s)

### 🚀 Auto-Update — Fix endpoint GitHub + releases con tag semver

**Problema:** `autoUpdate.js` consultaba `/releases/tags/latest` que devolvía tag literal "latest" (no semver), rompiendo `compareVersions()`.

**Fix:** Cambiar endpoint a `/releases/latest` (API de GitHub devuelve el último release publicado con tag real) + validación semver con regex. Workflow ahora crea releases con tag `v1.0.2` (no "latest").

**Versión:** 1.0.1 → 1.0.2

### 📱 APK Crash — Fix dependencias nativas (SDK 54 vs SDK 56)

**Problema:** `expo-file-system@56.0.8` y `expo-linking@56.0.14` (SDK 56) estaban instaladas en `node_modules` a pesar de que el proyecto usa Expo SDK 54, causando conflictos de módulos nativos en la APK compilada.

**Fix:** Pinned `expo-file-system@19.0.23` y `expo-linking@8.0.12` (versiones correctas para SDK 54).

**Build actual:** [Run #27921889417](https://github.com/juancito8812/tasa-del-dia-app-/actions/runs/27921889417) — en progreso (con dependencias corregidas)

---

## 📋 Estado Actual

### Móvil (`tasa-del-dia/`)
- **156 tests, 20 suites — 100% passing** ✅
- Fuentes: DolarApi.com (BCV, Paralelo, Euro) + Binance P2P directo
- Dependencias: `expo-blur`, `react-native-pager-view`, `expo-linear-gradient`, `expo-file-system`, `expo-linking`
- `.env`: `COTIZAVE_API_KEY` obsoleta (no se usa en runtime)
- Para desarrollo: `npx expo start --tunnel`
- Build APK: GitHub Action `Build APK (React Native)` (~6 min)
  - Cada build crea automáticamente un Release "latest" en GitHub con la APK
  - URL de descarga: `https://github.com/juancito8812/tasa-del-dia-app-/releases/latest/download/TasaDelDia.apk`
- Release con changelog: `Release Automático con Changelog` (workflow_dispatch o tags v*)
- **Workflows:** `build-apk.yml`, `release-automatic.yml`, `mobile-ci.yml` (3 activos)
- **Fixes aplicados:** `permissions: contents: write` + `grep -xE` para extracción de versión
- Último build: [Run #27919937529](https://github.com/juancito8812/tasa-del-dia-app-/actions/runs/27919937529)

**Workflows móviles activos (3):**
| Workflow | Trigger | Propósito |
|----------|---------|-----------|
| `build-apk.yml` | Push a main + manual | Build APK local + Release "latest" |
| `release-automatic.yml` | Manual + tags v* | Release con changelog + APK |
| `mobile-ci.yml` | Push/PR a main | Tests + lint + typecheck |

**Workflows eliminados:** `release-apk.yml` (obsoleto, reemplazado por release-automatic), `android-build.yml` (redundante con build-apk)

### ✨ Auto-Update desde GitHub

La app verifica automáticamente al iniciar si hay una versión más nueva en GitHub Releases.

| Componente | Archivo | Detalle |
|------------|---------|---------|
| **Auto-update service** | `src/services/autoUpdate.js` | Consulta GitHub API pública, compara semver, cache 30 min, skip version, descarga APK con expo-file-system + fallback navegador |
| **Update Modal** | `src/components/UpdateModal.js` | Modal con versión actual/nueva, botón Descargar (lanza instalador Android), Saltar versión, Más tarde |
| **Integración** | `App.js` | Check automático al montar (delay 2s para no interrumpir primera renderización) |
| **GitHub Release** | `.github/workflows/build-apk.yml` | Crea/actualiza Release "latest" con la APK después de cada build exitoso |
| **Tests** | `src/services/__tests__/autoUpdate.test.js` | 12 tests: compareVersions, isUpdateAvailable, getCurrentVersion |

Flujo: `checkLatestRelease()` → compara con `getCurrentVersion()` → si hay nueva y no fue saltada → muestra `UpdateModal` → usuario toca Descargar → `downloadAndInstall()` descarga APK y abre instalador.

### Arquitectura Mobile (actualizada)

```
App.js
└── SafeAreaProvider → ThemeProvider → ErrorBoundary
    └── AnimatedAppContent
        ├── StatusBar (expo-status-bar, único)
        ├── ScreenContainer (LinearGradient, único)
        │   └── SafeAreaView (único)
        │       └── View
        │           ├── PagerView
        │           │   ├── View → RatesScreen
        │           │   ├── View → ConverterScreen
        │           │   └── View → HistoryScreen
        │           └── CustomTabBar
        └── UpdateModal (Modal nativo, portal sobre todo)

src/
  screens/
    RatesScreen.js          # ~190 ln, usa useRatesData + RatesHeader + BCVModal
    ConverterScreen.js      # ~195 ln, usa useConverterData
    HistoryScreen.js        # ~170 ln, usa useHistoryData + HistoryChart + DateDetailCard
  components/
    RatesHeader.js           # Header con banners
    BCVModal.js              # Modal de BCV Lunes
    HistoryChart.js          # NativeBarChart
    DateDetailCard.js        # Detail de fecha
    UpdateModal.js           # Modal de actualización disponible
    CustomTabBar.js          # Tab bar con animación suave (interpolación continua)
    RateCard.js, ShimmerEffect.js, ThemeToggleMini.js, ScreenContainer.js
  hooks/
    useRatesData.js          # Fetching + BCV Lunes + recordatorio + retry
    useConverterData.js      # Fetching + conversión + copy/paste + spreads
    useHistoryData.js        # Historial + selección fecha + chart data
    useAutoRefresh.js
  services/
    api.js, backgroundTasks.js, notifications.js, autoUpdate.js
```

### Desktop (`tasa-del-dia-desktop/`)
- Flet 0.85.3 es la única UI activa
- Fuentes: DolarApi.com + Binance P2P (ambas sin API key)
- Build: `python build_flet.py --quick` (~2 min, genera `dist/TasaDelDiaFlet.exe`)
- Unique constraint: **NO usar módulos flet con `__getattr__` dinámico** (`.pyi` stubs) — PyInstaller no los resuelve. Usar clases con mayúscula: `ft.Padding`, `ft.Icons`, `ft.Border`, `ft.Alignment`
- Tab system: `Container` único con `content` intercambiable (evita layout conflictos de múltiples `expand=True`)
- Tabs se reconstruyen al cambiar (cada builder se llama de nuevo)
- Formato: `format_ves()` para locale venezolano
- API necesita User-Agent tipo navegador (urllib no envía default)
- **Problemas conocidos sin resolver**: scroll vertical dentro de tabs no funciona, historial no responde a clicks, formato tasas "2 cifras"
- `%APPDATA%\TasaDelDia\` para persistencia (config, cache, historial, logs)
- Para debug: `python flet_app/main.py` directamente (sin build)

### Skills repo
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
| `tasa-del-dia-desktop/flet_app/main.py` | UI completa Flet (~990 ln) |
| `tasa-del-dia-desktop/app/api.py` | `fetch_all_rates()` con DolarApi + Binance |
| `tasa-del-dia-desktop/app/storage.py` | Persistencia en `%APPDATA%` |
| `tasa-del-dia-desktop/build_flet.py` | Build script PyInstaller |

---

## ⏭️ Próximos Pasos Posibles

1. **Debug scroll/history Desktop** — probar con `ft.run()` en vez de `ft.app()`, verificar que ListView/Container recibe altura correcta
2. **Probar la APK nueva** — instalar el último build y verificar que el "salto" ya no ocurre
3. Build local APK con EAS
4. Ajustes finos al glassmorphism / UI
5. Notificaciones desktop (system tray)
6. Widget flotante desktop (overlay)

---

*Fin del documento de traspaso — Última actualización: 22-Jun-2026*
