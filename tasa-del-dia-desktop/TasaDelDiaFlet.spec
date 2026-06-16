# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['flet_app\\main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['app', 'app.api', 'app.storage', 'app.auto_update'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
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
    name='TasaDelDiaFlet',
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
    version='C:\\Users\\JUANSA~1\\AppData\\Local\\Temp\\6052a9be-84a9-45eb-a2f7-aca52e655a03',
    icon=['app_icon.ico'],
)
