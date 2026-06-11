#!/usr/bin/env python3
"""
Tasa del Día — Aplicación de escritorio (Premium Dark Fintech)
=============================================================
Archivo legacy de compatibilidad. Ahora el punto de entrada es main.py.

Este archivo se mantiene para compatibilidad con scripts existentes.
Usa:  python main.py
"""

from __future__ import annotations

import warnings

warnings.warn(
    "tasa_del_dia.py es el archivo legacy. Usa 'python main.py' en su lugar.",
    DeprecationWarning,
    stacklevel=2,
)

# Re-exportar todo para compatibilidad
from app.storage import (  # noqa: F401
    CACHE_FILE,
    CONFIG_DIR,
    CONFIG_FILE,
    HISTORICAL_FILE,
    format_date_key,
    get_historical_rates,
    get_today_key,
    load_cache_rates,
    load_config,
    save_cache_rates,
    save_config,
    save_historical_rates,
    save_today_historical_rate,
    set_manual_historical_rate,
)
from app.api import (  # noqa: F401
    BASE_URL,
    MARKET_MAP,
    ApiError,
    fetch_all_rates,
)
from app.theme import (  # noqa: F401
    DARK,
    LIGHT,
    FONTS,
    Theme,
    get_system_theme,
    resolve_theme,
)
from app.widgets import (  # noqa: F401
    REFRESH_MINUTES,
    RateCard,
    SpreadIndicator,
    TimerBar,
)
from app.app import TasaDelDiaApp  # noqa: F401
from main import main  # noqa: F401

if __name__ == "__main__":
    main()