"""
Actualización automática desde GitHub Releases.

Verifica si hay una nueva versión de Tasa del Día disponible
consultando la API de GitHub Releases y ofrece descargarla.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, Optional
from urllib import request as urllib_request
from urllib import error as urllib_error

logger = logging.getLogger(__name__)

# ─── Configuración ────────────────────────────────────────────
# Versión actual de la app (semver)
APP_VERSION = "1.0.3"

# Repositorio en GitHub
GITHUB_OWNER = "juancito8812"
GITHUB_REPO = "tasa-del-dia-app-"
RELEASES_API_URL = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/releases/latest"

REQUEST_TIMEOUT = 10


def _parse_version(version_str: str) -> tuple:
    """Parsea un string de versión semver a tupla comparable.

    Args:
        version_str: Versión en formato "v1.2.3" o "1.2.3".

    Returns:
        Tupla (major, minor, patch) para comparación.
    """
    cleaned = version_str.strip().lstrip("v")
    # Ignorar pre-release tags (ej: v1.0.0-beta → 1.0.0)
    base = cleaned.split("-")[0]
    parts = base.split(".")
    try:
        return tuple(int(p) for p in parts[:3])
    except (ValueError, IndexError):
        return (0, 0, 0)


def check_for_updates() -> Optional[Dict[str, Any]]:
    """Consulta GitHub Releases para ver si hay una versión más reciente.

    Returns:
        Diccionario con:
            - has_update (bool): True si hay nueva versión
            - latest_version (str): Última versión disponible
            - current_version (str): Versión actual
            - download_url (str): URL para descargar el .exe
            - release_url (str): URL de la release en GitHub
            - release_notes (str): Notas de la release
        O None si hay error.
    """
    try:
        req = urllib_request.Request(RELEASES_API_URL)
        req.add_header("Accept", "application/vnd.github.v3+json")
        req.add_header("User-Agent", f"TasaDelDia/{APP_VERSION}")

        with urllib_request.urlopen(req, timeout=REQUEST_TIMEOUT) as response:
            data: dict = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as e:
        logger.warning("GitHub API HTTPError %s: %s", e.code, e.reason)
        return None
    except (urllib_error.URLError, json.JSONDecodeError, OSError) as e:
        logger.warning("Error consultando GitHub Releases: %s", e)
        return None

    latest_tag: str = data.get("tag_name", "")

    has_update = _parse_version(latest_tag) > _parse_version(APP_VERSION)

    # Buscar URL de descarga del .exe en los assets
    download_url = ""
    for asset in data.get("assets", []):
        name: str = asset.get("name", "")
        if name.endswith(".exe") and "TasaDelDia" in name:
            download_url = asset.get("browser_download_url", "")
            break

    release_url = data.get("html_url", "")
    release_body = (data.get("body") or "").strip()

    # Acortar release notes
    release_notes = release_body[:500] if release_body else ""

    logger.info(
        "Update check: current=%s latest=%s has_update=%s",
        APP_VERSION, latest_tag, has_update,
    )

    return {
        "has_update": has_update,
        "latest_version": latest_tag,
        "current_version": APP_VERSION,
        "download_url": download_url,
        "release_url": release_url,
        "release_notes": release_notes,
    }
