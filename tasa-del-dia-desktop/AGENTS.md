# Tasa del Día — Instrucciones para el agente

## Stack
- Python 3.14, **Flet 0.85.3 (única UI activa)**
- API: `https://ve.dolarapi.com/v1` (BCV, Paralelo, Euro) + Binance P2P pública (POST sin key)
- Business logic compartida en `app/` (api.py, storage.py, auto_update.py)
- WinUp (PySide6) y Legacy (customtkinter) están **deprecados** — no modificar

## Compilar .exe (Flet — único)
```bash
cd tasa-del-dia-desktop
python build_flet.py --quick    # Flet → dist/TasaDelDiaFlet.exe
```

## Flet App (`flet_app/main.py`)
- UI declarativa con Flet (~925 líneas)
- Reusa `app/api.py`, `app/storage.py`, `app/auto_update.py`
- No tiene system tray, widget flotante ni notificaciones nativas
- Theme switching: `page.theme_mode` + colores por control
- Auto-refresh con threading.Timer
- Build: `python build_flet.py --quick` (usa `flet pack`, tarda ~2 min)
- Entry: `flet_app/main.py`

## Archivos clave
### Flet (activo)
- `flet_app/main.py` — UI completa
- `build_flet.py` — build script

### Compartidos
- `app/api.py` — `fetch_all_rates()`
- `app/storage.py` — persistencia en `%APPDATA%\TasaDelDia\`
- `app/theme.py` — colores
- `app/auto_update.py` — check de versión

### Deprecados (no modificar)
- `winup_app/` — WinUp PySide6
- `app/app.py`, `app/widgets.py` — Legacy customtkinter
- `app/system_tray.py`, `app/widget_window.py` — solo Legacy/WinUp
- `build.py`, `build_winup.py` — builds legacy
- `main.py`, `tasa_del_dia.py` — entry points legacy

### Otros
- `AI_HANDOFF.md` — traspaso detallado entre sesiones
- `README.md` — documentación

## Config
`%APPDATA%\TasaDelDia\` contiene:
- `config.json` — bcv_lunes, widget_enabled, reminder_enabled
- `cache_rates.json` — última tasa para offline
- `historical_rates.json` — historial de tasas
- `app.log` — logs (DEBUG)
