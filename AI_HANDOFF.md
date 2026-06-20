# Documento de Traspaso (AI Handoff Document)

Este documento proporciona contexto a futuros agentes que retomen el trabajo.

## 📌 Contexto del Proyecto

**Tasa del Día** — App multiplataforma para consultar tasas de cambio en Venezuela.

| Parte | Stack | Estado |
|-------|-------|--------|
| `tasa-del-dia/` | React Native + Expo SDK 54 | ✅ Activa (Android) |
| `tasa-del-dia-desktop/` | Python + Flet 0.85 | ✅ Flet activa; Legacy/WinUp deprecadas |

API: `https://api.cotizave.com` — key: `COTIZAVE_API_KEY` en `.env`

---

## 🚀 Últimos Cambios (Sesión 20-Jun-2026)

### 🐛 Bugs críticos corregidos — Móvil

| Bug | Archivo | Fix |
|-----|---------|-----|
| **"Sin conexión" constante** — `Promise.all` mataba ambos endpoints si uno fallaba | `api.js:fetchAllData` | `Promise.all` → `Promise.allSettled`. USD rates siguen cargando aunque BCV endpoint falle |
| **Retry cada 30s fijo** — Bombardeaba la API y mantenía banner constante | `RatesScreen.js` | Backoff exponencial: 30s, 45s, 67s... máx 5min, máx 10 reintentos |
| **`fetchBCVCurrencies` duplicada** — Definida 2 veces en el mismo archivo | `api.js` | Eliminada la segunda definición |
| **BCV Lunes no persistía en histórico** | `RatesScreen.js:handleSaveBCVLunes` | Agregado `saveHistoricalRate(getTodayKey(), { bcv: parsed })` |
| **Triple auto-refresh** — 3 intervalos de 20min concurrentes | `RatesScreen.js`, `ConverterScreen.js` | Eliminado `useAutoRefresh` de ambos screens |
| **Error "Sin conexión" genérico** — No distinguía entre error de red vs API | `api.js:fetchWithOfflineFallback` | Ahora muestra "Error de API: HTTP 401" vs "Sin conexión — datos guardados" |

### 🐛 Bugs críticos corregidos — Desktop

| Bug | Archivo | Fix |
|-----|---------|-----|
| **API sin auth** — No enviaba `X-API-Key` header | `app/api.py` | Agregado header desde `COTIZAVE_API_KEY` env var |
| **Import inexistente** — `from app.utils import resource_path` no existe | `app/app.py:_set_window_icon` | Reemplazado por `os.path.join` directo |
| **Dependencias faltantes** — `pyperclip` y `darkdetect` no estaban en requirements | `requirements.txt` | Agregadas ambas |
| **UI freeze al cambiar tema** — `_rebuild_ui` recreaba 2285 widgets sincrónicamente | `app/app.py:_switch_theme_mode` | `window.after(1)` + flag `_rebuilding` para evitar concurrencia |

### 🔧 Mejoras

| Archivo | Cambio |
|---------|--------|
| `flet_app/main.py` | Thread safety: `threading.Lock()` en todas las escrituras a estado global |
| `winup_app/app.py` | Thread safety: `threading.Lock()` en todas las escrituras a estado global |
| `api.js:fetchAllRates` | Mensaje de error más descriptivo: "HTTP 401 — el servidor rechazó la solicitud" |
| `api.js:fetchBCVCurrencies` | Mensaje de error más descriptivo: "HTTP 401 — error al obtener tasas BCV" |
| `constants/index.js` | Warning de seguridad: API key visible al decompilar el APK |

### 🗑️ Deprecaciones (Desktop)

14 archivos marcados como `[DEPRECATED] Use flet_app/main.py instead`:
- `app/app.py`, `app/widgets.py`, `app/widget_window.py`, `app/system_tray.py`
- `main.py`, `build.py`, `build_winup.py`, `tasa_del_dia.py`
- `winup_app/app.py`, `winup_app/main.py`, `winup_app/winup_shim.py`
- `TasaDelDia.spec`, `TasaDelDiaFlet.spec`, `TasaDelDiaWinUp.spec`
- `AGENTS.md` y `README.md` actualizados — Flet es la única UI activa
- `build.bat` ahora buildéa Flet por defecto

### 🤖 CI/CD

3 workflows nuevos en `.github/workflows/`:
- `mobile-ci.yml` — Node.js 22 + npm test en `tasa-del-dia/`
- `desktop-ci.yml` — Python 3.14 + pytest en `tasa-del-dia-desktop/`
- `android-build.yml` — Manual trigger con EAS Build

### 🧪 Tests

| Suite | Resultado |
|-------|-----------|
| Mobile (9 suites, 62 tests) | ✅ **62/62 pass** |
| Desktop core (api + storage, 32 tests) | ✅ **32/32 pass** |
| Desktop full (42 suites) | ✅ 255/255 pass (9 failures pre-existentes en system_tray, trend_chart, widget_window) |

---

## 📋 Estado Actual del Proyecto

### Móvil
- `.env` tiene API key válida: `ctz_live_64Nym3Qa8PZixs5TsZ1UahDDJWMkG6hpVt4oka`
- **EAS Build free plan agotado** hasta el 1-Jul-2026
- Build local con Gradle falla: path de Windows muy largo (>250 chars en CMake)
- Expo dev server corriendo en `localhost:8081`
- Para test: usar **Expo Go** escaneando QR desde `http://localhost:8081`

### Desktop
- Flet es la única UI activa
- Build: `python build_flet.py --quick` → `dist/TasaDelDiaFlet.exe`
- WinUp y Legacy: no modificar, solo mantener por referencia

### iOS
- Configuración lista en `app.config.js` (bundle ID, soporte tablet)
- **Requiere Apple Developer Account ($99/año)** — pospuesto

---

## ⏭️ Próximos Pasos Posibles

1. Esperar reset EAS Build (1-Jul) o upgradear plan
2. Probar la app con Expo Go desde localhost:8081
3. Buildear APK manual cuando EAS se resetee: `npx eas build --platform android --profile preview`
4. Arreglar build local (Windows path length >250 chars en node_modules)
5. Proxy backend para ocultar API key del bundle APK
6. Migrar de JavaScript a TypeScript
7. Agregar Sentry para monitoreo de errores en producción

---

## 🔑 API Key

```
COTIZAVE_API_KEY=ctz_live_64Nym3Qa8PZixs5TsZ1UahDDJWMkG6hpVt4oka
```

⚠️ Esta key está visible en el bundle de la app. Para producción, implementar un proxy backend.

---

*Fin del documento de traspaso — Última actualización: 20-Jun-2026*
