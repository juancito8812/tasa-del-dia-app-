---
name: run-app
description: Ejecuta la aplicación de escritorio Tasa del Día directamente desde Python (sin compilar). Use when necesites probar cambios rápidamente sin recompilar el .exe.
---

# Run App — Tasa del Día Desktop

Ejecuta la aplicación de escritorio directamente con Python para desarrollo y debugging rápido.

## Workflow

1. **Ejecutar desde la terminal**:
   ```bash
   cd tasa-del-dia-desktop
   python main.py
   ```

2. **Ver logs de debugging**:
   Los logs aparecen en la terminal. Con la app corriendo, los logs se guardan en:
   ```
   %APPDATA%\TasaDelDia\app.log
   ```
   (Normalmente `C:\Users\<usuario>\AppData\Roaming\TasaDelDia\app.log`)

3. **Ejecutar sin compilar el .exe**:
   Usar `python main.py` es más rápido que compilar el .exe (~90 segundos con PyInstaller). Es la forma recomendada durante el desarrollo.

## Atajos de teclado (dentro de la app)

| Atajo | Acción |
|-------|--------|
| `Ctrl+R` | Refrescar tasas |
| `Ctrl+C` | Copiar tasa BCV |
| `Ctrl+Shift+C` | Copiar todas las tasas |
| `Ctrl+W` | Mostrar/ocultar widget |
| `Ctrl+Q` | Cerrar app |
| `Esc` | Cerrar diálogo activo |

## Troubleshooting

- **RecursionError en startup**: Verificar `_start_theme_polling()` en `app.py` — la comparación de nombres de tema debe usar `"oscuro"`/`"claro"` (no `"dark"`/`"light"`).
- **Widget muestra "—"**: Las tasas se cargan después de crear el widget. Si no se actualizan, verificar que `_show_widget()` aplique `self.rates` existentes.
- **Gráfico no disponible**: Instalar matplotlib con `pip install matplotlib`.
- **No hay sonido de notificación**: `plyer` puede no estar instalado. Ejecutar `pip install plyer`.
- **Python no encontrado**: Asegurar que Python 3.14+ esté en el PATH.
