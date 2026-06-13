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

Esta sesión se centró en la **aplicación de escritorio** (`tasa-del-dia-desktop/`).

---

### 🧪 Pruebas Unitarias (Nuevas en esta sesión)

Se agregaron **153 tests nuevos** en 2 archivos, elevando la suite total a **268 tests**:

| Archivo | Tests | Cobertura |
|---------|:-----:|-----------|
| `tests/test_widgets.py` | **71** (NUEVO) | `_blend`, `_format_time`, RateCard (init, update, copy, loading/error), SpreadIndicator (init, update, spreads 5/10/20%), TimerBar (init, update, <60s) |
| `tests/test_app.py` | **82** (NUEVO) | Helpers (_theme_label, _blend_bg, _cancel_timers, _close_active_dialog), Conversión (do_conversion USD↔Bs, _set_mode, _paste), Copia (_copy_bcv_rate, _copy_all_rates), Widget (_toggle/hide/update_widget), Offline+Reminder (_set_offline_mode, _was_entered_today, _check_reminder con 4 escenarios), Historial (_hist_select_date, _hist_copy_rate, _hist_copy_all), API (_on_rates_loaded con 6 tests, _on_rates_error con 3 tests, refresh_rates) |

**Tests existentes de sesiones anteriores (115 tests):**
| Archivo | Tests | Cobertura |
|---------|:-----:|-----------|
| `tests/test_trend_chart.py` | 27 | TrendChart con matplotlib mockeado |
| `tests/test_auto_update.py` | 14 | Parseo semver, check_for_updates |
| `tests/test_system_tray.py` | 12 | Notificaciones, start/stop tray |
| `tests/test_widget_window.py` | 30 | Widget compacto Tkinter |
| `tests/test_api.py` | 3 | API con mock de urllib |
| `tests/test_storage.py` | 5 | Storage con tempfile |

**Patrón de testing usado:**
- `@patch` para mockear dependencias externas (API, storage, widgets, etc.)
- `tk.Tk().withdraw()` como fixture para tests que necesitan Tkinter real
- Parcheo de `__init__` (return_value=None) para clases grandes (TasaDelDiaApp)
- `MagicMock` con `side_effect` para simular cambios de estado en toggle
- `pack_info()` en lugar de `winfo_ismapped()` para widgets con root withdraw

### 🐛 Fix: _format_time en widgets.py

**Archivo:** `app/widgets.py`

**Cambio:** Se agregó `AttributeError` al `except` de `_format_time()` para evitar crash cuando se pasa un tipo no-string (ej. `int`).

**Línea modificada:** `except (ValueError, TypeError) as e:` → `except (ValueError, TypeError, AttributeError) as e:`

### 📦 Compilación con PyInstaller

**Archivo:** `TasaDelDia.spec`

Se compiló exitosamente el `.exe` (~51.6 MB) usando:
```bash
python -m PyInstaller --clean TasaDelDia.spec
```

El ejecutable está en `tasa-del-dia-desktop/dist/TasaDelDia.exe`.

Verificado con:
- Proceso iniciado correctamente
- Logs de la app funcionales (tasas obtenidas de la API)
- Historical_rates.json cargado correctamente
- Sin errores en crash dump

Advertencias conocidas (no críticas):
- `matplotlib` no disponible en el .exe (gráfico de tendencia desactivado)
- `auto_update` HTTP 404 (sin releases publicados aún)
- `pystray` SyntaxWarning inofensivo

### 📊 Reporte de Cobertura

**Antes:** 27% | **Ahora:** 55%

| Archivo | Antes | Ahora |
|---------|:-----:|:-----:|
| `app/widgets.py` | 0% | **100%** |
| `app/app.py` | 0% | **30%** |
| `app/api.py` | 98% | 98% |
| `app/auto_update.py` | 100% | 100% |
| `app/storage.py` | 81% | 82% |
| `app/system_tray.py` | 87% | 87% |
| `app/theme.py` | 68% | 70% |
| `app/trend_chart.py` | 92% | 92% |
| `app/widget_window.py` | 92% | 92% |
| **TOTAL** | **27%** | **55%** |

### 🔧 .gitignore actualizado

Se agregaron entradas para:
- `build/` y `dist/` (raíz del proyecto — artefactos de PyInstaller)
- `tasa-del-dia-desktop/.coverage` (reportes de cobertura)

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

1. **Tests de theme polling**: Agregar tests para `_start_theme_polling()` (método que tuvo bug de recursión en el pasado)
2. **Instalador**: Crear un instalador con Inno Setup para distribuir el `.exe`
3. **Verificar Build APK**: Revisar GitHub Actions para confirmar que el workflow #24 pasó
4. **Sincronización móvil-escritorio**: Compartir el histórico de tasas entre la app móvil y la de escritorio vía un archivo JSON o API
5. **Cobertura app.py**: Subir del 30% actual agregando tests para `_rebuild_ui`, `_switch_theme_mode`, `_start_theme_polling`

---

*Fin del documento de traspaso.*
