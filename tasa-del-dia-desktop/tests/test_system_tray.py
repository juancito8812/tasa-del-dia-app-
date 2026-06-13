"""Tests para el módulo de system tray (notificaciones y bandeja).

NOTA: pystray y PIL.Image/ImageDraw se importan DENTRO de start_tray()
(try/except ImportError). Por eso usamos setup_method() con patch()
para reemplazarlos antes de cada test.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.system_tray import (
    send_notification,
    start_tray,
    stop_tray,
)

# ═══════════════════════════════════════════════════════════════════
# Tests: send_notification
# ═══════════════════════════════════════════════════════════════════


class TestSendNotification:
    """Tests de send_notification con mock de plyer."""

    @patch("app.system_tray.plyer_notification")
    def test_send_success(self, mock_plyer: MagicMock) -> None:
        """Envía notificación correctamente."""
        with patch("app.system_tray._notifications_available", True):
            send_notification("Título", "Mensaje", timeout=3)

        mock_plyer.notify.assert_called_once_with(
            title="Título",
            message="Mensaje",
            timeout=3,
            app_name="Tasa del Día",
        )

    @patch("app.system_tray.plyer_notification")
    def test_send_with_default_timeout(self, mock_plyer: MagicMock) -> None:
        """Usa timeout por defecto (5) si no se especifica."""
        with patch("app.system_tray._notifications_available", True):
            send_notification("Título", "Mensaje")

        _, kwargs = mock_plyer.notify.call_args
        assert kwargs["timeout"] == 5

    @patch("app.system_tray.plyer_notification")
    def test_send_when_not_available(self, mock_plyer: MagicMock) -> None:
        """No envía si plyer no está disponible."""
        with patch("app.system_tray._notifications_available", False):
            send_notification("Título", "Mensaje")

        mock_plyer.notify.assert_not_called()

    @patch("app.system_tray.plyer_notification")
    def test_send_handles_exception(self, mock_plyer: MagicMock) -> None:
        """Maneja excepción de plyer sin crash."""
        mock_plyer.notify.side_effect = Exception("Error de prueba")

        with patch("app.system_tray._notifications_available", True):
            # No debe lanzar excepción
            send_notification("Título", "Mensaje")

    @patch("app.system_tray.plyer_notification")
    def test_send_empty_title(self, mock_plyer: MagicMock) -> None:
        """Título vacío es válido."""
        with patch("app.system_tray._notifications_available", True):
            send_notification("", "Solo mensaje")

        mock_plyer.notify.assert_called_once()


# ═══════════════════════════════════════════════════════════════════
# Tests: start_tray
# ═══════════════════════════════════════════════════════════════════


class TestStartTray:
    """Tests de start_tray con mock de pystray y PIL.

    Usamos setup_method() para iniciar los patches antes de cada test
    porque pystray y PIL se importan DENTRO de start_tray() (lazy import).
    """

    def _cleanup_globals(self) -> None:
        """Limpia el estado global del módulo entre tests."""
        import app.system_tray as st

        st._tray_icon = None
        st._tray_thread = None

    def setup_method(self) -> None:
        """Inicia los patches antes de cada test."""
        self._cleanup_globals()

        # Asegurar que PIL.Image e ImageDraw estén cargados como atributos del módulo
        # Pillow no los importa automáticamente con solo 'import PIL'
        import PIL.Image  # noqa: F401
        import PIL.ImageDraw  # noqa: F401

        self._patchers = [
            patch("pystray.Icon"),
            patch("pystray.Menu"),
            patch("pystray.MenuItem"),
            patch("PIL.Image"),
            patch("PIL.ImageDraw"),
        ]
        for p in self._patchers:
            p.start()

        # Configurar valores comunes
        import pystray
        from PIL import Image

        pystray.Menu.SEPARATOR = MagicMock()
        Image.new.return_value = MagicMock()

    def teardown_method(self) -> None:
        """Detiene los patches después de cada test."""
        for p in self._patchers:
            p.stop()
        self._cleanup_globals()

    def test_start_success(self) -> None:
        """Inicia el system tray correctamente."""
        import pystray
        from PIL import Image

        on_show = MagicMock()
        on_quit = MagicMock()

        start_tray(on_show, on_quit)

        # Verificar que se creó el icono
        pystray.Icon.assert_called_once()
        assert pystray.Menu.called
        # Verificar que se llamó a Image.new para crear el icono
        Image.new.assert_called_once()

    def test_start_twice_noop(self) -> None:
        """Llamar start_tray dos veces no crea otro icono."""
        import pystray

        start_tray(MagicMock(), MagicMock())
        start_tray(MagicMock(), MagicMock())

        # Solo debe haberse creado una vez
        pystray.Icon.assert_called_once()

    def test_start_guard_no_reinit(self) -> None:
        """Guard clause: si _tray_icon ya existe, no reinicia."""
        import app.system_tray as st

        st._tray_icon = MagicMock()

        with patch("pystray.Icon") as mock_icon:
            start_tray(MagicMock(), MagicMock())
            # No debe crear un nuevo icono
            mock_icon.assert_not_called()

        assert st._tray_icon is not None

    def test_start_menu_structure(self) -> None:
        """Verifica que el menú tenga las opciones correctas."""
        import pystray

        on_show = MagicMock()
        on_quit = MagicMock()

        start_tray(on_show, on_quit)

        # Verificar que MenuItem se llamó con los callbacks correctos
        menu_item_calls = pystray.MenuItem.call_args_list
        callbacks = []
        for args, _ in menu_item_calls:
            if len(args) >= 2:
                callbacks.append(args[1])

        assert on_show in callbacks
        assert on_quit in callbacks


# ═══════════════════════════════════════════════════════════════════
# Tests: stop_tray
# ═══════════════════════════════════════════════════════════════════


class TestStopTray:
    """Tests de stop_tray."""

    def _cleanup_globals(self) -> None:
        import app.system_tray as st

        st._tray_icon = None
        st._tray_thread = None

    def setup_method(self) -> None:
        self._cleanup_globals()

    def test_stop_when_not_running(self) -> None:
        """stop_tray sin tray activo no falla."""
        stop_tray()

    def test_stop_active_tray(self) -> None:
        """stop_tray detiene el icono activo."""
        import app.system_tray as st

        mock_icon = MagicMock()
        st._tray_icon = mock_icon

        stop_tray()

        mock_icon.stop.assert_called_once()
        assert st._tray_icon is None

    def test_stop_handles_exception(self) -> None:
        """stop_tray maneja excepción al detener icono."""
        import app.system_tray as st

        mock_icon = MagicMock()
        mock_icon.stop.side_effect = Exception("Error al detener")
        st._tray_icon = mock_icon

        # No debe lanzar excepción
        stop_tray()
        assert st._tray_icon is None
