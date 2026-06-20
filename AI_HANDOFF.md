# Documento de Traspaso (AI Handoff Document)

Este documento está diseñado para proporcionar contexto a futuros agentes de Inteligencia Artificial o desarrolladores que retomen el trabajo en este repositorio.

## 📌 Contexto del Proyecto

**Tasa del Día** es una aplicación multiplataforma para consultar tasas de cambio en Venezuela (BCV, Paralelo, Binance P2P, Euro).

El proyecto se divide en dos partes:
1. **`tasa-del-dia/`**: Aplicación móvil (Android) usando React Native (Expo SDK 54).
2. **`tasa-del-dia-desktop/`**: Aplicación de escritorio (Windows .exe) usando Python 3.14+ y Tkinter.

### Estado actual del repositorio

- Rama principal: `main`
- Todos los cambios están commiteados y pusheados
- El repositorio está sincronizado con GitHub

---

## 🚀 Últimos Cambios Realizados (Sesión Actual - Junio 2026)

### 🐛 Bugs corregidos (app móvil)

| Bug | Archivo | Fix |
|-----|---------|-----|
| **Data loss en historial** — `saveHistoricalRate` sobreescribía todo si BCV llegaba no-null, perdiendo paralelo/binance/euro | `api.js:253` | Ahora hace merge: `...all[dateKey], bcv: rates.bcv ?? old` |
| **`handleSaveBCVLunes` truncaba decimales** — `parseFloat("28.028,33")` daba 28.028 en vez de 28028.33 | `RatesScreen.js:279` | Normaliza formato español antes de parsear |
| **`parseDDMMYYYY` duplicada** — dos funciones con lógica similar en `api.js` y `HistoryScreen.js` | `HistoryScreen.js:365` | Eliminada la local, mejorada la de `api.js` para aceptar DDMMAAAA sin separadores |

### 🗑️ Código eliminado

| Archivo | Qué | Por qué |
|---------|-----|--------|
| `AutoRefreshBar.js` + test | Componente visual de cuenta regresiva | El timer se veía mal; se reemplazó por auto-refresh silencioso en background |
| `api.js` — `setManualHistoricalRate()` | Función de ingreso manual de historial | Nunca se llamaba desde ningún lado (dead code) |

### 🔧 Mejoras

| Archivo | Qué |
|---------|-----|
| `useAutoRefresh.js` | Simplificado: solo el intervalo de refresh, sin state de countdown ni reset |
| `RatesScreen.js`, `ConverterScreen.js` | `#a8557f` → `C.bcvLunes` (magic string eliminado) |
| `useAutoRefresh.js` | Comentario corregido: 1200s = 20min (antes decía 1500s = 25min) |
| `api.test.js` | Test actualizado para nueva `parseDateDDMMYYYY` más flexible |

### 🧪 Tests

**Mobile:** 62 tests, 9 suites — **100% passing** ✅
**Desktop:** sin cambios en esta sesión

---

## ⏭️ Siguientes Pasos Posibles

1. Verificar el build de la APK en GitHub Actions
2. Simplificar `extractRawDigits()` en ConverterScreen (64→15 líneas)
3. Migrar classe Theme de `theme.py` a `dataclass`
4. Sincronización móvil-escritorio del histórico de tasas

---

*Fin del documento de traspaso.*
