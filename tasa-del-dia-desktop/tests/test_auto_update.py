"""Tests para el módulo de actualización automática (auto_update)."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from app.auto_update import (
    APP_VERSION,
    _parse_version,
    check_for_updates,
)


class TestParseVersion:
    """Tests del parseo de versiones semver."""

    def test_standard_version(self) -> None:
        """v1.2.3 → (1, 2, 3)"""
        assert _parse_version("v1.2.3") == (1, 2, 3)

    def test_version_without_v(self) -> None:
        """1.2.3 → (1, 2, 3)"""
        assert _parse_version("1.2.3") == (1, 2, 3)

    def test_version_with_prerelease(self) -> None:
        """v1.0.0-beta → (1, 0, 0) — ignora pre-release"""
        assert _parse_version("v1.0.0-beta") == (1, 0, 0)

    def test_version_with_patch_prerelease(self) -> None:
        """1.0.1-rc.1 → (1, 0, 1)"""
        assert _parse_version("1.0.1-rc.1") == (1, 0, 1)

    def test_major_only(self) -> None:
        """v1 → (1,)"""
        result = _parse_version("v1")
        assert result[0] == 1

    def test_invalid_version(self) -> None:
        """Texto no numérico → (0, 0, 0)"""
        assert _parse_version("invalid") == (0, 0, 0)

    def test_version_with_spaces(self) -> None:
        """'  v2.0.0  ' → (2, 0, 0)"""
        assert _parse_version("  v2.0.0  ") == (2, 0, 0)
        assert _parse_version("\tv1.5.0\n") == (1, 5, 0)

    def test_comparison_newer(self) -> None:
        """1.0.2 < 1.0.3 → True"""
        assert _parse_version("1.0.2") < _parse_version("1.0.3")

    def test_comparison_older(self) -> None:
        """1.1.0 > 1.0.9 → True"""
        assert _parse_version("1.1.0") > _parse_version("1.0.9")


class TestCheckForUpdates:
    """Tests de check_for_updates con mock de urllib."""

    MOCK_RELEASE_DATA = {
        "tag_name": "v1.1.0",
        "html_url": "https://github.com/juancito8812/tasa-del-dia-app-/releases/tag/v1.1.0",
        "body": "Novedades en esta versión...\n- Mejoras varias\n- Bugfixes",
        "assets": [
            {
                "name": "TasaDelDia-Setup.msi",
                "browser_download_url": "https://github.com/.../TasaDelDia-Setup.msi",
            },
            {
                "name": "TasaDelDia.exe",
                "browser_download_url": "https://github.com/.../TasaDelDia.exe",
            },
        ],
    }

    @patch("app.auto_update.urllib_request.urlopen")
    def test_update_available(self, mock_urlopen: MagicMock) -> None:
        """Detecta cuando hay una versión más reciente."""
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(self.MOCK_RELEASE_DATA).encode()
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = check_for_updates()

        assert result is not None
        assert result["has_update"] is True
        assert result["latest_version"] == "v1.1.0"
        assert result["current_version"] == APP_VERSION
        assert "TasaDelDia.exe" in result["download_url"]
        assert result["release_notes"] != ""

    @patch("app.auto_update.urllib_request.urlopen")
    def test_no_update(self, mock_urlopen: MagicMock) -> None:
        """Versión actual igual a la latest → no hay update."""
        data = dict(self.MOCK_RELEASE_DATA)
        data["tag_name"] = f"v{APP_VERSION}"
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(data).encode()
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = check_for_updates()

        assert result is not None
        assert result["has_update"] is False

    @patch("app.auto_update.urllib_request.urlopen")
    def test_same_version_no_update(self, mock_urlopen: MagicMock) -> None:
        """Misma versión → no hay update."""
        data = dict(self.MOCK_RELEASE_DATA)
        data["tag_name"] = f"v{APP_VERSION}"
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(data).encode()
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = check_for_updates()
        assert result is not None
        assert result["has_update"] is False

    @patch("app.auto_update.urllib_request.urlopen")
    def test_http_error(self, mock_urlopen: MagicMock) -> None:
        """Error HTTP (ej: 403 rate limit) → retorna None."""
        from urllib.error import HTTPError

        mock_urlopen.side_effect = HTTPError(
            url="http://test.com",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=None,
        )

        result = check_for_updates()
        assert result is None

    @patch("app.auto_update.urllib_request.urlopen")
    def test_connection_error(self, mock_urlopen: MagicMock) -> None:
        """Error de conexión → retorna None."""
        from urllib.error import URLError

        mock_urlopen.side_effect = URLError(reason="No connection")

        result = check_for_updates()
        assert result is None

    @patch("app.auto_update.urllib_request.urlopen")
    def test_bad_json_response(self, mock_urlopen: MagicMock) -> None:
        """Respuesta no-JSON → None."""
        mock_resp = MagicMock()
        mock_resp.read.return_value = b"not json"
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = check_for_updates()
        assert result is None

    @patch("app.auto_update.urllib_request.urlopen")
    def test_no_assets(self, mock_urlopen: MagicMock) -> None:
        """Release sin assets → download_url vacío."""
        data = dict(self.MOCK_RELEASE_DATA)
        data["assets"] = []
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(data).encode()
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = check_for_updates()

        assert result is not None
        assert result["has_update"] is True
        assert result["download_url"] == ""

    @patch("app.auto_update.urllib_request.urlopen")
    def test_no_release_notes(self, mock_urlopen: MagicMock) -> None:
        """Release sin body → release_notes vacío."""
        data = dict(self.MOCK_RELEASE_DATA)
        data["body"] = None
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(data).encode()
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = check_for_updates()

        assert result is not None
        assert result["has_update"] is True
        assert result["release_notes"] == ""

    @patch("app.auto_update.urllib_request.urlopen")
    def test_truncates_long_notes(self, mock_urlopen: MagicMock) -> None:
        """Release notes largas se truncan a 500 chars."""
        data = dict(self.MOCK_RELEASE_DATA)
        data["body"] = "x" * 1000
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps(data).encode()
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        result = check_for_updates()

        assert result is not None
        assert len(result["release_notes"]) <= 500
