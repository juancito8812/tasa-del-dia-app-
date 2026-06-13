"""
Gráfico de tendencia histórica con matplotlib embebido en Tkinter.

Muestra la evolución de BCV y Paralelo a lo largo del tiempo
usando los datos guardados en el histórico.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import tkinter as tk

logger = logging.getLogger(__name__)

# Verificar disponibilidad de matplotlib
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


class TrendChart(tk.Frame):
    """Gráfico de tendencia histórica embebido en un Frame de Tkinter."""

    def __init__(
        self,
        parent: tk.Widget,
        theme: Any,
        **kwargs: object,
    ) -> None:
        super().__init__(parent, **kwargs)
        self._theme = theme
        self._canvas: Optional[FigureCanvasTkAgg] = None

        if not _matplotlib_available:
            self._show_unavailable()
            return

        # Contenedor para el gráfico + info
        self._container = tk.Frame(self, bg=theme.bg)
        self._container.pack(fill="both", expand=True)

        # Crear figura matplotlib
        self._fig = Figure(figsize=(6, 4), dpi=100)
        self._fig.patch.set_facecolor(theme.card)
        self._ax = self._fig.add_subplot(111)
        self._ax.set_facecolor(theme.card)

        # Canvas TkAgg
        self._canvas = FigureCanvasTkAgg(self._fig, master=self._container)
        self._canvas.get_tk_widget().pack(fill="both", expand=True, padx=8, pady=8)

        # Info label
        self._info_label = tk.Label(
            self._container, text="", bg=theme.bg, fg=theme.muted,
            font=("Segoe UI", 9),
        )
        self._info_label.pack(fill="x", padx=16, pady=(0, 8))

    def _show_unavailable(self) -> None:
        """Muestra mensaje si matplotlib no está instalado."""
        c = self._theme
        tk.Label(
            self, text="📈 Gráfico no disponible",
            bg=c.bg, fg=c.warning, font=("Segoe UI", 14, "bold"),
        ).pack(expand=True, pady=(20, 4))
        tk.Label(
            self, text="Instala matplotlib para ver la tendencia:\n"
                       "pip install matplotlib",
            bg=c.bg, fg=c.muted, font=("Segoe UI", 10),
            justify="center",
        ).pack(expand=True)

    def update_chart(self, historical: Dict[str, Any]) -> None:
        """Actualiza el gráfico con los datos históricos.

        Args:
            historical: Diccionario fecha -> {bcv, paralelo, ...}
        """
        if not _matplotlib_available or self._canvas is None:
            return

        c = self._theme
        self._ax.clear()

        # Preparar datos
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
            self._info_label.config(text="Guarda tasas para ver la tendencia")
            return

        # Graficar líneas
        if bcv_values:
            self._ax.plot(
                dates, bcv_values,
                color=c.success, linewidth=2, marker="o", markersize=4,
                label="BCV (Oficial)", zorder=3,
            )
        if par_values and any(not (v != v) for v in par_values):  # hay valores no-NaN
            self._ax.plot(
                dates, par_values,
                color=c.highlight, linewidth=2, marker="s", markersize=4,
                label="Dólar Paralelo", zorder=3,
            )

        # Formato de fechas
        self._ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m"))
        self._ax.xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates) // 6)))

        # Rotar etiquetas
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

        # Actualizar info
        fecha_min = dates[0].strftime("%d/%m/%Y")
        fecha_max = dates[-1].strftime("%d/%m/%Y")
        self._info_label.config(
            text=f"📊 {len(dates)} días · {fecha_min} → {fecha_max}"
        )

    def _apply_style(self, c: Any) -> None:
        """Aplica el estilo del tema al gráfico."""
        self._ax.spines["top"].set_visible(False)
        self._ax.spines["right"].set_visible(False)
        self._ax.spines["bottom"].set_color(c.card_border)
        self._ax.spines["left"].set_color(c.card_border)
        self._ax.tick_params(colors=c.secondary, labelsize=8)
        self._ax.yaxis.label.set_color(c.secondary)
        self._ax.grid(True, alpha=0.15, color=c.secondary)

    def apply_theme(self, theme: Any) -> None:
        """Actualiza el tema del gráfico."""
        self._theme = theme
        if _matplotlib_available and hasattr(self, "_fig"):
            self._fig.patch.set_facecolor(theme.card)
            self._ax.set_facecolor(theme.card)
            self._apply_style(theme)
            self._container.configure(bg=theme.bg)
            self._info_label.configure(bg=theme.bg, fg=theme.muted)
            try:
                self._canvas.draw()
            except Exception:
                pass

    def destroy(self) -> None:
        """Limpia recursos de matplotlib al destruir."""
        try:
            if hasattr(self, "_fig"):
                import matplotlib.pyplot as plt
                plt.close(self._fig)
        except Exception:
            pass
        super().destroy()
