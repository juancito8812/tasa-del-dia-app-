"""Tests para el módulo de widget compacto (WidgetWindow).

Usa un root Tkinter oculto para pruebas de UI sin mostrar ventanas.
"""

from __future__ import annotations

import json
import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest

from app.theme import DARK, LIGHT
from app.widget_window import (
    CONFIG_DIR,
    WIDGET_HEIGHT,
    WIDGET_WIDTH,
    WidgetWindow,
    _load_widget_pos,
    _save_widget_pos,
)


# ═══════════════════════════════════════════════════════════════════
# Tests: position persistence
# ═══════════════════════════════════════════════════════════════════


class TestWidgetPosition:
    """Tests de persistencia de posición del widget."""

    @pytest.fixture(autouse=True)
    def setup_temp_dir(self) -> None:
        """Usa un directorio temporal para la posición del widget."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("app.widget_window.CONFIG_DIR", tmpdir):
                yield

    def test_load_no_saved_position(self) -> None:
        """Sin archivo guardado → retorna None."""
        result = _load_widget_pos()
        assert result is None

    def test_save_and_load(self) -> None:
        """Guarda y recupera posición correctamente."""
        _save_widget_pos(100, 200)
        result = _load_widget_pos()
        assert result == {"x": 100, "y": 200}

    def test_save_updates_existing(self) -> None:
        """Guardar dos veces actualiza la posición."""
        _save_widget_pos(100, 200)
        _save_widget_pos(300, 400)
        result = _load_widget_pos()
        assert result == {"x": 300, "y": 400}

    def test_load_corrupted_file(self) -> None:
        """Archivo corrupto → retorna None (no crash)."""
        cfg_dir = CONFIG_DIR
        os.makedirs(cfg_dir, exist_ok=True)
        path = os.path.join(cfg_dir, "widget_pos.json")
        with open(path, "w") as f:
            f.write("not json")

        result = _load_widget_pos()
        assert result is None

    def test_save_failure(self) -> None:
        """Error al guardar no lanza excepción."""
        # Simular un directorio que no se puede crear
        with patch("app.widget_window.os.makedirs", side_effect=OSError("Permiso denegado")):
            _save_widget_pos(100, 200)  # No debe lanzar


# ═══════════════════════════════════════════════════════════════════
# Tests: WidgetWindow
# ═══════════════════════════════════════════════════════════════════

@pytest.fixture(scope="module")
def tk_root():
    """Crea un root de Tkinter oculto para los tests."""
    import tkinter as tk

    root = tk.Tk()
    root.withdraw()
    yield root
    root.destroy()


class TestWidgetWindowInit:
    """Tests de inicialización del WidgetWindow."""

    def test_creates_toplevel(self, tk_root) -> None:
        """Crea una ventana Toplevel."""
        widget = WidgetWindow(None, DARK)
        assert widget.window is not None
        assert widget.window.winfo_exists()
        widget.destroy()

    def test_starts_hidden(self, tk_root) -> None:
        """Inicia oculto (withdraw)."""
        widget = WidgetWindow(None, DARK)
        assert not widget._visible
        assert widget.is_visible is False
        widget.destroy()

    def test_stores_theme(self, tk_root) -> None:
        """Almacena el tema recibido."""
        widget = WidgetWindow(None, DARK)
        assert widget._theme == DARK
        widget.destroy()

    def test_window_is_topmost(self, tk_root) -> None:
        """Ventana configurada como always-on-top."""
        widget = WidgetWindow(None, DARK)
        assert widget.window.attributes("-topmost")
        widget.destroy()

    def test_window_has_no_borders(self, tk_root) -> None:
        """Ventana sin bordes (overrideredirect)."""
        widget = WidgetWindow(None, DARK)
        # overrideredirect retorna 1/0 como string en algunas plataformas
        assert widget.window.overrideredirect()
        widget.destroy()

    def test_window_correct_size(self, tk_root) -> None:
        """Ventana con dimensiones correctas."""
        widget = WidgetWindow(None, DARK)
        widget.window.update_idletasks()
        geo = widget.window.geometry()
        assert str(WIDGET_WIDTH) in geo
        assert str(WIDGET_HEIGHT) in geo
        widget.destroy()

    def test_window_alpha(self, tk_root) -> None:
        """Ventana con transparencia configurada."""
        widget = WidgetWindow(None, DARK)
        alpha = widget.window.attributes("-alpha")
        assert alpha is not None
        assert alpha < 1.0  # Debe ser semi-transparente
        widget.destroy()

    def test_close_button_binding(self, tk_root) -> None:
        """Botón de cierre oculta el widget."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        assert widget.is_visible

        # Simular clic en close
        widget.hide()
        assert not widget.is_visible
        widget.destroy()


