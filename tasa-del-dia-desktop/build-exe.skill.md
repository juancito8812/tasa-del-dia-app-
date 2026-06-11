# Build TasaDelDia .EXE — Skill de Codebuff

Esta skill compila la aplicación de escritorio Tasa del Día a un ejecutable (.exe) usando PyInstaller.

## Uso

Cuando el usuario diga "compila el .exe", "build" o "recompile", sigue estas instrucciones.

## Prerrequisitos

- Python 3.8+ instalado
- PyInstaller instalado (se instala automáticamente si no está)
- El archivo `tasa_del_dia.py` debe existir en `tasa-del-dia-desktop/`
- El archivo `TasaDelDia.spec` debe existir en `tasa-del-dia-desktop/`

## Instrucciones

### 1. Verificar que estamos en el directorio correcto

El proyecto debe estar en una ruta local (no UNC/ruta de red). Si está en una ruta UNC como `\\26.84.184.63\...`, PyInstaller fallará. En ese caso:

1. Copia la carpeta `tasa-del-dia-desktop` al disco local (ej: `C:\Users\...\Desktop\`)
2. Trabaja desde ahí para el build

### 2. Generar el icono

```bash
cd tasa-del-dia-desktop
python generate_icon.py
```

Si falla, continuar sin icono (usar el existente si hay).

### 3. Verificar PyInstaller

```bash
python -m PyInstaller --version
```

Si no está instalado:
```bash
pip install pyinstaller
```

### 4. Limpiar builds anteriores

```bash
if exist dist\TasaDelDia.exe del /f /q dist\TasaDelDia.exe
if exist build\TasaDelDia rmdir /s /q build\TasaDelDia
```

### 5. Compilar el .exe

```bash
python -m PyInstaller --clean TasaDelDia.spec
```

Esto toma 1-2 minutos.

### 6. Verificar resultado

```bash
dir dist\TasaDelDia.exe
```

El .exe debe aparecer con un tamaño de ~10-15 MB.

### 7. Informar al usuario

Dile al usuario:
- Ruta del .exe: `tasa-del-dia-desktop\dist\TasaDelDia.exe`
- Tamaño del archivo
- Que puede copiarlo a cualquier carpeta y ejecutarlo directamente

## Notas adicionales

- Si solo cambiaste el código de `tasa_del_dia.py`, puedes usar `--quick` para saltar la regeneración del icono: `python build.py --quick`
- El .exe es portátil — no necesita Python ni dependencias instaladas
- Los datos de configuración se guardan en `%APPDATA%\TasaDelDia\`
