"""
Componentes UI reutilizables: RateCard, SpreadIndicator, TimerBar.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional, TYPE_CHECKING

import tkinter as tk

from app.theme import FONTS, Theme

if TYPE_CHECKING:
    from typing import Tuple

logger = logging.getLogger(__name__)

# ─── CONSTANTES ─────────────────────────────────────────────────
REFRESH_MINUTES = 25


# ─── Funciones auxiliares ────────────────────────────────────────

def _blend(color: str, alpha: float, card_bg_rgb: Tuple[int, int, int]) -> str:
    """Mezcla un color con el fondo de la tarjeta para crear un efecto glassmorphism.

    Args:
        color: Color hex (#RRGGBB).
        alpha: Opacidad del color (0.0 - 1.0).
        card_bg_rgb: Tupla RGB del fondo de la tarjeta.

    Returns:
        Color hex resultante.
    """
    if color.startswith("#") and len(color) == 7:
        r = int(color[1:3], 16)
        g = int(color[3:5], 16)
        b = int(color[5:7], 16)
        bg_r, bg_g, bg_b = card_bg_rgb
        blend_r = int(r * alpha + bg_r * (1 - alpha))
        blend_g = int(g * alpha + bg_g * (1 - alpha))
        blend_b = int(b * alpha + bg_b * (1 - alpha))
        return f"#{blend_r:02x}{blend_g:02x}{blend_b:02x}"
    return color


def _format_time(updated_at: Optional[str]) -> str:
    """Formatea un timestamp ISO a string legible.

    Args:
        updated_at: Timestamp en formato ISO.

    Returns:
        String formateado (ej: "15/03 03:45 PM") o vacío.
    """
    if not updated_at:
        return ""
    try:
        dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        return dt.strftime("%d/%m %I:%M %p")
    except (ValueError, TypeError, AttributeError) as e:
        logger.warning("Error formateando timestamp '%s': %s", updated_at, e)
        return ""


# ─── RATE CARD ───────────────────────────────────────────────────

class RateCard(tk.Frame):
    """Tarjeta premium con glow accent y glassmorphism simulado."""

    def __init__(
        self,
        parent: tk.Widget,
        title: str,
        subtitle: str,
        icon: str,
        color: str,
        theme: Theme,
        **kwargs: object
    ) -> None:
        self._theme: Theme = theme
        c = theme
        super().__init__(
            parent,
            bg=c.card,
            highlightbackground=c.card_border,
            highlightthickness=1,
            **kwargs  # type: ignore[arg-type]
        )
        self.configure(padx=16, pady=14)
        self.color: str = color
        self.rate_var: tk.StringVar = tk.StringVar(value="—")
        self.time_var: tk.StringVar = tk.StringVar(value="")
        self._copy_timer: Optional[str] = None

        # Glow accent bar (top)
        glow = tk.Frame(self, bg=color, height=3)
        glow.pack(fill="x", side="top")
        glow.lift()

        # Header
        header = tk.Frame(self, bg=c.card)
        header.pack(fill="x", pady=(6, 0))

        icon_frame = tk.Frame(
            header, bg=_blend(color, 0.15, c.card_bg_rgb), width=38, height=38
        )
        icon_frame.pack(side="left", padx=(0, 10))
        icon_frame.pack_propagate(False)
        icon_label = tk.Label(
            icon_frame, text=icon,
            bg=_blend(color, 0.15, c.card_bg_rgb),
            fg=color, font=("Segoe UI", 16)
        )
        icon_label.pack(expand=True)

        text_frame = tk.Frame(header, bg=c.card)
        text_frame.pack(side="left", fill="x", expand=True)

        tk.Label(
            text_frame, text=title, bg=c.card, fg=c.primary,
            font=FONTS["card_title"], anchor="w"
        ).pack(anchor="w")
        if subtitle:
            tk.Label(
                text_frame, text=subtitle, bg=c.card, fg=c.secondary,
                font=FONTS["small"], anchor="w"
            ).pack(anchor="w")

        # Time label
        self.time_label = tk.Label(
            header, textvariable=self.time_var, bg=c.card,
            fg=c.muted, font=FONTS["small"]
        )
        self.time_label.pack(side="right", anchor="n", padx=(4, 0))

        # Rate
        rate_frame = tk.Frame(self, bg=c.card)
        rate_frame.pack(fill="x", pady=(8, 0))

        tk.Label(
            rate_frame, text="Bs.", bg=c.card, fg=color,
            font=("Segoe UI", 16, "bold"), anchor="w"
        ).pack(side="left")

        self.rate_label = tk.Label(
            rate_frame, textvariable=self.rate_var, bg=c.card,
            fg=color, font=FONTS["rate"], anchor="w", cursor="hand2"
        )
        self.rate_label.pack(side="left", padx=(4, 0))

        # Copy button
        self.copy_btn = tk.Label(
            rate_frame, text="📋", bg=c.card, fg=c.muted,
            font=("Segoe UI", 10), cursor="hand2", padx=4
        )
        self.copy_btn.pack(side="left", padx=(2, 0))
        self.copy_btn.bind("<Button-1>", lambda _e: self._copy_rate())
        self.rate_label.bind("<Button-1>", lambda _e: self._copy_rate())

        # Copy feedback
        self.copy_feedback = tk.Label(
            self, text="", bg=c.card, fg=color,
            font=("Segoe UI", 8, "bold"), anchor="e"
        )

        # Divider
        divider = tk.Frame(self, bg=c.card_border, height=1)
        divider.pack(fill="x", pady=(8, 6))

        # 1 USD info
        self.usd_info = tk.Label(
            self, text="", bg=c.card, fg=c.muted,
            font=FONTS["small"], anchor="w"
        )
        self.usd_info.pack(fill="x")

    def update_rate(
        self,
        rate_value: Optional[float],
        updated_at: Optional[str] = None
    ) -> None:
        """Actualiza el valor de la tasa mostrada.

        Args:
            rate_value: Valor numérico de la tasa o None.
            updated_at: Timestamp ISO de la última actualización.
        """
        if rate_value is not None:
            formatted = f"{rate_value:,.2f}"
            self.rate_var.set(formatted)
            self.usd_info.config(text=f"1 USD = {rate_value:,.2f} Bs.")
        else:
            self.rate_var.set("—")
            self.usd_info.config(text="")

        time_str = _format_time(updated_at)
        self.time_var.set(f"🕐 {time_str}" if time_str else "")

    def _copy_rate(self) -> None:
        """Copia la tasa al portapapeles."""
        rate_text = self.rate_var.get()
        if rate_text and rate_text not in ("—", "Cargando...", "Error"):
            self.clipboard_clear()
            self.clipboard_append("Bs. " + rate_text)
            if self._copy_timer:
                self.after_cancel(self._copy_timer)
            self.copy_feedback.pack(fill="x", pady=(4, 0))
            self.copy_feedback.config(text="✓ Copiado al portapapeles")
            timer_id = self.after(
                2000,
                lambda: self.copy_feedback.pack_forget()
                if self.copy_feedback.winfo_exists()
                else None
            )
            self._copy_timer = timer_id

    def show_loading(self) -> None:
        """Muestra estado de carga."""
        self.rate_var.set("Cargando...")
        self.rate_label.config(font=("Segoe UI", 14))
        self.time_var.set("")
        self.usd_info.config(text="")

    def show_error(self) -> None:
        """Muestra estado de error."""
        self.rate_label.config(font=FONTS["rate"])
        self.rate_var.set("Error")
        self.time_var.set("")


# ─── SPREAD INDICATOR ────────────────────────────────────────────

class SpreadIndicator(tk.Frame):
    """Indicador visual de brecha entre dos tasas."""

    def __init__(
        self,
        parent: tk.Widget,
        theme: Theme,
        title: str,
        icon: str,
        color_a: str,
        label_a: str,
        color_b: str,
        label_b: str,
        **kwargs: object
    ) -> None:
        self._theme: Theme = theme
        c = theme
        super().__init__(
            parent,
            bg=c.card,
            highlightbackground=c.card_border,
            highlightthickness=1,
            **kwargs  # type: ignore[arg-type]
        )
        self.configure(padx=14, pady=12)
        self.color_a: str = color_a
        self.color_b: str = color_b

        self.inner = tk.Frame(self, bg=c.card)
        self.inner.pack(fill="x")

        # Title
        title_frame = tk.Frame(self.inner, bg=c.card)
        title_frame.pack(fill="x", pady=(0, 10))

        tk.Label(
            title_frame, text=icon, bg=c.card, font=("Segoe UI", 11)
        ).pack(side="left", padx=(0, 6))
        tk.Label(
            title_frame, text=title, bg=c.card,
            fg=c.muted, font=FONTS["section"], anchor="w"
        ).pack(side="left")

        # Rates row
        rates_row = tk.Frame(self.inner, bg=c.card)
        rates_row.pack(fill="x", pady=(0, 10))

        # Rate A
        a_frame = tk.Frame(rates_row, bg=c.card)
        a_frame.pack(side="left", expand=True, fill="x")
        tk.Label(
            a_frame, text=label_a, bg=c.card, fg=c.muted,
            font=FONTS["spread_small"]
        ).pack()
        self.a_value = tk.Label(
            a_frame, text="—", bg=c.card, fg=color_a,
            font=FONTS["spread_big"]
        )
        self.a_value.pack()

        # VS
        vs_frame = tk.Frame(rates_row, bg=c.card)
        vs_frame.pack(side="left", padx=10)
        tk.Label(
            vs_frame, text="VS", bg=c.card, fg=c.muted,
            font=("Segoe UI", 10, "bold")
        ).pack()

        # Rate B
        b_frame = tk.Frame(rates_row, bg=c.card)
        b_frame.pack(side="left", expand=True, fill="x")
        tk.Label(
            b_frame, text=label_b, bg=c.card, fg=c.muted,
            font=FONTS["spread_small"]
        ).pack()
        self.b_value = tk.Label(
            b_frame, text="—", bg=c.card, fg=color_b,
            font=FONTS["spread_big"]
        )
        self.b_value.pack()

        # Progress bar background
        self.bar_bg = tk.Frame(self.inner, bg=c.input_bg, height=4)
        self.bar_bg.pack(fill="x", pady=(0, 10))

        # Bar fill
        self.bar_fill = tk.Frame(self.bar_bg, bg=c.success, height=4)
        self.bar_fill.place(x=0, y=0, relheight=1.0, relwidth=0.0)

        # Stats row
        stats_frame = tk.Frame(self.inner, bg=c.input_bg)
        stats_frame.pack(fill="x")

        # Diferencia
        diff_frame = tk.Frame(stats_frame, bg=c.input_bg)
        diff_frame.pack(side="left", expand=True, fill="x", pady=8)
        tk.Label(
            diff_frame, text="DIFERENCIA", bg=c.input_bg, fg=c.muted,
            font=FONTS["spread_small"]
        ).pack()
        self.diff_value = tk.Label(
            diff_frame, text="—", bg=c.input_bg, fg=c.success,
            font=FONTS["section"]
        )
        self.diff_value.pack()

        # Separator
        sep = tk.Frame(stats_frame, bg=c.card_border, width=1)
        sep.pack(side="left", fill="y", padx=4, pady=6)

        # Brecha %
        pct_frame = tk.Frame(stats_frame, bg=c.input_bg)
        pct_frame.pack(side="left", expand=True, fill="x", pady=8)
        tk.Label(
            pct_frame, text="BRECHA", bg=c.input_bg, fg=c.muted,
            font=FONTS["spread_small"]
        ).pack()
        self.pct_value = tk.Label(
            pct_frame, text="—", bg=c.input_bg, fg=c.success,
            font=FONTS["section"]
        )
        self.pct_value.pack()

        self.pack_forget()  # hidden by default

    def update(self, rate_a: Optional[float], rate_b: Optional[float]) -> None:
        """Actualiza con dos tasas y calcula la brecha.

        La brecha se calcula como (rate_b - rate_a) / rate_a * 100.

        Args:
            rate_a: Primera tasa (ej: BCV).
            rate_b: Segunda tasa (ej: Paralelo).
        """
        if rate_a and rate_b and rate_a > 0:
            diff = rate_b - rate_a
            pct = (diff / rate_a) * 100

            self.a_value.config(text=f"Bs. {rate_a:,.2f}")
            self.b_value.config(text=f"Bs. {rate_b:,.2f}")

            bar_pct = min(pct / 30 * 100, 100)
            self.bar_fill.place(relwidth=bar_pct / 100.0)

            if pct > 15:
                bar_color = self._theme.highlight
            elif pct > 8:
                bar_color = self._theme.warning
            else:
                bar_color = self._theme.success

            self.bar_fill.config(bg=bar_color)
            self.diff_value.config(text=f"Bs. {diff:,.2f}", fg=bar_color)
            self.pct_value.config(text=f"{pct:.2f}%", fg=bar_color)

            if not self.winfo_ismapped():
                parent_siblings = self.master.winfo_children()
                before = parent_siblings[0] if parent_siblings else None
                self.pack(fill="x", padx=12, pady=(0, 8), before=before)
        else:
            self.pack_forget()


# ─── TIMER BAR ──────────────────────────────────────────────────

class TimerBar(tk.Frame):
    """Barra de cuenta regresiva con estilo premium."""

    def __init__(self, parent: tk.Widget, theme: Theme, **kwargs: object) -> None:
        self._theme: Theme = theme
        c = theme
        super().__init__(
            parent,
            bg=c.card,
            highlightbackground=c.card_border,
            highlightthickness=1,
            **kwargs  # type: ignore[arg-type]
        )
        self.configure(padx=12, pady=8)

        row = tk.Frame(self, bg=c.card)
        row.pack(fill="x")

        # Icon
        icon_frame = tk.Frame(row, bg=c.input_bg, width=22, height=22)
        icon_frame.pack(side="left")
        icon_frame.pack_propagate(False)
        tk.Label(
            icon_frame, text="🔄", bg=c.input_bg, font=("Segoe UI", 10)
        ).pack(expand=True)

        self.label = tk.Label(
            row, text="Actualizando en 25:00", bg=c.card,
            fg=c.muted, font=FONTS["timer"], anchor="w", padx=8
        )
        self.label.pack(side="left", fill="x", expand=True)

        # Progress bar
        self.bar_bg = tk.Frame(self, bg=c.input_bg, height=3)
        self.bar_bg.pack(fill="x", pady=(6, 0))

        self.bar_fill = tk.Frame(self.bar_bg, bg=c.accent, height=3)
        self.bar_fill.place(x=0, y=0, relheight=1.0, relwidth=0.0)

        self.total_seconds: int = REFRESH_MINUTES * 60

    def update(self, remaining_seconds: int) -> None:
        """Actualiza el timer y la barra de progreso.

        Args:
            remaining_seconds: Segundos restantes para la próxima actualización.
        """
        c = self._theme
        mins = remaining_seconds // 60
        secs = remaining_seconds % 60
        elapsed_pct = (1 - remaining_seconds / self.total_seconds) * 100

        self.bar_fill.place(relwidth=elapsed_pct / 100.0)

        if remaining_seconds < 60:
            self.label.config(
                text=f"🔄  Actualizando en {remaining_seconds}s…",
                fg=c.warning
            )
            self.bar_fill.config(bg=c.warning)
        else:
            self.label.config(
                text=f"🔄  Próxima actualización en {mins}:{secs:02d}",
                fg=c.muted
            )
            self.bar_fill.config(bg=c.accent)