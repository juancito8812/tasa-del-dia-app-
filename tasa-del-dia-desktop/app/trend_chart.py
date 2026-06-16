from __future__ import annotations

import logging
import customtkinter as ctk
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

_matplotlib_available = False
try:
    import matplotlib
    matplotlib.use("TkAgg")
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    from matplotlib.figure import Figure
    import matplotlib.dates as mdates
    _matplotlib_available = True
except ImportError:
    logger.warning("matplotlib no disponible — gráfico desactivado")


class TrendChart(ctk.CTkFrame):
    def __init__(
        self,
        parent: ctk.CTkBaseClass,
        theme: Any,
        **kwargs: object,
    ) -> None:
        super().__init__(parent, **kwargs)
        self._theme = theme
        self._canvas: Optional[FigureCanvasTkAgg] = None

        if not _matplotlib_available:
            self._show_unavailable()
            return

        self._container = ctk.CTkFrame(self, fg_color=theme.bg, corner_radius=0)
        self._container.pack(fill="both", expand=True)

        self._fig = Figure(figsize=(6, 4), dpi=100)
        self._fig.patch.set_facecolor(theme.card)
        self._ax = self._fig.add_subplot(111)
        self._ax.set_facecolor(theme.card)

        self._canvas = FigureCanvasTkAgg(self._fig, master=self._container)
        self._canvas.get_tk_widget().pack(fill="both", expand=True, padx=8, pady=8)

        self._info_label = ctk.CTkLabel(
            self._container, text="", text_color=theme.muted,
            font=("Segoe UI", 9), fg_color="transparent",
        )
        self._info_label.pack(fill="x", padx=16, pady=(0, 8))

    def _show_unavailable(self) -> None:
        c = self._theme
        ctk.CTkLabel(
            self, text="📈 Gráfico no disponible",
            text_color=c.warning, font=("Segoe UI", 14, "bold"),
            fg_color="transparent",
        ).pack(expand=True, pady=(20, 4))
        ctk.CTkLabel(
            self, text="Instala matplotlib para ver la tendencia:\n"
                       "pip install matplotlib",
            text_color=c.muted, font=("Segoe UI", 10),
            justify="center", fg_color="transparent",
        ).pack(expand=True)

    def update_chart(self, historical: Dict[str, Any]) -> None:
        if not _matplotlib_available or self._canvas is None:
            return

        c = self._theme
        self._ax.clear()

        dates: List[datetime] = []
        bcv_values: List[float] = []
        par_values: List[float] = []

        for date_key in sorted(historical.keys()):
            try:
                dt = datetime.strptime(date_key, "%Y-%m-%d")
            except ValueError:
                continue
            entry = historical[date_key]

            bcv = entry.get("bcv")
            paralelo = entry.get("paralelo")

            if bcv is not None:
                dates.append(dt)
                bcv_values.append(float(bcv))
                if paralelo is not None:
                    par_values.append(float(paralelo))
                else:
                    par_values.append(float("nan"))
            elif paralelo is not None:
                dates.append(dt)
                bcv_values.append(float("nan"))
                par_values.append(float(paralelo))

        if not dates:
            self._ax.text(
                0.5, 0.5, "Sin datos históricos aún",
                ha="center", va="center",
                color=c.muted, fontsize=12, transform=self._ax.transAxes,
            )
            self._apply_style(c)
            self._canvas.draw()
            self._info_label.configure(text="Guarda tasas para ver la tendencia")
            return

        if bcv_values:
            self._ax.plot(
                dates, bcv_values,
                color=c.success, linewidth=2, marker="o", markersize=4,
                label="BCV (Oficial)", zorder=3,
            )
        if par_values and any(not (v != v) for v in par_values):
            self._ax.plot(
                dates, par_values,
                color=c.highlight, linewidth=2, marker="s", markersize=4,
                label="Dólar Paralelo", zorder=3,
            )

        self._ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m"))
        self._ax.xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates) // 6)))

        for label in self._ax.get_xticklabels():
            label.set_rotation(30)
            label.set_ha("right")
            label.set_color(c.secondary)

        self._ax.set_ylabel("Bs. por USD", color=c.secondary, fontsize=10)
        self._ax.legend(
            loc="upper left",
            facecolor=c.card,
            edgecolor=c.card_border,
            labelcolor=c.primary,
            fontsize=9,
        )

        self._apply_style(c)
        self._fig.tight_layout()
        self._canvas.draw()

        fecha_min = dates[0].strftime("%d/%m/%Y")
        fecha_max = dates[-1].strftime("%d/%m/%Y")
        self._info_label.configure(
            text=f"📊 {len(dates)} días · {fecha_min} → {fecha_max}"
        )

    def _apply_style(self, c: Any) -> None:
        self._ax.spines["top"].set_visible(False)
        self._ax.spines["right"].set_visible(False)
        self._ax.spines["bottom"].set_color(c.card_border)
        self._ax.spines["left"].set_color(c.card_border)
        self._ax.tick_params(colors=c.secondary, labelsize=8)
        self._ax.yaxis.label.set_color(c.secondary)
        self._ax.grid(True, alpha=0.15, color=c.secondary)

    def apply_theme(self, theme: Any) -> None:
        self._theme = theme
        if _matplotlib_available and hasattr(self, "_fig"):
            self._fig.patch.set_facecolor(theme.card)
            self._ax.set_facecolor(theme.card)
            self._apply_style(theme)
            self._container.configure(fg_color=theme.bg)
            self._info_label.configure(text_color=theme.muted)
            try:
                self._canvas.draw()
            except Exception:
                pass

    def destroy(self) -> None:
        try:
            if hasattr(self, "_fig"):
                import matplotlib.pyplot as plt
                plt.close(self._fig)
        except Exception:
            pass
        super().destroy()
