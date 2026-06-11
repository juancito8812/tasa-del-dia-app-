"""
Cliente HTTP para la API de Cotizave.
Obtiene tasas de cambio: BCV, Paralelo, Euro, Binance P2P.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional, Union
from urllib import request as urllib_request
from urllib import error as urllib_error

logger = logging.getLogger(__name__)

# ─── Configuración ───────────────────────────────────────────────
# Se puede sobreescribir con variable de entorno COTIZAVE_BASE_URL
DEFAULT_BASE_URL = "https://api.cotizave.com"
BASE_URL = os.environ.get("COTIZAVE_BASE_URL", DEFAULT_BASE_URL)

# Tiempo máximo de espera para requests (segundos)
REQUEST_TIMEOUT = 15

# Mapa de nombres de mercado a claves internas
MARKET_MAP: Dict[str, str] = {
    "reference": "bcv",
    "eur_reference": "eur",
    "binance": "binance_p2p",
    "parallel": "parallel",
}


class ApiError(Exception):
    """Error personalizado para fallos de la API."""

    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        self.status_code = status_code
        super().__init__(message)


RatesDict = Dict[str, Optional[Union[float, str]]]


def fetch_all_rates() -> RatesDict:
    """Obtiene todas las tasas de cambio desde la API de Cotizave.

    Returns:
        Diccionario con claves: 'bcv', 'eur', 'binance_p2p', 'parallel', 'fetched_at'.

    Raises:
        ApiError: Si hay un error de conexión o la API responde con error.
    """
    url = f"{BASE_URL}/v1/fx/public/calculator?amount=1&from=USD&to=VES"

    logger.info("Solicitando tasas a %s", url)

    req = urllib_request.Request(url)
    req.add_header("Accept", "application/json")

    try:
        with urllib_request.urlopen(req, timeout=REQUEST_TIMEOUT) as response:
            data: dict = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        try:
            err_data = json.loads(error_body)
            msg = err_data.get("message", f"Error HTTP {e.code}")
        except json.JSONDecodeError:
            msg = f"Error HTTP {e.code}"
        logger.error("HTTPError %s: %s", e.code, msg)
        raise ApiError(msg, status_code=e.code) from e
    except urllib_error.URLError as e:
        logger.error("URLError: %s", e.reason)
        raise ApiError(f"Error de conexión: {e.reason}") from e
    except (json.JSONDecodeError, OSError) as e:
        logger.error("Error parseando respuesta: %s", e)
        raise ApiError(str(e)) from e

    rates: Dict[str, Dict[str, Any]] = {}
    fetched_at: Optional[str] = data.get("fetched_at")

    for result in data.get("results", []):
        market: Optional[str] = result.get("market")
        internal_key = MARKET_MAP.get(market) if market else None
        if internal_key:
            rates[internal_key] = {
                "rate": result.get("rate"),
                "fetched_at": fetched_at,
            }

    result_rates: RatesDict = {
        "bcv": rates.get("bcv", {}).get("rate"),
        "eur": rates.get("eur", {}).get("rate"),
        "binance_p2p": rates.get("binance_p2p", {}).get("rate"),
        "parallel": rates.get("parallel", {}).get("rate"),
        "fetched_at": fetched_at,
    }

    logger.info("Tasas obtenidas: BCV=%s, Paralelo=%s, Euro=%s, Binance=%s",
                result_rates["bcv"], result_rates["parallel"],
                result_rates["eur"], result_rates["binance_p2p"])

    return result_rates