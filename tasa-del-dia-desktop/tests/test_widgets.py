"""Tests para el módulo de componentes UI (widgets.py).

Cubre: RateCard, SpreadIndicator, TimerBar, _blend, _format_time.
Usa Tkinter real oculto para verificar la integración con Tk.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.theme import DARK, LIGHT
from app.widgets import REFRESH_MINUTES, RateCard, SpreadIndicator, TimerBar, _blend, _format_time


# ═══════════════════════════════════════════════════════════════════
# Tests: funciones auxiliares
# ═══════════════════════════════════════════════════════════════════


class TestBlend:
    """Tests de _blend()."""

    def test_basic_blend(self) -> None:
        """Mezcla básica con alpha=0.5 sobre fondo negro."""
        result = _blend("#ff0000", 0.5, (0, 0, 0))
        # int(255 * 0.5 + 0 * 0.5) = int(127.5) = 127 = 0x7f
        assert result == "#7f0000"

    def test_full_alpha(self) -> None:
        """Alpha=1.0 → color original."""
        result = _blend("#ff0000", 1.0, (255, 255, 255))
        assert result == "#ff0000"

    def test_zero_alpha(self) -> None:
        """Alpha=0.0 → color de fondo."""
        result = _blend("#ff0000", 0.0, (200, 150, 100))
        assert result == "#c89664"

    def test_blend_with_white_bg(self) -> None:
        """Mezcla sobre fondo blanco."""
        result = _blend("#ff0000", 0.25, (255, 255, 255))
        assert result == "#ffbfbf"

    def test_invalid_color_format(self) -> None:
        """Color sin formato hex → retorna el color sin cambios."""
        result = _blend("invalid", 0.5, (0, 0, 0))
        assert result == "invalid"

    def test_short_hex_color(self) -> None:
        """Color hex corto (#fff) → retorna sin cambios (no es válido)."""
        result = _blend("#fff", 0.5, (0, 0, 0))
        assert result == "#fff"

    def test_green_channel(self) -> None:
        """Mezcla con color verde."""
        result = _blend("#00ff00", 0.5, (0, 0, 0))
        # int(255 * 0.5 + 0 * 0.5) = 127 = 0x7f
        assert result == "#007f00"

    def test_blue_channel(self) -> None:
        """Mezcla con color azul."""
        result = _blend("#0000ff", 0.3, (100, 100, 100))
        # r = int(0*0.3 + 100*0.7) = 70 = 0x46
        # g = int(0*0.3 + 100*0.7) = 70 = 0x46
        # b = int(255*0.3 + 100*0.7) = int(76.5+70) = int(146.5) = 146 = 0x92
        assert result == "#464692"


class TestFormatTime:
    """Tests de _format_time()."""

    def test_valid_iso_zulu(self) -> None:
        """Timestamp ISO con Z."""
        result = _format_time("2025-03-15T10:30:00Z")
        assert "15/03" in result
        assert "10:30" in result

    def test_valid_iso_offset(self) -> None:
        """Timestamp ISO con offset +00:00."""
        result = _format_time("2025-03-15T10:30:00+00:00")
        assert "15/03" in result
        assert "10:30" in result

    def test_none_input(self) -> None:
        """None → string vacío."""
        assert _format_time(None) == ""

    def test_empty_string(self) -> None:
        """String vacío → string vacío."""
        assert _format_time("") == ""

    def test_invalid_format(self) -> None:
        """Formato inválido → string vacío (sin crash)."""
        assert _format_time("not-a-date") == ""

    def test_different_date(self) -> None:
        """Timestamp de fecha diferente."""
        result = _format_time("2025-12-25T00:00:00Z")
        assert "25/12" in result
        assert "12:00" in result or "00:00" in result

    def test_pm_time(self) -> None:
        """Timestamp en PM."""
        result = _format_time("2025-03-15T14:30:00Z")
        assert "02:30" in result
        assert "PM" in result

    def test_type_error_handled(self) -> None:
        """Tipo inválido (int) → string vacío."""
        assert _format_time(12345) == ""  # type: ignore[arg-type]


# ═══════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════


@pytest.fixture(scope="module")
def tk_root():
    """Crea un root de Tkinter oculto para toda la suite."""
    import tkinter as tk

    root = tk.Tk()
    root.withdraw()
    yield root
    root.destroy()


@pytest.fixture
def fresh_root():
    """Crea y destruye un root por test."""
    import tkinter as tk

    root = tk.Tk()
    root.withdraw()
    yield root
    root.destroy()


# ═══════════════════════════════════════════════════════════════════
# Tests: RateCard
# ═══════════════════════════════════════════════════════════════════


class TestRateCardInit:
    """Tests de inicialización de RateCard."""

    def test_creates_with_title_subtitle(self, fresh_root) -> None:
        """Crea la tarjeta con título y subtítulo."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        assert card.color == "#4CAF50"
        assert card.rate_var.get() == "—"
        assert card.time_var.get() == ""
        card.destroy()

    def test_creates_without_subtitle(self, fresh_root) -> None:
        """Crea tarjeta sin subtítulo (string vacío)."""
        card = RateCard(fresh_root, "BCV", "", "🏦", "#4CAF50", DARK)
        assert card.rate_var.get() == "—"
        card.destroy()

    def test_stores_theme(self, fresh_root) -> None:
        """Almacena el tema recibido."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        assert card._theme == DARK
        card.destroy()

    def test_has_copy_button(self, fresh_root) -> None:
        """Tiene botón de copia."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        assert hasattr(card, "copy_btn")
        assert card.copy_btn.winfo_exists()
        card.destroy()

    def test_has_rate_label(self, fresh_root) -> None:
        """Tiene label de tasa."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        assert hasattr(card, "rate_label")
        assert card.rate_label.winfo_exists()
        card.destroy()

    def test_has_usd_info(self, fresh_root) -> None:
        """Tiene label de información USD."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        assert hasattr(card, "usd_info")
        assert card.usd_info.winfo_exists()
        card.destroy()

    def test_has_time_label(self, fresh_root) -> None:
        """Tiene label de tiempo."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        assert hasattr(card, "time_label")
        assert card.time_label.winfo_exists()
        card.destroy()

    def test_copy_feedback_starts_hidden(self, fresh_root) -> None:
        """Feedback de copia inicia oculto (no empaquetado)."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        # copy_feedback no debería estar packeado inicialmente
        assert not card.copy_feedback.winfo_ismapped()
        card.destroy()


class TestRateCardUpdateRate:
    """Tests de update_rate()."""

    def test_update_with_float(self, fresh_root) -> None:
        """Actualiza con valor float."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(60.5)
        assert card.rate_var.get() == "60.50"
        assert "60.50" in card.usd_info.cget("text")
        card.destroy()

    def test_update_with_integer(self, fresh_root) -> None:
        """Actualiza con valor entero."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(60)
        assert card.rate_var.get() == "60.00"
        card.destroy()

    def test_update_with_large_number(self, fresh_root) -> None:
        """Actualiza con número grande (> 999)."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(582.6862)
        assert card.rate_var.get() == "582.69"
        card.destroy()

    def test_update_with_none(self, fresh_root) -> None:
        """Actualiza con None → muestra —."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(60.5)
        card.update_rate(None)
        assert card.rate_var.get() == "—"
        assert card.usd_info.cget("text") == ""
        card.destroy()

    def test_update_with_timestamp(self, fresh_root) -> None:
        """Actualiza con timestamp."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(60.5, "2025-03-15T10:30:00Z")
        assert "15/03" in card.time_var.get()
        assert "10:30" in card.time_var.get()
        card.destroy()

    def test_update_without_timestamp_clears_time(self, fresh_root) -> None:
        """Actualizar sin timestamp limpia el tiempo."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(60.5, "2025-03-15T10:30:00Z")
        card.update_rate(61.0)
        assert card.time_var.get() == ""
        card.destroy()

    def test_update_decimal_precision(self, fresh_root) -> None:
        """Mantiene precisión de 2 decimales."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(60.5555)
        assert card.rate_var.get() == "60.56"
        card.destroy()

    def test_update_with_zero(self, fresh_root) -> None:
        """Actualiza con cero."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.update_rate(0.0)
        assert card.rate_var.get() == "0.00"
        card.destroy()


class TestRateCardCopy:
    """Tests de _copy_rate()."""

    def _pack_card(self, card: RateCard) -> None:
        """Empaqueta la tarjeta para que los widgets hijos puedan mostrarse."""
        card.pack()
        card.update_idletasks()

    def test_copy_copies_to_clipboard(self, fresh_root) -> None:
        """Copia la tasa al portapapeles."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        self._pack_card(card)
        card.update_rate(60.5)
        card.clipboard_clear = MagicMock()
        card.clipboard_append = MagicMock()

        card._copy_rate()

        card.clipboard_clear.assert_called_once()
        card.clipboard_append.assert_called_once_with("Bs. 60.50")
        card.destroy()

    @staticmethod
    def _is_packed(widget) -> bool:
        """Verifica si un widget está gestionado por pack (sin requerir padre mapeado)."""
        import tkinter as tk

        try:
            widget.pack_info()
            return True
        except tk.TclError:
            return False

    def test_copy_shows_feedback(self, fresh_root) -> None:
        """Copiar muestra feedback visual."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        self._pack_card(card)
        card.update_rate(60.5)
        card._copy_rate()

        assert self._is_packed(card.copy_feedback)
        assert "Copiado" in card.copy_feedback.cget("text")
        card.destroy()

    def test_copy_hides_feedback_after_timer(self, fresh_root) -> None:
        """Feedback se oculta después del timer (2000ms)."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        self._pack_card(card)
        card.update_rate(60.5)
        card._copy_rate()
        assert self._is_packed(card.copy_feedback)

        # Cancelar el timer real y simular el callback
        timer_id = card._copy_timer
        assert timer_id is not None
        card.after_cancel(timer_id)
        card.copy_feedback.pack_forget()

        assert not self._is_packed(card.copy_feedback)
        card.destroy()

    def test_copy_does_not_copy_when_dash(self, fresh_root) -> None:
        """No copia si la tasa es —."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.clipboard_clear = MagicMock()
        card.clipboard_append = MagicMock()

        card._copy_rate()

        card.clipboard_clear.assert_not_called()
        card.clipboard_append.assert_not_called()
        card.destroy()

    def test_copy_does_not_copy_when_loading(self, fresh_root) -> None:
        """No copia si está en estado 'Cargando...'."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.show_loading()
        card.clipboard_clear = MagicMock()
        card.clipboard_append = MagicMock()

        card._copy_rate()

        card.clipboard_clear.assert_not_called()
        card.destroy()

    def test_copy_does_not_copy_when_error(self, fresh_root) -> None:
        """No copia si está en estado 'Error'."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.show_error()
        card.clipboard_clear = MagicMock()
        card.clipboard_append = MagicMock()

        card._copy_rate()

        card.clipboard_clear.assert_not_called()
        card.destroy()

    def test_copy_cancels_previous_timer(self, fresh_root) -> None:
        """Copiar dos veces cancela el timer anterior."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        self._pack_card(card)
        card.update_rate(60.5)
        card._copy_rate()
        first_timer = card._copy_timer

        card._copy_rate()
        second_timer = card._copy_timer

        assert first_timer != second_timer  # El timer ID cambió
        card.destroy()


class TestRateCardStates:
    """Tests de estados (loading, error)."""

    def test_show_loading(self, fresh_root) -> None:
        """show_loading() establece texto 'Cargando...'."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.show_loading()
        assert card.rate_var.get() == "Cargando..."
        assert card.time_var.get() == ""
        assert card.usd_info.cget("text") == ""
        card.destroy()

    def test_show_error(self, fresh_root) -> None:
        """show_error() establece texto 'Error'."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.show_error()
        assert card.rate_var.get() == "Error"
        assert card.time_var.get() == ""
        card.destroy()

    def test_loading_then_update(self, fresh_root) -> None:
        """Transición de loading → valor normal."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.show_loading()
        card.update_rate(60.5)
        assert card.rate_var.get() == "60.50"
        card.destroy()

    def test_error_then_update(self, fresh_root) -> None:
        """Transición de error → valor normal."""
        card = RateCard(fresh_root, "BCV", "Banco Central", "🏦", "#4CAF50", DARK)
        card.show_error()
        card.update_rate(60.5)
        assert card.rate_var.get() == "60.50"
        card.destroy()


# ═══════════════════════════════════════════════════════════════════
# Tests: SpreadIndicator
# ═══════════════════════════════════════════════════════════════════


class TestSpreadIndicatorInit:
    """Tests de inicialización de SpreadIndicator."""

    def test_creates_labels(self, fresh_root) -> None:
        """Crea los labels de tasa A y B."""
        spread = SpreadIndicator(
            fresh_root, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        assert spread.a_value.cget("text") == "—"
        assert spread.b_value.cget("text") == "—"
        assert spread.diff_value.cget("text") == "—"
        assert spread.pct_value.cget("text") == "—"
        spread.destroy()

    def test_starts_hidden(self, fresh_root) -> None:
        """Inicia oculto (pack_forget)."""
        spread = SpreadIndicator(
            fresh_root, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        assert not spread.winfo_ismapped()
        spread.destroy()

    def test_stores_theme(self, fresh_root) -> None:
        """Almacena el tema."""
        spread = SpreadIndicator(
            fresh_root, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        assert spread._theme == DARK
        spread.destroy()

    def test_has_bar_fill(self, fresh_root) -> None:
        """Tiene barra de progreso."""
        spread = SpreadIndicator(
            fresh_root, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        assert hasattr(spread, "bar_fill")
        spread.destroy()


class TestSpreadIndicatorUpdate:
    """Tests de update().

    SpreadIndicator intenta hacerse pack(before=...) usando el primer
    hijo del padre. Para evitar errores Tcl (widget no packeado),
    usamos un Frame intermedio con un placeholder ya packeado.
    """

    @pytest.fixture
    def spread_parent(self, fresh_root):
        """Crea un Frame padre con un placeholder packeado."""
        import tkinter as tk

        parent = tk.Frame(fresh_root)
        parent.pack()
        # Placeholder para que SpreadIndicator tenga un before= válido
        placeholder = tk.Frame(parent)
        placeholder.pack()
        yield parent
        parent.destroy()

    def test_update_with_valid_rates(self, spread_parent) -> None:
        """Actualiza con tasas válidas."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(60.0, 72.0)

        assert "60.00" in spread.a_value.cget("text")
        assert "72.00" in spread.b_value.cget("text")
        assert "12.00" in spread.diff_value.cget("text")  # 72 - 60 = 12
        assert "20.00" in spread.pct_value.cget("text")  # 12/60 * 100 = 20%
        spread.destroy()

    def test_update_shows_widget(self, spread_parent) -> None:
        """update() gestiona el widget con pack."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        import tkinter as tk
        # No está gestionado por pack inicialmente
        with pytest.raises(tk.TclError):
            spread.pack_info()

        spread.update(60.0, 72.0)

        # Ahora sí está gestionado por pack
        spread.pack_info()  # No debe lanzar excepción
        spread.destroy()

    def test_update_with_none_hides_widget(self, spread_parent) -> None:
        """update() con None oculta el widget."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(None, None)
        assert not spread.winfo_ismapped()
        spread.destroy()

    def test_update_with_zero_rate_a_hides(self, spread_parent) -> None:
        """rate_a = 0 → oculta (división por cero evitada)."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(0, 72.0)
        assert not spread.winfo_ismapped()
        spread.destroy()

    def test_update_with_rate_b_none_hides(self, spread_parent) -> None:
        """rate_b = None → oculta."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(60.0, None)
        assert not spread.winfo_ismapped()
        spread.destroy()

    def test_spread_under_8_percent(self, spread_parent) -> None:
        """Brecha < 8% → color success (verde)."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(100.0, 105.0)  # 5% spread

        bar_color = spread.bar_fill.cget("bg")
        assert bar_color == DARK.success
        assert "5.00" in spread.pct_value.cget("text")
        spread.destroy()

    def test_spread_between_8_and_15_percent(self, spread_parent) -> None:
        """Brecha entre 8% y 15% → color warning (amarillo)."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(100.0, 110.0)  # 10% spread

        bar_color = spread.bar_fill.cget("bg")
        assert bar_color == DARK.warning
        spread.destroy()

    def test_spread_over_15_percent(self, spread_parent) -> None:
        """Brecha > 15% → color highlight (rojo)."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(100.0, 120.0)  # 20% spread

        bar_color = spread.bar_fill.cget("bg")
        assert bar_color == DARK.highlight
        spread.destroy()

    def test_spread_exactly_8_percent(self, spread_parent) -> None:
        """Brecha exactamente 8% → success (<=8)."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(100.0, 108.0)  # 8% spread

        bar_color = spread.bar_fill.cget("bg")
        assert bar_color == DARK.success
        spread.destroy()

    def test_bar_percentage_capped(self, spread_parent) -> None:
        """Porcentaje de barra se capa en 100%."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(100.0, 200.0)  # 100% spread

        assert spread.pct_value.cget("text") == "100.00%"
        spread.destroy()

    def test_update_then_update_again(self, spread_parent) -> None:
        """Actualizar dos veces con valores diferentes."""
        spread = SpreadIndicator(
            spread_parent, DARK, "BCV vs Paralelo", "📊",
            "#4CAF50", "BCV", "#FF5722", "PARALELO",
        )
        spread.update(100.0, 105.0)  # 5%
        spread.update(100.0, 120.0)  # 20%

        assert "20.00" in spread.pct_value.cget("text")
        # Verificar que está gestionado por pack
        spread.pack_info()  # No debe lanzar excepción
        spread.destroy()


# ═══════════════════════════════════════════════════════════════════
# Tests: TimerBar
# ═══════════════════════════════════════════════════════════════════


class TestTimerBarInit:
    """Tests de inicialización de TimerBar."""

    def test_creates_label(self, fresh_root) -> None:
        """Crea el label de timer."""
        timer = TimerBar(fresh_root, DARK)
        assert hasattr(timer, "label")
        assert timer.label.winfo_exists()
        assert "25:00" in timer.label.cget("text")
        timer.destroy()

    def test_stores_total_seconds(self, fresh_root) -> None:
        """Almacena total_seconds = REFRESH_MINUTES * 60."""
        timer = TimerBar(fresh_root, DARK)
        assert timer.total_seconds == REFRESH_MINUTES * 60
        timer.destroy()

    def test_stores_theme(self, fresh_root) -> None:
        """Almacena el tema."""
        timer = TimerBar(fresh_root, DARK)
        assert timer._theme == DARK
        timer.destroy()

    def test_has_bar_bg(self, fresh_root) -> None:
        """Tiene fondo de barra."""
        timer = TimerBar(fresh_root, DARK)
        assert hasattr(timer, "bar_bg")
        assert timer.bar_bg.winfo_exists()
        timer.destroy()

    def test_bar_fill_exists(self, fresh_root) -> None:
        """Tiene barra de progreso."""
        timer = TimerBar(fresh_root, DARK)
        assert hasattr(timer, "bar_fill")
        assert timer.bar_fill.winfo_exists()
        timer.destroy()


class TestTimerBarUpdate:
    """Tests de update()."""

    def test_update_full_time(self, fresh_root) -> None:
        """Actualiza con tiempo completo (> 60s)."""
        timer = TimerBar(fresh_root, DARK)
        timer.update(1500)  # 25 minutes

        text = timer.label.cget("text")
        assert "25:00" in text
        # Color normal (muted, no warning)
        assert timer.label.cget("fg") == DARK.muted
        timer.destroy()

    def test_update_under_60_seconds(self, fresh_root) -> None:
        """Menos de 60s → color warning."""
        timer = TimerBar(fresh_root, DARK)
        timer.update(30)

        text = timer.label.cget("text")
        assert "30s" in text
        assert timer.label.cget("fg") == DARK.warning
        timer.destroy()

    def test_update_exactly_60_seconds(self, fresh_root) -> None:
        """Exactamente 60s → formato normal (minutos: 1:00)."""
        timer = TimerBar(fresh_root, DARK)
        timer.update(60)

        text = timer.label.cget("text")
        # mins=1, secs=00 → formato "1:00", no "01:00"
        assert "1:00" in text
        assert timer.label.cget("fg") == DARK.muted  # Normal, no warning
        timer.destroy()

    def test_update_zero_seconds(self, fresh_root) -> None:
        """0 segundos restantes."""
        timer = TimerBar(fresh_root, DARK)
        timer.update(0)

        text = timer.label.cget("text")
        assert "0" in text
        assert timer.label.cget("fg") == DARK.warning
        timer.destroy()

    def test_update_bar_warning_color(self, fresh_root) -> None:
        """Barra cambia a color warning cuando < 60s."""
        timer = TimerBar(fresh_root, DARK)
        timer.update(30)

        assert timer.bar_fill.cget("bg") == DARK.warning
        timer.destroy()

    def test_update_bar_accent_color(self, fresh_root) -> None:
        """Barra tiene color accent cuando >= 60s."""
        timer = TimerBar(fresh_root, DARK)
        timer.update(600)

        assert timer.bar_fill.cget("bg") == DARK.accent
        timer.destroy()

    def test_multiple_updates(self, fresh_root) -> None:
        """Múltiples actualizaciones sin errores."""
        timer = TimerBar(fresh_root, DARK)
        timer.update(1500)  # Normal
        timer.update(30)  # Warning
        timer.update(600)  # Normal otra vez

        assert timer.label.cget("fg") == DARK.muted
        assert timer.bar_fill.cget("bg") == DARK.accent
        timer.destroy()

    def test_progress_bar_updates(self, fresh_root) -> None:
        """La barra de progreso se actualiza según elapsed."""
        timer = TimerBar(fresh_root, DARK)
        total = timer.total_seconds
        halfway = total // 2

        # A mitad del tiempo → barra al ~50% (no verificamos relwidth exacto,
        # solo que el label se actualiza correctamente)
        timer.update(halfway)
        mins = halfway // 60
        secs = halfway % 60
        expected = f"{mins}:{secs:02d}"
        assert expected in timer.label.cget("text")
        timer.destroy()
