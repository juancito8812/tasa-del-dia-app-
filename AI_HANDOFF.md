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

Esta sesión se centró casi exclusivamente en la **aplicación de escritorio** (`tasa-del-dia-desktop/`).

---

### 🧪 Pruebas Unitarias (Nuevas)

Se agregaron **56 tests nuevos** distribuidos en 3 archivos, elevando la suite a **115 tests** (59 existentes):

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `tests/test_trend_chart.py` | 27 (nuevo) | TrendChart con matplotlib mockeado: init, update_chart, apply_theme, destroy, sin-matplotlib |
| `tests/test_auto_update.py` | 14 (nuevo) | Parseo de versiones semver, `check_for_updates` (HTTP errors, JSON, assets, release notes truncadas) |
| `tests/test_system_tray.py` | 12 (nuevo) | `send_notification` con/sin plyer, `start_tray` con pystray+PIL mockeados (lazy imports), `stop_tray` |
| `tests/test_widget_window.py` | 30 (nuevo) | Persistencia de posición, init (topmost, bordes, tamaño, alpha), show/hide/toggle, `update_rates`, destroy |
| `tests/test_api.py` | 3 (existente) | Tests de API con mock de urllib |
| `tests/test_storage.py` | 5 (existente) | Tests de storage con tempfile |

**Patrón de testing usado:**
- `@patch` para mockear dependencias externas (urllib, plyer, pystray, PIL, matplotlib)
- `setup_method/teardown_method` para patches de lazy imports dentro de funciones
- `tk.Tk().withdraw()` como fixture para tests que necesitan Tkinter real
- `tempfile.TemporaryDirectory` para pruebas de persistencia

### 🐛 Bug: RecursionError en `_start_theme_polling` (Corregido)

**Archivo:** `app/app.py`

**Causa:** Dos bugs en `_start_theme_polling()`:
1. `_poll()` se llamaba **sincrónicamente** (`_poll()` al final del método en vez de `self.window.after(5000, _poll)`)
2. La comparación de nombres de tema era incorrecta: `self.actual_theme.name` es `"oscuro"`/`"claro"`, pero se comparaba con `"dark"`/`"light"` → **nunca coincidían**

**Resultado:** Cada vez que se reconstruía la UI, el polling detectaba un "cambio de tema" falso y reconstruía de nuevo... infinitamente → `RecursionError: maximum recursion depth exceeded`.

**Fix:** 
- Cambiar `_poll()` por `self.window.after(5000, _poll)` (programar, no ejecutar inmediatamente)
- Cambiar `expected = "dark"/"light"` por `expected_name = "oscuro"/"claro"`

### 🐛 Bug: Widget no mostraba tasas (Corregido)

**Archivo:** `app/app.py`

**Causa:** Race condition en la inicialización:
1. `__init__` programa `_show_widget` con `after(500, ...)`
2. `refresh_rates()` inicia el fetch de la API en un hilo
3. Si la API responde ANTES de los 500ms, `_on_rates_loaded` ejecuta `_update_widget_rates()` pero el widget **aún no existe** → la llamada es un no-op
4. Cuando `_show_widget` se ejecuta a los 500ms, crea el widget con valores por defecto `"—"` y nunca recibe las tasas

**Fix:** En `_show_widget()` y `_toggle_widget()`, después de crear/mostrar el widget, verificar si `self.rates` ya tiene datos y aplicarlos inmediatamente.

### 🐛 Bug: Histórico y tendencia no funcionaban en modo offline/caché (Corregido)

**Archivo:** `app/app.py`

**Causa:** Cuando la API fallaba y se usaba el caché (`_on_rates_error`), el código:
1. **No guardaba** las tasas cacheadas en el histórico (`save_today_historical_rate`)
2. **No actualizaba** el gráfico de tendencia (`_update_trend_chart`)
3. **No actualizaba** el widget compacto (`_update_widget_rates`)
4. **No almacenaba** `self.rates` con los valores del caché

**Fix:** En `_on_rates_error()`, agregar:
- `self.rates = {...}` mapeando claves del caché al formato `RatesDict`
- Llamadas a `save_today_historical_rate()`, `_update_hist_count()`, `_update_trend_chart()`, `_update_widget_rates()`

### 📊 Gráfico de Tendencia (TrendChart)

**Archivo nuevo:** `app/trend_chart.py`

Gráfico de líneas usando matplotlib embebido en Tkinter (`FigureCanvasTkAgg`). Muestra la evolución de BCV y Paralelo desde los datos históricos guardados.

**Dependencias:** `matplotlib`, `matplotlib.backends.backend_tkagg` y `matplotlib.dates`.

**PyInstaller:** Se agregaron `hiddenimports` en `TasaDelDia.spec`:
```python
hiddenimports=[
    "matplotlib", "matplotlib.backends.backend_tkagg",
    "matplotlib.figure", "matplotlib.dates", "matplotlib.pyplot",
]
```

