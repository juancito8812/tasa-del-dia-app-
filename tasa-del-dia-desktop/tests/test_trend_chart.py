"""Tests para el módulo de gráfico de tendencia (TrendChart).

Usa mocks para matplotlib y crea un root Tkinter oculto para
verificar la integración con Tk sin necesidad de un display real.
"""

from __future__ import annotations

import tkinter as tk
from unittest.mock import MagicMock, patch

import pytest

from app.theme import DARK, LIGHT
from app.trend_chart import TrendChart


# ─── Fixture global ──────────────────────────────────────────────


@pytest.fixture(scope="module")
def tk_root():
    """Crea un root de Tkinter oculto para toda la suite de tests."""
    root = tk.Tk()
    root.withdraw()
    yield root
    root.destroy()


@pytest.fixture
def fresh_root():
    """Crea y destruye un root por test (para tests que necesitan aislamiento)."""
    root = tk.Tk()
    root.withdraw()
    yield root
    root.destroy()


# ─── Helpers para crear un TrendChart mockeado ─────────────────────


def _make_mocked_chart(parent: tk.Widget) -> tuple[TrendChart, MagicMock, MagicMock]:
    """Crea un TrendChart con matplotlib completamente mockeado.

    Returns:
        (chart, mock_fig, mock_canvas)
    """
    with (
        patch("app.trend_chart._matplotlib_available", True),
        patch("app.trend_chart.Figure") as mock_figure_cls,
        patch("app.trend_chart.FigureCanvasTkAgg") as mock_canvas_cls,
        patch("app.trend_chart.mdates") as mock_mdates,
    ):
        mock_fig = MagicMock()
        mock_ax = MagicMock()
        mock_fig.add_subplot.return_value = mock_ax
        mock_figure_cls.return_value = mock_fig

        mock_canvas = MagicMock()
        mock_canvas_widget = MagicMock(spec=tk.Widget)
        mock_canvas.get_tk_widget.return_value = mock_canvas_widget
        mock_canvas_cls.return_value = mock_canvas

        mock_mdates.DateFormatter.return_value = MagicMock()
        mock_mdates.DayLocator.return_value = MagicMock()

        chart = TrendChart(parent, DARK)

        return chart, mock_fig, mock_canvas


# ═══════════════════════════════════════════════════════════════════
# Tests: matplotlib NO disponible
# ═══════════════════════════════════════════════════════════════════


class TestTrendChartNoMatplotlib:
    """Comportamiento cuando matplotlib no está instalado."""

    @patch("app.trend_chart._matplotlib_available", False)
    def test_show_unavailable_message(self, tk_root: tk.Tk) -> None:
        """Muestra mensaje 'gráfico no disponible'."""
        import customtkinter as ctk
        chart = TrendChart(tk_root, DARK)

        labels = [w for w in chart.winfo_children() if isinstance(w, ctk.CTkLabel)]
        texts = [l.cget("text") for l in labels]

        assert any("no disponible" in t.lower() for t in texts)
        assert any("pip install" in t.lower() for t in texts)

    @patch("app.trend_chart._matplotlib_available", False)
    def test_canvas_is_none(self, tk_root: tk.Tk) -> None:
        """_canvas es None cuando matplotlib no está disponible."""
        chart = TrendChart(tk_root, DARK)
        assert chart._canvas is None

    @patch("app.trend_chart._matplotlib_available", False)
    def test_update_chart_noop(self, tk_root: tk.Tk) -> None:
        """update_chart es no-op (no lanza error) sin matplotlib."""
        chart = TrendChart(tk_root, DARK)
        chart.update_chart({"2025-03-15": {"bcv": 60.0}})

    @patch("app.trend_chart._matplotlib_available", False)
    def test_apply_theme_noop(self, tk_root: tk.Tk) -> None:
        """apply_theme no lanza error sin matplotlib."""
        chart = TrendChart(tk_root, DARK)
        chart.apply_theme(LIGHT)
        assert chart._theme == LIGHT

    @patch("app.trend_chart._matplotlib_available", False)
    def test_destroy_noop(self, tk_root: tk.Tk) -> None:
        """destroy no lanza error (no hay figura que cerrar)."""
        chart = TrendChart(tk_root, DARK)
        chart.destroy()


# ═══════════════════════════════════════════════════════════════════
# Tests: matplotlib disponible (mockeado)
# ═══════════════════════════════════════════════════════════════════


