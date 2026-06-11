"""Tests para el módulo de storage (persistencia)."""

from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime
from unittest.mock import patch

import pytest

from app.storage import (
    CONFIG_DIR,
    format_date_key,
    get_historical_rates,
    get_today_key,
    load_cache_rates,
    load_config,
    parse_date_from_display,
    save_cache_rates,
    save_config,
    save_historical_rates,
    save_today_historical_rate,
    set_manual_historical_rate,
)


class TestDateUtils:
    """Tests para utilidades de fechas."""

    def test_format_date_key_valid(self) -> None:
        assert format_date_key("2025-03-15") == "15/03/2025"

    def test_format_date_key_none(self) -> None:
        assert format_date_key(None) == ""

    def test_format_date_key_empty(self) -> None:
        assert format_date_key("") == ""

    def test_get_today_key_format(self) -> None:
        key = get_today_key()
        assert len(key) == 10  # YYYY-MM-DD
        parts = key.split("-")
        assert len(parts) == 3
        assert len(parts[0]) == 4  # year
        assert len(parts[1]) == 2  # month
        assert len(parts[2]) == 2  # day

    def test_parse_date_valid(self) -> None:
        assert parse_date_from_display("15/03/2025") == "2025-03-15"

    def test_parse_date_empty(self) -> None:
        assert parse_date_from_display("") is None
        assert parse_date_from_display("   ") is None

    def test_parse_date_invalid_format(self) -> None:
        assert parse_date_from_display("not-a-date") is None

    def test_parse_date_out_of_range(self) -> None:
        assert parse_date_from_display("32/01/2025") is None  # day > 31
        assert parse_date_from_display("15/13/2025") is None  # month > 12
        assert parse_date_from_display("15/01/2019") is None  # year < 2020
        assert parse_date_from_display("15/01/2031") is None  # year > 2030

    def test_parse_date_with_dashes(self) -> None:
        assert parse_date_from_display("15-03-2025") == "2025-03-15"

    def test_parse_date_with_spaces(self) -> None:
        assert parse_date_from_display("  01/02/2025  ") == "2025-02-01"


class TestConfigPersistence:
    """Tests para la persistencia de configuración."""

    @pytest.fixture(autouse=True)
    def setup_temp_dir(self) -> None:
        """Usa un directorio temporal para los tests de configuración."""
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("app.storage.CONFIG_DIR", tmpdir), \
                 patch("app.storage.CONFIG_FILE", os.path.join(tmpdir, "config.json")):
                yield

    def test_load_config_defaults(self) -> None:
        """Carga configuración por defecto si no existe archivo."""
        config = load_config()
        assert config["bcv_lunes"] is None
        assert config["bcv_lunes_updated_at"] is None
        assert config["reminder_enabled"] is False
        assert config["last_known_theme"] == "dark"

    def test_save_and_load_config(self) -> None:
        """Guarda y recupera configuración."""
        save_config(bcv_lunes_value=50.5)
        config = load_config()
        assert config["bcv_lunes"] == 50.5
        assert config["bcv_lunes_updated_at"] is not None

    def test_save_reminder(self) -> None:
        """Guarda el estado del recordatorio."""
        save_config(reminder_enabled=True)
        config = load_config()
        assert config["reminder_enabled"] is True

    def test_delete_bcv_lunes(self) -> None:
        """Guardar 0 borra el valor de BCV Lunes."""
        save_config(bcv_lunes_value=100.0)
        save_config(bcv_lunes_value=0)
        config = load_config()
        assert config["bcv_lunes"] is None
        assert config["bcv_lunes_updated_at"] is None

    def test_partial_update(self) -> None:
        """Actualizar solo un campo no afecta los demás."""
        save_config(bcv_lunes_value=30.0, reminder_enabled=True)
        save_config(reminder_enabled=False)  # solo cambia reminder
        config = load_config()
        assert config["bcv_lunes"] == 30.0  # preservado


class TestCacheRates:
    """Tests para la caché de tasas."""

    @pytest.fixture(autouse=True)
    def setup_temp_dir(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("app.storage.CACHE_FILE", os.path.join(tmpdir, "cache.json")):
                with patch("app.storage.CONFIG_DIR", tmpdir):
                    yield

    def test_save_cache(self) -> None:
        rates = {
            "bcv": 60.5,
            "parallel": 70.0,
            "binance_p2p": 68.0,
            "eur": 65.0,
            "fetched_at": "2025-03-15T10:00:00Z",
        }
        result = save_cache_rates(rates)
        assert result is True

    def test_load_cache_empty(self) -> None:
        assert load_cache_rates() is None

    def test_save_and_load_cache(self) -> None:
        rates = {
            "bcv": 60.5,
            "parallel": 70.0,
            "binance_p2p": 68.0,
            "eur": 65.0,
            "fetched_at": "2025-03-15T10:00:00Z",
        }
        save_cache_rates(rates)
        cached = load_cache_rates()
        assert cached is not None
        assert cached["bcv"] == 60.5
        assert cached["paralelo"] == 70.0

    def test_cache_mapping(self) -> None:
        """Verifica el mapeo de claves al guardar caché."""
        rates = {
            "bcv": 60.0,
            "parallel": 71.0,
            "fetch_at": "X",
        }
        save_cache_rates(rates)
        cached = load_cache_rates()
        assert cached["bcv"] == 60.0
        # la clave 'parallel' se mapea a 'paralelo' en caché
        assert cached["paralelo"] == 71.0


class TestHistoricalRates:
    """Tests para tasas históricas."""

    @pytest.fixture(autouse=True)
    def setup_temp_dir(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            with patch("app.storage.HISTORICAL_FILE", os.path.join(tmpdir, "historical.json")):
                with patch("app.storage.CONFIG_DIR", tmpdir):
                    yield

    def test_empty_historical(self) -> None:
        assert get_historical_rates() == {}

    def test_save_and_load_historical(self) -> None:
        data = {"2025-03-15": {"bcv": 60.5}}
        save_historical_rates(data)
        loaded = get_historical_rates()
        assert loaded["2025-03-15"]["bcv"] == 60.5

    def test_set_manual_rate(self) -> None:
        set_manual_historical_rate("2025-03-15", bcv=60.0, paralelo=70.0)
        data = get_historical_rates()
        assert data["2025-03-15"]["bcv"] == 60.0
        assert data["2025-03-15"]["paralelo"] == 70.0
        assert data["2025-03-15"]["manual"] is True

    def test_save_today_historical(self) -> None:
        save_today_historical_rate(bcv=60.0)
        data = get_historical_rates()
        today = get_today_key()
        assert today in data
        assert data[today]["bcv"] == 60.0