### 📦 Compilación con PyInstaller

**Archivo:** `TasaDelDia.spec`

El `.exe` se compila con `python -m PyInstaller --clean TasaDelDia.spec`. El resultado está en `dist/TasaDelDia.exe` (~51 MB portátil).

Notas importantes:
- `console=False` para que no aparezca ventana de terminal
- `hiddenimports` necesarios para matplotlib (ver arriba)
- `pystray` tiene un `SyntaxWarning` inofensivo que no afecta la compilación
- Los datos de la app se guardan en `%APPDATA%\TasaDelDia\`

### 🔊 Logging para Debugging

Se agregaron logs detallados en:
- **`app/api.py`**: Log de markets recibidos y `fetched_at`
- **`app/storage.py`**: Log de condición `should_save` en `save_today_historical_rate`, conteo de registros históricos, rutas de archivos
- **`app/app.py`**: Log en `_on_rates_loaded`, `_update_widget_rates`, `_show_widget`, `_update_trend_chart`

Para ver los logs: ejecutar `python main.py` (salen en terminal). En el `.exe`, se guardan en `%APPDATA%\TasaDelDia\app.log`.

### 🛠️ Aplicación Móvil (React Native)

**Build APK:** Se corrigió el error `private properties are not supported` de Hermes:
1. **`sharp` movido de `dependencies` a `devDependencies`** — sharp usa `#private` fields de ES2022 que Hermes no puede compilar. Al estar en `dependencies`, Metro lo incluía en el bundle.
2. **Versiones alineadas con Expo SDK 54**: `babel-preset-expo`, `jest-expo`, `expo-background-fetch`, `expo-task-manager` estaban en versión 56.x (para SDK 56) causando incompatibilidad.

### 🔄 Estado del Build APK

El workflow Build APK (#24, commit `2772071`) está **pendiente de verificar**. Los builds locales pueden tardar 15-30 minutos.

---

## 🏗️ Arquitectura de la App de Escritorio

### Estructura de archivos
```
tasa-del-dia-desktop/
├── app/
│   ├── __init__.py
│   ├── api.py              # Cliente HTTP → api.cotizave.com
│   ├── app.py              # Clase principal TasaDelDiaApp (ventana + lógica)
│   ├── auto_update.py      # Verificación de updates desde GitHub Releases
│   ├── storage.py          # Persistencia: config, caché, histórico JSON
│   ├── system_tray.py      # Notificaciones (plyer) + bandeja (pystray)
│   ├── theme.py            # Temas oscuro/claro/sistema
│   ├── trend_chart.py      # Gráfico de tendencia (matplotlib + Tkinter)
│   ├── widget_window.py    # Widget compacto always-on-top
│   └── widgets.py          # RateCard, SpreadIndicator, TimerBar
├── tests/
│   ├── test_api.py         # 3 tests (API mockeada)
│   ├── test_auto_update.py # 14 tests (versiones, check_for_updates)
│   ├── test_storage.py     # 5 tests (config, caché, histórico)
│   ├── test_system_tray.py # 12 tests (notificaciones, start/stop tray)
│   ├── test_trend_chart.py # 27 tests (TrendChart con matplotlib mockeado)
│   └── test_widget_window.py # 30 tests (widget con Tkinter real)
├── main.py                 # Punto de entrada
├── TasaDelDia.spec         # Config de PyInstaller
└── requirements.txt
```

### Flujo de inicialización
1. `main.py` → crea `TasaDelDiaApp`
2. `__init__`: construye UI → programa timers → inicia system tray → `refresh_rates()`
3. `refresh_rates()`: hilo → `fetch_all_rates()` → `_on_rates_loaded()` o `_on_rates_error()`
4. `_on_rates_loaded()`: actualiza cards → spread → widget → **guarda histórico** → **actualiza tendencia** → programa próximo refresh

### Flujo de datos históricos
- API → `save_cache_rates()` (caché offline)
- API → `save_today_historical_rate()` (histórico automático para hoy)
- Usuario → `set_manual_historical_rate()` (entrada manual para cualquier fecha)
- `get_historical_rates()` lee `historical_rates.json` desde `%APPDATA%\TasaDelDia\`

---

## ⏭️ Siguientes Pasos Posibles

1. **Verificar Build APK**: Revisar GitHub Actions para confirmar que el workflow #24 pasó
2. **Instalador**: Crear un instalador con Inno Setup para distribuir el `.exe`
3. **Reporte de cobertura**: Ejecutar `pytest --cov=app tests/` para ver cobertura
4. **Tests de Tkinter**: Arreglar el entorno para que los 30 tests de `test_widget_window.py` puedan ejecutarse (requiere `tk.tcl` en el path de Python)
5. **Sincronización móvil-escritorio**: Compartir el histórico de tasas entre la app móvil y la de escritorio vía un archivo JSON o API

---

*Fin del documento de traspaso.*