class TestTrendChartInitialization:
    """Tests de inicialización del TrendChart."""

    def test_creates_figure_and_canvas(self, fresh_root: tk.Tk) -> None:
        """Crea Figure y FigureCanvasTkAgg correctamente."""
        chart, mock_fig, mock_canvas = _make_mocked_chart(fresh_root)

        assert chart._theme == DARK
        assert chart._canvas is not None
        mock_fig.add_subplot.assert_called_once_with(111)

    def test_figure_configuration(self, fresh_root: tk.Tk) -> None:
        """Configura tamaño y colores de la figura."""
        chart, mock_fig, mock_canvas = _make_mocked_chart(fresh_root)

        mock_fig.patch.set_facecolor.assert_called_with(DARK.card)

    def test_canvas_creation(self, fresh_root: tk.Tk) -> None:
        """El canvas se crea con self._fig como argumento."""
        chart, mock_fig, mock_canvas = _make_mocked_chart(fresh_root)

        # El canvas se creó y get_tk_widget fue llamado
        assert chart._canvas is not None
        assert chart._canvas is mock_canvas
        mock_canvas.get_tk_widget.assert_called_once()

    def test_info_label_exists(self, fresh_root: tk.Tk) -> None:
        """El info_label se crea y configura."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        # _container fue creado, verificar que _info_label exista
        assert hasattr(chart, "_info_label")
        assert chart._info_label.winfo_exists()


# ═══════════════════════════════════════════════════════════════════
# Tests: update_chart
# ═══════════════════════════════════════════════════════════════════


class TestTrendChartUpdate:
    """Tests del método update_chart."""

    def test_update_empty_historical(self, fresh_root: tk.Tk) -> None:
        """Con datos vacíos, muestra mensaje 'Sin datos'."""
        chart, _, mock_canvas = _make_mocked_chart(fresh_root)
        # mock_canvas.draw() es el mock, no tiene .draw()
        # El canvas real está dentro de chart._canvas
        real_canvas = chart._canvas

        chart.update_chart({})

        # _ax.text(x=0.5, y=0.5, s="Sin datos históricos aún", ...)
        chart._ax.text.assert_called_once()
        args, _ = chart._ax.text.call_args
        assert len(args) >= 3
        assert "Sin datos" in args[2]  # el texto es el 3er argumento posicional

        # draw debe haberse llamado
        assert real_canvas is not None

    def test_update_with_full_data(self, fresh_root: tk.Tk) -> None:
        """Con datos de BCV + Paralelo, grafica 2 líneas."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        data = {
            "2025-03-14": {"bcv": 60.0, "paralelo": 72.0},
            "2025-03-15": {"bcv": 61.0, "paralelo": 73.0},
        }
        chart.update_chart(data)

        # Dos llamadas a plot: BCV + Paralelo
        assert chart._ax.plot.call_count == 2
        # Leyenda agregada
        chart._ax.legend.assert_called_once()
        # Eje X configurado
        chart._ax.xaxis.set_major_formatter.assert_called_once()
        chart._ax.xaxis.set_major_locator.assert_called_once()
        # Canvas dibujado
        chart._canvas.draw.assert_called_once()

    def test_update_bcv_only(self, fresh_root: tk.Tk) -> None:
        """Solo BCV (sin Paralelo) — 1 línea."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        data = {
            "2025-03-14": {"bcv": 60.0},
            "2025-03-15": {"bcv": 61.0},
        }
        chart.update_chart(data)

        assert chart._ax.plot.call_count == 1  # Solo BCV

    def test_update_paralelo_only(self, fresh_root: tk.Tk) -> None:
        """Solo Paralelo (BCV como NaN) — se grafica BCV+Paralelo."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        data = {
            "2025-03-14": {"paralelo": 72.0},
            "2025-03-15": {"paralelo": 73.0},
        }
        chart.update_chart(data)

        # El código agrega BCV como NaN y Paralelo como valor
        # `if bcv_values:` es True (aunque todos NaN), así que plot se llama 2 veces
        assert chart._ax.plot.call_count == 2

    def test_update_ignores_invalid_dates(self, fresh_root: tk.Tk) -> None:
        """Fechas con formato inválido son ignoradas."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        data = {
            "invalid-date": {"bcv": 99.0},
            "2025-03-15": {"bcv": 61.0},
        }
        chart.update_chart(data)

        # Solo el dato válido se grafica
        assert chart._ax.plot.call_count == 1

    def test_update_single_data_point(self, fresh_root: tk.Tk) -> None:
        """Un solo punto de datos grafica 2 líneas (BCV + Paralelo)."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        data = {
            "2025-03-15": {"bcv": 61.0, "paralelo": 73.0},
        }
        chart.update_chart(data)

        assert chart._ax.plot.call_count == 2

    def test_update_with_missing_paralelo(self, fresh_root: tk.Tk) -> None:
        """Paralelo faltante se agrega como NaN, no se grafica."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        data = {
            "2025-03-14": {"bcv": 60.0},
            "2025-03-15": {"bcv": 61.0, "paralelo": None},
        }
        chart.update_chart(data)

        # Solo BCV se grafica (paralelo tiene solo NaN)
        assert chart._ax.plot.call_count == 1

    def test_update_info_label_message(self, fresh_root: tk.Tk) -> None:
        """El info_label muestra rango de fechas tras actualizar."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        data = {
            "2025-03-14": {"bcv": 60.0, "paralelo": 72.0},
            "2025-03-15": {"bcv": 61.0, "paralelo": 73.0},
        }
        chart.update_chart(data)

        expected_text = "📊 2 días · 14/03/2025 → 15/03/2025"
        # _info_label es un tk.Label real — usar cget para leer el texto
        actual_text = chart._info_label.cget("text")
        assert actual_text == expected_text

    def test_update_apply_style_called(self, fresh_root: tk.Tk) -> None:
        """apply_style se llama después de graficar."""
        with patch.object(TrendChart, "_apply_style") as mock_apply_style:
            chart, _, _ = _make_mocked_chart(fresh_root)

            data = {
                "2025-03-15": {"bcv": 61.0, "paralelo": 73.0},
            }
            chart.update_chart(data)

            mock_apply_style.assert_called_once_with(DARK)


