#!/usr/bin/env python3
"""
Tasa del Dia (Flet) -- Build .EXE
----------------------------------
Compila la version Flet a .EXE usando flet pack.
Uso:  python build_flet.py
      python build_flet.py --quick   (salta generacion de icono)
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

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")


def get_flet_path():
    scripts = os.path.join(os.environ.get("APPDATA", ""), "Python", "Python314", "Scripts")
    flet_exe = os.path.join(scripts, "flet.exe")
    if os.path.exists(flet_exe):
        return flet_exe
    return "flet"


def run_command(cmd, desc="Comando", timeout=300):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            return True, result.stdout.strip()
        else:
            return False, (result.stderr or result.stdout).strip()
    except subprocess.TimeoutExpired:
        return False, "Timeout"
    except Exception as e:
        return False, str(e)


def main():
    quick = "--quick" in sys.argv
    skip_icon = quick

    print(f"{CYAN}{BOLD}╔══════════════════════════════════════════╗{RESET}")
    print(f"{CYAN}{BOLD}║  Tasa del Dia Flet - Build .EXE       ║{RESET}")
    print(f"{CYAN}{BOLD}╚══════════════════════════════════════════╝{RESET}")
    print(f"  {'(modo rapido)' if quick else '(build completo)'}")
    print()

    ok, ver = run_command("python --version")
    if ok:
        print(f"  {GREEN}[OK] Python {ver.split()[-1]}{RESET}")

    flet_exe = get_flet_path()
    ok, ver = run_command(f'"{flet_exe}" --version', "Flet", timeout=15)
    if ok:
        ver_str = ver.strip().split("\n")[-1] if ver else "?"
        print(f"  {GREEN}[OK] {ver_str}{RESET}")

    if not skip_icon:
        print()
        ok, out = run_command("python generate_icon.py", "Generar icono")
        if ok:
            print(f"  {GREEN}[OK] Icono generado{RESET}")
        else:
            print(f"  {YELLOW}[WARN] No se pudo generar icono{RESET}")
    else:
        print(f"\n{YELLOW}[SKIP] Icono saltado{RESET}")

    print()
    exe_path = "dist/TasaDelDiaFlet.exe"
    if os.path.exists(exe_path):
        os.remove(exe_path)
        print(f"  [..] Limpiando: {exe_path}")
    build_dir = "build/TasaDelDiaFlet"
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
        print(f"  [..] Limpiando: {build_dir}")

    icon_flag = f'-i "app_icon.ico"' if os.path.exists("app_icon.ico") else ""
    cmd = (
        f'"{flet_exe}" pack flet_app/main.py '
        f'-n TasaDelDiaFlet '
        f'{icon_flag} '
        f'--distpath dist '
        f'--product-name "Tasa del Dia" '
        f'--file-description "Tasa del Dia - Venezuela" '
        f'--product-version "1.0.0" '
        f'--company-name "Tasa del Dia" '
        f'--hidden-import app --hidden-import app.api --hidden-import app.storage '
        f'--hidden-import app.auto_update '
        f'-y'
    )

    print(f"  Ejecutando: flet pack")
    print(f"  {YELLOW}Esto puede tomar 5-10 minutos...{RESET}\n")

    start = time.time()
    ok, out = run_command(cmd, "Flet pack", timeout=600)
    elapsed = time.time() - start

    if ok:
        mins = int(elapsed // 60)
        secs = int(elapsed % 60)
        print(f"\n  {GREEN}[OK] Compilacion completada en {mins}m {secs}s{RESET}")
    else:
        lines = out.split("\n")
        error_lines = "\n  ".join(lines[-30:])
        print(f"\n  {RED}[ERROR] Fallo ({int(elapsed)}s):{RESET}\n  {error_lines}")
        sys.exit(1)

    if os.path.exists(exe_path):
        size_mb = os.path.getsize(exe_path) / (1024 * 1024)
        mod_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(os.path.getmtime(exe_path)))
        print(f"\n{GREEN}╔══════════════════════════════════════════╗{RESET}")
        print(f"{GREEN}║   [OK] EXE CREADO EXITOSAMENTE!         ║{RESET}")
        print(f"{GREEN}╚══════════════════════════════════════════╝{RESET}")
        print(f"\n  {CYAN}Ubicacion:{RESET} {os.path.abspath(exe_path)}")
        print(f"  {CYAN}Tamanho:{RESET}   {size_mb:.1f} MB")
        print(f"  {CYAN}Fecha:{RESET}     {mod_time}")
    else:
        print(f"\n  {RED}[ERROR] No se encontro el .exe{RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()
