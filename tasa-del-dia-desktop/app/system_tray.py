"""
Utilidades de sistema: notificaciones nativas y bandeja del sistema.
"""

from __future__ import annotations

import logging
import threading
from typing import Any, Callable, Optional

logger = logging.getLogger(__name__)

# ─── Notificaciones ─────────────────────────────────────────────

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


# ─── System Tray ────────────────────────────────────────────────

_tray_icon = None
_tray_thread = None


def start_tray(
    on_show: Callable[[], None],
    on_quit: Callable[[], None],
) -> None:
    """Inicia el icono de bandeja del sistema en un hilo separado.

    Args:
        on_show: Callback para mostrar/restaurar la ventana.
        on_quit: Callback para cerrar la aplicación.
    """
    global _tray_icon, _tray_thread

    if _tray_icon is not None:
        return  # ya iniciado

    try:
        import pystray
        from PIL import Image, ImageDraw
    except ImportError:
        logger.warning("pystray o Pillow no disponibles — system tray desactivado")
        return

    # Crear un icono simple (rectángulo azul oscuro con texto T)
    img = Image.new("RGB", (64, 64), color=(26, 26, 62))
    draw = ImageDraw.Draw(img)
    draw.rectangle([12, 8, 52, 56], fill=(233, 69, 96))
    draw.text((20, 14), "T", fill=(255, 255, 255))

    menu = pystray.Menu(
        pystray.MenuItem("📊 Abrir Tasa del Día", on_show),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("🔄 Actualizar tasas", on_show),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("❌ Salir", on_quit),
    )

    _tray_icon = pystray.Icon(
        "tasa_del_dia",
        img,
        "Tasa del Día — Venezuela",
        menu,
    )

    def _run_tray() -> None:
        try:
            _tray_icon.run()
        except Exception as e:
            logger.error("Error en system tray: %s", e)

    _tray_thread = threading.Thread(target=_run_tray, daemon=True)
    _tray_thread.start()
    logger.info("System tray iniciado")


def stop_tray() -> None:
    """Detiene el icono de bandeja."""
    global _tray_icon
    if _tray_icon is not None:
        try:
            _tray_icon.stop()
        except Exception:
            pass
        _tray_icon = None
        logger.info("System tray detenido")
