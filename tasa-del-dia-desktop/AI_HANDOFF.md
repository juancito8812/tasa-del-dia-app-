# AI_HANDOFF — Tasa del Día

## Estado actual (15-Jun-2026)
Tres versiones conviven:

| Versión | Build | Tamaño | Entry | Estado |
|---------|-------|--------|-------|--------|
| **Flet** | `build_flet.py` | 77.1 MB | `flet_app/main.py` | ✅ Activa (nueva) |
| WinUp PySide6 | `build_winup.py` | 70.2 MB | `winup_app/main.py` | ✅ Mantenida |
| Legacy customtkinter | `build.py` | 30.5 MB | `main.py` | 🟡 Legacy |

Repos:
- Desktop: `https://github.com/juancito8812/tasa-del-dia-destopk`
- Principal: `https://github.com/juancito8812/tasa-del-dia-app-`

## Stack

### Flet (recomendada)
- Python 3.14.5 + Flet 0.85.3
- UI declarativa tipo Flutter (ft.Column, ft.Row, ft.Container, ft.Tabs)
- Threading para auto-refresh (QTimerThreadPool ya no aplica)
- Tema dark/light/system con `page.theme_mode` + colores por control
- **Sin system tray, sin widget flotante, sin notificaciones nativas**
- SnackBar para notificaciones in-app
- `flet pack` para build .exe (PyInstaller bajo el hood)

### WinUp PySide6 (mantenida)
- Python 3.14.5 + PySide6 6.11.1
- `winup_shim.py` — shim propio sin dependencia a winup
- QTimer + QThreadPool para async
- Tema dark/light/system con CSS
- Tiene: system tray, widget flotante, notificaciones nativas

### Legacy customtkinter (mantenida)
- Python 3.14 + customtkinter + tkinter + PyInstaller 6.20.0
- ThreadPoolExecutor + queue.Queue + _poll_queue

API: `https://api.cotizave.com/v1/fx/public/calculator?amount=1&from=USD&to=VES`

## Cambios de esta sesión (15-Jun-2026)

### Timer bar eliminado (WinUp)
- Se removió `_build_timer_bar()`, `_start_countdown()`, `_update_timer_display()`, `_countdown`
- Auto-refresh cada 25 min sigue intacto en `_on_rates_loaded`

### Tema claro completado (WinUp)
- Se agregó `_widget_styles` + `_register_style()` para registrar estilos por widget
- `_apply_theme()` itera todos los estilos registrados y re-aplica con colores actuales
- Todos los contenedores registrados: rate cards, spreads, reminder, info bar, converter, history

### App Flet creada
- `flet_app/main.py` (~925 líneas) con toda la UI
- Reusa `app/api.py`, `app/storage.py`, `app/auto_update.py`
- 3 tabs: Tasas, Conversor, Historial
- Theme switching, auto-refresh, BCV Lunes, recordatorio viernes
- Sin system tray, widget flotante, ni notificaciones nativas (limitaciones de Flet)
- Build: `python build_flet.py --quick` → `dist/TasaDelDiaFlet.exe` (77.1 MB)

### Bugs corregidos (sesiones anteriores)
1. `_poll_queue()` sin protección ante excepciones
2. `SpreadIndicator.update()` crasheaba con `pack(before=self)`
3. Widget desaparecía al cambiar tema
4. `.config()` → `.configure()` en CTk widgets
5. `after(0, callback)` no funciona en PyInstaller
6. Datos históricos corruptos con valores de prueba
7. Shadowing de imports causa UnboundLocalError en Python 3.14
8. `import winup` fallaba en .exe compilado → eliminado, creado winup_shim
9. Build 272 MB → 70.2 MB quitando collect_data_files/collect_dynamic_libs
10. Layout no se expandía → agregado stretch al TabView
11. Widget centrado → posicionado en esquina inferior derecha + drag
12. Conflicto `winup_app/app.py` vs `app/` package → orden de sys.path corregido

## Bugs activos conocidos (no reintroducir)
- `.config()` no existe en CTk widgets, usar `.configure()` (legacy)
- `after(0, callback)` desde threads NO funciona en PyInstaller (legacy)
- `SpreadIndicator.update()` no debe hacer `pack(before=sibling)` si sibling no está empaquetado (legacy)
- Widget legacy debe recrearse ANTES de `_on_rates_loaded` en `_rebuild_ui`
- Shadowing de imports en `app.py` causa UnboundLocalError en Python 3.14 — imports al tope

## Decisiones clave
- **Flet como UI principal**: más moderno, build más simple, código más conciso
- **WinUp PySide6 mantenida**: por si se necesita system tray/widget flotante
- `winup_shim` en vez de winup: elimina dependencia externa y problemas de PyInstaller
- `_register_style()` para theme switching: evita tener que rebuildear la UI
- `flet pack` para build: usa PyInstaller con config optimizada para Flet

## Pendiente / Próximos pasos
1. Evaluar si Flet cubre todas las necesidades o mantener WinUp como respaldo
2. Subir al repo destopk (git subtree push)
3. CI/CD para Flet (.github/workflows)
4. Probar .exe en otra máquina (VC++ redistribuible)
5. Probar Flet en otra máquina (requiere Flutter runtime embebido)

## Rutas relevantes
### Flet (recomendada)
- `flet_app/main.py` — UI completa (~925 líneas)
- `build_flet.py` — build .exe (77.1 MB)

### WinUp (respaldo)
- `winup_app/app.py` — UI completa (~1650 líneas, 34 widgets)
- `winup_app/main.py` — entry point
- `winup_app/winup_shim.py` — shim PySide6 (~170 líneas)
- `build_winup.py` — build .exe (70.2 MB)

### Módulos compartidos
- `app/api.py` — fetch_all_rates()
- `app/storage.py` — persistencia JSON en `%APPDATA%\TasaDelDia\`
- `app/theme.py` — colores
- `app/auto_update.py` — check de versión
- `app/system_tray.py` — icono de bandeja (solo WinUp/Legacy)

### Legacy
- `app/app.py` — TasaDelDiaApp (customtkinter)
- `app/widgets.py` — RateCard, SpreadIndicator, TimerBar
- `build.py` — build .exe (30.5 MB)

### Otros
- `AGENTS.md` — instrucciones para agente
- `AI_HANDOFF.md` — este archivo
- `README.md` — documentación

## Config
`%APPDATA%\TasaDelDia\` contiene:
- `config.json` — bcv_lunes, widget_enabled, reminder_enabled
- `cache_rates.json` — última tasa para offline
- `historical_rates.json` — historial de tasas
- `app.log` — logs (DEBUG, legacy/WinUp solamente)

## Dependencias
Flet: `flet>=0.85`, `requests`, `urllib3`, `certifi`, `idna`, `charset_normalizer`, `packaging`, `Pillow`
WinUp: `PySide6>=6.11`, `requests`, `urllib3`, `certifi`, `idna`, `charset_normalizer`, `packaging`, `Pillow`, `plyer`, `pystray`
Legacy: `customtkinter`, `pyinstaller`, `plyer`, `pystray`, `Pillow`, `matplotlib`, `requests`
Build: `pyinstaller`, `flet`
