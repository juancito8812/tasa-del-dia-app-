# Tasa del Día — Venezuela

App de escritorio que muestra las tasas de cambio del Bolívar venezolano. Tres versiones: **Flet** (recomendada), **WinUp (PySide6)**, y **Legacy (customtkinter)**.

## Requisitos
- Python 3.10+

## Instalación
```bash
pip install -r requirements.txt
```

## Uso

### Flet (recomendado)
```bash
python flet_app/main.py
```

### WinUp
```bash
python winup_app/main.py
```

### Legacy
```bash
python main.py
```

## Compilar .exe

### Flet (77 MB)
```bash
python build_flet.py          # build completo
python build_flet.py --quick  # salta icono
```
Genera `dist/TasaDelDiaFlet.exe`.

### WinUp (70 MB)
```bash
python build_winup.py          # build completo
python build_winup.py --quick  # salta icono
```
Genera `dist/TasaDelDiaWinUp.exe`.

### Legacy (30 MB)
```bash
python build.py          # build completo
python build.py --quick  # salta icono
```
Genera `dist/TasaDelDia.exe`.

## Características

| Feature | Flet | WinUp | Legacy |
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
| `flet_app/main.py` | UI Flet (recomendada) |
| `build_flet.py` | Compilar .exe Flet |
| `winup_app/app.py` | UI WinUp PySide6 |
| `winup_app/main.py` | Entry point WinUp |
| `winup_app/winup_shim.py` | Shim PySide6 sin winup |
| `build_winup.py` | Compilar .exe WinUp |
| `app/api.py` | API de tasas |
| `app/storage.py` | Persistencia JSON |
| `app/auto_update.py` | Actualizaciones |
| `app/system_tray.py` | Bandeja del sistema (WinUp/Legacy) |
| `app/app.py` | UI legacy (customtkinter) |
| `build.py` | Compilar .exe legacy |

## Config
`%APPDATA%\TasaDelDia\`:
- `config.json` — preferencias
- `cache_rates.json` — tasas offline
- `historical_rates.json` — historial
- `app.log` — logs (DEBUG)

## Repositorios
- Desktop: https://github.com/juancito8812/tasa-del-dia-destopk
- Principal: https://github.com/juancito8812/tasa-del-dia-app-
