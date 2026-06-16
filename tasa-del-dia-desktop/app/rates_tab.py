from __future__ import annotations

import logging
import customtkinter as ctk
from datetime import datetime
from typing import Any, Dict, Optional

from app.theme import FONTS, Theme
from app.widgets import REFRESH_MINUTES, RateCard, SpreadIndicator, TimerBar
from app.storage import load_config, save_config

logger = logging.getLogger(__name__)


class RatesTab:
    def __init__(self, parent: ctk.CTkBaseClass, app: Any, theme: Theme) -> None:
        self.app = app
        self.c = theme
        self.bcv_lunes: Optional[float] = None
        self.bcv_lunes_updated_at: Optional[str] = None
        self.reminder_enabled: bool = False
        self._brecha_notified: bool = False

    def build(self, parent: ctk.CTkBaseClass) -> None:
        c = self.c
        scroll_frame = self.app._create_scrollable(parent)

        self.spread_indicator = SpreadIndicator(
            scroll_frame, c, title="BRECHA BCV VS PARALELO", icon="⚖️",
            color_a=c.success, label_a="●  BCV", color_b=c.highlight, label_b="●  Paralelo",
        )

        self.spread_lunes = SpreadIndicator(
            scroll_frame, c, title="BRECHA BCV (LUNES) VS PARALELO", icon="📅",
            color_a=c.bcv_lunes, label_a="●  BCV (Lunes)", color_b=c.highlight, label_b="●  Paralelo",
        )

        self.card_bcv = RateCard(scroll_frame, "BCV (Oficial)", "Banco Central de Venezuela", "🏛️", c.success, c)
        self.card_bcv.pack(fill="x", padx=12, pady=(4, 6))

        self.card_parallel = RateCard(scroll_frame, "Dólar Paralelo", "Mercado paralelo / promedio", "📈", c.highlight, c)
        self.card_parallel.pack(fill="x", padx=12, pady=6)

        self.card_eur = RateCard(scroll_frame, "Euro (BCV)", "Tasa de referencia oficial", "💶", c.info, c)
        self.card_eur.pack(fill="x", padx=12, pady=6)

        self.card_binance = RateCard(scroll_frame, "Binance P2P", "USDT / VES — Mercado P2P", "₿", c.warning, c)
        self.card_binance.pack(fill="x", padx=12, pady=6)

        self.card_lunes = RateCard(scroll_frame, "BCV (Lunes)", "Tasa manual del lunes", "📅", c.bcv_lunes, c)
        self.card_lunes.pack(fill="x", padx=12, pady=6)

        edit_btn = ctk.CTkLabel(self.card_lunes.rate_label.master, text="✏️", text_color=c.bcv_lunes, font=("Segoe UI", 10), cursor="hand2", fg_color="transparent")
        edit_btn.pack(side="left", padx=(2, 0))
        edit_btn.bind("<Button-1>", lambda _e: self.app._edit_bcv_lunes())

        self._build_reminder_card(scroll_frame)

        self.offline_banner = ctk.CTkFrame(scroll_frame, fg_color=c.warning, corner_radius=0)
        ctk.CTkLabel(self.offline_banner, text="⚠️", text_color="#ffffff", font=("Segoe UI", 11), fg_color="transparent").pack(side="left", padx=(12, 6))
        self.offline_label = ctk.CTkLabel(self.offline_banner, text="", text_color="#ffffff", font=FONTS["small"], anchor="w", fg_color="transparent")
        self.offline_label.pack(side="left", fill="x", expand=True, padx=(0, 12), pady=6)

        info_frame = ctk.CTkFrame(scroll_frame, fg_color=c.card, border_color=c.card_border, border_width=1, corner_radius=6)
        info_inner = ctk.CTkFrame(info_frame, fg_color="transparent", corner_radius=0)
        info_inner.pack(padx=14, pady=10, fill="x")
        ctk.CTkLabel(info_inner, text="🔄", font=("Segoe UI", 11), fg_color="transparent").pack(side="left", padx=(0, 6))
        self.info_label = ctk.CTkLabel(info_inner, text="Las tasas se actualizan cada 25 minutos", text_color=c.muted, font=FONTS["small"], anchor="w", fg_color="transparent")
        self.info_label.pack(side="left", fill="x", expand=True)
        info_frame.pack(fill="x", padx=12, pady=(6, 12))

    def _build_reminder_card(self, parent: ctk.CTkBaseClass) -> None:
        c = self.c
        reminder_card = ctk.CTkFrame(parent, fg_color=c.card, border_color=c.card_border, border_width=1, corner_radius=6)
        reminder_card.pack(fill="x", padx=12, pady=(0, 6))
        reminder_inner = ctk.CTkFrame(reminder_card, fg_color="transparent", corner_radius=0)
        reminder_inner.pack(padx=14, pady=10, fill="x")
        ctk.CTkLabel(reminder_inner, text="🔔", font=("Segoe UI", 11), fg_color="transparent").pack(side="left", padx=(0, 8))
        reminder_text_frame = ctk.CTkFrame(reminder_inner, fg_color="transparent", corner_radius=0)
        reminder_text_frame.pack(side="left", fill="x", expand=True)
        ctk.CTkLabel(reminder_text_frame, text="Recordatorio viernes 6:00 PM", text_color=c.primary, font=FONTS["subtitle"], anchor="w", fg_color="transparent").pack(fill="x")
        ctk.CTkLabel(reminder_text_frame, text="Te avisa si aún no has ingresado la tasa", text_color=c.muted, font=FONTS["small"], anchor="w", fg_color="transparent").pack(fill="x")
        self.reminder_var = ctk.BooleanVar(value=self.reminder_enabled)
        reminder_check = ctk.CTkSwitch(reminder_inner, text="", variable=self.reminder_var, command=self.app._toggle_reminder, width=40)
        reminder_check.pack(side="right", padx=(8, 0))

    def update_rates(self, rates: Dict[str, Any]) -> None:
        c = self.c
        bcv = rates.get("bcv")
        parallel = rates.get("parallel")
        eur = rates.get("eur")
        binance = rates.get("binance_p2p")
        fetched = rates.get("fetched_at")

        self.card_bcv.update_rate(bcv, fetched)
        self.card_parallel.update_rate(parallel, fetched)
        self.card_eur.update_rate(eur, fetched)
        self.card_binance.update_rate(binance, fetched)
        self.card_lunes.update_rate(self.bcv_lunes, self.bcv_lunes_updated_at)

        self.spread_indicator.update(bcv, parallel)
        self.spread_lunes.update(self.bcv_lunes, parallel)

        bcv_f = float(bcv) if bcv else None
        par_f = float(parallel) if parallel else None
        if bcv_f and par_f:
            pct = ((par_f - bcv_f) / bcv_f) * 100
            if pct > 20 and not self._brecha_notified:
                self._brecha_notified = True
                from app.system_tray import send_notification
                send_notification("⚠️ Brecha alta", f"La brecha BCV vs Paralelo es de {pct:.1f}%")

        self.update_offline_banner(False)

    def update_offline_banner(self, offline: bool, cached_at: str = "") -> None:
        if offline:
            msg = f"Sin conexión — Mostrando últimas tasas disponibles"
            if cached_at:
                try:
                    t = datetime.fromisoformat(cached_at.replace("Z", "+00:00"))
                    msg += f" ({t.strftime('%I:%M %p')})"
                except (ValueError, TypeError):
                    pass
            self.offline_label.configure(text=msg)
            self.offline_banner.pack(fill="x", padx=12, pady=(0, 6))
        else:
            self.offline_banner.pack_forget()

    def show_loading(self) -> None:
        for card in [self.card_bcv, self.card_parallel, self.card_eur, self.card_binance]:
            card.show_loading()
