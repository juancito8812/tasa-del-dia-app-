"""
Sistema de temas: Oscuro, Claro y Sigue el tema del sistema.
Soporta detección automática del tema de Windows vía registro.
"""

from __future__ import annotations

import logging
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

# ─── Tipo de datos ───────────────────────────────────────────────
ThemeDict = Dict[str, object]


class Theme:
    """Contenedor de un tema con todos sus colores y metadatos."""

    def __init__(self, data: ThemeDict) -> None:
        self._data = data

    def __getitem__(self, key: str) -> object:
        return self._data[key]

    def get(self, key: str, default: object = None) -> object:
        return self._data.get(key, default)

    @property
    def name(self) -> str:
        return str(self._data.get("name", "unknown"))

    @property
    def icon(self) -> str:
        return str(self._data.get("icon", "🌙"))

    @property
    def bg(self) -> str:
        return str(self._data["bg"])

    @property
    def card(self) -> str:
        return str(self._data["card"])

    @property
    def card_border(self) -> str:
        return str(self._data["card_border"])

    @property
    def primary(self) -> str:
        return str(self._data["primary"])

    @property
    def secondary(self) -> str:
        return str(self._data["secondary"])

    @property
    def muted(self) -> str:
        return str(self._data["muted"])

    @property
    def accent(self) -> str:
        return str(self._data["accent"])

    @property
    def highlight(self) -> str:
        return str(self._data["highlight"])

    @property
    def success(self) -> str:
        return str(self._data["success"])

    @property
    def warning(self) -> str:
        return str(self._data["warning"])

    @property
    def info(self) -> str:
        return str(self._data["info"])

    @property
    def bcv_lunes(self) -> str:
        return str(self._data["bcvLunes"])

    @property
    def input_bg(self) -> str:
        return str(self._data["input_bg"])

    @property
    def input_text(self) -> str:
        return str(self._data["input_text"])

    @property
    def card_bg_rgb(self) -> Tuple[int, int, int]:
        return tuple(self._data["card_bg_rgb"])  # type: ignore


# ─── Datos de temas ──────────────────────────────────────────────

_DARK_DATA: ThemeDict = {
    "name": "oscuro",
    "icon": "🌙",
    "bg": "#0a0a14",
    "card": "#16162a",
    "card_border": "#2a2a45",
    "primary": "#ffffff",
    "secondary": "#a0aec0",
    "muted": "#636e82",
    "accent": "#1a1a3e",
    "highlight": "#e94560",
    "success": "#00b894",
    "warning": "#f39c12",
    "info": "#4fc3f7",
    "bcvLunes": "#a855f7",
    "input_bg": "#111126",
    "input_text": "#ffffff",
    "card_bg_rgb": (0x16, 0x16, 0x2A),
}

_LIGHT_DATA: ThemeDict = {
    "name": "claro",
    "icon": "☀️",
    "bg": "#f0f2f5",
    "card": "#ffffff",
    "card_border": "#d1d5db",
    "primary": "#1a1a2e",
    "secondary": "#4a5568",
    "muted": "#9ca3af",
    "accent": "#e2e8f0",
    "highlight": "#e94560",
    "success": "#059669",
    "warning": "#d97706",
    "info": "#0284c7",
    "bcvLunes": "#7c3aed",
    "input_bg": "#f1f5f9",
    "input_text": "#1a1a2e",
    "card_bg_rgb": (0xFF, 0xFF, 0xFF),
}


# ─── Temas disponibles ──────────────────────────────────────────

DARK = Theme(_DARK_DATA)
LIGHT = Theme(_LIGHT_DATA)


def get_system_theme() -> str:
    """Detecta el tema del sistema en Windows.

    Returns:
        'dark' o 'light' según la configuración de Windows.
        'dark' como fallback si no se puede detectar.
    """
    try:
        import winreg  # noqa: PLC0415
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
        )
        value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
        winreg.CloseKey(key)
        theme = "light" if value == 1 else "dark"
        logger.debug("Tema del sistema detectado: %s", theme)
        return theme
    except ImportError:
        logger.debug("winreg no disponible (no es Windows), usando tema oscuro por defecto")
        return "dark"
    except Exception as e:
        logger.warning("Error detectando tema del sistema: %s", e)
        return "dark"


def resolve_theme(mode: str) -> Theme:
    """Resuelve el tema según el modo seleccionado.

    Args:
        mode: 'dark', 'light' o 'system'.

    Returns:
        Instancia de Theme correspondiente.
    """
    if mode == "dark":
        return DARK
    elif mode == "light":
        return LIGHT
    else:  # system
        system = get_system_theme()
        return DARK if system == "dark" else LIGHT


# ─── Fuentes ─────────────────────────────────────────────────────

FONTS: Dict[str, Tuple[str, int, str]] = {
    "title": ("Segoe UI", 20, "bold"),
    "subtitle": ("Segoe UI", 10),
    "card_title": ("Segoe UI", 13, "bold"),
    "rate": ("Segoe UI", 26, "bold"),
    "small": ("Segoe UI", 9),
    "button": ("Segoe UI", 11, "bold"),
    "result": ("Segoe UI", 22, "bold"),
    "section": ("Segoe UI", 9, "bold"),
    "timer": ("Segoe UI", 11),
    "spread_big": ("Segoe UI", 18, "bold"),
    "spread_small": ("Segoe UI", 9),
}