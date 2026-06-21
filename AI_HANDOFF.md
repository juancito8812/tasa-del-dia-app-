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

### ✨ Features Mobile nuevas

| Feature | Archivos | Detalle |
|---------|----------|---------|
| **Fix "jalón" al deslizar entre tabs** | `App.js`, `RatesScreen.js`, `ConverterScreen.js`, `HistoryScreen.js` | StatusBar unificado en App.js (eliminado de cada screen); eliminado `<Animated.View>` con referencias rotas (fadeAnim/translateY undefined) en RatesScreen; corregido useEffect que nunca cargaba History por isActive no pasado; eliminada animación muerta en ConverterScreen |
| **Transición suave entre tabs** | `App.js`, `CustomTabBar.js`, `CustomTabBar.test.js` | `onPageScroll` captura `position+offset` en Animated.Value; CustomTabBar interpola color/escala/opacidad/indicador continuamente en vez de spring discreto |
| **Refactor frontend-ui-engineering** | Múltiples archivos nuevos | Datos separados en hooks (`useRatesData`, `useConverterData`, `useHistoryData`); subcomponentes extraídos (`RatesHeader`, `BCVModal`, `HistoryChart`, `DateDetailCard`); screens reducidas a < 200 líneas; estilos inline movidos a StyleSheet |

### 📦 Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/hooks/useRatesData.js` | Hook: fetching, BCV Lunes, recordatorio, retry offline, brecha |
| `src/hooks/useConverterData.js` | Hook: fetching, conversión, copy/paste, spreads, gasolina |
| `src/hooks/useHistoryData.js` | Hook: histórico, selección de fecha, chart data, copy |
| `src/components/RatesHeader.js` | Header RatesScreen con error/offline banners |
| `src/components/BCVModal.js` | Modal para editar BCV Lunes |
| `src/components/HistoryChart.js` | NativeBarChart extraído como componente |
| `src/components/DateDetailCard.js` | Detail card de historial con copia individual/todo |

### 🗑️ Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `App.js` | StatusBar unificado, onPageScroll handler, scrollOffset Animated.Value |
| `CustomTabBar.js` | Interpolación continua con scrollOffset, barrita indicadora |
| `RatesScreen.js` | ~390→170 líneas, usa useRatesData + RatesHeader + BCVModal |
| `ConverterScreen.js` | ~670→185 líneas, usa useConverterData |
| `HistoryScreen.js` | ~600→160 líneas, usa useHistoryData + HistoryChart + DateDetailCard |
| `CustomTabBar.test.js` | Actualizado con createMockScrollOffset() |

---

## 🔒 Seguridad — Mejoras aplicadas (22-Jun-2026)

### ErrorBoundary (App.js)
- **Antes:** Mostraba `error.message` al usuario (filtrado de información interna)
- **Después:** Pantalla genérica con tema oscuro, logo 🔄, mensajes "Algo salió mal" / "Reinicia la app" / "Contacta al soporte"
- Detalle completo del error + componentStack se loguea a `console.warn`

### Android Network Security
- **`android/app/src/main/res/xml/network_security_config.xml`**: HTTPS-only enforcement con `cleartextTrafficPermitted="false"` + debug overrides para certificados de usuario en desarrollo
- **`app.config.js`**: Referencia al XML via `expo.android.networkSecurityConfig`
- EAS Build usará esta configuración al compilar la APK

### Environment
- **`.env.example`**: Documentación actualizada — `COTIZAVE_API_KEY` ahora comentada como obsoleta, aclarando que ninguna API necesita keys

### Cache
- **`saveHistoricalRate()`**: Ya tenía límite de 365 entradas (sin cambios necesarios)

---

### Móvil (`tasa-del-dia/`)
- **62 tests, 10 suites — 100% passing** ✅
- Fuentes: DolarApi.com (BCV, Paralelo, Euro) + Binance P2P directo
- Dependencias: `expo-blur`, `react-native-pager-view`, `expo-linear-gradient`
- `.env` necesita `COTIZAVE_API_KEY` (aún referenciada en constants, pero no se usa en runtime)
- Para desarrollo: `npx expo start --tunnel`
- Build APK: GitHub Action `Build APK (React Native)`
- Checkpoint tag: `glassmorphism-checkpoint`
- `git worktree` para aislar features

### Arquitectura Mobile (actualizada)

```
src/
  screens/
    RatesScreen.js          # ~170 ln, usa useRatesData + RatesHeader + BCVModal
    ConverterScreen.js      # ~185 ln, usa useConverterData
    HistoryScreen.js        # ~160 ln, usa useHistoryData + HistoryChart + DateDetailCard
  components/
    RatesHeader.js           # Header con banners
    BCVModal.js              # Modal de BCV Lunes
    HistoryChart.js          # NativeBarChart
    DateDetailCard.js        # Detail de fecha
    CustomTabBar.js          # Tab bar con animación suave
    RateCard.js, ShimmerEffect.js, ThemeToggleMini.js, ScreenContainer.js
  hooks/
    useRatesData.js          # Fetching + BCV Lunes + recordatorio + retry
    useConverterData.js      # Fetching + conversión + copy/paste + spreads
    useHistoryData.js        # Historial + selección fecha + chart data
    useAutoRefresh.js
  services/
    api.js, backgroundTasks.js, notifications.js
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
2. Proxy backend para ocultar API key del bundle APK (si se reintroduce Cotizave)
3. Build local APK con EAS
4. Ajustes finos al glassmorphism / UI
5. Notificaciones desktop (system tray)
6. Widget flotante desktop (overlay)

---

*Fin del documento de traspaso — Última actualización: 22-Jun-2026*
