"""
Cliente HTTP para múltiples fuentes.
Obtiene tasas de cambio desde DolarApi.com y Binance P2P.
"""

from __future__ import annotations

import json
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Union
from urllib import request as urllib_request
from urllib import error as urllib_error

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT = 15

DOLARAPI_BASE_URL = "https://ve.dolarapi.com/v1"
BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"


class ApiError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        self.status_code = status_code
        super().__init__(message)


RatesDict = Dict[str, Optional[Union[float, str]]]


def _fetch_json(url: str, method: str = "GET", body: Optional[dict] = None) -> Optional[dict]:
    req = urllib_request.Request(url, method=method)
    req.add_header("Accept", "application/json")
    if body is not None:
        req.add_header("Content-Type", "application/json")
        req.data = json.dumps(body).encode("utf-8")
    try:
        with urllib_request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except (urllib_error.HTTPError, urllib_error.URLError, json.JSONDecodeError, OSError) as e:
        logger.warning("Error fetching %s: %s", url, e)
        return None


def _fetch_binance_p2p() -> Optional[float]:
    body = {
        "asset": "USDT",
        "fiat": "VES",
        "tradeType": "BUY",
        "rows": 1,
        "page": 1,
    }
    data = _fetch_json(BINANCE_P2P_URL, method="POST", body=body)
    if data:
        try:
            price = data["data"][0]["adv"]["price"]
            return float(price)
        except (KeyError, IndexError, TypeError, ValueError):
            pass
    return None


def fetch_all_rates() -> RatesDict:
    results: Dict[str, Any] = {
        "bcv": None,
        "parallel": None,
        "eur": None,
        "binance_p2p": None,
    }
    timestamps: list[str] = []

    def fetch_bcv():
        data = _fetch_json(f"{DOLARAPI_BASE_URL}/dolares/oficial")
        if data:
            results["bcv"] = data.get("promedio")
            ts = data.get("fechaActualizacion")
            if ts:
                timestamps.append(ts)

    def fetch_parallel():
        data = _fetch_json(f"{DOLARAPI_BASE_URL}/dolares/paralelo")
        if data:
            results["parallel"] = data.get("promedio")
            ts = data.get("fechaActualizacion")
            if ts:
                timestamps.append(ts)

    def fetch_eur():
        data = _fetch_json(f"{DOLARAPI_BASE_URL}/euros/oficial")
        if data:
            results["eur"] = data.get("promedio")
            ts = data.get("fechaActualizacion")
            if ts:
                timestamps.append(ts)

    def fetch_binance():
        results["binance_p2p"] = _fetch_binance_p2p()

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [
            executor.submit(fetch_bcv),
            executor.submit(fetch_parallel),
            executor.submit(fetch_eur),
            executor.submit(fetch_binance),
        ]
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                logger.error("Error in parallel fetch: %s", e)

    if results["bcv"] is None and results["parallel"] is None:
        raise ApiError("No se pudieron obtener las tasas USD")

    fetched_at = max(timestamps) if timestamps else datetime.now(timezone.utc).isoformat()

    result_rates: RatesDict = {
        "bcv": results["bcv"],
        "eur": results["eur"],
        "binance_p2p": results["binance_p2p"],
        "parallel": results["parallel"],
        "fetched_at": fetched_at,
    }

    logger.info("Tasas obtenidas: BCV=%s, Paralelo=%s, Euro=%s, Binance=%s",
                result_rates["bcv"], result_rates["parallel"],
                result_rates["eur"], result_rates["binance_p2p"])

    return result_rates
