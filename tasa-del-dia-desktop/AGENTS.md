# Tasa del Día — Instrucciones para el agente

## Stack
- Python 3.14, Flet 0.85.3 (principal), PySide6 6.11.1 (respaldo), customtkinter (legacy)
- API: `https://api.cotizave.com/v1/fx/public/calculator?amount=1&from=USD&to=VES`
- Business logic compartida en `app/` (api.py, storage.py, auto_update.py)

## Compilar .exe
```bash
cd tasa-del-dia-desktop
python build_flet.py --quick    # Flet (recomendado) → dist/TasaDelDiaFlet.exe
python build_winup.py --quick   # WinUp PySide6 → dist/TasaDelDiaWinUp.exe
python build.py --quick         # Legacy → dist/TasaDelDia.exe
```

## Bugs conocidos (no reintroducir)
- `.config()` no existe en CTk widgets, usar `.configure()` (legacy)
- `after(0, callback)` desde threads NO funciona en PyInstaller (legacy)
- `SpreadIndicator.update()` no debe hacer `pack(before=sibling)` si sibling no está empaquetado (legacy)
- Widget legacy debe recrearse ANTES de `_on_rates_loaded` en `_rebuild_ui`
- Shadowing de imports (QHBoxLayout, etc.) causa UnboundLocalError en Python 3.14 si se importan dentro de funciones

## Flet App (`flet_app/main.py`)
- UI declarativa con Flet (~925 líneas)
- Reusa `app/api.py`, `app/storage.py`, `app/auto_update.py`
- No tiene system tray, widget flotante ni notificaciones nativas
- Theme switching: `page.theme_mode` + colores por control
- Auto-refresh con threading.Timer
- Build: `python build_flet.py --quick` (usa `flet pack`, tarda ~2 min)
- Entry: `flet_app/main.py`

## WinUp UI (`winup_app/app.py`)
- ~1650 líneas, 34 widgets, PySide6
- Tiene system tray, widget flotante, notificaciones nativas
- `winup_shim.py` reemplaza dependencia winup con PySide6 puro
- `_register_style()` para theme switching completo
- Build: `python build_winup.py --quick` → 70.2 MB

## Archivos clave
### Flet
- `flet_app/main.py` — UI completa
- `build_flet.py` — build script

### WinUp
- `winup_app/app.py` — UI completa
- `winup_app/main.py` — entry point
- `winup_app/winup_shim.py` — shim PySide6
- `build_winup.py` — build script

### Compartidos
- `app/api.py` — `fetch_all_rates()`
- `app/storage.py` — persistencia en `%APPDATA%\TasaDelDia\`
- `app/theme.py` — colores
- `app/auto_update.py` — check de versión
- `app/system_tray.py` — icono de bandeja (solo WinUp/Legacy)

### Legacy
- `app/app.py` — `TasaDelDiaApp`
- `app/widgets.py` — `RateCard`, `SpreadIndicator`, `TimerBar`
- `build.py` — build script

### Otros
- `AI_HANDOFF.md` — traspaso detallado entre sesiones
- `README.md` — documentación

## Config
`%APPDATA%\TasaDelDia\` contiene:
- `config.json` — bcv_lunes, widget_enabled, reminder_enabled
- `cache_rates.json` — última tasa para offline
- `historical_rates.json` — historial de tasas
- `app.log` — logs (DEBUG)
