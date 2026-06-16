#!/usr/bin/env python3
"""
Tasa del Dia (WinUp) -- Build .EXE
-----------------------------------
Compila la version WinUp (PySide6) a .EXE.
Uso:  python build_winup.py
      python build_winup.py --quick   (salta generacion de icono)
"""

import os
import sys
import subprocess
import shutil
import time

GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"
DIM = "\033[2m"

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
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            return True, result.stdout.strip()
        else:
            return False, (result.stderr or result.stdout).strip()
    except subprocess.TimeoutExpired:
        return False, "Timeout - el comando tardo demasiado"
    except Exception as e:
        return False, str(e)


def check_python():
    ok, ver = run_command("python --version")
    if ok:
        print_ok(f"Python {ver.split()[-1]}")
        return True
    print_error("Python no esta instalado")
    return False


def generate_icon():
    ok, out = run_command("python generate_icon.py", "Generar icono")
    if ok:
        print_ok("Icono generado: app_icon.ico")
        return True
    print_warn(f"No se pudo generar el icono: {out[:100]}")
    return False


def check_pyinstaller():
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
    paths = [
        ("dist/TasaDelDiaWinUp.exe", True),
        ("build/TasaDelDiaWinUp", False),
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
    cmd = (
        "python -m PyInstaller --clean --noconfirm --onefile "
        f"--name TasaDelDiaWinUp --windowed --icon app_icon.ico "
        f"--add-data \"app_icon.ico;.\" "
        f"--hidden-import winup_app.winup_shim "
        f"--hidden-import app --hidden-import app.api --hidden-import app.storage "
        f"--hidden-import app.theme --hidden-import app.system_tray --hidden-import app.auto_update "
        '--hidden-import "requests" --hidden-import "urllib3" --hidden-import "certifi" '
        '--hidden-import "idna" --hidden-import "charset_normalizer" '
        '--hidden-import "packaging" --hidden-import "packaging.version" '
        '--hidden-import "PIL" --hidden-import "pystray" --hidden-import "plyer" '
        '--exclude-module "customtkinter" --exclude-module "matplotlib" '
        '--exclude-module "winup" --exclude-module "watchdog" '
        '--exclude-module "tkinter" --exclude-module "unittest" --exclude-module "pytest" '
        '--exclude-module "test" '
        '"winup_app/main.py"'
    )

    print(f"\n  Ejecutando: python -m PyInstaller (command line)")
    print(f"  {YELLOW}Esto puede tomar 3-5 minutos...{RESET}\n")

    start = time.time()
    ok, out = run_command(cmd, "Compilar .EXE")
    elapsed = time.time() - start

    if ok:
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)
        print_ok(f"Compilacion completada en {mins}m {secs}s")
        return True
    else:
        lines = out.split("\n")
        error_lines = "\n  ".join(lines[-20:])
        print_error(f"Fallo al compilar ({int(elapsed)}s):\n  {error_lines}")
        return False


def verify_exe():
    exe_path = "dist/TasaDelDiaWinUp.exe"
    if not os.path.exists(exe_path):
        print_error(f"No se encontro: {exe_path}")
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
    print(f"  {CYAN}Ubicacion:{RESET} {os.path.abspath(exe_path)}")
    print(f"  {CYAN}Tamanho:{RESET}   {size_mb:.1f} MB")
    print(f"  {CYAN}Fecha:{RESET}     {time_str}")
    print()
    return True


def main():
    quick = "--quick" in sys.argv
    no_clean = "--no-clean" in sys.argv
    skip_icon = quick

    print(f"{CYAN}{BOLD}╔══════════════════════════════════════════╗{RESET}")
    print(f"{CYAN}{BOLD}║  Tasa del Dia WinUp - Build .EXE      ║{RESET}")
    print(f"{CYAN}{BOLD}╚══════════════════════════════════════════╝{RESET}")
    print(f"  {'(modo rapido)' if quick else '(build completo)'}")
    print()

    if not check_python():
        sys.exit(1)

    total_steps = 4 if not skip_icon else 3
    step = 1

    if not skip_icon:
        step += 1
        generate_icon()
    else:
        print(f"\n{YELLOW}[SKIP] Generacion de icono saltada (--quick){RESET}")

    step += 1
    if not check_pyinstaller():
        sys.exit(1)

    if not no_clean:
        clean_old_builds()

    step += 1
    if not compile_exe(no_clean):
        sys.exit(1)

    verify_exe()

    print(f"{YELLOW}TIP: Para recompilar rapido usa: python build_winup.py --quick{RESET}")
    print()


if __name__ == "__main__":
    main()
