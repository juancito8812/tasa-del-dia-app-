---
name: build-exe
description: Compila la aplicación de escritorio TasaDelDia en un .exe portátil usando PyInstaller. Use when necesites generar o regenerar el ejecutable de Windows.
---

# Build .EXE — Tasa del Día Desktop

Compila la aplicación de escritorio en un único `.exe` portátil (~51 MB) que no requiere Python ni dependencias para ejecutarse.

## Workflow

1. **Matar proceso existente** (si hay uno ejecutándose):
   ```bash
   taskkill /f /im TasaDelDia.exe >nul 2>&1
   ```

2. **Compilar con PyInstaller**:
   ```bash
   cd tasa-del-dia-desktop
   python -m PyInstaller --clean TasaDelDia.spec
   ```
   O desde cualquier directorio usando la ruta absoluta:
   ```bash
   python -m PyInstaller --clean "C:\Users\JRCPU\Desktop\Nueva carpeta\tasa-del-dia-app-\tasa-del-dia-desktop\TasaDelDia.spec"
   ```

3. **Verificar archivo generado**:
   ```bash
   ls -la dist/TasaDelDia.exe
   ```

## Output

El ejecutable se genera en `tasa-del-dia-desktop/dist/TasaDelDia.exe`.

## Troubleshooting

- **"Spec file not found!"**: Usar la ruta absoluta al `.spec`
- **Matplotlib no funciona en el .exe**: Verificar que los `hiddenimports` en `TasaDelDia.spec` incluyan: `matplotlib`, `matplotlib.backends.backend_tkagg`, `matplotlib.figure`, `matplotlib.dates`, `matplotlib.pyplot`
- **Error de import faltante**: Agregar el módulo a `hiddenimports` en el `.spec`
- **La compilación tarda ~90 segundos**: Es normal, PyInstaller está empaquetando todas las dependencias
