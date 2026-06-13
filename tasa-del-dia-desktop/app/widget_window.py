"""
Widget compacto siempre visible — muestra BCV y Paralelo en una mini ventana.
"""

from __future__ import annotations

import logging
import os
import json
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

import tkinter as tk

from app.theme import Theme

logger = logging.getLogger(__name__)

# ─── Configuración del widget ──────────────────────────────────
WIDGET_WIDTH = 240
WIDGET_HEIGHT = 110
WIDGET_ALPHA = 0.92
CONFIG_DIR = os.path.join(
    os.environ.get("APPDATA", os.path.expanduser("~")), "TasaDelDia"
)


def _load_widget_pos() -> Optional[Dict[str, int]]:
    """Carga la última posición guardada del widget."""
    path = os.path.join(CONFIG_DIR, "widget_pos.json")
    try:
        if os.path.exists(path):
            with open(path, "r") as f:
                return json.load(f)
    except (json.JSONDecodeError, OSError):
        pass
    return None


def _save_widget_pos(x: int, y: int) -> None:
    """Guarda la posición del widget."""
    try:
        os.makedirs(CONFIG_DIR, exist_ok=True)
        path = os.path.join(CONFIG_DIR, "widget_pos.json")
        with open(path, "w") as f:
            json.dump({"x": x, "y": y}, f)
    except OSError as e:
        logger.warning("Error guardando posición del widget: %s", e)


class WidgetWindow:
    """Ventana compacta, siempre visible, arrastrable, que muestra BCV y Paralelo."""

    def __init__(self, parent_app: Any, theme: Theme) -> None:
        self._parent = parent_app
        self._theme = theme
        self._visible = False

        self.window = tk.Toplevel()
        self.window.withdraw()  # oculta hasta que se active
        self.window.overrideredirect(True)  # sin bordes de ventana
        self.window.attributes("-topmost", True)  # siempre al frente
        self.window.attributes("-alpha", WIDGET_ALPHA)

        # Restaurar posición guardada o centrar en pantalla
        saved = _load_widget_pos()
        if saved:
            px, py = saved["x"], saved["y"]
        else:
            sw = self.window.winfo_screenwidth()
            sh = self.window.winfo_screenheight()
            px = sw - WIDGET_WIDTH - 30
            py = sh - WIDGET_HEIGHT - 60

        self.window.geometry(f"{WIDGET_WIDTH}x{WIDGET_HEIGHT}+{px}+{py}")

        # ─── Arrastre ───
        self._drag_data = {"x": 0, "y": 0}
        self.window.bind("<Button-1>", self._on_drag_start)
        self.window.bind("<B1-Motion>", self._on_drag_motion)

        # ─── UI ───
        self._build_ui()

        # Cerrar con la app principal
        self.window.protocol("WM_DELETE_WINDOW", self.hide)

    def _build_ui(self) -> None:
        """Construye la interfaz del widget."""
        c = self._theme
        win = self.window
        win.configure(bg=c.card)

        # ─── Header ───
        header = tk.Frame(win, bg=c.accent, height=22)
        header.pack(fill="x")
        header.pack_propagate(False)

        tk.Label(
            header, text="📉  Tasa del Día", bg=c.accent, fg=c.primary,
            font=("Segoe UI", 9, "bold"),
        ).pack(side="left", padx=(8, 0))

        self._close_btn = tk.Label(
            header, text="✕", bg=c.accent, fg=c.muted,
            font=("Segoe UI", 9, "bold"), cursor="hand2", padx=6,
        )
        self._close_btn.pack(side="right")
        self._close_btn.bind("<Button-1>", lambda _e: self.hide() or "break")

        # ─── Cuerpo ───
        body = tk.Frame(win, bg=c.card)
        body.pack(fill="both", expand=True, padx=10, pady=(6, 2))

        # BCV
        bcv_row = tk.Frame(body, bg=c.card)
        bcv_row.pack(fill="x", pady=(0, 2))
        tk.Label(
            bcv_row, text="🏛️  BCV", bg=c.card, fg=c.muted,
            font=("Segoe UI", 9),
        ).pack(side="left")
        self._bcv_label = tk.Label(
            bcv_row, text="—", bg=c.card, fg=c.success,
            font=("Segoe UI", 12, "bold"), anchor="e",
        )
        self._bcv_label.pack(side="right")

        # Paralelo
        par_row = tk.Frame(body, bg=c.card)
        par_row.pack(fill="x", pady=(0, 2))
        tk.Label(
            par_row, text="📈  Paralelo", bg=c.card, fg=c.muted,
            font=("Segoe UI", 9),
        ).pack(side="left")
        self._par_label = tk.Label(
            par_row, text="—", bg=c.card, fg=c.highlight,
            font=("Segoe UI", 12, "bold"), anchor="e",
        )
        self._par_label.pack(side="right")

        # ─── Footer ───
        footer = tk.Frame(win, bg=c.card)
        footer.pack(fill="x", padx=10, pady=(0, 4))
        self._time_label = tk.Label(
            footer, text="", bg=c.card, fg=c.muted,
            font=("Segoe UI", 7), anchor="w",
        )
        self._time_label.pack(side="left")

    # ─── Arrastre ───────────────────────────────────────────────

    def _on_drag_start(self, event: tk.Event) -> None:
        self._drag_data["x"] = event.x_root - self.window.winfo_x()
        self._drag_data["y"] = event.y_root - self.window.winfo_y()

    def _on_drag_motion(self, event: tk.Event) -> None:
        nx = event.x_root - self._drag_data["x"]
        ny = event.y_root - self._drag_data["y"]
        self.window.geometry(f"+{nx}+{ny}")
        # Guardar posición mientras arrastra
        _save_widget_pos(nx, ny)

    # ─── Actualización ──────────────────────────────────────────

    def update_rates(
        self,
        bcv: Optional[float],
        paralelo: Optional[float],
        fetched_at: Optional[str] = None,
    ) -> None:
        """Actualiza las tasas mostradas en el widget."""
        if bcv is not None:
            self._bcv_label.config(text=f"Bs. {bcv:,.2f}")
        else:
            self._bcv_label.config(text="—")

        if paralelo is not None:
            self._par_label.config(text=f"Bs. {paralelo:,.2f}")
        else:
            self._par_label.config(text="—")

        if fetched_at:
            try:
                dt = datetime.fromisoformat(
                    str(fetched_at).replace("Z", "+00:00")
                )
                self._time_label.config(text=f"🕐 {dt.strftime('%d/%m %I:%M %p')}")
            except (ValueError, TypeError):
                pass
        else:
            self._time_label.config(text="")

    # ─── Visibilidad ────────────────────────────────────────────

    def toggle(self) -> None:
        """Alterna la visibilidad del widget."""
        if self._visible:
            self.hide()
        else:
            self.show()

    def show(self) -> None:
        """Muestra el widget."""
        self.window.deiconify()
        self.window.lift()
        self._visible = True
        logger.info("Widget mostrado")

    def hide(self) -> None:
        """Oculta el widget."""
        self.window.withdraw()
        self._visible = False

        # Guardar posición al ocultar
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
        """Destruye la ventana del widget."""
        try:
            gx, gy = self.window.winfo_x(), self.window.winfo_y()
            _save_widget_pos(gx, gy)
        except Exception:
            pass
        self.window.destroy()
        self._visible = False
        logger.info("Widget destruido")
