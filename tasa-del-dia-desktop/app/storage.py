"""
Persistencia de datos: configuración, caché de tasas y tasas históricas.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# ─── Directorio de configuración ─────────────────────────────────
CONFIG_DIR = os.path.join(
    os.environ.get("APPDATA", os.path.expanduser("~")), "TasaDelDia"
)
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")
CACHE_FILE = os.path.join(CONFIG_DIR, "cache_rates.json")
HISTORICAL_FILE = os.path.join(CONFIG_DIR, "historical_rates.json")


def _ensure_config_dir() -> None:
    """Crea el directorio de configuración si no existe."""
    try:
        os.makedirs(CONFIG_DIR, exist_ok=True)
    except OSError as e:
        logger.exception("No se pudo crear el directorio de configuración %s", CONFIG_DIR)


# ─── Config ──────────────────────────────────────────────────────

ConfigDict = Dict[str, Any]


def load_config() -> ConfigDict:
    """Carga la configuración desde el archivo JSON.

    Returns:
        Diccionario con valores por defecto si el archivo no existe o está corrupto.
    """
    try:
        if not os.path.exists(CONFIG_FILE):
            logger.info("Archivo de configuración no encontrado, usando valores por defecto")
            return _default_config()
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data: dict = json.load(f)
        return {
            "bcv_lunes": data.get("bcv_lunes"),
            "bcv_lunes_updated_at": data.get("bcv_lunes_updated_at"),
            "reminder_enabled": data.get("reminder_enabled", False),
            "last_known_theme": data.get("last_known_theme", "dark"),
            "widget_enabled": data.get("widget_enabled", False),
        }
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Error cargando configuración: %s", e)
        return _default_config()


def _default_config() -> ConfigDict:
    return {
        "bcv_lunes": None,
        "bcv_lunes_updated_at": None,
        "reminder_enabled": False,
    "last_known_theme": "dark",
    "widget_enabled": False,
}


def save_config(
    bcv_lunes_value: Optional[float] = None,
    reminder_enabled: Optional[bool] = None,
    last_known_theme: Optional[str] = None,
    widget_enabled: Optional[bool] = None,
) -> None:
    """Guarda valores en la configuración. Pasar None para no modificar.

    Args:
        bcv_lunes_value: Tasa BCV del lunes (0 para borrar).
        reminder_enabled: Activar recordatorio de los viernes.
        last_known_theme: Último tema conocido ('dark' o 'light').
        widget_enabled: Activar widget compacto siempre visible.
    """
    try:
        _ensure_config_dir()
        config = load_config()
        if bcv_lunes_value is not None:
            if bcv_lunes_value > 0:
                config["bcv_lunes"] = bcv_lunes_value
                config["bcv_lunes_updated_at"] = datetime.now().isoformat()
            else:
                config["bcv_lunes"] = None
                config["bcv_lunes_updated_at"] = None
        if reminder_enabled is not None:
            config["reminder_enabled"] = bool(reminder_enabled)
        if last_known_theme is not None:
            config["last_known_theme"] = last_known_theme
        if widget_enabled is not None:
            config["widget_enabled"] = bool(widget_enabled)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        logger.debug("Configuración guardada correctamente")
    except OSError as e:
        logger.exception("Error guardando configuración: %s", e)


# ─── Caché de tasas ──────────────────────────────────────────────

CacheRates = Dict[str, Any]


def save_cache_rates(rates: Dict[str, Any]) -> bool:
    """Guarda las tasas en caché para uso offline.

    Args:
        rates: Diccionario con las tasas obtenidas de la API.

    Returns:
        True si se guardó correctamente, False en caso contrario.
    """
    try:
        _ensure_config_dir()
        cache: CacheRates = {
            "bcv": rates.get("bcv"),
            "paralelo": rates.get("parallel"),
            "binance_p2p": rates.get("binance_p2p"),
            "euro": rates.get("eur"),
            "fetched_at": rates.get("fetched_at"),
            "cached_at": datetime.now().isoformat(),
        }
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        logger.debug("Caché de tasas guardada")
        return True
    except OSError as e:
        logger.exception("Error guardando caché de tasas: %s", e)
        return False


def load_cache_rates() -> Optional[CacheRates]:
    """Carga las tasas desde la caché.

    Returns:
        Diccionario con las tasas cacheadas o None si no existe/corrupto.
    """
    try:
        if not os.path.exists(CACHE_FILE):
            return None
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Error cargando caché de tasas: %s", e)
        return None


# ─── Tasas históricas ────────────────────────────────────────────

HistoricalRates = Dict[str, Dict[str, Any]]


def get_historical_rates() -> HistoricalRates:
    """Carga todas las tasas históricas.

    Returns:
        Diccionario fecha -> {bcv, paralelo, binance_p2p, euro, ...}
    """
    try:
        if os.path.exists(HISTORICAL_FILE):
            with open(HISTORICAL_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
    except (json.JSONDecodeError, OSError) as e:
        logger.warning("Error cargando tasas históricas: %s", e)
        return {}


def save_historical_rates(all_rates: HistoricalRates) -> None:
    """Guarda todas las tasas históricas."""
    try:
        _ensure_config_dir()
        with open(HISTORICAL_FILE, "w", encoding="utf-8") as f:
            json.dump(all_rates, f, ensure_ascii=False, indent=2)
        logger.debug("Tasas históricas guardadas (%d registros)", len(all_rates))
    except OSError as e:
        logger.exception("Error guardando tasas históricas: %s", e)


def save_today_historical_rate(
    bcv: Optional[float] = None,
    paralelo: Optional[float] = None,
    binance_p2p: Optional[float] = None,
    euro: Optional[float] = None,
) -> None:
    """Auto-guarda las tasas de hoy al histórico."""
    today_key = datetime.now().strftime("%Y-%m-%d")
    try:
        all_rates = get_historical_rates()
        if today_key not in all_rates or bcv is not None:
            existing = all_rates.get(today_key, {})
            entry: Dict[str, Any] = {
                "bcv": bcv if bcv is not None else existing.get("bcv"),
                "paralelo": paralelo if paralelo is not None else existing.get("paralelo"),
                "binance_p2p": binance_p2p if binance_p2p is not None else existing.get("binance_p2p"),
                "euro": euro if euro is not None else existing.get("euro"),
                "fetchedAt": datetime.now().isoformat(),
            }
            if existing.get("manual"):
                entry["manual"] = True
            all_rates[today_key] = entry
            save_historical_rates(all_rates)
            logger.info("Tasas de hoy guardadas en histórico")
    except Exception as e:
        logger.exception("Error guardando tasa histórica de hoy: %s", e)


def set_manual_historical_rate(
    date_key: str,
    bcv: Optional[float] = None,
    paralelo: Optional[float] = None,
    binance_p2p: Optional[float] = None,
    euro: Optional[float] = None,
) -> None:
    """Guarda tasas ingresadas manualmente para una fecha específica."""
    try:
        all_rates = get_historical_rates()
        existing = all_rates.get(date_key, {})
        entry: Dict[str, Any] = {
            "bcv": bcv if bcv is not None else existing.get("bcv"),
            "paralelo": paralelo if paralelo is not None else existing.get("paralelo"),
            "binance_p2p": binance_p2p if binance_p2p is not None else existing.get("binance_p2p"),
            "euro": euro if euro is not None else existing.get("euro"),
            "fetchedAt": datetime.now().isoformat(),
            "manual": True,
        }
        all_rates[date_key] = entry
        save_historical_rates(all_rates)
        logger.info("Tasas manuales guardadas para %s", date_key)
    except Exception as e:
        logger.exception("Error guardando tasas manuales: %s", e)


# ─── Utilidades de fechas ────────────────────────────────────────

def format_date_key(date_key: Optional[str]) -> str:
    """Formatea YYYY-MM-DD a DD/MM/AAAA para mostrar.

    Args:
        date_key: Fecha en formato YYYY-MM-DD.

    Returns:
        Fecha formateada DD/MM/AAAA o cadena vacía si es None.
    """
    if not date_key:
        return ""
    parts = date_key.split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return date_key


def get_today_key() -> str:
    """Retorna la fecha de hoy como YYYY-MM-DD."""
    return datetime.now().strftime("%Y-%m-%d")


def parse_date_from_display(raw: str) -> Optional[str]:
    """Parsea una fecha ingresada por el usuario (DD/MM/AAAA) a YYYY-MM-DD.

    Args:
        raw: String ingresado por el usuario (ej: "15/03/2025").

    Returns:
        Fecha en formato YYYY-MM-DD o None si es inválida.
    """
    if not raw or not raw.strip():
        return None
    cleaned = raw.strip().replace("/", "-").split("-")
    if len(cleaned) != 3:
        return None
    try:
        dd, mm, yyyy = int(cleaned[0]), int(cleaned[1]), int(cleaned[2])
        # Validación básica de rango
        if dd < 1 or dd > 31 or mm < 1 or mm > 12 or yyyy < 2020 or yyyy > 2030:
            logger.warning("Fecha fuera de rango: %s", raw)
            return None
        return f"{yyyy}-{mm:02d}-{dd:02d}"
    except (ValueError, IndexError):
        logger.warning("Formato de fecha inválido: %s", raw)
        return None