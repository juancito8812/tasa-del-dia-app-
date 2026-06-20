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

## 🚀 Últimos Cambios (Sesión 21-Jun-2026)

### ✨ Features nuevas

| Feature | Archivo | Spec | Plan |
|---------|---------|------|------|
| **Card Gasolina (BCV)** en Tasas — muestra 1L,5L,10L,20L,30L en Bs | `RatesScreen.js` (+28 ln) | `docs/superpowers/specs/2026-06-21-gasolina-bcv-design.md` | `docs/superpowers/plans/2026-06-21-gasolina-bcv-plan.md` |
| **Conversor Gasolina** en Conversor — input de litros → Bs | `ConverterScreen.js` (+41 ln) | `docs/superpowers/specs/2026-06-21-gasolina-conversor-design.md` | — |

### 🐛 Bugs corregidos (sesiones anteriores)

| Bug | Archivo | Fix |
|-----|---------|-----|
| **Data loss en historial** — `saveHistoricalRate` sobreescribía todo | `api.js` | Merge: `...all[dateKey], bcv: rates.bcv ?? old` |
| **`handleSaveBCVLunes` truncaba decimales** | `RatesScreen.js` | Normaliza formato español antes de `parseFloat` |
| **`parseDDMMYYYY` duplicada** en `api.js` e `HistoryScreen.js` | `HistoryScreen.js` | Eliminada la local, mejorada la de `api.js` |

### 🗑️ Código eliminado

| Archivo | Qué |
|---------|-----|
| `AutoRefreshBar.js` + test | Temporizador visual eliminado; auto-refresh silencioso en bg |
| `api.js` — `setManualHistoricalRate()` | Dead code — nunca se llamaba |

### 🔧 Mejoras

| Archivo | Cambio |
|---------|--------|
| `useAutoRefresh.js` | Simplificado: solo intervalo, sin countdown |
| `RatesScreen.js`, `ConverterScreen.js` | `#a8557f` → `C.bcvLunes` |
| `RatesScreen.js` | Gasolina card al final del scroll (visible con `tasaBCV != null`) |
| `ConverterScreen.js` | Conversor gasolina con input y copia al portapapeles |

---

## 📋 Estado Actual

### Móvil (`tasa-del-dia/`)
- **62 tests, 9 suites — 100% passing** ✅
- `.env` tiene API key válida de Cotizave
- Para desarrollo: `npx expo start --tunnel` (exponer QR via tunnel)
- Build APK: GitHub Action `Build APK (React Native)` — disparar con `gh workflow run`
- `git worktree` para aislar features: `git worktree add .worktrees/<branch> -b <branch>`

### Desktop (`tasa-del-dia-desktop/`)
- Flet es la única UI activa
- Build: `python build_flet.py --quick`

### Skills repo
- Skills en `skills/` (40+ skills: ponytail, superpowers, brainstorming, etc.)
- Config global en `~/.config/opencode/opencode.json` apunta a `tasa-del-dia-app-/skills`
- Flujo: brainstorming → spec → writing-plans → subagent-driven-development → finishing

---

## 📂 Docs de referencia

| Archivo | Qué contiene |
|---------|-------------|
| `AI_HANDOFF.md` | **Este archivo** — estado y handoff |
| `docs/superpowers/specs/` | Specs de features diseñadas |
| `docs/superpowers/plans/` | Planes de implementación |

---

## ⏭️ Próximos Pasos Posibles

1. Revisar build de APK en GitHub Actions (workflow corriendo)
2. Probar APK compilada instalándola directo en Android
3. Proxy backend para ocultar API key del bundle APK
4. Build local con EAS cuando se resetee el plan free
5. Más features en la app

---

*Fin del documento de traspaso — Última actualización: 21-Jun-2026*
