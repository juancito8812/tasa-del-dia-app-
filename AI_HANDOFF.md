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

### 🐛 Fix: Salto vertical al deslizar entre tabs (causa raíz)

**Problema:** Las 3 pantallas tenían estructuras distintas (ScreenContainer/SafeAreaView/insets diferentes), causando que el PagerView re-calculara el layout al cambiar de tab.

| Cambio | Archivos | Detalle |
|--------|----------|---------|
| **ScreenContainer único en App.js** | `App.js` + 3 screens | LinearGradient pasa a App.js (una sola vez), ya no se re-renderiza por cada tab change |
| **SafeAreaView único en App.js** | `App.js` + 3 screens | SafeArea padding ahora consistente entre todas las páginas |
| **bounces=false estandarizado** | `ConverterScreen.js` | Todas las pantallas ahora tienen `bounces={false}` en ScrollView |
| **Eliminado useSafeAreaInsets** | `ConverterScreen.js` | Ya no calcula padding individual — SafeAreaView de App.js lo maneja |

### 🔒 Seguridad (segunda pasada)

| Mejora | Archivo | Detalle |
|--------|---------|---------|
| **ErrorBoundary** | `App.js` | Mensaje genérico al usuario (sin leak de `error.message`), log completo a console.warn |
| **usesCleartextTraffic** | `app.config.js` | `usesCleartextTraffic: false` via expo-build-properties (HTTPS-only en Android) |
| **.env.example** | `.env.example` | Documentación actualizada, `COTIZAVE_API_KEY` comentada como obsoleta |

### 📦 Archivos creados en esta sesión

| Archivo | Propósito |
|---------|-----------|
| `.env.example` | Documentación de variables de entorno |

### 🗑️ Archivos modificados en esta sesión

| Archivo | Cambio |
|---------|--------|
| `App.js` | ScreenContainer + SafeAreaView unificados, ErrorBoundary genérico |
| `app.config.js` | `usesCleartextTraffic: false` para Android |
| `RatesScreen.js` | Eliminado ScreenContainer/SafeAreaView (~190 ln) |
| `ConverterScreen.js` | Eliminado ScreenContainer/useSafeAreaInsets, bounces=false (~195 ln) |
| `HistoryScreen.js` | Eliminado ScreenContainer/SafeAreaView (~170 ln) |

### 🗑️ Archivos eliminados

- `android/` (gitignored — era de prueba local)

### Último commit
- **SHA:** `83a8213` — "fix: unificar estructura de pantallas y mejoras de seguridad"
- **20 archivos**, 1773 inserciones, 1956 eliminaciones

---

## 📋 Estado Actual

### Móvil (`tasa-del-dia/`)
- **62 tests, 10 suites — 100% passing** ✅
- Fuentes: DolarApi.com (BCV, Paralelo, Euro) + Binance P2P directo
- Dependencias: `expo-blur`, `react-native-pager-view`, `expo-linear-gradient`, `expo-file-system`
- `.env`: `COTIZAVE_API_KEY` obsoleta (no se usa en runtime)
- Para desarrollo: `npx expo start --tunnel`
- Build APK: GitHub Action `Build APK (React Native)` (~6 min)
  - Cada build crea automáticamente un Release "latest" en GitHub con la APK
  - URL de descarga: `https://github.com/juancito8812/tasa-del-dia-app-/releases/latest/download/TasaDelDia.apk`
- Último build: [Run #27915752480](https://github.com/juancito8812/tasa-del-dia-app-/actions/runs/27915752480)

### ✨ Auto-Update desde GitHub

La app verifica automáticamente al iniciar si hay una versión más nueva en GitHub Releases.

| Componente | Archivo | Detalle |
|------------|---------|---------|
| **Auto-update service** | `src/services/autoUpdate.js` | Consulta GitHub API pública, compara semver, cache 30 min, skip version, descarga APK con expo-file-system + fallback navegador |
| **Update Modal** | `src/components/UpdateModal.js` | Modal con versión actual/nueva, botón Descargar (lanza instalador Android), Saltar versión, Más tarde |
| **Integración** | `App.js` | Check automático al montar (delay 2s para no interrumpir primera renderización) |
| **GitHub Release** | `.github/workflows/build-apk.yml` | Crea/actualiza Release "latest" con la APK después de cada build exitoso |

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
