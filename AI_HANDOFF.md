# Documento de Traspaso (AI Handoff Document)

> **LEE ESTE ARCHIVO PRIMERO** — Contiene el estado actual del proyecto, lo último que se hizo y los specs/planes disponibles.

## 📌 Contexto del Proyecto

**Tasa del Día** — App multiplataforma para consultar tasas de cambio en Venezuela.

| Parte | Stack | Rama | Estado |
|-------|-------|------|--------|
| `tasa-del-dia/` | React Native + Expo SDK 54 | `main` | ✅ Activa (Android) |
| `tasa-del-dia-desktop/` | Python + Flet 0.85 | `main` | ✅ Activa |

API: `https://api.cotizave.com` — key en `.env` (`COTIZAVE_API_KEY`)

**Skills usadas:** brainstorming → spec → writing-plans → subagent-driven-development → finishing-a-development-branch  
**Método de trabajo:** git worktree (`.worktrees/` ignorado via `.gitignore`)

---

## 🚀 Últimos Cambios (Sesión 22-Jun-2026)

### ✨ Features nuevas

| Feature | Archivo | Spec | Plan |
|---------|---------|------|------|
| **Card Gasolina (BCV)** en Tasas — muestra 1L,5L,10L,20L,30L en Bs | `RatesScreen.js` (+28 ln) | `docs/superpowers/specs/2026-06-21-gasolina-bcv-design.md` | `docs/superpowers/plans/2026-06-21-gasolina-bcv-plan.md` |
| **Conversor Gasolina** en Conversor — input de litros → Bs | `ConverterScreen.js` (+41 ln) | `docs/superpowers/specs/2026-06-21-gasolina-conversor-design.md` | — |
| **Glassmorphism Redesign** — blur en cards+tab bar, swipe entre pantallas, gradiente fondo | Múltiples archivos | `docs/superpowers/specs/2026-06-20-glassmorphism-redesign-design.md` | `docs/superpowers/plans/2026-06-20-glassmorphism-redesign.md` |

### 🐛 47 Bugs corregidos en gran barrido (22-Jun-2026)

| Archivo | Fixes |
|---------|-------|
| `api.js` | Guard `Array.isArray` en `data.rates`; `await saveCacheRates`; `removeItem` en vez de `setItem('false')`; trim historial >365; year range dinámico; comment corregido |
| `notifications.js` | Notificación ahora one-time DATE en vez de weekly `repeats:true`; `rescheduleIfEnteredToday` eliminado; `ensureReminderScheduled` respeta preferencia; emoji `📅` removido |
| `backgroundTasks.js` | `console.warn` en fallo; `TaskManager.isTaskRegisteredAsync` check |
| `RatesScreen.js` | `.catch()` en promesas AsyncStorage; `mountedRef` guard en `tryReconnect`; `interpolate` cacheado con `useMemo` |
| `HistoryScreen.js` | `mountedRef` + `.catch()` en `loadHistory`; lista limitada a 365 items; guard contra `value == null` en copy; emojis removidos del clipboard; `maxLength={10}` |
| `ConverterScreen.js` | Feedback visual al copiar gasolina; `useMemo` para `parseFloat` |
| `RateCard.js` + `AnimatedNumber.js` | `formatRate` en `useCallback`; `format` movido a ref en AnimatedNumber; `animation.stop()` en unmount |
| `ShimmerEffect.js` | Colores `rgba(180,180,180,0.2)` visibles en ambos temas |
| `ThemeToggleMini.js` | `accessibilityLabel` + `accessibilityRole` |
| `ThemeContext.js` | `themePref` default `'system'`; dead code removido en `useTheme` |
| `useAutoRefresh.js` | `AppState` listener pausa/resume interval |
| `App.js` | `ensureReminderScheduled` llamado; `fonts` removido (no RN7); `.catch` en bg fetch; ErrorBoundary inline |
| `constants/index.js` | `throw new Error` si API_KEY falta |
| CI/CD + `package.json` | `@v4` actions; `continue-on-error` removido; `COTIZAVE_API_KEY` en test; `EAS_TOKEN`→`EXPO_TOKEN`; `react-test-renderer ^19.1.0`; `eas-cli` removido |

### 🔧 Mejoras anteriores

| Archivo | Cambio |
|---------|--------|
| `useAutoRefresh.js` | Simplificado: solo intervalo, sin countdown |
| `RatesScreen.js`, `ConverterScreen.js` | `#a8557f` → `C.bcvLunes` |
| `RatesScreen.js` | Gasolina card al final del scroll |
| `ConverterScreen.js` | Conversor gasolina con input y copia |

---

## 📋 Estado Actual

### Móvil (`tasa-del-dia/`)
- **62 tests, 10 suites — 100% passing** ✅
- Dependencias nuevas: `expo-blur`, `react-native-pager-view`, `expo-linear-gradient`
- `.env` tiene API key válida de Cotizave
- Para desarrollo: `npx expo start --tunnel` (exponer QR via tunnel)
- Build APK: GitHub Action `Build APK (React Native)` — disparar con `gh workflow run`
- Checkpoint tag: `glassmorphism-checkpoint` (antes del build APK)
- `git worktree` para aislar features: `git worktree add .worktrees/<branch> -b <branch>`

### Desktop (`tasa-del-dia-desktop/`)
- Flet es la única UI activa
- Build: `python build_flet.py --quick`

### Skills repo
- Skills en `skills/` (40+ skills: ponytail, superpowers, brainstorming, etc.)
- Config global en `~/.config/opencode/opencode.json` apunta a `tasa-del-dia-app-/skills`
- Flujo: brainstorming → spec → writing-plans → subagent-driven-development → finishing
- Marketplace externo: `wshobson/agents` clonado en `~/agents/`

---

## 📂 Docs de referencia

| Archivo | Qué contiene |
|---------|-------------|
| `AI_HANDOFF.md` | **Este archivo** — estado y handoff |
| `docs/superpowers/specs/` | Specs de features diseñadas (incl. glassmorphism redesign) |
| `docs/superpowers/plans/` | Planes de implementación (incl. glassmorphism redesign) |
| `.git/sdd/progress.md` | Ledger de progreso subagent-driven-development |

---

## ⏭️ Próximos Pasos Posibles

1. Probar APK compilada instalándola directo en Android
2. Proxy backend para ocultar API key del bundle APK
3. Build local con EAS cuando se resetee el plan free
4. Ajustes finos al glassmorphism (colores glow, intensidad blur en dispositivos específicos)
5. Más features en la app

---

*Fin del documento de traspaso — Última actualización: 22-Jun-2026*
