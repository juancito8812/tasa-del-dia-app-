"""Tests para el módulo API (cliente DolarApi.com + Binance P2P)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.api import ApiError, RatesDict, fetch_all_rates


class TestFetchAllRates:
    """Tests de fetch_all_rates con mock de _fetch_json."""

    @patch("app.api._fetch_json")
    def test_successful_fetch(self, mock_fetch: MagicMock) -> None:
        """Verifica que parsea correctamente respuestas de todas las fuentes."""
        def side_effect(url, method="GET", body=None):
            if "dolares/oficial" in url:
                return {"promedio": 60.5, "fechaActualizacion": "2025-03-15T10:00:00Z"}
            if "dolares/paralelo" in url:
                return {"promedio": 72.3, "fechaActualizacion": "2025-03-15T10:05:00Z"}
            if "euros/oficial" in url:
                return {"promedio": 65.1, "fechaActualizacion": "2025-03-15T10:02:00Z"}
            if "binance.com" in url:
                return {"data": [{"adv": {"price": "70.0"}}]}
            return None
        mock_fetch.side_effect = side_effect

        rates = fetch_all_rates()

        assert rates["bcv"] == 60.5
        assert rates["parallel"] == 72.3
        assert rates["binance_p2p"] == 70.0
        assert rates["eur"] == 65.1
        assert rates["fetched_at"] == "2025-03-15T10:05:00Z"

    @patch("app.api._fetch_json")
    def test_partial_results(self, mock_fetch: MagicMock) -> None:
        """Verifica que maneja resultados parciales (solo BCV disponible)."""
        def side_effect(url, method="GET", body=None):
            if "dolares/oficial" in url:
                return {"promedio": 60.5, "fechaActualizacion": "2025-03-15T10:00:00Z"}
            return None
        mock_fetch.side_effect = side_effect

        rates = fetch_all_rates()

        assert rates["bcv"] == 60.5
        assert rates["parallel"] is None
        assert rates["binance_p2p"] is None
        assert rates["eur"] is None

    @patch("app.api._fetch_json")
    def test_all_fail(self, mock_fetch: MagicMock) -> None:
        """Verifica que lanza ApiError si todas las fuentes fallan."""
        mock_fetch.return_value = None

        with pytest.raises(ApiError) as exc_info:
            fetch_all_rates()

        assert "No se pudieron obtener las tasas USD" in str(exc_info.value)

    @patch("app.api._fetch_json")
    def test_binance_none_on_failure(self, mock_fetch: MagicMock) -> None:
        """Verifica que Binance retorna None si falla, sin romper las demás."""
        def side_effect(url, method="GET", body=None):
            if "dolares/oficial" in url:
                return {"promedio": 60.5, "fechaActualizacion": "2025-03-15T10:00:00Z"}
            if "dolares/paralelo" in url:
                return {"promedio": 72.3, "fechaActualizacion": "2025-03-15T10:05:00Z"}
            return None
        mock_fetch.side_effect = side_effect

        rates = fetch_all_rates()

        assert rates["bcv"] == 60.5
        assert rates["parallel"] == 72.3
        assert rates["binance_p2p"] is None

    @patch("app.api._fetch_json")
    def test_binance_bad_response(self, mock_fetch: MagicMock) -> None:
        """Verifica que Binance con respuesta inesperada no rompe nada."""
        def side_effect(url, method="GET", body=None):
            if "dolares/oficial" in url:
                return {"promedio": 60.5, "fechaActualizacion": "2025-03-15T10:00:00Z"}
            if "dolares/paralelo" in url:
                return {"promedio": 72.3, "fechaActualizacion": "2025-03-15T10:05:00Z"}
            if "binance.com" in url:
                return {"data": []}
            return None
        mock_fetch.side_effect = side_effect

        rates = fetch_all_rates()

        assert rates["bcv"] == 60.5
        assert rates["binance_p2p"] is None
