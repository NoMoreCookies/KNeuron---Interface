# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_all

sklearn_datas, sklearn_bins, sklearn_hidden = collect_all("sklearn")
scipy_datas, scipy_bins, scipy_hidden = collect_all("scipy")

a = Analysis(
    ["bridge.py"],
    pathex=[],
    binaries=sklearn_bins + scipy_bins,
    datas=sklearn_datas + scipy_datas,
    hiddenimports=sklearn_hidden + scipy_hidden,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="ssvep-classifier",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
)
