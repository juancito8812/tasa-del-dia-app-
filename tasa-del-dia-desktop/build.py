#!/usr/bin/env python3
"""
Tasa del Día — Build .EXE
--------------------------
Script Python que compila la aplicación de escritorio a .EXE.
Uso:  python build.py
      python build.py --quick   (salta generación de icono)
      python build.py --no-clean  (no limpia builds anteriores)
"""

import os
import sys
import subprocess
import shutil
import time

# ─── Colors ───
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"
DIM = "\033[2m"

# ─── Fix Windows encoding ───
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


def print_step(num, total, text):
    print(f"\n{YELLOW}[{num}/{total}] > {text}...{RESET}")


def print_ok(text):
    print(f"  {GREEN}[OK] {text}{RESET}")


def print_warn(text):
    print(f"  {YELLOW}[WARN] {text}{RESET}")


def print_error(text):
    print(f"  {RED}[ERROR] {text}{RESET}")


def run_command(cmd, desc="Comando"):
    """Run a command and return (success, output)."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            return True, result.stdout.strip()
        else:
            return False, (result.stderr or result.stdout).strip()
    except subprocess.TimeoutExpired:
        return False, "Timeout - el comando tardó demasiado"
    except Exception as e:
        return False, str(e)


def check_python():
    """Verify Python is installed and get version."""
    ok, ver = run_command("python --version")
    if ok:
        print_ok(f"Python {ver.split()[-1]}")
        return True
    print_error("Python no está instalado o no está en PATH")
    print("  Descárgalo desde: https://www.python.org/downloads/")
    return False


def generate_icon():
    """Generate the app icon using the icon generator script."""
    ok, out = run_command("python generate_icon.py", "Generar icono")
    if ok:
        print_ok("Icono generado: app_icon.ico")
        return True
    print_warn(f"No se pudo generar el icono: {out[:100]}")
    return False


def check_pyinstaller():
    """Check if PyInstaller is installed, install if not."""
    ok, ver = run_command("python -m PyInstaller --version", "PyInstaller")
    if ok:
        print_ok(f"PyInstaller {ver.strip()}")
        return True
    print("  [..] Instalando PyInstaller...")
    ok, out = run_command("pip install pyinstaller", "Instalar PyInstaller")
    if ok:
        print_ok("PyInstaller instalado")
        return True
    print_error(f"No se pudo instalar PyInstaller:\n  {out[:200]}")
    return False


def clean_old_builds():
    """Clean previous build artifacts."""
    paths = [
        ("dist/TasaDelDia.exe", True),
        ("build/TasaDelDia", False),
    ]
    for path, is_file in paths:
        if os.path.exists(path):
            try:
                if is_file:
                    os.remove(path)
                else:
                    shutil.rmtree(path)
                print(f"  [..] Limpiando: {path}")
            except Exception as e:
                print_warn(f"No se pudo limpiar {path}: {e}")


def compile_exe(no_clean=False):
    """Compile the .exe using PyInstaller."""
    cmd = "python -m PyInstaller TasaDelDia.spec"
    if not no_clean:
        cmd += " --clean"

    print(f"\n  Ejecutando: {cmd}")
    print(f"  {YELLOW}Esto puede tomar 1-2 minutos...{RESET}\n")

    start = time.time()
    ok, out = run_command(cmd, "Compilar .EXE")
    elapsed = time.time() - start

    if ok:
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)
        print_ok(f"Compilación completada en {mins}m {secs}s")
        return True
    else:
        # Show last lines of error
        lines = out.split("\n")
        error_lines = "\n  ".join(lines[-15:])
        print_error(f"Fallo al compilar (took {int(elapsed)}s):\n  {error_lines}")
        return False


def verify_exe():
    """Verify the compiled .exe exists and show info."""
    exe_path = "dist/TasaDelDia.exe"
    if not os.path.exists(exe_path):
        print_error(f"No se encontró: {exe_path}")
        return False

    size_bytes = os.path.getsize(exe_path)
    size_mb = size_bytes / (1024 * 1024)
    mod_time = os.path.getmtime(exe_path)
    time_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(mod_time))

    print()
    print(f"{GREEN}╔══════════════════════════════════════════╗{RESET}")
    print(f"{GREEN}║   [OK] EXE CREADO EXITOSAMENTE!         ║{RESET}")
    print(f"{GREEN}╚══════════════════════════════════════════╝{RESET}")
    print()
    print(f"  {CYAN}Ubicación:{RESET} {os.path.abspath(exe_path)}")
    print(f"  {CYAN}Tamaño:{RESET}    {size_mb:.1f} MB")
    print(f"  {CYAN}Fecha:{RESET}     {time_str}")
    print()
    return True


# ─── Main ───

def main():
    # Parse args
    quick = "--quick" in sys.argv
    no_clean = "--no-clean" in sys.argv
    skip_icon = quick

    print(f"{CYAN}{BOLD}╔══════════════════════════════════════════╗{RESET}")
    print(f"{CYAN}{BOLD}║     Tasa del Dia - Build .EXE          ║{RESET}")
    print(f"{CYAN}{BOLD}╚══════════════════════════════════════════╝{RESET}")
    print(f"  {'(modo rápido)' if quick else '(build completo)'}")
    print()

    # Step 1: Python
    if not check_python():
        sys.exit(1)

    total_steps = 4 if not skip_icon else 3
    step = 1

    # Step 2: Generate icon (optional)
    if not skip_icon:
        step += 1
        # Don't fail if icon generation fails
        generate_icon()
    else:
        print(f"\n{YELLOW}[SKIP] Generación de icono saltada (--quick){RESET}")

    # Step 3: Check PyInstaller
    step += 1
    if not check_pyinstaller():
        sys.exit(1)

    # Step 4: Clean old builds
    if not no_clean:
        clean_old_builds()

    # Step 5: Compile
    step += 1
    if not compile_exe(no_clean):
        sys.exit(1)

    # Verify
    verify_exe()

    print(f"{YELLOW}TIP: Para recompilar rápido usa: python build.py --quick{RESET}")
    print()


if __name__ == "__main__":
    main()
