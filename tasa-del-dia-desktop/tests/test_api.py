"""Tests para el módulo API (cliente HTTP de Cotizave)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.api import ApiError, MARKET_MAP, RatesDict, fetch_all_rates


class TestMarketMap:
    """Tests del mapa de mercados."""

    def test_market_map_keys(self) -> None:
        assert MARKET_MAP["reference"] == "bcv"
        assert MARKET_MAP["eur_reference"] == "eur"
        assert MARKET_MAP["binance"] == "binance_p2p"
        assert MARKET_MAP["parallel"] == "parallel"

    def test_market_map_length(self) -> None:
        assert len(MARKET_MAP) == 4


class TestFetchAllRates:
    """Tests de fetch_all_rates con mock de urllib."""

    @patch("app.api.urllib_request.urlopen")
    def test_successful_fetch(self, mock_urlopen: MagicMock) -> None:
        """Verifica que parsea correctamente la respuesta de la API."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"""
        {
            "fetched_at": "2025-03-15T10:00:00Z",
            "results": [
                {"market": "reference", "rate": 60.5},
                {"market": "parallel", "rate": 72.3},
                {"market": "binance", "rate": 70.0},
                {"market": "eur_reference", "rate": 65.1}
            ]
        }
        """
        mock_urlopen.return_value.__enter__.return_value = mock_response

        rates = fetch_all_rates()

        assert rates["bcv"] == 60.5
        assert rates["parallel"] == 72.3
        assert rates["binance_p2p"] == 70.0
        assert rates["eur"] == 65.1
        assert rates["fetched_at"] == "2025-03-15T10:00:00Z"

    @patch("app.api.urllib_request.urlopen")
    def test_partial_results(self, mock_urlopen: MagicMock) -> None:
        """Verifica que maneja respuestas con resultados parciales."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"""
        {
            "fetched_at": "2025-03-15T10:00:00Z",
            "results": [
                {"market": "reference", "rate": 60.5}
            ]
        }
        """
        mock_urlopen.return_value.__enter__.return_value = mock_response

        rates = fetch_all_rates()

        assert rates["bcv"] == 60.5
        assert rates["parallel"] is None
        assert rates["binance_p2p"] is None
        assert rates["eur"] is None

    @patch("app.api.urllib_request.urlopen")
    def test_empty_results(self, mock_urlopen: MagicMock) -> None:
        """Verifica que maneja respuestas vacías."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"""
        {
            "fetched_at": "2025-03-15T10:00:00Z",
            "results": []
        }
        """
        mock_urlopen.return_value.__enter__.return_value = mock_response

        rates = fetch_all_rates()

        assert rates["bcv"] is None
        assert rates["parallel"] is None

    @patch("app.api.urllib_request.urlopen")
    def test_http_error(self, mock_urlopen: MagicMock) -> None:
        """Verifica que lanza ApiError en errores HTTP."""
        from urllib.error import HTTPError

        mock_urlopen.side_effect = HTTPError(
            url="http://test.com",
            code=500,
            msg="Internal Server Error",
            hdrs={},
            fp=None,
        )

        with pytest.raises(ApiError) as exc_info:
            fetch_all_rates()

        assert "Error HTTP" in str(exc_info.value)
        assert exc_info.value.status_code == 500

    @patch("app.api.urllib_request.urlopen")
    def test_connection_error(self, mock_urlopen: MagicMock) -> None:
        """Verifica que lanza ApiError en errores de conexión."""
        from urllib.error import URLError

        mock_urlopen.side_effect = URLError(reason="No connection")

        with pytest.raises(ApiError) as exc_info:
            fetch_all_rates()

        assert "No connection" in str(exc_info.value)

    @patch("app.api.urllib_request.urlopen")
    def test_bad_json_response(self, mock_urlopen: MagicMock) -> None:
        """Verifica que lanza ApiError si la respuesta no es JSON válido."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"not json at all"
        mock_urlopen.return_value.__enter__.return_value = mock_response

        with pytest.raises(ApiError):
            fetch_all_rates()

    @patch("app.api.urllib_request.urlopen")
    def test_unknown_market_key(self, mock_urlopen: MagicMock) -> None:
        """Verifica que ignora claves de mercado desconocidas."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"""
        {
            "fetched_at": "2025-03-15T10:00:00Z",
            "results": [
                {"market": "some_unknown_market", "rate": 99.9},
                {"market": "reference", "rate": 60.0}
            ]
        }
        """
        mock_urlopen.return_value.__enter__.return_value = mock_response

        rates = fetch_all_rates()
        assert rates["bcv"] == 60.0
        assert rates["parallel"] is None