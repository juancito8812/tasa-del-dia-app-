from __future__ import annotations

import logging
from typing import Dict, Tuple

import customtkinter as ctk

logger = logging.getLogger(__name__)

ThemeDict = Dict[str, object]


class Theme:
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
        return tuple(self._data["card_bg_rgb"])


_DARK_DATA: ThemeDict = {
    "name": "oscuro",
    "icon": "🌙",
    "bg": "#07070d",
    "card": "#111120",
    "card_border": "#1e1e3a",
    "primary": "#f0f0ff",
    "secondary": "#8888b0",
    "muted": "#55557a",
    "accent": "#1c1c38",
    "highlight": "#ff4060",
    "success": "#00d4a0",
    "warning": "#fbbf24",
    "info": "#38bdf8",
    "bcvLunes": "#c084fc",
    "input_bg": "#0d0d1a",
    "input_text": "#f0f0ff",
    "card_bg_rgb": (0x11, 0x11, 0x20),
}

_LIGHT_DATA: ThemeDict = {
    "name": "claro",
    "icon": "☀️",
    "bg": "#f4f6fa",
    "card": "#ffffff",
    "card_border": "#e2e4ee",
    "primary": "#0f0f1a",
    "secondary": "#4a4a6a",
    "muted": "#9494b8",
    "accent": "#e8ecf4",
    "highlight": "#e93555",
    "success": "#059669",
    "warning": "#d97706",
    "info": "#0284c7",
    "bcvLunes": "#7c3aed",
    "input_bg": "#eef0f6",
    "input_text": "#0f0f1a",
    "card_bg_rgb": (0xFF, 0xFF, 0xFF),
}

DARK = Theme(_DARK_DATA)
LIGHT = Theme(_LIGHT_DATA)


def get_system_theme() -> str:
    return ctk.get_appearance_mode().lower()


def resolve_theme(mode: str) -> Theme:
    if mode == "dark":
        return DARK
    elif mode == "light":
        return LIGHT
    else:
        return DARK if ctk.get_appearance_mode().lower() == "dark" else LIGHT


def apply_ctk_theme(mode: str) -> None:
    ctk.set_appearance_mode(mode)


FONTS: Dict[str, Tuple[str, int, str]] = {
    "title": ("Segoe UI", 22, "bold"),
    "subtitle": ("Segoe UI", 10),
    "card_title": ("Segoe UI", 13, "bold"),
    "rate": ("Segoe UI", 28, "bold"),
    "small": ("Segoe UI", 9),
    "button": ("Segoe UI", 11, "bold"),
    "result": ("Segoe UI", 24, "bold"),
    "section": ("Segoe UI", 10, "bold"),
    "timer": ("Segoe UI", 11),
    "spread_big": ("Segoe UI", 20, "bold"),
    "spread_small": ("Segoe UI", 9),
}
