# -*- mode: python ; coding: utf-8 -*-
"""
Spec para compilar Tasa del Día con PyInstaller.
Uso: python -m PyInstaller TasaDelDia.spec
Nota: __file__ no está disponible en el contexto de PyInstaller,
      usar os.getcwd() en su lugar.
"""

from __future__ import annotations

import os
import sys

# El directorio actual es tasa-del-dia-desktop/ (por working-directory en workflow)
app_dir = os.path.join(os.getcwd(), "app")

a = Analysis(
    ['main.py'],
    pathex=[os.getcwd()],
    binaries=[],
    datas=[
        ('app_icon.ico', '.'),
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