# AI_HANDOFF — Tasa del Día Desktop

## Estado actual (20-Jun-2026)

| Versión | Build | Entry | Estado |
|---------|-------|-------|--------|
| **Flet** | `build_flet.py --quick` | `flet_app/main.py` | ✅ **Única activa** |
| WinUp PySide6 | `build_winup.py` | `winup_app/main.py` | 🗑️ Deprecada |
| Legacy customtkinter | `build.py` | `main.py` | 🗑️ Deprecada |

## Stack

### Flet (activa)
- Python 3.14 + Flet 0.85.3
- UI declarativa tipo Flutter
- Threading + Lock para thread safety
- Tema dark/light/system
- SnackBar para notificaciones in-app
- `flet pack` para build .exe

### Deprecadas (no modificar)
- WinUp y Legacy marcadas como `[DEPRECATED]` en todos los archivos
- Se mantienen solo para referencia

## Cambios de esta sesión (20-Jun-2026)

### Bugs corregidos
1. **API sin X-API-Key** — `app/api.py` ahora lee `COTIZAVE_API_KEY` del entorno y la envía como header
2. **Import `app.utils` inexistente** — `app/app.py:_set_window_icon` ahora usa `os.path.join`
3. **Dependencias faltantes** — `pyperclip>=1.8.2` y `darkdetect>=0.8.0` agregados a `requirements.txt`
4. **UI freeze en theme switch** — `_switch_theme_mode` usa `window.after(1)` + flag `_rebuilding`

### Thread safety
- `flet_app/main.py`: `threading.Lock()` en todas las escrituras a `_rates`, `_converter_rates`, `_offline_mode`, `_is_loading`, `_brecha_notified`
- `winup_app/app.py`: mismo patrón con Lock

### Deprecaciones
- 14 archivos marcados como `[DEPRECATED]`
- `AGENTS.md` reestructurado: Flet es la única UI activa
- `README.md` actualizado
- `build.bat` ahora ejecuta `build_flet.py --quick` por defecto

## Dependencias
```
flet>=0.85, requests, urllib3, certifi, idna, charset_normalizer, packaging, Pillow, pyperclip, darkdetect
```

## Config
`%APPDATA%\TasaDelDia\`:
- `config.json` — bcv_lunes, widget_enabled, reminder_enabled
- `cache_rates.json` — última tasa para offline
- `historical_rates.json` — historial
- `app.log` — logs (DEBUG)

## Tests
- Core (api + storage): 32/32 pass
- Full suite: 255/255 pass (9 failures pre-existentes en system_tray, trend_chart, widget_window)
