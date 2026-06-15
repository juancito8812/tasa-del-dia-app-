from __future__ import annotations

import logging
import threading
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)

# ─── Notifications ─────────────────────────────────────────────────

_notifications_available = False
try:
    from plyer import notification as plyer_notification
    _notifications_available = True
except ImportError:
    logger.warning("plyer no disponible — notificaciones desactivadas")


def send_notification(title: str, message: str, timeout: int = 5) -> None:
    """Envía una notificación nativa de Windows.

    Args:
        title: Título de la notificación.
        message: Cuerpo del mensaje.
        timeout: Duración en segundos.
    """
    if not _notifications_available:
        logger.debug("Notificación omitida (plyer no disponible): %s — %s", title, message)
        return
    try:
        plyer_notification.notify(
            title=title,
            message=message,
            timeout=timeout,
            app_name="Tasa del Día",
        )
        logger.debug("Notificación enviada: %s", title)
    except Exception as e:
        logger.warning("Error enviando notificación: %s", e)


# ─── System Tray ────────────────────────────────────────────────────


class SystemTray:
    """Gestor del icono de bandeja del sistema."""

    def __init__(self) -> None:
        self._icon: Any = None
        self._thread: Optional[threading.Thread] = None

    def start(
        self,
        on_show: Callable[[], None],
        on_quit: Callable[[], None],
        on_refresh: Optional[Callable[[], None]] = None,
    ) -> None:
        """Inicia el icono de bandeja del sistema en un hilo separado.

        Args:
            on_show: Callback para mostrar/restaurar la ventana.
            on_quit: Callback para cerrar la aplicación.
            on_refresh: Callback para actualizar tasas.
        """
        if self._icon is not None:
            return

        try:
            import pystray
            from PIL import Image, ImageDraw
        except ImportError:
            logger.warning("pystray o Pillow no disponibles — system tray desactivado")
            return

        img = Image.new("RGB", (64, 64), color=(26, 26, 62))
        draw = ImageDraw.Draw(img)
        draw.rectangle([12, 8, 52, 56], fill=(233, 69, 96))
        draw.text((20, 14), "T", fill=(255, 255, 255))

        menu = pystray.Menu(
            pystray.MenuItem("Abrir Tasa del Día", on_show),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Actualizar tasas", on_refresh or on_show),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Salir", on_quit),
        )

        self._icon = pystray.Icon(
            "tasa_del_dia",
            img,
            "Tasa del Día — Venezuela",
            menu,
        )

        def _run() -> None:
            try:
                self._icon.run()
            except Exception as e:
                logger.error("Error en system tray: %s", e)

        self._thread = threading.Thread(target=_run, daemon=True)
        self._thread.start()
        logger.info("System tray iniciado")

    def stop(self) -> None:
        """Detiene el icono de bandeja."""
        if self._icon is not None:
            try:
                self._icon.stop()
            except Exception:
                pass
            self._icon = None
            logger.info("System tray detenido")

    @property
    def running(self) -> bool:
        return self._icon is not None


# Module-level singleton
_tray = SystemTray()


def start_tray(
    on_show: Callable[[], None],
    on_quit: Callable[[], None],
    on_refresh: Optional[Callable[[], None]] = None,
) -> None:
    """Inicia el icono de bandeja del sistema (wrapper legacy)."""
    _tray.start(on_show, on_quit, on_refresh)


def stop_tray() -> None:
    """Detiene el icono de bandeja (wrapper legacy)."""
    _tray.stop()


def get_tray() -> SystemTray:
    """Retorna la instancia única del SystemTray."""
    return _tray
