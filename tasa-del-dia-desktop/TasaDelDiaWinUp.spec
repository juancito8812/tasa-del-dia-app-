# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['winup_app\\main.py'],
    pathex=[],
    binaries=[],
    datas=[('app_icon.ico', '.')],
    hiddenimports=['winup_app.winup_shim', 'app', 'app.api', 'app.storage', 'app.theme', 'app.system_tray', 'app.auto_update', 'requests', 'urllib3', 'certifi', 'idna', 'charset_normalizer', 'packaging', 'packaging.version', 'PIL', 'pystray', 'plyer'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['customtkinter', 'matplotlib', 'winup', 'watchdog', 'tkinter', 'unittest', 'pytest', 'test'],
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
    name='TasaDelDiaWinUp',
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
    icon=['app_icon.ico'],
)
