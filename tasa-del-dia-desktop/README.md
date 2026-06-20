# Tasa del Día — Venezuela

App de escritorio que muestra las tasas de cambio del Bolívar venezolano. **Flet** es la única versión activa. Las versiones **WinUp (PySide6)** y **Legacy (customtkinter)** están deprecadas y se eliminarán en una versión futura.

## Requisitos
- Python 3.10+

## Instalación
```bash
pip install -r requirements.txt
```

## Uso

### Flet (único)
```bash
python flet_app/main.py
```

### WinUp (deprecado)
```bash
python winup_app/main.py
```

### Legacy (deprecado)
```bash
python main.py
```

## Compilar .exe

### Flet (77 MB) — recomendado
```bash
python build_flet.py          # build completo
python build_flet.py --quick  # salta icono
```
Genera `dist/TasaDelDiaFlet.exe`.

### WinUp (70 MB) — deprecado
```bash
python build_winup.py          # build completo
python build_winup.py --quick  # salta icono
```
Genera `dist/TasaDelDiaWinUp.exe`.

### Legacy (30 MB) — deprecado
```bash
python build.py          # build completo
python build.py --quick  # salta icono
```
Genera `dist/TasaDelDia.exe`.

## Características

| Feature | Flet | WinUp (deprecado) | Legacy (deprecado) |
|---------|------|-------|--------|
| Tasas en tiempo real | ✅ | ✅ | ✅ |
| 3 pestañas (Tasas/Conversor/Historial) | ✅ | ✅ | ✅ |
| Tema dark/light/system | ✅ | ✅ | ✅ |
| BCV Lunes (edición manual) | ✅ | ✅ | ✅ |
| Recordatorio viernes | ✅ | ✅ | ✅ |
| Modo offline con caché | ✅ | ✅ | ✅ |
| Auto-refresh cada 25 min | ✅ | ✅ | ✅ |
| System tray | ❌ | ✅ | ✅ |
| Widget flotante | ❌ | ✅ | ✅ |
| Notificaciones nativas | ❌ | ✅ | ✅ |
| Gráfico de tendencia | ❌ | ❌ | ✅ |

## API
```
GET https://api.cotizave.com/v1/fx/public/calculator?amount=1&from=USD&to=VES
```

## Archivos clave
| Archivo | Propósito |
|---------|-----------|
| `flet_app/main.py` | UI Flet (única activa) |
| `build_flet.py` | Compilar .exe Flet |
| `winup_app/app.py` | UI WinUp PySide6 (deprecada) |
| `winup_app/main.py` | Entry point WinUp (deprecado) |
| `winup_app/winup_shim.py` | Shim PySide6 sin winup (deprecado) |
| `build_winup.py` | Compilar .exe WinUp (deprecado) |
| `app/api.py` | API de tasas (compartido) |
| `app/storage.py` | Persistencia JSON (compartido) |
| `app/auto_update.py` | Actualizaciones (compartido) |
| `app/system_tray.py` | Bandeja del sistema (deprecado) |
| `app/app.py` | UI legacy customtkinter (deprecado) |
| `build.py` | Compilar .exe legacy (deprecado) |

## Config
`%APPDATA%\TasaDelDia\`:
- `config.json` — preferencias
- `cache_rates.json` — tasas offline
- `historical_rates.json` — historial
- `app.log` — logs (DEBUG)

## Repositorios
- Desktop: https://github.com/juancito8812/tasa-del-dia-destopk
- Principal: https://github.com/juancito8812/tasa-del-dia-app-
