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

**Skills usadas:** brainstorming → spec → writing-plans → test-driven-development → incremental-implementation → debugging-and-error-recovery  
**Método de trabajo:** git worktree (`.worktrees/` ignorado via `.gitignore`)

---

## 🚀 Últimos Cambios (Sesión 21-Jun-2026)

### ✨ Features nuevas

| Feature | Plataforma | Archivos | Detalle |
|---------|-----------|----------|---------|
| **Binance P2P directo** | Mobile + Desktop | `api.js` (+fetchBinanceP2P), `app/api.py` | POST a `p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search` sin API key |
| **Manual tabs (Desktop)** | Desktop | `flet_app/main.py` (+ switch_tab, $selected_tab) | Reemplazó `TabBar`+`TabBarView` (rompía scroll) por `Row` de botones + visibilidad toggle |
| **Formato VES** | Desktop | `flet_app/main.py` (+format_ves) | Números con formato venezolano: punto miles, coma decimal |

### 🐛 Correcciones Desktop (21-Jun-2026)

| Issue | Fix |
|-------|-----|
| Cotizave API caída (403) | Migrado a `ve.dolarapi.com/v1` + User-Agent header en urllib |
| PyInstaller crash `ft.padding.all` | Usar `ft.Padding.all` (clase, no módulo con `__getattr__`) |
| PyInstaller crash `ft.icons.DARK_MODE` | Usar `ft.Icons.DARK_MODE` |
| PyInstaller crash `ft.border.all` | Usar `ft.Border.all` |
| PyInstaller crash `ft.alignment.center` | Usar `ft.Alignment.CENTER` |
| Flet 0.85.3 `Tab(text=, content=)` | `TabBar(tabs=[Tab(label=...)])` + `TabBarView(controls=[...])` |
| Flet 0.85.3 `TextButton(text=)` / `ElevatedButton(text=)` | Usar `content=` en vez de `text=` |
| Flet 0.85.3 `TextField(weight=)` | Usar `TextField(text_style=TextStyle(weight=))` |
| Scroll no funciona en TabBarView | Manual tabs con `ListView` + visibilidad |
| Historial no responde a clicks | `update_history_tab()` ahora popula `detail_card` al seleccionar fecha |
| Formato tasas usa punto decimal | `format_ves()` convierte a coma decimal |

### 🐛 Correcciones Mobile (21-Jun-2026)

| Issue | Fix |
|-------|-----|
| Swipe animation brusca | `translateY` 15→8px, start opacity 0.9, duración 150ms |
| Crash Galaxy A12/A54 | `SafeAreaProvider` faltante agregado |
| Cotizave a DolarApi | API URL cambiada, `Promise.allSettled` con Binance |

---

## 📋 Estado Actual

### Móvil (`tasa-del-dia/`)
- **62 tests, 10 suites — 100% passing** ✅
- Fuentes: DolarApi.com (BCV, Paralelo, Euro) + Binance P2P directo
- Dependencias: `expo-blur`, `react-native-pager-view`, `expo-linear-gradient`
- `.env` necesita `COTIZAVE_API_KEY` (aún referenciada en constants, pero no se usa en runtime)
- Para desarrollo: `npx expo start --tunnel`
- Build APK: GitHub Action `Build APK (React Native)`
- Checkpoint tag: `glassmorphism-checkpoint`
- `git worktree` para aislar features

### Desktop (`tasa-del-dia-desktop/`)
- Flet 0.85.3 es la única UI activa
- Fuentes: DolarApi.com + Binance P2P (ambas sin API key)
- Build: `python build_flet.py --quick` (~2 min, genera `dist/TasaDelDiaFlet.exe`)
- Unique constraint: **NO usar módulos flet con `__getattr__` dinámico** (`.pyi` stubs) — PyInstaller no los resuelve. Usar clases con mayúscula: `ft.Padding`, `ft.Icons`, `ft.Border`, `ft.Alignment`
- Tab system: manual (Row de botones + visibilidad), no `TabBarView`
- Formato: `format_ves()` para locale venezolano
- API necesita User-Agent tipo navegador (urllib no envía default)
- **Tabs**: tasas BCV/Paralelo/Euro/Binance, conversor USD↔Bs, historial con chips de fecha + detalle
- `%APPDATA%\TasaDelDia\` para persistencia (config, cache, historial, logs)

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

1. Proxy backend para ocultar API key del bundle APK (si se reintroduce Cotizave)
2. Build local APK con EAS cuando se resetee plan free
3. Ajustes finos al glassmorphism
4. Notificaciones desktop (system tray)
5. Widget flotante desktop (overlay)

---

*Fin del documento de traspaso — Última actualización: 21-Jun-2026*
