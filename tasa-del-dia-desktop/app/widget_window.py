from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

import customtkinter as ctk

from app.theme import Theme

logger = logging.getLogger(__name__)

WIDGET_WIDTH = 260
WIDGET_HEIGHT = 130
WIDGET_ALPHA = 0.95
CONFIG_DIR = os.path.join(
    os.environ.get("APPDATA", os.path.expanduser("~")), "TasaDelDia"
)


def _load_widget_pos() -> Optional[Dict[str, int]]:
    path = os.path.join(CONFIG_DIR, "widget_pos.json")
    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
    except (json.JSONDecodeError, OSError):
        pass
    return None


def _save_widget_pos(x: int, y: int) -> None:
    try:
        os.makedirs(CONFIG_DIR, exist_ok=True)
        path = os.path.join(CONFIG_DIR, "widget_pos.json")
        with open(path, "w") as f:
            json.dump({"x": x, "y": y}, f)
    except OSError as e:
        logger.warning("Error guardando posición del widget: %s", e)


class WidgetWindow:
    def __init__(self, parent_app: Any, theme: Theme) -> None:
        self._parent = parent_app
        self._theme = theme
        self._visible = False

        self.window = ctk.CTkToplevel()
        self.window.withdraw()
        self.window.overrideredirect(True)
        self.window.attributes("-topmost", True)
        self.window.attributes("-alpha", WIDGET_ALPHA)

        saved = _load_widget_pos()
        if saved:
            px, py = saved["x"], saved["y"]
        else:
            sw = self.window.winfo_screenwidth()
            sh = self.window.winfo_screenheight()
            px = sw - WIDGET_WIDTH - 30
            py = sh - WIDGET_HEIGHT - 60

        self.window.geometry(f"{WIDGET_WIDTH}x{WIDGET_HEIGHT}+{px}+{py}")

        self._drag_data = {"x": 0, "y": 0}
        self.window.bind("<Button-1>", self._on_drag_start)
        self.window.bind("<B1-Motion>", self._on_drag_motion)

        self._build_ui()

        self.window.protocol("WM_DELETE_WINDOW", self.hide)

    def _build_ui(self) -> None:
        c = self._theme
        win = self.window
        win.configure(fg_color=c.card)

        # Modern gradient-like header (solid color accent)
        header = ctk.CTkFrame(win, fg_color=c.accent, height=26, corner_radius=0)
        header.pack(fill="x")

        ctk.CTkLabel(
            header, text="📉  Tasa del Día",
            text_color=c.primary, font=("Segoe UI", 10, "bold"),
            fg_color="transparent",
        ).pack(side="left", padx=(10, 0))

        self._close_btn = ctk.CTkLabel(
            header, text="✕", text_color=c.muted,
            font=("Segoe UI", 10, "bold"), cursor="hand2",
            fg_color="transparent",
        )
        self._close_btn.pack(side="right", padx=8)
        self._close_btn.bind("<Button-1>", lambda _e: self.hide() or "break")

        body = ctk.CTkFrame(win, fg_color=c.card, corner_radius=0)
        body.pack(fill="both", expand=True, padx=12, pady=(8, 4))

        bcv_row = ctk.CTkFrame(body, fg_color=c.card, corner_radius=0)
        bcv_row.pack(fill="x", pady=(0, 4))
        ctk.CTkLabel(
            bcv_row, text="🏛️  BCV", text_color=c.muted,
            font=("Segoe UI", 10), fg_color="transparent",
        ).pack(side="left")
        self._bcv_label = ctk.CTkLabel(
            bcv_row, text="—", text_color=c.success,
            font=("Segoe UI", 14, "bold"), anchor="e",
            fg_color="transparent",
        )
        self._bcv_label.pack(side="right")

        par_row = ctk.CTkFrame(body, fg_color=c.card, corner_radius=0)
        par_row.pack(fill="x", pady=(0, 4))
        ctk.CTkLabel(
            par_row, text="📈  Paralelo", text_color=c.muted,
            font=("Segoe UI", 10), fg_color="transparent",
        ).pack(side="left")
        self._par_label = ctk.CTkLabel(
            par_row, text="—", text_color=c.highlight,
            font=("Segoe UI", 14, "bold"), anchor="e",
            fg_color="transparent",
        )
        self._par_label.pack(side="right")

        footer = ctk.CTkFrame(win, fg_color=c.card, corner_radius=0)
        footer.pack(fill="x", padx=12, pady=(0, 6))
        self._time_label = ctk.CTkLabel(
            footer, text="", text_color=c.muted,
            font=("Segoe UI", 8), anchor="w", fg_color="transparent",
        )
        self._time_label.pack(side="left")

    def _on_drag_start(self, event: ctk.Event) -> None:
        self._drag_data["x"] = event.x_root - self.window.winfo_x()
        self._drag_data["y"] = event.y_root - self.window.winfo_y()

    def _on_drag_motion(self, event: ctk.Event) -> None:
        nx = event.x_root - self._drag_data["x"]
        ny = event.y_root - self._drag_data["y"]
        self.window.geometry(f"+{nx}+{ny}")
        _save_widget_pos(nx, ny)

    def update_rates(
        self,
        bcv: Optional[float],
        paralelo: Optional[float],
        fetched_at: Optional[str] = None,
    ) -> None:
        if not self.window.winfo_exists():
            return
        if bcv is not None:
            self._bcv_label.configure(text=f"Bs. {bcv:,.2f}")
        else:
            self._bcv_label.configure(text="—")

        if paralelo is not None:
            self._par_label.configure(text=f"Bs. {paralelo:,.2f}")
        else:
            self._par_label.configure(text="—")

        if fetched_at:
            try:
                dt = datetime.fromisoformat(
                    str(fetched_at).replace("Z", "+00:00")
                )
                self._time_label.configure(text=f"🕐 {dt.strftime('%d/%m %I:%M %p')}")
            except (ValueError, TypeError):
                pass
        else:
            self._time_label.configure(text="")

    def toggle(self) -> None:
        if self._visible:
            self.hide()
        else:
            self.show()

    def show(self) -> None:
        self.window.deiconify()
        self.window.lift()
        self._visible = True
        logger.info("Widget mostrado")

    def hide(self) -> None:
        if not self.window.winfo_exists():
            return
        self.window.withdraw()
        self._visible = False
        try:
            gx, gy = self.window.winfo_x(), self.window.winfo_y()
            _save_widget_pos(gx, gy)
        except Exception:
            pass
        logger.info("Widget ocultado")

    @property
    def is_visible(self) -> bool:
        return self._visible

    def destroy(self) -> None:
        try:
            if self.window.winfo_exists():
                gx, gy = self.window.winfo_x(), self.window.winfo_y()
                _save_widget_pos(gx, gy)
        except Exception:
            pass
        try:
            self.window.destroy()
        except Exception:
            pass
        self._visible = False
        logger.info("Widget destruido")