class TestWidgetWindowVisibility:
    """Tests de métodos show/hide/toggle."""

    def test_show(self, tk_root) -> None:
        """show() hace visible el widget."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        assert widget.is_visible
        widget.destroy()

    def test_hide(self, tk_root) -> None:
        """hide() oculta el widget."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.hide()
        assert not widget.is_visible
        widget.destroy()

    def test_toggle_from_hidden(self, tk_root) -> None:
        """toggle() desde oculto → muestra."""
        widget = WidgetWindow(None, DARK)
        widget.toggle()
        assert widget.is_visible
        widget.destroy()

    def test_toggle_from_visible(self, tk_root) -> None:
        """toggle() desde visible → oculta."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.toggle()
        assert not widget.is_visible
        widget.destroy()

    def test_double_hide_no_error(self, tk_root) -> None:
        """hide() dos veces no lanza error."""
        widget = WidgetWindow(None, DARK)
        widget.hide()
        widget.hide()
        assert not widget.is_visible
        widget.destroy()


class TestWidgetWindowUpdateRates:
    """Tests de update_rates."""

    def test_update_bcv_only(self, tk_root) -> None:
        """Actualiza solo BCV."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.update_rates(bcv=60.5, paralelo=None)

        assert widget._bcv_label.cget("text") == "Bs. 60.50"
        assert widget._par_label.cget("text") == "—"
        widget.destroy()

    def test_update_paralelo_only(self, tk_root) -> None:
        """Actualiza solo Paralelo."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.update_rates(bcv=None, paralelo=72.3)

        assert widget._bcv_label.cget("text") == "—"
        assert widget._par_label.cget("text") == "Bs. 72.30"
        widget.destroy()

    def test_update_both(self, tk_root) -> None:
        """Actualiza ambas tasas."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.update_rates(bcv=60.5, paralelo=72.3)

        assert widget._bcv_label.cget("text") == "Bs. 60.50"
        assert widget._par_label.cget("text") == "Bs. 72.30"
        widget.destroy()

    def test_update_clears_previous(self, tk_root) -> None:
        """Actualizar con None limpia valores previos."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.update_rates(bcv=60.5, paralelo=72.3)
        widget.update_rates(bcv=None, paralelo=None)

        assert widget._bcv_label.cget("text") == "—"
        assert widget._par_label.cget("text") == "—"
        widget.destroy()

    def test_update_with_fetched_time(self, tk_root) -> None:
        """Muestra hora de actualización si está disponible."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.update_rates(bcv=60.5, paralelo=72.3, fetched_at="2025-03-15T10:30:00Z")

        assert "15/03" in widget._time_label.cget("text")
        assert "10:30" in widget._time_label.cget("text")
        widget.destroy()

    def test_update_without_time(self, tk_root) -> None:
        """Sin fetched_at, time_label queda vacío."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.update_rates(bcv=60.5, paralelo=72.3)

        assert widget._time_label.cget("text") == ""
        widget.destroy()


class TestWidgetWindowDestroy:
    """Tests de destroy."""

    def test_destroy_hides(self, tk_root) -> None:
        """destroy() marca como no visible."""
        widget = WidgetWindow(None, DARK)
        widget.show()
        widget.destroy()
        assert not widget.is_visible

    def test_destroy_called_twice(self, tk_root) -> None:
        """destroy() dos veces no lanza error."""
        widget = WidgetWindow(None, DARK)
        widget.destroy()
        # Segunda llamada no debe lanzar excepción
        widget.destroy()
