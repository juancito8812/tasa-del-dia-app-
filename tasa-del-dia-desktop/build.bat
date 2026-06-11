@echo off
setlocal enabledelayedexpansion
title Build Tasa del Dia - .EXE

:: ─── Color helpers ───
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo %CYAN%╔══════════════════════════════════════════╗%RESET%
echo %CYAN%║     Tasa del Dia - Build .EXE            ║%RESET%
echo %CYAN%╚══════════════════════════════════════════╝%RESET%
echo.

:: ─── 1. Check Python ───
echo %YELLOW%[1/4]^> Verificando Python...%RESET%
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[ERROR] Python no esta instalado.%RESET%
    echo.
    echo Descargalo desde: https://www.python.org/downloads/
    echo IMPORTANTE: Marca "Add Python to PATH" durante la instalacion.
    pause
    exit /b 1
)
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PY_VER=%%i
echo %GREEN%  [OK] Python %PY_VER%%RESET%
echo.

:: ─── 2. Generate icon ───
echo %YELLOW%[2/4]^> Generando icono...%RESET%
python generate_icon.py
if %errorlevel% neq 0 (
    echo %YELLOW%  [WARN] No se pudo generar el icono. Continuando...%RESET%
) else (
    echo %GREEN%  [OK] Icono generado: app_icon.ico%RESET%
)
echo.

:: ─── 3. Check PyInstaller ───
echo %YELLOW%[3/4]^> Verificando PyInstaller...%RESET%
python -m PyInstaller --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%  [..] Instalando PyInstaller...%RESET%
    pip install pyinstaller
    if %errorlevel% neq 0 (
        echo %RED%  [ERROR] No se pudo instalar PyInstaller.%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%  [OK] PyInstaller instalado%RESET%
) else (
    for /f "delims=" %%i in ('python -m PyInstaller --version') do set PI_VER=%%i
    echo %GREEN%  [OK] PyInstaller %%PI_VER%%%RESET%
)
echo.

:: ─── 4. Compile .EXE ───
echo %YELLOW%[4/4]^> Compilando .EXE (esto puede tomar 1-2 minutos)...%RESET%
echo.

:: Clean old build artifacts
if exist "dist\TasaDelDia.exe" (
    del /f /q "dist\TasaDelDia.exe" >nul 2>&1
    echo   [..] Limpiando build anterior...
)
if exist "build\TasaDelDia" (
    rmdir /s /q "build\TasaDelDia" >nul 2>&1
)

python -m PyInstaller --clean TasaDelDia.spec
if %errorlevel% neq 0 (
    echo.
    echo %RED%╔══════════════════════════════════════════╗%RESET%
    echo %RED%║     [ERROR] Fallo al generar el .EXE     ║%RESET%
    echo %RED%╚══════════════════════════════════════════╝%RESET%
    pause
    exit /b 1
)

:: ─── Success ───
for %%i in ("dist\TasaDelDia.exe") do set FILE_SIZE=%%~zi
set /a FILE_SIZE_MB=FILE_SIZE / 1048576

echo.
echo %GREEN%╔══════════════════════════════════════════╗%RESET%
echo %GREEN%║   [OK] EXE CREADO EXITOSAMENTE!         ║%RESET%
echo %GREEN%╚══════════════════════════════════════════╝%RESET%
echo.
echo %CYAN%  Ubicacion:%RESET% dist\TasaDelDia.exe
echo %CYAN%  Tamano:%RESET%    %FILE_SIZE_MB% MB
echo.
echo Puedes mover TasaDelDia.exe a cualquier
echo carpeta y ejecutarlo directamente.
echo.
echo %YELLOW%TIP: Para recompilar rapido, solo ejecuta este batch de nuevo.%RESET%
echo.
pause
