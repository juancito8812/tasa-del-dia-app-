#!/usr/bin/env python3
"""
Tasa del Día — Aplicación de escritorio (Premium Dark Fintech)
=============================================================
Punto de entrada principal. Inicializa logging y lanza la app.

Uso:
    python main.py

Requiere:
    - Python 3.10+
    - Tkinter (incluido con Python en Windows)
"""

from __future__ import annotations

import logging
import os
import sys


def setup_logging() -> None:
    """Configura el sistema de logging de la aplicación.

    Los logs se escriben en:
      - %APPDATA%/TasaDelDia/app.log (archivo, nivel DEBUG)
      - stderr (nivel INFO)
    """
    from app.storage import CONFIG_DIR

    log_dir = CONFIG_DIR
    os.makedirs(log_dir, exist_ok=True)

    log_file = os.path.join(log_dir, "app.log")

    # Configurar logging
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Formato detallado
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Handler para archivo
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # Handler para consola (stderr)
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    logging.info("=== Tasa del Día iniciado ===")
    logging.info("Logs: %s", log_file)


def main() -> None:
    """Punto de entrada principal de la aplicación."""
    # Crash dump temprano para diagnóstico
    _dump_path = os.path.join(
        os.environ.get("TEMP", os.path.expanduser("~")),
        "tasa_del_dia_crash.log",
    )
    try:
        with open(_dump_path, "w", encoding="utf-8") as _f:
            _f.write("=== Tasa del Día iniciando ===\n")
            _f.write(f"CWD: {os.getcwd()}\n")
            _f.write(f"ARGV: {sys.argv}\n")
            _f.write(f"PYTHONPATH: {os.environ.get('PYTHONPATH', 'N/A')}\n")
            _f.write("Iniciando setup_logging...\n")
    except Exception as _e:
        pass  # No podemos hacer nada si falla escribir el dump

    setup_logging()
    logging.info("Inicio de la app")

    try:
        from app.app import TasaDelDiaApp

        app = TasaDelDiaApp()
        app.window.mainloop()
    except Exception:
        logging.exception("Error fatal al iniciar la aplicación")
        # También escribir al crash dump
        import traceback
        try:
            with open(_dump_path, "a", encoding="utf-8") as _f:
                traceback.print_exc(file=_f)
        except Exception:
            pass
        raise


if __name__ == "__main__":
    main()