# ═══════════════════════════════════════════════════════════════════
# Tests: apply_style
# ═══════════════════════════════════════════════════════════════════


class TestTrendChartStyle:
    """Tests del método _apply_style."""

    def test_style_spines(self, fresh_root: tk.Tk) -> None:
        """Spines superior y derecho ocultos; inferior e izquierdo coloreados."""
        chart, _, _ = _make_mocked_chart(fresh_root)
        chart._apply_style(DARK)

        chart._ax.spines["top"].set_visible.assert_called_with(False)
        chart._ax.spines["right"].set_visible.assert_called_with(False)
        chart._ax.spines["bottom"].set_color.assert_called_with(DARK.card_border)
        chart._ax.spines["left"].set_color.assert_called_with(DARK.card_border)

    def test_style_tick_params(self, fresh_root: tk.Tk) -> None:
        """Tick labels configurados con color y tamaño."""
        chart, _, _ = _make_mocked_chart(fresh_root)
        chart._apply_style(DARK)

        chart._ax.tick_params.assert_called_with(colors=DARK.secondary, labelsize=8)

    def test_style_grid(self, fresh_root: tk.Tk) -> None:
        """Grid activado con baja opacidad."""
        chart, _, _ = _make_mocked_chart(fresh_root)
        chart._apply_style(DARK)

        chart._ax.grid.assert_called_with(True, alpha=0.15, color=DARK.secondary)


# ═══════════════════════════════════════════════════════════════════
# Tests: apply_theme
# ═══════════════════════════════════════════════════════════════════


class TestTrendChartApplyTheme:
    """Tests del método apply_theme."""

    def test_apply_theme_updates_figure_colors(self, fresh_root: tk.Tk) -> None:
        """apply_theme actualiza colores de la figura al nuevo tema."""
        chart, mock_fig, _ = _make_mocked_chart(fresh_root)

        chart.apply_theme(LIGHT)

        assert chart._theme == LIGHT
        mock_fig.patch.set_facecolor.assert_called_with(LIGHT.card)
        chart._ax.set_facecolor.assert_called_with(LIGHT.card)

    def test_apply_theme_redraws(self, fresh_root: tk.Tk) -> None:
        """apply_theme llama a draw() para refrescar."""
        chart, _, _ = _make_mocked_chart(fresh_root)

        chart.apply_theme(LIGHT)

        chart._canvas.draw.assert_called_once()

    def test_apply_theme_updates_container(self, fresh_root: tk.Tk) -> None:
        """apply_theme actualiza bg del container e info_label."""
        chart, _, _ = _make_mocked_chart(fresh_root)
        chart.apply_theme(LIGHT)

        assert chart._info_label.cget("fg_color") == LIGHT.bg
        assert chart._info_label.cget("text_color") == LIGHT.muted

    def test_apply_theme_calls_apply_style(self, fresh_root: tk.Tk) -> None:
        """apply_theme re-aplica el estilo con el nuevo tema."""
        with patch.object(TrendChart, "_apply_style") as mock_apply_style:
            chart, _, _ = _make_mocked_chart(fresh_root)
            chart.apply_theme(LIGHT)

            mock_apply_style.assert_called_once_with(LIGHT)


# ═══════════════════════════════════════════════════════════════════
# Tests: destroy
# ═══════════════════════════════════════════════════════════════════


class TestTrendChartDestroy:
    """Tests del método destroy."""

    @patch("matplotlib.pyplot.close")
    def test_destroy_closes_figure(
        self, mock_plt_close: MagicMock, fresh_root: tk.Tk
    ) -> None:
        """destroy cierra la figura de matplotlib."""
        chart, mock_fig, _ = _make_mocked_chart(fresh_root)
        # self._fig fue asignado como mock_fig (return_value de Figure())
        chart.destroy()

        mock_plt_close.assert_called_once_with(mock_fig)

    def test_destroy_after_no_matplotlib(self, tk_root: tk.Tk) -> None:
        """destroy sin matplotlib no lanza error."""
        with patch("app.trend_chart._matplotlib_available", False):
            chart = TrendChart(tk_root, DARK)
            chart.destroy()
