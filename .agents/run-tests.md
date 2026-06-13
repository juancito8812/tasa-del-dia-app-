---
name: run-tests
description: Ejecuta la suite de tests unitarios de la aplicación de escritorio. Use when necesites verificar que los tests pasan después de hacer cambios.
---

# Run Tests — Tasa del Día Desktop

Ejecuta la suite completa de tests unitarios (115 tests) para la aplicación de escritorio.

## Workflow

1. **Ejecutar todos los tests**:
   ```bash
   cd tasa-del-dia-desktop
   python -m pytest tests/ -v
   ```

2. **Ejecutar tests específicos** (sin Tkinter, más rápidos):
   ```bash
   python -m pytest tests/test_auto_update.py tests/test_system_tray.py tests/test_trend_chart.py tests/test_api.py tests/test_storage.py -v
   ```

3. **Ejecutar tests con resumen compacto**:
   ```bash
   python -m pytest tests/ -q
   ```

## Tests disponibles (115 total)

| Archivo | Tests | Requiere Tkinter |
|---------|-------|-----------------|
| `tests/test_api.py` | 3 | No |
| `tests/test_auto_update.py` | 14 | No |
| `tests/test_storage.py` | 5 | No |
| `tests/test_system_tray.py` | 12 | No |
| `tests/test_trend_chart.py` | 27 | No |
| `tests/test_widget_window.py` | 30 | **Sí** |
| `tests/test_storage.py` | 5 | No |

## Troubleshooting

- **Tests de widget_window fallan con TclError**: Es un problema del entorno (falta `tk.tcl` en el path de Python). No afecta la funcionalidad de la app.
- **Tests lentos**: Los 89 tests sin Tkinter toman ~3 segundos. Los 30 de widget_window requieren Tkinter real.
- **Mocking de pystray/PIL**: Usar `@patch("pystray.Icon")` y `@patch("PIL.Image")` — NO `@patch("app.system_tray.Image")` porque los imports son lazy (dentro de la función `start_tray`). Ver `test_system_tray.py` para ejemplos.
