"""Tests para el módulo principal TasaDelDiaApp (app.py).

Estrategia: Parcheamos __init__ para evitar construir la UI completa,
y configuramos manualmente los atributos necesarios para cada test.
Usamos Tkinter real oculto para self.window.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.theme import DARK, LIGHT


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


def _make_app(tk_root):
    """Crea una instancia de TasaDelDiaApp con __init__ parcheado
    y los atributos mínimos configurados.

    Returns:
        (app, patcher) donde patcher debe restaurarse con patcher.stop()
    """
    from app.app import TasaDelDiaApp

    # Parchear __init__ para que no haga nada
    patcher = patch.object(TasaDelDiaApp, "__init__", return_value=None)
    patcher.start()

    app = TasaDelDiaApp()
    app.window = tk_root

    # ─── Atributos de estado básicos ───
    from concurrent.futures import ThreadPoolExecutor
    app._executor = ThreadPoolExecutor(max_workers=2)
    app.offline_mode = False
    app.cached_rates = None
    app.theme_mode = "dark"
    app.actual_theme = DARK
    app.rates = {}
    app.converter_rates = {}
    app.is_loading = False
    app._refresh_timer = None
    app._theme_poll_timer = None
    app._countdown = 1500  # 25 min
    app._countdown_timer = None
    app._brecha_notified = False
    app._active_dialog = None
    app.bcv_lunes = None
    app.bcv_lunes_updated_at = None
    app._widget_enabled = False
    app.reminder_enabled = False
    app._reminder_shown_this_friday = False
    app._reminder_timer = None
    app._rebuild_offline_mode = False

    # ─── Widget ───
    app.widget = None

    # ─── Timers ───
    app._refresh_timer = None
    app._theme_poll_timer = None
    app._countdown_timer = None
    app._reminder_timer = None
    app._result_copy_timer = None
    app._hist_copy_timer = None

    # ─── Historial ───
    app._hist_selected_date = None
    app._hist_copied_field = None
    app._hist_copy_timer = None

    # ─── Spy helpers (se sobreescriben en tests específicos cuando sea necesario) ───
    app._update_history_tab = MagicMock()
    app._update_conv_rate_labels = MagicMock()
    app._update_converter_spreads = MagicMock()

    return app, patcher


@pytest.fixture
def app(tk_root):
    """Fixture que crea y destruye la app para cada test."""
    _app, patcher = _make_app(tk_root)
    yield _app
    patcher.stop()


def _setup_rate_cards(app):
    """Configura mocks para rate cards."""
    app.card_bcv = MagicMock()
    app.card_parallel = MagicMock()
    app.card_eur = MagicMock()
    app.card_binance = MagicMock()
    app.card_lunes = MagicMock()
    app.spread_indicator = MagicMock()
    app.spread_lunes = MagicMock()
    app.info_label = MagicMock()
    app.timer_bar = MagicMock()
    # do_conversion() se llama al final de _on_rates_loaded,
    # mockeamos para que no intente acceder a widgets del conversor
    app.do_conversion = MagicMock()


def _setup_converter(app, tk_root):
    """Configura los atributos del conversor para tests."""
    import tkinter as tk

    app.rate_var_conv = tk.StringVar(value="bcv")
    app.conv_mode = tk.StringVar(value="usd_to_bs")
    app.amount_entry = tk.Entry(tk_root)
    app.amount_entry.insert(0, "100")

    app.btn_usd = MagicMock()
    app.btn_bs = MagicMock()

    app.result_from = MagicMock()
    app.result_to = MagicMock()
    app.result_info = MagicMock()
    app.result_copy_feedback = MagicMock()
    app._result_copy_timer = None

    app.converter_rates = {
        "bcv": 60.5,
        "parallel": 72.3,
        "binance_p2p": 70.0,
        "eur": 65.1,
        "bcv_lunes": None,
    }
    app.bcv_lunes = None


# ═══════════════════════════════════════════════════════════════════
# Tests: helpers
# ═══════════════════════════════════════════════════════════════════


class TestThemeLabel:
    """Tests de _theme_label()."""

    def test_theme_label_dark(self, app) -> None:
        """Modo dark."""
        app.theme_mode = "dark"
        assert "Oscuro" in app._theme_label()

    def test_theme_label_light(self, app) -> None:
        """Modo light."""
        app.theme_mode = "light"
        assert "Claro" in app._theme_label()

    def test_theme_label_system(self, app) -> None:
        """Modo system."""
        app.theme_mode = "system"
        assert "Sistema" in app._theme_label()

    def test_theme_label_unknown_fallback(self, app) -> None:
        """Modo desconocido → fallback."""
        app.theme_mode = "unknown"
        assert "🌙" in app._theme_label()


class TestBlendBg:
    """Tests de _blend_bg()."""

    def test_blend_with_dark_bg(self, app) -> None:
        """Mezcla con fondo oscuro de la app."""
        result = app._blend_bg("#ff0000", 0.5)
        # Fondo oscuro: #07070d → rgb(7, 7, 13)
        # r = int(255*0.5 + 7*0.5) = 131 = 0x83
        # g = int(0*0.5 + 7*0.5) = 3 = 0x03
        # b = int(0*0.5 + 13*0.5) = 6 = 0x06
        assert result == "#830306"

    def test_blend_full_alpha(self, app) -> None:
        """Alpha=1.0 → color original."""
        result = app._blend_bg("#ff0000", 1.0)
        assert result == "#ff0000"

    def test_blend_zero_alpha(self, app) -> None:
        """Alpha=0.0 → color de fondo."""
        result = app._blend_bg("#ff0000", 0.0)
        assert result == DARK.bg

    def test_blend_invalid_color(self, app) -> None:
        """Color inválido → retorna sin cambios."""
        result = app._blend_bg("invalid", 0.5)
        assert result == "invalid"

    def test_blend_with_light_theme(self, app) -> None:
        """Mezcla con tema claro."""
        app.actual_theme = LIGHT
        result = app._blend_bg("#ff0000", 0.5)
        # Fondo claro: #f4f6fa → rgb(244, 246, 250)
        # r = int(255*0.5 + 244*0.5) = 249 = 0xf9
        # g = int(0*0.5 + 246*0.5) = 123 = 0x7b
        # b = int(0*0.5 + 250*0.5) = 125 = 0x7d
        assert result == "#f97b7d"


class TestCancelTimers:
    """Tests de _cancel_timers()."""

    def test_cancel_all_timers(self, app) -> None:
        """Cancela todos los timers activos."""
        app.window.after_cancel = MagicMock()
        app._refresh_timer = "timer1"
        app._theme_poll_timer = "timer2"
        app._countdown_timer = "timer3"
        app._reminder_timer = "timer4"

        app._cancel_timers()

        assert app.window.after_cancel.call_count == 4

    def test_cancel_with_none_timers(self, app) -> None:
        """Sin timers activos, no lanza error."""
        app.window.after_cancel = MagicMock()
        for attr in ["_refresh_timer", "_theme_poll_timer",
                     "_countdown_timer", "_reminder_timer"]:
            setattr(app, attr, None)

        app._cancel_timers()

        app.window.after_cancel.assert_not_called()

    def test_cancel_with_exception(self, app) -> None:
        """Error al cancelar no propaga excepción."""
        app.window.after_cancel = MagicMock(side_effect=ValueError("bad timer"))
        app._refresh_timer = "timer1"
        app._theme_poll_timer = "timer2"
        app._countdown_timer = "timer3"
        app._reminder_timer = "timer4"

        app._cancel_timers()  # No debe lanzar

    def test_cancel_partial_timers(self, app) -> None:
        """Solo cancela los timers que existen."""
        app.window.after_cancel = MagicMock()
        app._refresh_timer = "timer1"
        app._theme_poll_timer = None
        app._countdown_timer = "timer3"
        app._reminder_timer = None

        app._cancel_timers()

        assert app.window.after_cancel.call_count == 2


class TestCloseActiveDialog:
    """Tests de _close_active_dialog()."""

    def test_close_existing_dialog(self, app) -> None:
        """Cierra el diálogo activo si existe."""
        mock_dialog = MagicMock()
        mock_dialog.winfo_exists.return_value = True
        app._active_dialog = mock_dialog

        app._close_active_dialog()

        mock_dialog.destroy.assert_called_once()
        assert app._active_dialog is None

    def test_close_no_dialog(self, app) -> None:
        """Sin diálogo activo, no hace nada."""
        app._active_dialog = None
        app._close_active_dialog()

    def test_close_destroyed_dialog(self, app) -> None:
        """Diálogo que ya fue destruido."""
        mock_dialog = MagicMock()
        mock_dialog.winfo_exists.return_value = False
        app._active_dialog = mock_dialog

        app._close_active_dialog()

        mock_dialog.destroy.assert_not_called()


# ═══════════════════════════════════════════════════════════════════
# Tests: Conversion
# ═══════════════════════════════════════════════════════════════════


class TestDoConversion:
    """Tests de do_conversion().

    En esta clase, do_conversion() es el método REAL (no mockeado),
    por lo que necesitamos todos los widgets del conversor configurados.
    """

    def test_usd_to_bs(self, app, tk_root) -> None:
        """USD → Bs con tasa BCV."""
        _setup_converter(app, tk_root)
        app.do_conversion()

        app.result_from.config.assert_called_with(text="$100.00 USD")
        app.result_to.config.assert_called_with(text="Bs. 6,050.00")
        app.result_info.config.assert_called_with(text="Tasa: 1 USD = Bs. 60.50")

    def test_bs_to_usd(self, app, tk_root) -> None:
        """Bs → USD con tasa Paralelo."""
        _setup_converter(app, tk_root)
        app.conv_mode.set("bs_to_usd")
        app.rate_var_conv.set("parallel")

        app.do_conversion()

        app.result_from.config.assert_called_with(text="Bs. 100.00")
        app.result_to.config.assert_called_with(text="$1.38 USD")
        app.result_info.config.assert_called_with(text="Tasa: Bs. 72.30 = 1 USD")

    def test_rate_not_available(self, app, tk_root) -> None:
        """Tasa no disponible → mensaje de error."""
        _setup_converter(app, tk_root)
        app.rate_var_conv.set("bcv_lunes")
        app.bcv_lunes = None

        app.do_conversion()

        app.result_to.config.assert_called_with(text="Tasa no disponible")

    def test_invalid_amount(self, app, tk_root) -> None:
        """Monto inválido → mensaje de error."""
        _setup_converter(app, tk_root)
        app.amount_entry.delete(0, "end")
        app.amount_entry.insert(0, "abc")

        app.do_conversion()

        app.result_to.config.assert_called_with(text="Monto inválido")

    def test_empty_amount(self, app, tk_root) -> None:
        """Monto vacío → no hace nada."""
        _setup_converter(app, tk_root)
        app.amount_entry.delete(0, "end")
        app.result_from.config.reset_mock()
        app.result_to.config.reset_mock()

        app.do_conversion()

        app.result_from.config.assert_not_called()
        app.result_to.config.assert_not_called()

    def test_zero_amount(self, app, tk_root) -> None:
        """Monto cero → no hace nada."""
        _setup_converter(app, tk_root)
        app.amount_entry.delete(0, "end")
        app.amount_entry.insert(0, "0")
        app.result_from.config.reset_mock()
        app.result_to.config.reset_mock()

        app.do_conversion()

        app.result_from.config.assert_not_called()
        app.result_to.config.assert_not_called()

    def test_negative_amount(self, app, tk_root) -> None:
        """Monto negativo → no hace nada."""
        _setup_converter(app, tk_root)
        app.amount_entry.delete(0, "end")
        app.amount_entry.insert(0, "-50")
        app.result_from.config.reset_mock()
        app.result_to.config.reset_mock()

        app.do_conversion()

        app.result_from.config.assert_not_called()
        app.result_to.config.assert_not_called()

    def test_usd_to_bs_with_bcv_lunes(self, app, tk_root) -> None:
        """USD → Bs usando tasa BCV Lunes."""
        _setup_converter(app, tk_root)
        app.rate_var_conv.set("bcv_lunes")
        app.bcv_lunes = 58.5

        app.do_conversion()

        app.result_from.config.assert_called_with(text="$100.00 USD")
        app.result_to.config.assert_called_with(text="Bs. 5,850.00")

    def test_bs_to_usd_with_euro(self, app, tk_root) -> None:
        """Bs → USD usando tasa Euro."""
        _setup_converter(app, tk_root)
        app.conv_mode.set("bs_to_usd")
        app.rate_var_conv.set("eur")

        app.do_conversion()

        app.result_to.config.assert_called_with(text="$1.54 USD")

    def test_uses_comma_as_decimal(self, app, tk_root) -> None:
        """Monto con coma decimal se convierte a punto."""
        _setup_converter(app, tk_root)
        app.amount_entry.delete(0, "end")
        app.amount_entry.insert(0, "100,50")

        app.do_conversion()

        # 100.50 * 60.5 = 6080.25
        app.result_to.config.assert_called_with(text="Bs. 6,080.25")


class TestSetMode:
    """Tests de _set_mode()."""

    def test_set_usd_to_bs(self, app, tk_root) -> None:
        """Cambia a modo USD → Bs."""
        _setup_converter(app, tk_root)
        app.do_conversion = MagicMock()

        app._set_mode("usd_to_bs")

        assert app.conv_mode.get() == "usd_to_bs"
        app.do_conversion.assert_called_once()

    def test_set_bs_to_usd(self, app, tk_root) -> None:
        """Cambia a modo Bs → USD."""
        _setup_converter(app, tk_root)
        app.do_conversion = MagicMock()

        app._set_mode("bs_to_usd")

        assert app.conv_mode.get() == "bs_to_usd"
        app.do_conversion.assert_called_once()


class TestSetQuickAmount:
    """Tests de _set_quick_amount()."""

    def test_set_quick_amount(self, app, tk_root) -> None:
        """Establece monto rápido y ejecuta conversión."""
        _setup_converter(app, tk_root)
        app.do_conversion = MagicMock()

        app._set_quick_amount(500)

        assert app.amount_entry.get() == "500"
        app.do_conversion.assert_called_once()

    def test_set_quick_amount_large(self, app, tk_root) -> None:
        """Monto rápido grande."""
        _setup_converter(app, tk_root)
        app.do_conversion = MagicMock()

        app._set_quick_amount(50000)

        assert app.amount_entry.get() == "50000"
        app.do_conversion.assert_called_once()


class TestPasteFromClipboard:
    """Tests de _paste_from_clipboard()."""

    def test_paste_numeric(self, app, tk_root) -> None:
        """Pega un número desde el portapapeles."""
        _setup_converter(app, tk_root)
        app.window.clipboard_get = MagicMock(return_value="2500")

        app._paste_from_clipboard()

        assert app.amount_entry.get() == "2500"

    def test_paste_with_commas(self, app, tk_root) -> None:
        """Pega un número con comas."""
        _setup_converter(app, tk_root)
        app.window.clipboard_get = MagicMock(return_value="1,500.50")

        app._paste_from_clipboard()

        assert app.amount_entry.get() == "1,500.50"

    def test_paste_with_text(self, app, tk_root) -> None:
        """Pega texto con número al inicio."""
        _setup_converter(app, tk_root)
        app.window.clipboard_get = MagicMock(return_value="2500 USD a Bs")

        app._paste_from_clipboard()

        assert app.amount_entry.get() == "2500"

    def test_paste_empty_clipboard(self, app, tk_root) -> None:
        """Portapapeles vacío no cambia el monto."""
        _setup_converter(app, tk_root)
        app.amount_entry.delete(0, "end")
        app.amount_entry.insert(0, "100")
        app.window.clipboard_get = MagicMock(return_value="")

        app._paste_from_clipboard()

        assert app.amount_entry.get() == "100"


# ═══════════════════════════════════════════════════════════════════
# Tests: Copy rates
# ═══════════════════════════════════════════════════════════════════


class TestCopyBcvRate:
    """Tests de _copy_bcv_rate()."""

    def test_copy_bcv_rate(self, app) -> None:
        """Copia la tasa BCV al portapapeles."""
        import tkinter as tk

        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()
        app.window.focus_get = MagicMock(return_value="not_an_entry")

        app.card_bcv = MagicMock()
        app.card_bcv.rate_var = tk.StringVar(value="60.50")

        app._copy_bcv_rate()

        app.window.clipboard_clear.assert_called_once()
        app.window.clipboard_append.assert_called_once_with("Bs. 60.50")

    def test_copy_bcv_rate_ignores_entry_focus(self, app) -> None:
        """No copia si el foco está en un Entry."""
        import customtkinter as ctk

        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()
        entry = MagicMock(spec=ctk.CTkEntry)
        app.window.focus_get = MagicMock(return_value=entry)
        app.card_bcv = MagicMock()
        app.card_bcv.rate_var = ctk.StringVar(value="60.50")

        app._copy_bcv_rate()

        app.window.clipboard_clear.assert_not_called()
        app.window.clipboard_append.assert_not_called()

    def test_copy_bcv_rate_dash(self, app) -> None:
        """No copia si la tasa es '—'."""
        import customtkinter as ctk

        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()
        app.window.focus_get = MagicMock(return_value="not_an_entry")
        app.card_bcv = MagicMock()
        app.card_bcv.rate_var = ctk.StringVar(value="—")

        app._copy_bcv_rate()

        app.window.clipboard_clear.assert_not_called()
        app.window.clipboard_append.assert_not_called()


class TestCopyAllRates:
    """Tests de _copy_all_rates()."""

    def test_copy_all_rates(self, app) -> None:
        """Copia todas las tasas disponibles."""
        import tkinter as tk

        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()

        def _make_card(val: str):
            c = MagicMock()
            c.rate_var = tk.StringVar(value=val)
            return c

        app.card_bcv = _make_card("60.50")
        app.card_parallel = _make_card("72.30")
        app.card_eur = _make_card("65.10")
        app.card_binance = _make_card("70.00")
        app.bcv_lunes = None

        app._copy_all_rates()

        text = app.window.clipboard_append.call_args[0][0]
        assert "BCV: Bs. 60.50" in text
        assert "Paralelo: Bs. 72.30" in text
        assert "Euro: Bs. 65.10" in text
        assert "Binance P2P: Bs. 70.00" in text

    def test_copy_all_rates_includes_bcv_lunes(self, app) -> None:
        """Incluye BCV Lunes si está disponible."""
        import tkinter as tk

        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()

        def _make_card(val: str):
            c = MagicMock()
            c.rate_var = tk.StringVar(value=val)
            return c

        app.card_bcv = _make_card("60.50")
        app.card_parallel = _make_card("72.30")
        app.card_eur = _make_card("65.10")
        app.card_binance = _make_card("70.00")
        app.bcv_lunes = 58.5

        app._copy_all_rates()

        text = app.window.clipboard_append.call_args[0][0]
        assert "BCV Lunes: Bs. 58.50" in text

    def test_copy_all_rates_no_data(self, app) -> None:
        """Sin datos, no copia nada."""
        import tkinter as tk

        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()

        def _make_card(val: str):
            c = MagicMock()
            c.rate_var = tk.StringVar(value=val)
            return c

        app.card_bcv = _make_card("—")
        app.card_parallel = _make_card("—")
        app.card_eur = _make_card("—")
        app.card_binance = _make_card("—")
        app.bcv_lunes = None

        app._copy_all_rates()

        app.window.clipboard_clear.assert_not_called()
        app.window.clipboard_append.assert_not_called()


class TestShowToast:
    """Tests de _show_toast()."""

    def test_show_toast_creates_toplevel(self, app) -> None:
        """Crea un Toplevel temporal con mensaje."""
        app._show_toast("Título", "Mensaje de prueba")
        assert app.window.winfo_exists()


# ═══════════════════════════════════════════════════════════════════
# Tests: Widget
# ═══════════════════════════════════════════════════════════════════


@patch("app.app.WidgetWindow")
class TestWidgetManagement:
    """Tests de gestión del widget compacto."""

    def test_toggle_widget_creates_and_toggles(
        self, mock_widget_cls, app
    ) -> None:
        """_toggle_widget crea WidgetWindow si no existe."""
        mock_widget = MagicMock()
        mock_widget.is_visible = True
        mock_widget_cls.return_value = mock_widget

        app._toggle_widget()

        mock_widget_cls.assert_called_once_with(app, DARK)
        mock_widget.toggle.assert_called_once()

    def test_toggle_widget_applies_existing_rates(
        self, mock_widget_cls, app
    ) -> None:
        """Al mostrar widget con tasas existentes, las aplica."""
        mock_widget = MagicMock()
        mock_widget.is_visible = False  # Empieza oculto
        # Al hacer toggle, cambia a visible
        def _toggle_side():
            mock_widget.is_visible = not mock_widget.is_visible
        mock_widget.toggle.side_effect = _toggle_side
        mock_widget_cls.return_value = mock_widget

        app.rates = {"bcv": 60.5, "parallel": 72.3, "fetched_at": "2025-03-15T10:00:00Z"}
        app._update_widget_rates = MagicMock()

        app._toggle_widget()

        app._update_widget_rates.assert_called_once_with(60.5, 72.3, "2025-03-15T10:00:00Z")

    @patch("app.app.save_config")
    def test_toggle_widget_saves_config(
        self, mock_save, mock_widget_cls, app
    ) -> None:
        """Toggle widget guarda estado en config."""
        mock_widget = MagicMock()
        mock_widget.is_visible = True
        mock_widget_cls.return_value = mock_widget

        app._toggle_widget()

        mock_save.assert_called_once_with(widget_enabled=True)

    def test_hide_widget(self, mock_widget_cls, app) -> None:
        """_hide_widget oculta el widget."""
        mock_widget = MagicMock()
        app.widget = mock_widget

        app._hide_widget()

        mock_widget.hide.assert_called_once()

    def test_update_widget_rates_visible(
        self, mock_widget_cls, app
    ) -> None:
        """Actualiza tasas en widget visible."""
        mock_widget = MagicMock()
        mock_widget.is_visible = True
        app.widget = mock_widget

        app._update_widget_rates(60.5, 72.3, "2025-03-15T10:00:00Z")

        mock_widget.update_rates.assert_called_once_with(60.5, 72.3, "2025-03-15T10:00:00Z")

    def test_update_widget_rates_not_visible(
        self, mock_widget_cls, app
    ) -> None:
        """No actualiza widget si no es visible."""
        mock_widget = MagicMock()
        mock_widget.is_visible = False
        app.widget = mock_widget

        app._update_widget_rates(60.5, 72.3)

        mock_widget.update_rates.assert_not_called()

    def test_update_widget_rates_no_widget(
        self, mock_widget_cls, app
    ) -> None:
        """No lanza error si widget no existe."""
        app.widget = None
        app._update_widget_rates(60.5, 72.3)


# ═══════════════════════════════════════════════════════════════════
# Tests: Offline Mode
# ═══════════════════════════════════════════════════════════════════


class TestSetOfflineMode:
    """Tests de _set_offline_mode()."""

    def test_set_offline_with_timestamp(self, app) -> None:
        """Modo offline con timestamp muestra la hora."""
        app.actual_theme = DARK
        app.offline_banner = MagicMock()
        app.offline_banner.winfo_exists.return_value = True
        app.offline_label = MagicMock()
        app.info_label = MagicMock()
        parent = MagicMock()
        parent.winfo_exists.return_value = True
        app.info_label.master = MagicMock()
        app.info_label.master.master = parent

        app._set_offline_mode(True, "2025-03-15T10:30:00Z")

        text_arg = app.offline_label.configure.call_args[1]["text"]
        assert "Sin conexión" in text_arg
        assert "15/03" in text_arg

    def test_set_offline_without_timestamp(self, app) -> None:
        """Modo offline sin timestamp muestra mensaje simple."""
        app.actual_theme = DARK
        app.offline_banner = MagicMock()
        app.offline_banner.winfo_exists.return_value = True
        app.offline_label = MagicMock()
        app.info_label = MagicMock()
        parent = MagicMock()
        parent.winfo_exists.return_value = True
        app.info_label.master = MagicMock()
        app.info_label.master.master = parent

        app._set_offline_mode(True, "")

        text_arg = app.offline_label.configure.call_args[1]["text"]
        assert "Sin conexión" in text_arg
        assert "15/03" not in text_arg

    def test_set_online(self, app) -> None:
        """Desactivar modo offline oculta el banner."""
        app.actual_theme = DARK
        app.offline_banner = MagicMock()
        app.offline_banner.winfo_exists.return_value = True
        app.offline_label = MagicMock()
        app.info_label = MagicMock()

        app._set_offline_mode(False)

        app.offline_banner.pack_forget.assert_called_once()

    def test_set_offline_no_banner(self, app) -> None:
        """Sin banner, no lanza error."""
        app._set_offline_mode(True, "")


# ═══════════════════════════════════════════════════════════════════
# Tests: Reminder
# ═══════════════════════════════════════════════════════════════════


class TestWasEnteredToday:
    """Tests de _was_entered_today()."""

    def test_not_entered(self, app) -> None:
        """Sin bcv_lunes_updated_at → False."""
        app.bcv_lunes_updated_at = None
        assert app._was_entered_today() is False

    def test_invalid_date(self, app) -> None:
        """Fecha inválida → False (no crash)."""
        app.bcv_lunes_updated_at = "invalid-date"
        assert app._was_entered_today() is False

    def test_entered_today(self, app) -> None:
        """Ingresado hoy → True."""
        from datetime import datetime
        app.bcv_lunes_updated_at = datetime.now().isoformat()
        assert app._was_entered_today() is True

    def test_entered_yesterday(self, app) -> None:
        """Ingresado ayer → False."""
        from datetime import datetime, timedelta
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        app.bcv_lunes_updated_at = yesterday
        assert app._was_entered_today() is False


class TestToggleReminder:
    """Tests de _toggle_reminder()."""

    @patch("app.app.save_config")
    def test_enable_reminder(self, mock_save, app) -> None:
        """Activar recordatorio."""
        app.reminder_var = MagicMock()
        app.reminder_var.get.return_value = True

        app._toggle_reminder()

        assert app.reminder_enabled is True
        mock_save.assert_called_once_with(reminder_enabled=True)

    @patch("app.app.save_config")
    def test_disable_reminder(self, mock_save, app) -> None:
        """Desactivar recordatorio."""
        app.reminder_var = MagicMock()
        app.reminder_var.get.return_value = False

        app._toggle_reminder()

        assert app.reminder_enabled is False
        mock_save.assert_called_once_with(reminder_enabled=False)


# ═══════════════════════════════════════════════════════════════════
# Tests: History Tab
# ═══════════════════════════════════════════════════════════════════


class TestHistSelectDate:
    """Tests de _hist_select_date()."""

    def test_select_date(self, app) -> None:
        """Seleccionar fecha."""
        app._hist_select_date("2025-03-15")
        assert app._hist_selected_date == "2025-03-15"
        app._update_history_tab.assert_called_once()

    def test_deselect_date(self, app) -> None:
        """Deseleccionar la misma fecha."""
        app._hist_selected_date = "2025-03-15"
        app._hist_select_date("2025-03-15")
        assert app._hist_selected_date is None
        app._update_history_tab.assert_called_once()

    def test_select_different_date(self, app) -> None:
        """Cambiar de fecha."""
        app._hist_selected_date = "2025-03-14"
        app._hist_select_date("2025-03-15")
        assert app._hist_selected_date == "2025-03-15"
        app._update_history_tab.assert_called_once()


class TestHistCopyRate:
    """Tests de _hist_copy_rate()."""

    def test_copy_rate(self, app) -> None:
        """Copia una tasa individual."""
        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()

        app._hist_copy_rate("hist_bcv", "Bs. 60.50")

        app.window.clipboard_clear.assert_called_once()
        app.window.clipboard_append.assert_called_once_with("Bs. 60.50")
        assert app._hist_copied_field == "hist_bcv"
        app._update_history_tab.assert_called_once()

    def test_copy_cancels_previous_timer(self, app) -> None:
        """Copiar dos veces cancela el timer anterior."""
        app.window.clipboard_clear = MagicMock()
        app.window.clipboard_append = MagicMock()
        app.window.after_cancel = MagicMock()
        app.window.after = MagicMock(return_value="new_timer")
        app._hist_copy_timer = "old_timer"

        app._hist_copy_rate("hist_bcv", "Bs. 60.50")

        app.window.after_cancel.assert_called_once_with("old_timer")
        assert app._hist_copy_timer == "new_timer"


@patch("app.app.get_historical_rates")
@patch("app.app.format_date_key")
class TestHistCopyAll:
    """Tests de _hist_copy_all()."""

    def test_copy_all(self, mock_fmt, mock_hist, app) -> None:
        """Copia todas las tasas de la fecha seleccionada."""
        mock_fmt.return_value = "15/03/2025"
        mock_hist.return_value = {
            "2025-03-15": {
                "bcv": 60.5,
                "paralelo": 72.3,
                "binance_p2p": 70.0,
                "euro": 65.1,
            }
        }
        app._hist_selected_date = "2025-03-15"
        app._hist_copy_rate = MagicMock()

        app._hist_copy_all()

        text = app._hist_copy_rate.call_args[0][1]
        assert "15/03/2025" in text
        assert "BCV: Bs." in text
        assert "Paralelo: Bs." in text
        assert "Binance" in text
        assert "Euro" in text

    def test_copy_all_no_selection(self, mock_fmt, mock_hist, app) -> None:
        """Sin fecha seleccionada, no hace nada."""
        app._hist_selected_date = None
        app._hist_copy_rate = MagicMock()

        app._hist_copy_all()

        app._hist_copy_rate.assert_not_called()

    def test_copy_all_with_manual(self, mock_fmt, mock_hist, app) -> None:
        """Incluye indicador 'manual' si aplica."""
        mock_fmt.return_value = "15/03/2025"
        mock_hist.return_value = {
            "2025-03-15": {
                "bcv": 60.5,
                "paralelo": None,
                "binance_p2p": None,
                "euro": None,
                "manual": True,
            }
        }
        app._hist_selected_date = "2025-03-15"
        app._hist_copy_rate = MagicMock()

        app._hist_copy_all()

        text = app._hist_copy_rate.call_args[0][1]
        assert "Ingreso manual" in text


# ═══════════════════════════════════════════════════════════════════
# Tests: Check reminder
# ═══════════════════════════════════════════════════════════════════


class TestCheckReminder:
    """Tests de _check_reminder() con parche contextual de datetime."""

    def test_not_friday(self, app) -> None:
        """No es viernes → no muestra recordatorio."""
        with patch("app.app.datetime") as mock_dt:
            mock_now = MagicMock()
            mock_now.weekday.return_value = 2  # Wednesday
            mock_now.hour = 18
            mock_now.minute = 5
            mock_dt.now.return_value = mock_now

            app._show_reminder_popup = MagicMock()
            app._check_reminder()

            app._show_reminder_popup.assert_not_called()

    def test_friday_before_6pm(self, app) -> None:
        """Viernes antes de las 6 PM → no muestra."""
        with patch("app.app.datetime") as mock_dt:
            mock_now = MagicMock()
            mock_now.weekday.return_value = 4  # Friday
            mock_now.hour = 17
            mock_now.minute = 30
            mock_dt.now.return_value = mock_now

            app._show_reminder_popup = MagicMock()
            app._check_reminder()

            app._show_reminder_popup.assert_not_called()

    def test_friday_after_630pm(self, app) -> None:
        """Viernes después de las 6:30 PM → no muestra."""
        with patch("app.app.datetime") as mock_dt:
            mock_now = MagicMock()
            mock_now.weekday.return_value = 4  # Friday
            mock_now.hour = 19
            mock_now.minute = 0
            mock_dt.now.return_value = mock_now

            app._show_reminder_popup = MagicMock()
            app._check_reminder()

            app._show_reminder_popup.assert_not_called()

    def test_friday_at_6pm(self, app) -> None:
        """Viernes a las 6:05 PM → muestra recordatorio."""
        with patch("app.app.datetime") as mock_dt:
            mock_now = MagicMock()
            mock_now.weekday.return_value = 4  # Friday
            mock_now.hour = 18
            mock_now.minute = 5
            mock_dt.now.return_value = mock_now

            app._show_reminder_popup = MagicMock()
            app._was_entered_today = MagicMock(return_value=False)

            app._check_reminder()

            app._show_reminder_popup.assert_called_once_with(False)
            assert app._reminder_shown_this_friday is True


# ═══════════════════════════════════════════════════════════════════
# Tests: _on_rates_loaded
# ═══════════════════════════════════════════════════════════════════


class TestOnRatesLoaded:
    """Tests de _on_rates_loaded()."""

    def test_updates_cards_and_spreads(self, app) -> None:
        """Actualiza tarjetas y spreads con las tasas recibidas."""
        _setup_rate_cards(app)

        rates = {
            "bcv": 60.5,
            "parallel": 72.3,
            "eur": 65.1,
            "binance_p2p": 70.0,
            "fetched_at": "2025-03-15T10:00:00Z",
        }

        app._on_rates_loaded(rates)

        assert app.rates == rates
        assert app.is_loading is False
        app.card_bcv.update_rate.assert_called_once_with(60.5, "2025-03-15T10:00:00Z")
        app.card_parallel.update_rate.assert_called_once_with(72.3, "2025-03-15T10:00:00Z")
        app.card_eur.update_rate.assert_called_once_with(65.1, "2025-03-15T10:00:00Z")
        app.card_binance.update_rate.assert_called_once_with(70.0, "2025-03-15T10:00:00Z")
        app.spread_indicator.update.assert_called_once_with(60.5, 72.3)

    def test_sets_converter_rates(self, app) -> None:
        """Configura converter_rates correctamente."""
        _setup_rate_cards(app)

        rates = {
            "bcv": 60.5,
            "parallel": 72.3,
            "eur": 65.1,
            "binance_p2p": 70.0,
            "fetched_at": "2025-03-15T10:00:00Z",
        }

        app.bcv_lunes = 58.5
        app._on_rates_loaded(rates)

        assert app.converter_rates["bcv"] == 60.5
        assert app.converter_rates["binance_p2p"] == 70.0
        assert app.converter_rates["eur"] == 65.1
        assert app.converter_rates["parallel"] == 72.3
        assert app.converter_rates["bcv_lunes"] == 58.5

    def test_saves_historical(self, app) -> None:
        """Guarda las tasas en histórico."""
        _setup_rate_cards(app)

        with patch("app.app.save_today_historical_rate") as mock_save:
            rates = {
                "bcv": 60.5,
                "parallel": 72.3,
                "eur": 65.1,
                "binance_p2p": 70.0,
                "fetched_at": "2025-03-15T10:00:00Z",
            }
            app._on_rates_loaded(rates)

            mock_save.assert_called_once_with(
                bcv=60.5,
                paralelo=72.3,
                binance_p2p=70.0,
                euro=65.1,
            )

    def test_schedules_next_refresh(self, app) -> None:
        """Programa la próxima actualización."""
        _setup_rate_cards(app)
        app.window.after_cancel = MagicMock()
        app.window.after = MagicMock()

        rates = {
            "bcv": 60.5,
            "parallel": 72.3,
            "fetched_at": "2025-03-15T10:00:00Z",
        }
        app._on_rates_loaded(rates)

        app.window.after.assert_called()

    def test_sends_notification_on_high_spread(self, app) -> None:
        """Brecha > 20% envía notificación."""
        _setup_rate_cards(app)

        with patch("app.app.send_notification") as mock_notify:
            rates = {
                "bcv": 60.0,
                "parallel": 78.0,  # 30% spread
                "fetched_at": "2025-03-15T10:00:00Z",
            }
            app._brecha_notified = False
            app._on_rates_loaded(rates)

            mock_notify.assert_called_once()
            assert app._brecha_notified is True

    def test_resets_brecha_flag_when_spread_low(self, app) -> None:
        """Brecha <= 20% resetea el flag de notificación."""
        _setup_rate_cards(app)

        with patch("app.app.send_notification"):
            rates = {
                "bcv": 60.0,
                "parallel": 66.0,  # 10% spread
                "fetched_at": "2025-03-15T10:00:00Z",
            }
            app._brecha_notified = True
            app._on_rates_loaded(rates)

            assert app._brecha_notified is False


# ═══════════════════════════════════════════════════════════════════
# Tests: _on_rates_error
# ═══════════════════════════════════════════════════════════════════


class TestOnRatesError:
    """Tests de _on_rates_error()."""

    def test_with_cache_available(self, app) -> None:
        """Con caché, muestra tasas cacheadas en modo offline."""
        _setup_rate_cards(app)

        with (
            patch("app.app.load_cache_rates") as mock_load,
            patch("app.app.save_today_historical_rate"),
        ):
            mock_load.return_value = {
                "bcv": 60.0,
                "paralelo": 72.0,
                "binance_p2p": 70.0,
                "euro": 65.0,
                "fetched_at": "2025-03-15T08:00:00Z",
                "cached_at": "2025-03-15T08:00:00Z",
            }
            app.bcv_lunes = None

            app._on_rates_error("Error de conexión")

            assert app.is_loading is False
            assert app.rates["bcv"] == 60.0
            assert app.rates["parallel"] == 72.0
            app.card_bcv.update_rate.assert_called()
            app._update_history_tab.assert_called()

    def test_without_cache(self, app) -> None:
        """Sin caché disponible, muestra error en las cards."""
        _setup_rate_cards(app)

        with patch("app.app.load_cache_rates", return_value=None):
            app._on_rates_error("Error de conexión")

            app.card_bcv.show_error.assert_called_once()
            app.card_parallel.show_error.assert_called_once()
            app.card_eur.show_error.assert_called_once()
            app.card_binance.show_error.assert_called_once()

    def test_retry_scheduled(self, app) -> None:
        """Programa reintento a los 30 segundos."""
        _setup_rate_cards(app)

        with patch("app.app.load_cache_rates", return_value=None):
            app.window.after = MagicMock(return_value="retry_timer")
            app._on_rates_error("Error de conexión")

            assert app._refresh_timer == "retry_timer"


# ═══════════════════════════════════════════════════════════════════
# Tests: _refresh_rates
# ═══════════════════════════════════════════════════════════════════


class TestRefreshRates:
    """Tests de refresh_rates()."""

    def test_refresh_starts_loading(self, app) -> None:
        """refresh_rates inicia el estado de carga."""
        app.card_bcv = MagicMock()
        app.card_parallel = MagicMock()
        app.card_eur = MagicMock()
        app.card_binance = MagicMock()

        app.refresh_rates()

        assert app.is_loading is True
        app.card_bcv.show_loading.assert_called_once()
        app.card_parallel.show_loading.assert_called_once()
        app.card_eur.show_loading.assert_called_once()
        app.card_binance.show_loading.assert_called_once()

    def test_refresh_ignores_if_already_loading(self, app) -> None:
        """No inicia otra carga si ya está cargando."""
        app.card_bcv = MagicMock()
        app.is_loading = True

        app.refresh_rates()

        app.card_bcv.show_loading.assert_not_called()

    def test_refresh_submits_to_executor(self, app) -> None:
        """Envía la tarea al ThreadPoolExecutor."""
        app.card_bcv = MagicMock()
        app.card_parallel = MagicMock()
        app.card_eur = MagicMock()
        app.card_binance = MagicMock()

        app._executor = MagicMock()
        app.refresh_rates()

        app._executor.submit.assert_called_once_with(app._fetch_rates_thread)
