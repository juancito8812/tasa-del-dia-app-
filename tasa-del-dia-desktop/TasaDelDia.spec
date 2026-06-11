# -*- mode: python ; coding: utf-8 -*-
"""
Spec para compilar Tasa del Día con PyInstaller.
Uso: python -m PyInstaller TasaDelDia.spec
"""

from __future__ import annotations

import os
import sys

# Incluir todo el paquete 'app' como datos adicionales
app_dir = os.path.join(os.path.dirname(__file__), "app")

a = Analysis(
    ['main.py'],
    pathex=[os.path.dirname(__file__)],
    binaries=[],
    datas=[
        ('app_icon.ico', '.'),
        # Incluir todo el paquete app como módulo
        (app_dir, 'app'),
    ],
    hiddenimports=[
        'app',
        'app.storage',
        'app.api',
        'app.theme',
        'app.widgets',
        'app.app',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Excluir tests del .exe final
        'tests',
        'pytest',
        'unittest',
    ],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='TasaDelDia',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='app_icon.ico',
)