"""
Clase principal TasaDelDiaApp — aplicación de escritorio para tasas de cambio.
"""

from __future__ import annotations

import logging
import queue
import tkinter as tk
import customtkinter as ctk
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Any, Dict, Optional

from app.api import ApiError, RatesDict, fetch_all_rates
from app.storage import (
    get_historical_rates,
    get_today_key,
    format_date_key,
    load_cache_rates,
    load_config,
    save_cache_rates,
    save_config,
    save_today_historical_rate,
    set_manual_historical_rate,
    parse_date_from_display,
)
from app.theme import FONTS, Theme, get_system_theme, resolve_theme, apply_ctk_theme
from app.widgets import REFRESH_MINUTES, RateCard, SpreadIndicator, TimerBar
from app.widget_window import WidgetWindow
from app.system_tray import send_notification, start_tray, stop_tray
from app.auto_update import check_for_updates, APP_VERSION

logger = logging.getLogger(__name__)


class TasaDelDiaApp:
    """Aplicación principal de Tasa del Día."""

    def __init__(self) -> None:
        ctk.set_appearance_mode("system")
        ctk.set_default_color_theme("dark-blue")
        self.window = ctk.CTk()
        self.window.title("Tasa del Día — Venezuela")
        self.window.resizable(True, True)
        self.window.minsize(420, 600)

        # Set window icon
        self._set_window_icon()

        screen_w = self.window.winfo_screenwidth()
        screen_h = self.window.winfo_screenheight()
        x = (screen_w - 500) // 2
        y = (screen_h - 750) // 2
        self.window.geometry(f"500x750+{x}+{max(0, y - 50)}")

        # ─── Executor para tareas en segundo plano ───
        self._executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="tasa")

        # ─── Estado interno ───
        self.offline_mode: bool = False
        self.cached_rates: Optional[Dict[str, Any]] = None

        self.theme_mode: str = "system"
        self.actual_theme: Theme = resolve_theme(self.theme_mode)

        self.rates: RatesDict = {}
        self.converter_rates: Dict[str, Any] = {}
        self.is_loading: bool = False
        self._refresh_timer: Optional[str] = None
        self._theme_poll_timer: Optional[str] = None
        self._countdown: int = REFRESH_MINUTES * 60
        self._countdown_timer: Optional[str] = None

        # Widget compacto
        self.widget: Optional[WidgetWindow] = None

        # Control de notificación de brecha alta
        self._brecha_notified: bool = False

        # Diálogo activo (para Esc)
        self._active_dialog: Optional[ctk.CTkToplevel] = None

        # BCV Lunes state
        bcv_config = load_config()
        self.bcv_lunes: Optional[float] = bcv_config.get("bcv_lunes")
        self.bcv_lunes_updated_at: Optional[str] = bcv_config.get("bcv_lunes_updated_at")

        # Widget state: starts hidden, created on first use
        self._widget_enabled: bool = bcv_config.get("widget_enabled", False)

        # Reminder state
        self.reminder_enabled: bool = bcv_config.get("reminder_enabled", False)
        self._reminder_shown_this_friday: bool = False
        self._reminder_timer: Optional[str] = None

        # ─── Cola thread-safe para resultados de API ───
        self._result_queue: queue.Queue = queue.Queue()
        self._poll_queue()

        # ─── Teardown flag ───
        self._build_ui()
        self._bind_events()
        self._start_theme_polling()
        self._start_countdown()
        self._start_reminder_check()
        self._init_tray()
        # Check reminder immediately on startup
        if self.reminder_enabled and not self._reminder_shown_this_friday:
            self.window.after(1000, self._check_reminder)

        # Auto-mostrar widget si estaba habilitado
        if self._widget_enabled:
            self.window.after(500, self._show_widget)

        # Check for updates (silent, on startup)
        self.window.after(5000, self._check_updates_silent)

        self.refresh_rates()

    # ─── Window icon ───────────────────────────────────────────────

    def _set_window_icon(self) -> None:
        """Intenta establecer el icono de la ventana."""
        try:
            from app.utils import resource_path  # type: ignore[attr-defined]
            icon_path = resource_path("app_icon.ico")
            if icon_path and __import__("os").path.exists(icon_path):
                self.window.iconbitmap(icon_path)
        except Exception:
            pass

    # ─── Theme ─────────────────────────────────────────────────────

    def _resolve_theme(self) -> Theme:
        mode = self.theme_mode
        if mode == "system":
            apply_ctk_theme("system")
        else:
            apply_ctk_theme(mode)
        return resolve_theme(mode)

    def _rebuild_ui(self) -> None:
        """Reconstruye toda la UI (usado al cambiar de tema)."""
        self._cancel_timers()

        old_rates = self.rates
        old_converter = self.converter_rates
        old_countdown = self._countdown
        old_bcv_lunes = self.bcv_lunes
        old_bcv_lunes_updated = self.bcv_lunes_updated_at
        old_reminder = self.reminder_enabled
        old_offline = self.offline_mode
        old_cached = self.cached_rates

        for widget in self.window.winfo_children():
            widget.destroy()

        self.actual_theme = self._resolve_theme()
        c = self.actual_theme
        self.window.configure(bg=c.bg)

        self.bcv_lunes = old_bcv_lunes
        self.bcv_lunes_updated_at = old_bcv_lunes_updated
        self.reminder_enabled = old_reminder
        self.offline_mode = old_offline
        self.cached_rates = old_cached

        self._build_ui()
        self._start_theme_polling()
        self._start_countdown()
        self._start_reminder_check()

        self.rates = old_rates
        self.converter_rates = old_converter
        self._countdown = old_countdown

        # Recrear widget ANTES de _on_rates_loaded para asegurar que
        # el widget con el nuevo tema exista incluso si _on_rates_loaded falla
        if self.widget:
            was_widget_visible = self.widget.is_visible
            self.widget.destroy()
            self.widget = WidgetWindow(self, self.actual_theme)
            if was_widget_visible:
                self.widget.show()
                bcv = old_rates.get("bcv") if old_rates else None
                paralelo = old_rates.get("parallel") if old_rates else None
                fetched = old_rates.get("fetched_at") if old_rates else None
                self.widget.update_rates(bcv, paralelo, fetched)
            self._widget_enabled = was_widget_visible

        if old_rates:
            self._on_rates_loaded(old_rates)

        # Restore offline mode after theme rebuild
        if old_offline:
            if old_cached:
                self._set_offline_mode(True, old_cached.get("cached_at", ""))
            else:
                self._set_offline_mode(True)

    def _switch_theme_mode(self) -> None:
        """Cambia al siguiente modo de tema."""
        modes = ["dark", "light", "system"]
        idx = modes.index(self.theme_mode)
        self.theme_mode = modes[(idx + 1) % len(modes)]
        logger.info("Cambiando tema a: %s", self.theme_mode)
        self._rebuild_ui()

    def _theme_label(self) -> str:
        labels = {
            "dark": "🌙 Oscuro",
            "light": "☀️ Claro",
            "system": "🖥️ Sistema",
        }
        return labels.get(self.theme_mode, "🌙")

    def _blend_bg(self, color: str, alpha: float) -> str:
        """Mezcla un color con el fondo actual."""
        if color.startswith("#") and len(color) == 7:
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            bg_color = self.actual_theme.bg
            bg_r = int(bg_color[1:3], 16) if bg_color.startswith("#") and len(bg_color) == 7 else 0x0A
            bg_g = int(bg_color[3:5], 16) if bg_color.startswith("#") and len(bg_color) == 7 else 0x0A
            bg_b = int(bg_color[5:7], 16) if bg_color.startswith("#") and len(bg_color) == 7 else 0x14
            blend_r = int(r * alpha + bg_r * (1 - alpha))
            blend_g = int(g * alpha + bg_g * (1 - alpha))
            blend_b = int(b * alpha + bg_b * (1 - alpha))
            return f"#{blend_r:02x}{blend_g:02x}{blend_b:02x}"
        return color

    # ─── UI ────────────────────────────────────────────────────────

    def _build_ui(self) -> None:
        c = self.actual_theme
        self.window.configure(fg_color=c.bg)

        # ─── Top Bar ───
        top = ctk.CTkFrame(self.window, fg_color=c.bg, corner_radius=0)
        top.pack(fill="x", padx=20, pady=(16, 6))

        title_frame = ctk.CTkFrame(top, fg_color=c.bg, corner_radius=0)
        title_frame.pack(fill="x")

        title_frame.grid_columnconfigure(0, weight=0)
        title_frame.grid_columnconfigure(1, weight=1)
        title_frame.grid_columnconfigure(2, weight=0)
        title_frame.grid_columnconfigure(3, weight=0)
        title_frame.grid_columnconfigure(4, weight=0)

        # Icon with modern rounded container
        icon_container = ctk.CTkFrame(
            title_frame, fg_color=self._blend_bg(c.highlight, 0.1),
            corner_radius=10, width=44, height=44,
        )
        icon_container.grid(row=0, column=0, padx=(0, 14), pady=2)
        icon_container.grid_propagate(False)
        ctk.CTkLabel(
            icon_container, text="📉",
            font=("Segoe UI", 20), fg_color="transparent",
        ).place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(
            title_frame, text="Tasa del Día", font=FONTS["title"],
            text_color=c.primary, anchor="w",
        ).grid(row=0, column=1, sticky="w")

        ctk.CTkLabel(
            title_frame, text="🇻🇪",             font=("Segoe UI", 14),
            fg_color="transparent",
        ).grid(row=0, column=2, padx=(0, 8))

        ctk.CTkButton(
            title_frame, text=self._theme_label(),             font=("Segoe UI", 10),
            fg_color=c.card, text_color=c.secondary,
            hover_color=c.accent, corner_radius=8,
            command=self._switch_theme_mode, width=60, height=28,
        ).grid(row=0, column=3, padx=(0, 4))

        ctk.CTkButton(
            title_frame, text="📌 Widget", font=FONTS["section"],
            fg_color=c.card, text_color=c.secondary,
            hover_color=c.accent, corner_radius=8,
            command=self._toggle_widget, width=60, height=28,
        ).grid(row=0, column=4)

        ctk.CTkLabel(
            top, text="Tasas de cambio del Bolívar Venezolano",
            text_color=c.secondary, font=FONTS["subtitle"], anchor="w",
        ).pack(fill="x", padx=(58, 0), pady=(2, 0))

        # Timer bar
        self.timer_bar = TimerBar(self.window, c)
        self.timer_bar.pack(fill="x", padx=16, pady=(8, 6))

        # ─── CTkTabview ───
        self.notebook = ctk.CTkTabview(
            self.window, corner_radius=10,
            fg_color=c.bg,
            segmented_button_fg_color=c.card,
            segmented_button_selected_color=c.accent,
            segmented_button_selected_hover_color=self._blend_bg(c.highlight, 0.3),
            segmented_button_unselected_color=c.card,
            text_color=c.primary,
            segmented_button_unselected_hover_color=c.accent,
        )
        self.notebook.pack(fill="both", expand=True, padx=16, pady=(4, 8))

        # ═══════ TAB 1: TASAS ═══════
        self.notebook.add("📊  Tasas")
        self._build_rates_tab()
        # ═══════ TAB 2: CONVERSOR ═══════
        self.notebook.add("💱  Conversor")
        self._build_converter_tab()
        # ═══════ TAB 3: HISTORIAL ═══════
        self.notebook.add("📅  Historial")
        self._build_history_tab()

    def _create_scrollable(self, parent: ctk.CTkBaseClass) -> ctk.CTkScrollableFrame:
        c = self.actual_theme
        scroll = ctk.CTkScrollableFrame(parent, fg_color=c.bg, corner_radius=0)
        scroll.pack(fill="both", expand=True)
        return scroll

    def _build_rates_tab(self) -> None:
        c = self.actual_theme
        tab = self.notebook.tab("📊  Tasas")
        scroll_frame = self._create_scrollable(tab)

        # Spread indicators
        self.spread_indicator = SpreadIndicator(
            scroll_frame, c,
            title="BRECHA BCV VS PARALELO", icon="⚖️",
            color_a=c.success, label_a="●  BCV",
            color_b=c.highlight, label_b="●  Paralelo",
        )

        self.spread_lunes = SpreadIndicator(
            scroll_frame, c,
            title="BRECHA BCV (LUNES) VS PARALELO", icon="📅",
            color_a=c.bcv_lunes, label_a="●  BCV (Lunes)",
            color_b=c.highlight, label_b="●  Paralelo",
        )

        # Rate Cards
        self.card_bcv = RateCard(
            scroll_frame, "BCV (Oficial)", "Banco Central de Venezuela",
            "🏛️", c.success, c,
        )
        self.card_bcv.pack(fill="x", padx=12, pady=(4, 6))

        self.card_parallel = RateCard(
            scroll_frame, "Dólar Paralelo", "Mercado paralelo / promedio",
            "📈", c.highlight, c,
        )
        self.card_parallel.pack(fill="x", padx=12, pady=6)

        self.card_eur = RateCard(
            scroll_frame, "Euro (BCV)", "Tasa de referencia oficial",
            "💶", c.info, c,
        )
        self.card_eur.pack(fill="x", padx=12, pady=6)

        self.card_binance = RateCard(
            scroll_frame, "Binance P2P", "USDT / VES — Mercado P2P",
            "₿", c.warning, c,
        )
        self.card_binance.pack(fill="x", padx=12, pady=6)

        # BCV Lunes card
        self.card_lunes = RateCard(
            scroll_frame, "BCV (Lunes)", "Tasa manual del lunes",
            "📅", c.bcv_lunes, c,
        )
        self.card_lunes.pack(fill="x", padx=12, pady=6)
        self.card_lunes.update_rate(self.bcv_lunes, self.bcv_lunes_updated_at)

        # Edit button for BCV Lunes
        edit_btn = ctk.CTkLabel(
            self.card_lunes.rate_label.master, text="✏️", text_color=c.bcv_lunes,
            font=("Segoe UI", 10), cursor="hand2", fg_color="transparent",
        )
        edit_btn.pack(side="left", padx=(2, 0))
        edit_btn.bind("<Button-1>", lambda _e: self._edit_bcv_lunes())

        # Reminder toggle
        self._build_reminder_card(scroll_frame)


        # Offline banner (hidden by default)
        self.offline_banner = ctk.CTkFrame(scroll_frame, fg_color=c.warning, corner_radius=0)
        ctk.CTkLabel(
            self.offline_banner, text="⚠️", text_color="#ffffff",
            font=("Segoe UI", 11), fg_color="transparent",
        ).pack(side="left", padx=(12, 6))
        self.offline_label = ctk.CTkLabel(
            self.offline_banner, text="", text_color="#ffffff",
            font=FONTS["small"], anchor="w", fg_color="transparent",
        )
        self.offline_label.pack(side="left", fill="x", expand=True, padx=(0, 12), pady=6)

        # Info bar
        info_frame = ctk.CTkFrame(scroll_frame, fg_color=c.card, border_color=c.card_border, border_width=1, corner_radius=6)
        info_frame.pack(fill="x", padx=12, pady=(6, 12))
        info_inner = ctk.CTkFrame(info_frame, fg_color="transparent", corner_radius=0)
        info_inner.pack(padx=14, pady=10, fill="x")

        ctk.CTkLabel(
            info_inner, text="🔄", font=("Segoe UI", 11), fg_color="transparent",
        ).pack(side="left", padx=(0, 6))
        self.info_label = ctk.CTkLabel(
            info_inner, text="Las tasas se actualizan cada 25 minutos",
            text_color=c.muted, font=FONTS["small"], anchor="w", fg_color="transparent",
        )
        self.info_label.pack(side="left", fill="x", expand=True)

    def _build_reminder_card(self, parent: ctk.CTkBaseClass) -> None:
        c = self.actual_theme
        reminder_card = ctk.CTkFrame(parent, fg_color=c.card, corner_radius=8)
        reminder_card.pack(fill="x", padx=12, pady=(0, 6))
        reminder_inner = ctk.CTkFrame(reminder_card, fg_color=c.card, corner_radius=0)
        reminder_inner.pack(padx=14, pady=10, fill="x")

        ctk.CTkLabel(
            reminder_inner, text="🔔", font=("Segoe UI", 11),
        ).pack(side="left", padx=(0, 8))
        reminder_text_frame = ctk.CTkFrame(reminder_inner, fg_color=c.card, corner_radius=0)
        reminder_text_frame.pack(side="left", fill="x", expand=True)
        ctk.CTkLabel(
            reminder_text_frame, text="Recordatorio viernes 6:00 PM",
            text_color=c.primary, font=FONTS["subtitle"], anchor="w",
        ).pack(fill="x")
        ctk.CTkLabel(
            reminder_text_frame, text="Te avisa si aún no has ingresado la tasa",
            text_color=c.muted, font=FONTS["small"], anchor="w",
        ).pack(fill="x")

        self.reminder_var = ctk.BooleanVar(value=self.reminder_enabled)
        reminder_switch = ctk.CTkSwitch(
            reminder_inner, variable=self.reminder_var,
            command=self._toggle_reminder,
            fg_color=c.card_border, progress_color=c.success,
            button_color=c.accent, button_hover_color=c.highlight,
        )
        reminder_switch.pack(side="right", padx=(8, 0))


    def _build_converter_tab(self) -> None:
        c = self.actual_theme
        tab = self.notebook.tab("💱  Conversor")
        cv_scroll = ctk.CTkScrollableFrame(tab, fg_color=c.bg, corner_radius=0)
        cv_scroll.pack(fill="both", expand=True)

        conv_content = ctk.CTkFrame(cv_scroll, fg_color=c.bg, corner_radius=0)
        conv_content.pack(fill="x", padx=12, pady=12)

        ctk.CTkLabel(
            conv_content, text="TASA A USAR",
            text_color=c.muted, font=FONTS["section"], anchor="w",
        ).pack(fill="x", pady=(0, 8))

        self.rate_var_conv = ctk.StringVar(value="bcv")
        self._rate_value_labels: Dict[str, ctk.CTkLabel] = {}
        rate_options = [
            ("bcv", "BCV (Oficial)", c.success),
            ("parallel", "Dólar Paralelo", c.highlight),
            ("binance_p2p", "Binance P2P", c.warning),
            ("eur", "Euro (BCV)", c.info),
            ("bcv_lunes", "BCV (Lunes)", c.bcv_lunes),
        ]

        for key, label, color in rate_options:
            frame = ctk.CTkFrame(conv_content, fg_color=c.card, corner_radius=8)
            frame.pack(fill="x", pady=(0, 6))

            rb = ctk.CTkRadioButton(
                frame, text=label, variable=self.rate_var_conv, value=key,
                text_color=c.secondary, font=FONTS["subtitle"],
                fg_color=c.highlight, hover_color=c.accent,
                command=self._on_rate_change,
            )
            rb.pack(side="left", fill="x", expand=True, padx=12, pady=10)

            val_label = ctk.CTkLabel(
                frame, text="—", text_color=color,
                font=("Segoe UI", 11, "bold"),
            )
            if key == "bcv_lunes":
                val_label.configure(cursor="hand2")
                val_label.bind("<Button-1>", lambda _e: self._edit_bcv_lunes())
            val_label.pack(side="right", padx=12)
            self._rate_value_labels[key] = val_label

        conv_card = ctk.CTkFrame(conv_content, fg_color=c.card, corner_radius=8)
        conv_card.pack(fill="x", pady=(8, 0))
        inner = ctk.CTkFrame(conv_card, fg_color=c.card, corner_radius=0)
        inner.pack(padx=16, pady=16, fill="x")

        self.conv_mode = ctk.StringVar(value="usd_to_bs")
        mode_frame = ctk.CTkFrame(inner, fg_color=c.input_bg, corner_radius=6)
        mode_frame.pack(fill="x", pady=(0, 14))

        accent_bg = c.accent
        self.btn_usd = ctk.CTkButton(
            mode_frame, text="USD → Bs.", font=FONTS["button"],
            fg_color=accent_bg, text_color=c.primary,
            hover_color=c.highlight, corner_radius=6,
            command=lambda: self._set_mode("usd_to_bs"),
        )
        self.btn_usd.pack(side="left", fill="x", expand=True, padx=(2, 1), pady=2)

        self.btn_bs = ctk.CTkButton(
            mode_frame, text="Bs. → USD", font=FONTS["button"],
            fg_color=c.input_bg, text_color=c.muted,
            hover_color=accent_bg, corner_radius=6,
            command=lambda: self._set_mode("bs_to_usd"),
        )
        self.btn_bs.pack(side="right", fill="x", expand=True, padx=(1, 2), pady=2)

        ctk.CTkLabel(
            inner, text="MONTO", text_color=c.secondary,
            font=FONTS["small"], anchor="w",
        ).pack(fill="x", pady=(0, 4))

        entry_frame = ctk.CTkFrame(inner, fg_color=c.input_bg, corner_radius=6)
        entry_frame.pack(fill="x")

        self.amount_entry = ctk.CTkEntry(
            entry_frame,             font=("Segoe UI", 22, "bold"),
            justify="center", fg_color=c.input_bg, text_color=c.input_text,
            border_width=0,
        )
        self.amount_entry.pack(side="left", fill="x", expand=True, padx=12, pady=10)
        self.amount_entry.insert(0, "100")
        self.amount_entry.bind("<Return>", lambda _e: self.do_conversion())

        paste_btn = ctk.CTkButton(
            entry_frame, text="📋 Pegar", font=FONTS["section"],
            fg_color=c.input_bg, text_color=c.muted,
            hover_color=c.accent, corner_radius=6,
            command=self._paste_from_clipboard, width=60,
        )
        paste_btn.pack(side="right", padx=(0, 6))
        self._paste_btn = paste_btn

        quick_frame = ctk.CTkFrame(inner, fg_color=c.card, corner_radius=0)
        quick_frame.pack(fill="x", pady=(8, 0))

        QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000]
        for val in QUICK_AMOUNTS:
            btn = ctk.CTkButton(
                quick_frame, text=f"{val:,}".replace(",", "."),
                font=FONTS["section"],
                fg_color=c.input_bg, text_color=c.secondary,
                hover_color=c.accent, corner_radius=6, height=28,
                command=lambda v=val: self._set_quick_amount(v),
            )
            btn.pack(side="left", fill="x", expand=True, padx=1)

        self.convert_btn = ctk.CTkButton(
            inner, text="💱  Convertir", font=FONTS["button"],
            fg_color=c.accent, text_color=c.primary,
            hover_color=c.highlight, corner_radius=8,
            command=self.do_conversion,
        )
        self.convert_btn.pack(fill="x", pady=(12, 0))

        result_frame = ctk.CTkFrame(inner, fg_color=c.card, corner_radius=8)
        result_frame.pack(fill="x", pady=(12, 0))
        result_inner = ctk.CTkFrame(result_frame, fg_color=c.card, corner_radius=0)
        result_inner.pack(padx=16, pady=14, fill="x")

        ctk.CTkLabel(
            result_inner, text="RESULTADO", text_color=c.secondary,
            font=FONTS["small"], anchor="w",
        ).pack(fill="x")

        self.result_from = ctk.CTkLabel(
            result_inner, text="", text_color=c.primary,
            font=FONTS["result"], anchor="center", cursor="hand2",
        )
        self.result_from.pack(fill="x", pady=(6, 0))
        self.result_from.bind(
            "<Button-1>",
            lambda _e: self._copy_result_text(self.result_from.cget("text")),
        )

        arrow_frame2 = ctk.CTkFrame(result_inner, fg_color=c.card, corner_radius=0)
        arrow_frame2.pack(fill="x", pady=4)
        ctk.CTkLabel(
            arrow_frame2, text="▼", text_color=c.highlight,
            font=("Segoe UI", 16),
        ).pack()

        self.result_to = ctk.CTkLabel(
            result_inner, text="", text_color=c.highlight,
            font=FONTS["result"], anchor="center", cursor="hand2",
        )
        self.result_to.pack(fill="x")
        self.result_to.bind(
            "<Button-1>",
            lambda _e: self._copy_result_text(self.result_to.cget("text")),
        )

        self.result_info = ctk.CTkLabel(
            result_inner, text="", text_color=c.muted,
            font=FONTS["small"], anchor="center",
        )
        self.result_info.pack(fill="x", pady=(4, 0))

        self.result_copy_feedback = ctk.CTkLabel(
            result_inner, text="", text_color=c.success,
            font=("Segoe UI", 8, "bold"), anchor="center",
        )
        self.result_copy_feedback.pack(fill="x", pady=(2, 0))
        self._result_copy_timer: Optional[str] = None

        cv_spread_frame = ctk.CTkFrame(cv_scroll, fg_color=c.bg, corner_radius=0)
        cv_spread_frame.pack(fill="x", padx=12, pady=(0, 12))

        self.cv_spread_bcv = SpreadIndicator(
            cv_spread_frame, c,
            title="BRECHA BCV VS PARALELO", icon="⚖️",
            color_a=c.success, label_a="●  BCV",
            color_b=c.highlight, label_b="●  Paralelo",
        )
        self.cv_spread_lunes = SpreadIndicator(
            cv_spread_frame, c,
            title="BRECHA BCV (LUNES) VS PARALELO", icon="📅",
            color_a=c.bcv_lunes, label_a="●  BCV (Lunes)",
            color_b=c.highlight, label_b="●  Paralelo",
        )


    # ─── Historial (reemplaza Tendencia) ───────────────────────────

    def _build_history_tab(self) -> None:
        c = self.actual_theme
        tab = self.notebook.tab("📅  Historial")
        hist_scroll = ctk.CTkScrollableFrame(tab, fg_color=c.bg, corner_radius=0)
        hist_scroll.pack(fill="both", expand=True)

        hist_header = ctk.CTkFrame(hist_scroll, fg_color=c.bg, corner_radius=0)
        hist_header.pack(fill="x", padx=12, pady=(12, 4))

        ctk.CTkLabel(
            hist_header, text="SELECCIONAR FECHA", text_color=c.muted,
            font=FONTS["section"], anchor="w",
        ).pack(fill="x")

        self._hist_chips_frame = ctk.CTkFrame(hist_scroll, fg_color=c.bg, corner_radius=0)
        self._hist_chips_frame.pack(fill="x", padx=12, pady=(4, 8))

        custom_row = ctk.CTkFrame(hist_scroll, fg_color=c.bg, corner_radius=0)
        custom_row.pack(fill="x", padx=12, pady=(0, 4))

        self._hist_custom_var = ctk.StringVar()
        self._hist_custom_entry = ctk.CTkEntry(
            custom_row, textvariable=self._hist_custom_var,
            font=("Segoe UI", 12, "bold"), justify="center",
            fg_color=c.input_bg, text_color=c.input_text,
            border_width=0,
        )
        self._hist_custom_entry.pack(side="left", fill="x", expand=True, padx=(0, 6))
        self._hist_custom_entry.insert(0, datetime.now().strftime("%d/%m/%Y"))
        self._hist_custom_entry.bind("<Return>", lambda _e: self._hist_search_date())

        ctk.CTkButton(
            custom_row, text="🔍 Ver", font=FONTS["section"],
            fg_color=c.info, text_color="#ffffff",
            hover_color=c.highlight, corner_radius=6,
            command=self._hist_search_date,
        ).pack(side="right")

        self._hist_detail_card = ctk.CTkFrame(
            hist_scroll, fg_color=c.card, corner_radius=8,
        )

        self._hist_chart_container = ctk.CTkFrame(
            hist_scroll, fg_color=c.card, corner_radius=8,
        )
        self._hist_chart_container.pack(fill="x", padx=12, pady=(0, 8))

        self._hist_list_container = ctk.CTkFrame(hist_scroll, fg_color=c.bg, corner_radius=0)
        self._hist_list_container.pack(fill="x", padx=12, pady=(0, 12))

        self._hist_selected_date: Optional[str] = None
        self._hist_copied_field: Optional[str] = None
        self._hist_copy_timer: Optional[str] = None

        self._update_history_tab()

    def _update_history_tab(self) -> None:
        """Actualiza la pestaña de historial con los datos actuales."""
        c = self.actual_theme
        historical = get_historical_rates()

        # Build sorted list (descending)
        sorted_dates = sorted(historical.keys(), reverse=True)
        last_5 = sorted_dates[:5]

        logger.info("_update_history_tab: %d fechas en histórico", len(sorted_dates))

        for w in self._hist_chips_frame.winfo_children():
            w.destroy()

        if last_5:
            chips_row = ctk.CTkFrame(self._hist_chips_frame, fg_color=c.bg, corner_radius=0)
            chips_row.pack(fill="x")

            for date_key in last_5:
                is_selected = date_key == self._hist_selected_date
                entry = historical.get(date_key, {})
                is_today = date_key == get_today_key()
                day = date_key.split("-")[2]
                months = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
                          "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
                month_abbr = months[int(date_key.split("-")[1])]
                label_text = f"{day}\n{month_abbr}"
                if is_today:
                    label_text = f"{day}\n¡Hoy!"

                btn = ctk.CTkButton(
                    chips_row, text=label_text,
                    font=("Segoe UI", 9, "bold"),
                    fg_color=c.accent if is_selected else c.card,
                    text_color=c.primary if is_selected else c.secondary,
                    hover_color=c.info, corner_radius=6,
                    width=60, height=48,
                    command=lambda dk=date_key: self._hist_select_date(dk),
                )
                btn.pack(side="left", padx=(0, 6))

                has_data = any([
                    entry.get("bcv"), entry.get("paralelo"),
                    entry.get("binance_p2p"), entry.get("euro"),
                ])
                if has_data:
                    dot = ctk.CTkLabel(
                        chips_row, text="●", text_color=c.success,
                        font=("Segoe UI", 6), fg_color="transparent",
                    )
                    dot.pack(side="left", padx=(0, 8), anchor="s")
        else:
            ctk.CTkLabel(
                self._hist_chips_frame, text="No hay fechas guardadas aún",
                text_color=c.muted, font=FONTS["small"],
                fg_color="transparent",
            ).pack()

        # ── Update detail card ──
        for w in self._hist_detail_card.winfo_children():
            w.destroy()
        self._hist_detail_card.pack_forget()

        if self._hist_selected_date and self._hist_selected_date in historical:
            self._hist_detail_card.pack(fill="x", padx=12, pady=(0, 8))
            self._render_hist_detail(historical[self._hist_selected_date])

        # ── Update chart (when no date selected) ──
        for w in self._hist_chart_container.winfo_children():
            w.destroy()

        if not self._hist_selected_date and len(sorted_dates) >= 2:
            recent = sorted(historical.items(), key=lambda x: x[0])[-5:]
            chart_inner = ctk.CTkFrame(self._hist_chart_container, fg_color=c.card, corner_radius=0)
            chart_inner.pack(fill="x", padx=14, pady=12)

            ctk.CTkLabel(
                chart_inner, text="📈 ÚLTIMOS 5 DÍAS",
                text_color=c.muted, font=FONTS["section"], anchor="w", fg_color="transparent",
            ).pack(fill="x", pady=(0, 8))

            legend = ctk.CTkFrame(chart_inner, fg_color=c.card, corner_radius=0)
            legend.pack(fill="x", pady=(0, 8))
            for lbl, clr in [("BCV", c.success), ("Paralelo", c.highlight)]:
                lf = ctk.CTkFrame(legend, fg_color="transparent", corner_radius=0)
                lf.pack(side="left", padx=(0, 12))
                ctk.CTkLabel(lf, text="●", text_color=clr,
                             font=("Segoe UI", 8), fg_color="transparent").pack(side="left")
                ctk.CTkLabel(lf, text=lbl, text_color=c.muted,
                             font=FONTS["small"], fg_color="transparent").pack(side="left", padx=(2, 0))

            bcv_vals = [v.get("bcv", 0) or 0 for _, v in recent]
            par_vals = [v.get("paralelo", 0) or 0 for _, v in recent]
            all_vals = [x for x in bcv_vals + par_vals if x > 0]

            if all_vals:
                max_val = max(all_vals)
                min_val = min(all_vals)
                rng = max_val - min_val or 1
                chart_h = 100

                bars_frame = ctk.CTkFrame(chart_inner, fg_color=c.card, corner_radius=0)
                bars_frame.pack(fill="x")

                for i, (date_key, _) in enumerate(recent):
                    col = ctk.CTkFrame(bars_frame, fg_color="transparent", corner_radius=0)
                    col.pack(side="left", fill="x", expand=True, padx=1)

                    for val, clr in [(bcv_vals[i], c.success), (par_vals[i], c.highlight)]:
                        if val and val > 0:
                            pct = ((val - min_val) / rng) * 0.8 + 0.2
                            bh = max(int(pct * chart_h), 6)
                            bar = ctk.CTkFrame(col, fg_color=clr, corner_radius=0, height=bh)
                            bar.pack(fill="x", pady=1, padx=2)

                    parts = date_key.split("-")
                    lbl = f"{parts[2]}/{parts[1]}"
                    ctk.CTkLabel(
                        col, text=lbl, text_color=c.muted,
                        font=("Segoe UI", 7), anchor="center", fg_color="transparent",
                    ).pack(fill="x")

        # ── Update list (when no date selected) ──
        for w in self._hist_list_container.winfo_children():
            w.destroy()

        if not self._hist_selected_date:
            if sorted_dates:
                for date_key in sorted_dates:
                    entry = historical[date_key]
                    card = ctk.CTkFrame(
                        self._hist_list_container, fg_color=c.card,
                        border_color=c.card_border, border_width=1, corner_radius=6,
                    )
                    card.pack(fill="x", pady=(0, 6))
                    inner = ctk.CTkFrame(card, fg_color="transparent", corner_radius=0)
                    inner.pack(fill="x", padx=12, pady=8)

                    hdr = ctk.CTkFrame(inner, fg_color="transparent", corner_radius=0)
                    hdr.pack(fill="x", pady=(0, 6))
                    ctk.CTkLabel(
                        hdr, text=f"📅 {format_date_key(date_key)}",
                        text_color=c.primary, font=("Segoe UI", 11, "bold"), fg_color="transparent",
                    ).pack(side="left")
                    if entry.get("manual"):
                        ctk.CTkLabel(
                            hdr, text="  ✏️ Manual", text_color=c.muted,
                            font=("Segoe UI", 8), fg_color="transparent",
                        ).pack(side="left", padx=(4, 0))

                    ctk.CTkButton(
                        hdr, text="Ver detalle", font=FONTS["section"],
                        fg_color=c.accent, text_color=c.primary,
                        hover_color=c.info, corner_radius=6, height=24,
                        command=lambda dk=date_key: self._hist_select_date(dk),
                    ).pack(side="right")

                    rates_row = ctk.CTkFrame(inner, fg_color="transparent", corner_radius=0)
                    rates_row.pack(fill="x")
                    fields = [
                        ("BCV", entry.get("bcv"), c.success),
                        ("Paralelo", entry.get("paralelo"), c.highlight),
                        ("Binance", entry.get("binance_p2p"), c.warning),
                        ("Euro", entry.get("euro"), c.info),
                    ]
                    for lbl, val, clr in fields:
                        col = ctk.CTkFrame(rates_row, fg_color="transparent", corner_radius=0)
                        col.pack(side="left", fill="x", expand=True)
                        ctk.CTkLabel(
                            col, text=lbl, text_color=c.muted,
                            font=("Segoe UI", 8), fg_color="transparent",
                        ).pack()
                        val_text = f"Bs. {val:,.2f}" if val else "—"
                        ctk.CTkLabel(
                            col, text=val_text,
                            text_color=clr if val else c.muted,
                            font=("Segoe UI", 10, "bold"), fg_color="transparent",
                        ).pack()
            else:
                ctk.CTkLabel(
                    self._hist_list_container,
                    text="No hay tasas históricas guardadas aún.\n"
                         "Se guardarán automáticamente al obtener las tasas del día.",
                    text_color=c.muted, font=FONTS["small"],
                    justify="center", wraplength=350, fg_color="transparent",
                ).pack(pady=20)

    def _hist_select_date(self, date_key: str) -> None:
        """Selecciona o deselecciona una fecha del historial."""
        if self._hist_selected_date == date_key:
            self._hist_selected_date = None
        else:
            self._hist_selected_date = date_key
        self._update_history_tab()

    def _hist_search_date(self) -> None:
        raw = self._hist_custom_var.get().strip()
        date_key = parse_date_from_display(raw)
        if date_key is None:
            return
        historical = get_historical_rates()
        if date_key not in historical:
            return
        self._hist_selected_date = date_key
        self._update_history_tab()

    def _render_hist_detail(self, entry: Dict[str, Any]) -> None:
        """Renderiza la tarjeta de detalle de una fecha seleccionada."""
        c = self.actual_theme
        card = self._hist_detail_card

        inner = ctk.CTkFrame(card, fg_color=c.card, corner_radius=0)
        inner.pack(fill="x", padx=14, pady=12)

        hdr = ctk.CTkFrame(inner, fg_color=c.card, corner_radius=0)
        hdr.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(
            hdr, text=f"📅 {format_date_key(self._hist_selected_date)}",
            text_color=c.primary, font=("Segoe UI", 14, "bold"), fg_color="transparent",
        ).pack(side="left")
        if self._hist_selected_date == get_today_key():
            ctk.CTkLabel(
                hdr, text="  HOY", text_color=c.success,
                font=("Segoe UI", 8, "bold"), fg_color="transparent",
            ).pack(side="left", padx=(4, 0))
        if entry.get("manual"):
            ctk.CTkLabel(
                hdr, text="  ✏️ Manual", text_color=c.muted,
                font=("Segoe UI", 8), fg_color="transparent",
            ).pack(side="left", padx=(4, 0))

        ctk.CTkButton(
            hdr, text="✕", font=("Segoe UI", 10, "bold"),
            fg_color=c.card, text_color=c.muted,
            hover_color=c.highlight, corner_radius=4, width=30, height=24,
            command=lambda: self._hist_select_date(self._hist_selected_date or ""),
        ).pack(side="right")

        rates = [
            ("BCV (Oficial)", entry.get("bcv"), c.success),
            ("Paralelo", entry.get("paralelo"), c.highlight),
            ("Binance P2P", entry.get("binance_p2p"), c.warning),
            ("Euro (BCV)", entry.get("euro"), c.info),
        ]

        for label_text, val, color in rates:
            row = ctk.CTkFrame(inner, fg_color=c.input_bg, corner_radius=0)
            row.pack(fill="x", pady=(0, 4))

            ctk.CTkLabel(
                row, text=f"●  {label_text}", text_color=color if val else c.muted,
                font=("Segoe UI", 10), anchor="w", fg_color="transparent",
            ).pack(side="left", fill="x", expand=True, padx=8, pady=6)

            val_str = f"Bs. {val:,.2f}" if val else "—"
            ctk.CTkLabel(
                row, text=val_str, text_color=color if val else c.muted,
                font=("Segoe UI", 12, "bold"), fg_color="transparent",
            ).pack(side="right", padx=4)

            if val:
                field_key = f"hist_{label_text.lower().split()[0]}"
                is_copied = self._hist_copied_field == field_key
                copy_btn = ctk.CTkButton(
                    row, text="📋" if not is_copied else "✓",
                    font=("Segoe UI", 8),
                    fg_color=c.accent if not is_copied else c.success,
                    text_color=c.primary if not is_copied else "#ffffff",
                    hover_color=c.info, corner_radius=4, width=28, height=20,
                    command=lambda fk=field_key, v=val:
                        self._hist_copy_rate(fk, f"Bs. {v:,.2f}"),
                )
                copy_btn.pack(side="right", padx=(2, 6))

        all_btn_row = ctk.CTkFrame(inner, fg_color=c.card, corner_radius=0)
        all_btn_row.pack(fill="x", pady=(8, 0))
        is_all_copied = self._hist_copied_field == "hist_all"
        ctk.CTkButton(
            all_btn_row, text="📋  Copiar todo" if not is_all_copied else "✓  ¡Copiado!",
            font=FONTS["button"],
            fg_color=c.info if not is_all_copied else c.success,
            text_color="#ffffff",
            hover_color=c.highlight, corner_radius=6,
            command=self._hist_copy_all,
        ).pack(fill="x")

    def _hist_copy_rate(self, field_key: str, text: str) -> None:
        """Copia una tasa individual del historial al portapapeles."""
        self.window.clipboard_clear()
        self.window.clipboard_append(text)
        self._hist_copied_field = field_key
        if self._hist_copy_timer:
            self.window.after_cancel(self._hist_copy_timer)
        self._hist_copy_timer = self.window.after(
            1500,
            lambda: (setattr(self, "_hist_copied_field", None)
                     or self._update_history_tab()),
        )
        self._update_history_tab()

    def _hist_copy_all(self) -> None:
        """Copia todas las tasas de la fecha seleccionada."""
        if not self._hist_selected_date:
            return
        historical = get_historical_rates()
        entry = historical.get(self._hist_selected_date, {})
        lines = [
            f"📅 Fecha: {format_date_key(self._hist_selected_date)}",
            f"🏦 BCV: Bs. {entry.get('bcv', 0):,.2f}" if entry.get("bcv") else "🏦 BCV: —",
            f"💵 Paralelo: Bs. {entry.get('paralelo', 0):,.2f}" if entry.get("paralelo") else "💵 Paralelo: —",
            f"📊 Binance P2P: Bs. {entry.get('binance_p2p', 0):,.2f}" if entry.get("binance_p2p") else "📊 Binance P2P: —",
            f"💶 Euro: Bs. {entry.get('euro', 0):,.2f}" if entry.get("euro") else "💶 Euro: —",
        ]
        if entry.get("manual"):
            lines.append("📝 Ingreso manual")
        text = "\n".join(lines)
        self._hist_copy_rate("hist_all", text)

    def _update_hist_chart(self) -> None:
        """Actualiza el historial desde _on_rates_loaded (reemplaza _update_trend_chart)."""
        self._update_history_tab()

    # ─── Historial de Tasas ────────────────────────────────────────

    def _show_historical_rates(self) -> None:
        """Abre un diálogo para ver y gestionar tasas históricas."""
        c = self.actual_theme
        historical = get_historical_rates()

        dialog = ctk.CTkToplevel(self.window)
        self._active_dialog = dialog
        dialog.title("Tasas Históricas")
        dialog.resizable(False, False)
        dialog.transient(self.window)

        x = self.window.winfo_x() + (self.window.winfo_width() - 380) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 480) // 2
        dialog.geometry(f"380x480+{x}+{y}")

        frame = ctk.CTkFrame(dialog, fg_color=c.card, corner_radius=0)
        frame.pack(fill="both", expand=True, padx=20, pady=18)

        ctk.CTkLabel(
            frame, text="Tasas Históricas", text_color=c.primary,
            font=("Segoe UI", 16, "bold"), fg_color="transparent",
        ).pack(anchor="w")
        ctk.CTkLabel(
            frame,
            text="Ingresa una fecha (DD/MM/AAAA) para ver o guardar tasas",
            text_color=c.secondary, font=("Segoe UI", 9),
            anchor="w", wraplength=340, fg_color="transparent",
        ).pack(fill="x", pady=(2, 10))

        date_entry_frame = ctk.CTkFrame(frame, fg_color=c.input_bg, corner_radius=6)
        date_entry_frame.pack(fill="x")

        date_var = ctk.StringVar()
        date_entry = ctk.CTkEntry(
            date_entry_frame, textvariable=date_var,
            font=("Segoe UI", 14, "bold"), justify="center",
            fg_color=c.input_bg, text_color=c.input_text,
            border_width=0,
        )
        date_entry.pack(fill="x", padx=12, pady=8)
        date_entry.insert(0, datetime.now().strftime("%d/%m/%Y"))

        ctk.CTkButton(
            frame, text="📅 Hoy", font=FONTS["section"],
            fg_color=c.input_bg, text_color=c.info,
            hover_color=c.accent, corner_radius=6, height=24,
            command=lambda: date_var.set(datetime.now().strftime("%d/%m/%Y")),
        ).pack(anchor="w", pady=(4, 8))

        search_frame = ctk.CTkFrame(frame, fg_color=c.card, corner_radius=0)
        search_frame.pack(fill="x", pady=(0, 8))

        ctk.CTkButton(
            search_frame, text="🔍 Buscar", font=FONTS["section"],
            fg_color=c.info, text_color="#ffffff",
            hover_color=c.highlight, corner_radius=6,
            command=lambda: self._update_hist_display(
                result_container, c, date_var, get_historical_rates(), dialog
            ),
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        # Auto-update on date change
        def _on_date_change(*_args: object) -> None:
            dialog.after(
                300,
                lambda: self._update_hist_display(
                    result_container, c, date_var, get_historical_rates(), dialog
                ),
            )

        date_var.trace_add("write", _on_date_change)

        result_container = ctk.CTkFrame(frame, fg_color=c.input_bg, corner_radius=6)
        result_container.pack(fill="both", expand=True, pady=(0, 10))

        self._update_hist_display(result_container, c, date_var, historical, dialog)

        btn_frame = ctk.CTkFrame(frame, fg_color=c.card, corner_radius=0)
        btn_frame.pack(fill="x")

        ctk.CTkButton(
            btn_frame, text="📁 Exportar CSV", font=FONTS["section"],
            fg_color=c.info, text_color="#ffffff",
            hover_color=c.highlight, corner_radius=6,
            command=lambda: self._export_historical_csv(),
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        ctk.CTkButton(
            btn_frame, text="Cerrar", font=FONTS["section"],
            fg_color=c.input_bg, text_color=c.secondary,
            hover_color=c.accent, corner_radius=6,
            command=lambda: (dialog.destroy(), setattr(self, "_active_dialog", None)),
        ).pack(side="right", fill="x", expand=True, padx=(2, 0))

        dialog.grab_set()
        date_entry.focus_set()
        date_entry.selection_range(0, tk.END)

    def _update_hist_display(
        self,
        container: ctk.CTkFrame,
        c: Theme,
        date_var: ctk.StringVar,
        historical: Dict[str, Any],
        parent_dialog: ctk.CTkToplevel,
    ) -> None:
        for w in container.winfo_children():
            w.destroy()

        raw = date_var.get().strip()
        if not raw:
            ctk.CTkLabel(
                container, text="Ingresa una fecha",
                text_color=c.muted, font=("Segoe UI", 10), fg_color="transparent",
            ).pack(expand=True)
            return

        date_key = parse_date_from_display(raw)
        if date_key is None:
            ctk.CTkLabel(
                container, text="Fecha inválida. Usa DD/MM/AAAA",
                text_color=c.highlight, font=("Segoe UI", 10), fg_color="transparent",
            ).pack(expand=True)
            return

        today_key = get_today_key()
        is_today = date_key == today_key

        title_row = ctk.CTkFrame(container, fg_color=c.input_bg, corner_radius=0)
        title_row.pack(fill="x", padx=10, pady=(8, 4))
        ctk.CTkLabel(
            title_row, text=format_date_key(date_key), text_color=c.primary,
            font=("Segoe UI", 12, "bold"), fg_color="transparent",
        ).pack(side="left")
        if is_today:
            ctk.CTkLabel(
                title_row, text="  HOY", text_color=c.success,
                font=("Segoe UI", 8, "bold"), fg_color="transparent",
            ).pack(side="left", padx=(4, 0))

        entry = historical.get(date_key, {})
        if entry:
            fields = [
                ("BCV (Oficial)", entry.get("bcv"), c.success),
                ("Paralelo", entry.get("paralelo"), c.highlight),
                ("Binance P2P", entry.get("binance_p2p"), c.warning),
                ("Euro (BCV)", entry.get("euro"), c.info),
            ]

            for label_text, val, color in fields:
                row = ctk.CTkFrame(container, fg_color=c.input_bg, corner_radius=0)
                row.pack(fill="x", padx=10, pady=1)
                ctk.CTkLabel(
                    row, text="●", text_color=color if val is not None else c.muted,
                    font=("Segoe UI", 8), fg_color="transparent",
                ).pack(side="left", padx=(0, 4))
                ctk.CTkLabel(
                    row, text=label_text, text_color=c.secondary,
                    font=("Segoe UI", 9), anchor="w", fg_color="transparent",
                ).pack(side="left", fill="x", expand=True)
                val_text = f"Bs. {val:,.2f}" if val is not None else "—"
                ctk.CTkLabel(
                    row, text=val_text, text_color=color if val is not None else c.muted,
                    font=("Segoe UI", 10, "bold"), fg_color="transparent",
                ).pack(side="right")

            if entry.get("manual"):
                ctk.CTkLabel(
                    container, text="✏️ Ingresado manualmente",
                    text_color=c.muted, font=("Segoe UI", 8),
                    fg_color="transparent",
                ).pack(pady=(4, 0))

            edit_frame = ctk.CTkFrame(container, fg_color=c.input_bg, corner_radius=0)
            edit_frame.pack(fill="x", padx=10, pady=(6, 8))
            ctk.CTkButton(
                edit_frame, text="✏️ Editar tasas", font=FONTS["section"],
                fg_color=c.card, text_color=c.secondary,
                hover_color=c.accent, corner_radius=6,
                command=lambda: self._show_hist_manual_entry(
                    date_key, entry, parent_dialog, container, date_var, historical, c
                ),
            ).pack(fill="x")
        else:
            empty_frame = ctk.CTkFrame(container, fg_color=c.input_bg, corner_radius=0)
            empty_frame.pack(expand=True, fill="both")
            ctk.CTkLabel(
                empty_frame, text="No hay tasas guardadas para esta fecha",
                text_color=c.warning, font=("Segoe UI", 10, "bold"),
                fg_color="transparent",
            ).pack(pady=(20, 2))
            ctk.CTkLabel(
                empty_frame, text="Puedes ingresarlas manualmente",
                text_color=c.muted, font=("Segoe UI", 9),
                fg_color="transparent",
            ).pack()
            ctk.CTkButton(
                empty_frame, text="📝 Ingresar tasas manualmente",
                font=FONTS["button"],
                fg_color=c.info, text_color="#ffffff",
                hover_color=c.highlight, corner_radius=6,
                command=lambda: self._show_hist_manual_entry(
                    date_key, {}, parent_dialog, container, date_var, historical, c
                ),
            ).pack(pady=(10, 20))

    def _show_hist_manual_entry(
        self,
        date_key: str,
        entry: Dict[str, Any],
        parent_dialog: ctk.CTkToplevel,
        container: ctk.CTkFrame,
        date_var: ctk.StringVar,
        historical: Dict[str, Any],
        c: Theme,
    ) -> None:
        """Muestra un sub-diálogo para ingresar/editar tasas históricas."""
        sub = ctk.CTkToplevel(parent_dialog)
        sub.title("Ingresar tasas")
        sub.resizable(False, False)
        sub.transient(parent_dialog)

        x = parent_dialog.winfo_x() + 30
        y = parent_dialog.winfo_y() + 30
        sub.geometry(f"320x300+{x}+{y}")

        sf = ctk.CTkFrame(sub, fg_color=c.card, corner_radius=0)
        sf.pack(fill="both", expand=True, padx=20, pady=18)

        ctk.CTkLabel(
            sf, text=f"Tasas para {format_date_key(date_key)}",
            text_color=c.primary, font=("Segoe UI", 14, "bold"), fg_color="transparent",
        ).pack(anchor="w")
        ctk.CTkLabel(
            sf, text="Ingresa las tasas que recuerdes (puedes dejar vacío)",
            text_color=c.secondary, font=("Segoe UI", 9),
            anchor="w", wraplength=280, fg_color="transparent",
        ).pack(fill="x", pady=(2, 10))

        fields_def = [
            ("BCV (Oficial)", "bcv", c.success),
            ("Paralelo", "paralelo", c.highlight),
            ("Euro (BCV)", "euro", c.info),
        ]
        field_vars: Dict[str, ctk.StringVar] = {}

        for label_text, key, color in fields_def:
            frow = ctk.CTkFrame(sf, fg_color=c.card, corner_radius=0)
            frow.pack(fill="x", pady=(0, 8))
            ctk.CTkLabel(
                frow, text=label_text, text_color=c.secondary,
                font=("Segoe UI", 9), anchor="w", fg_color="transparent",
            ).pack(fill="x")
            val = entry.get(key)
            var = ctk.StringVar(value=f"{val:,.2f}" if val else "")
            field_vars[key] = var
            e = ctk.CTkEntry(
                frow, textvariable=var, fg_color=c.input_bg, text_color=color,
                font=("Segoe UI", 14, "bold"), justify="center",
                border_width=0,
            )
            e.pack(fill="x")

        btn_row = ctk.CTkFrame(sf, fg_color=c.card, corner_radius=0)
        btn_row.pack(fill="x", pady=(10, 0))

        def on_save_hist() -> None:
            bcv_raw = field_vars["bcv"].get().strip().replace(",", ".")
            paralelo_raw = field_vars["paralelo"].get().strip().replace(",", ".")
            euro_raw = field_vars["euro"].get().strip().replace(",", ".")

            def parse_or_none(s: str) -> Optional[float]:
                try:
                    v = float(s)
                    return v if v > 0 else None
                except (ValueError, TypeError):
                    return None

            bcv = parse_or_none(bcv_raw)
            paralelo = parse_or_none(paralelo_raw)
            euro = parse_or_none(euro_raw)

            if bcv is None and paralelo is None and euro is None:
                return

            set_manual_historical_rate(date_key, bcv=bcv, paralelo=paralelo, euro=euro)
            updated_historical = get_historical_rates()
            self._update_hist_display(container, c, date_var, updated_historical, parent_dialog)
            sub.destroy()

        ctk.CTkButton(
            btn_row, text="Cancelar", font=FONTS["section"],
            fg_color=c.input_bg, text_color=c.secondary,
            hover_color=c.accent, corner_radius=6,
            command=sub.destroy,
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))
        ctk.CTkButton(
            btn_row, text="Guardar", font=FONTS["section"],
            fg_color=c.info, text_color="#ffffff",
            hover_color=c.highlight, corner_radius=6,
            command=on_save_hist,
        ).pack(side="right", fill="x", expand=True, padx=(2, 0))

        sub.grab_set()

    # ─── Exportar CSV ────────────────────────────────────────────

    def _export_historical_csv(self) -> None:
        """Exporta todas las tasas históricas a un archivo CSV."""
        from tkinter import filedialog, messagebox

        historical = get_historical_rates()
        if not historical:
            messagebox.showinfo("Exportar", "No hay datos históricos para exportar.")
            return

        filename = filedialog.asksaveasfilename(
            defaultextension=".csv",
            filetypes=[("CSV", "*.csv")],
            initialfile=f"tasas-historicas-{datetime.now().strftime('%Y-%m-%d')}.csv",
        )
        if not filename:
            return

        try:
            import csv
            with open(filename, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.writer(f)
                writer.writerow(["Fecha", "BCV (Oficial)", "Paralelo", "Binance P2P", "Euro (BCV)", "Manual"])
                for date_key in sorted(historical.keys(), reverse=True):
                    entry = historical[date_key]
                    writer.writerow([
                        format_date_key(date_key),
                        f'{entry.get("bcv", ""):,.2f}' if entry.get("bcv") else "",
                        f'{entry.get("paralelo", ""):,.2f}' if entry.get("paralelo") else "",
                        f'{entry.get("binance_p2p", ""):,.2f}' if entry.get("binance_p2p") else "",
                        f'{entry.get("euro", ""):,.2f}' if entry.get("euro") else "",
                        "Sí" if entry.get("manual") else "",
                    ])

            count = len(historical)
            messagebox.showinfo(
                "Exportar",
                f"✅ {count} registros exportados correctamente.\n{filename}",
            )
            logger.info("CSV exportado: %s (%d registros)", filename, count)
        except Exception as e:
            logger.exception("Error exportando CSV: %s", e)
            messagebox.showerror("Error", f"No se pudo exportar:\n{e}")

    # ─── Widget compacto ──────────────────────────────────────────

    def _toggle_widget(self) -> None:
        """Alterna la visibilidad del widget compacto."""
        if not self.widget:
            self.widget = WidgetWindow(self, self.actual_theme)

        was_visible = self.widget.is_visible
        self.widget.toggle()
        self._widget_enabled = self.widget.is_visible
        save_config(widget_enabled=self._widget_enabled)

        # Si se acaba de mostrar y ya hay tasas cargadas, aplicarlas
        if not was_visible and self.widget.is_visible and self.rates:
            self._update_widget_rates(
                self.rates.get("bcv"),
                self.rates.get("parallel"),
                self.rates.get("fetched_at"),
            )

    def _show_widget(self) -> None:
        """Muestra el widget (si estaba habilitado)."""
        if not self.widget:
            self.widget = WidgetWindow(self, self.actual_theme)
            logger.debug("_show_widget: widget creado")
        self.widget.show()
        self._widget_enabled = True

        # Aplicar tasas actuales si ya están cargadas
        # (evita que el widget aparezca con "—" si _on_rates_loaded
        #  se ejecutó antes de crear el widget)
        if self.rates:
            logger.info(
                "_show_widget: aplicando tasas existentes — BCV=%s, Paralelo=%s",
                self.rates.get("bcv"), self.rates.get("parallel"),
            )
            self._update_widget_rates(
                self.rates.get("bcv"),
                self.rates.get("parallel"),
                self.rates.get("fetched_at"),
            )
        else:
            logger.info(
                "_show_widget: widget mostrado sin tasas (rates aún no cargadas)"
            )

    def _hide_widget(self) -> None:
        """Oculta el widget."""
        if self.widget:
            self.widget.hide()
        self._widget_enabled = False

    def _update_widget_rates(
        self,
        bcv: Optional[float],
        paralelo: Optional[float],
        fetched_at: Optional[str] = None,
    ) -> None:
        """Actualiza las tasas en el widget si está visible."""
        if self.widget and self.widget.is_visible:
            logger.info(
                "Widget actualizado: BCV=%s, Paralelo=%s, fetched_at=%s",
                bcv, paralelo, fetched_at,
            )
            self.widget.update_rates(bcv, paralelo, fetched_at)
        else:
            logger.debug(
                "Widget NO actualizado (no existe o no visible): existe=%s, visible=%s",
                self.widget is not None,
                self.widget.is_visible if self.widget else False,
            )

    # ─── BCV Lunes ─────────────────────────────────────────────────

    def _edit_bcv_lunes(self) -> None:
        """Abre un diálogo para editar la tasa BCV del lunes."""
        c = self.actual_theme
        dialog = ctk.CTkToplevel(self.window)
        self._active_dialog = dialog
        dialog.title("Editar BCV (Lunes)")
        dialog.resizable(False, False)
        dialog.transient(self.window)

        x = self.window.winfo_x() + (self.window.winfo_width() - 320) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 200) // 2
        dialog.geometry(f"320x200+{x}+{y}")

        frame = ctk.CTkFrame(dialog, fg_color=c.card, corner_radius=0)
        frame.pack(fill="both", expand=True, padx=20, pady=20)

        ctk.CTkLabel(
            frame, text="BCV (Lunes)", text_color=c.primary,
            font=("Segoe UI", 14, "bold"), fg_color="transparent",
        ).pack(anchor="w")
        ctk.CTkLabel(
            frame, text="Ingresa la tasa publicada por el BCV para el lunes:",
            text_color=c.secondary, font=("Segoe UI", 9),
            anchor="w", wraplength=280, fg_color="transparent",
        ).pack(fill="x", pady=(4, 12))

        entry_var = ctk.StringVar(value=f"{self.bcv_lunes:,.2f}" if self.bcv_lunes else "")
        entry = ctk.CTkEntry(
            frame, textvariable=entry_var,
            font=("Segoe UI", 18, "bold"), justify="center",
            fg_color=c.input_bg, text_color=c.input_text,
            border_width=0,
        )
        entry.pack(fill="x")

        btn_frame = ctk.CTkFrame(frame, fg_color=c.card, corner_radius=0)
        btn_frame.pack(fill="x", pady=(12, 0))

        def on_save() -> None:
            raw = entry_var.get().strip().replace(",", ".")
            try:
                val = float(raw)
                if val > 0:
                    if val > 500:
                        from tkinter import messagebox
                        messagebox.showwarning(
                            "Valor alto",
                            "La tasa ingresada es muy alta ({:,.2f}). Verifica que sea correcta.".format(val),
                            parent=dialog,
                        )
                        return
                    self.bcv_lunes = val
                    self.bcv_lunes_updated_at = datetime.now().isoformat()
                    save_config(val)
                    self.card_lunes.update_rate(self.bcv_lunes, self.bcv_lunes_updated_at)
                    self._update_conv_rate_labels(self.converter_rates)
                    paralelo = self.converter_rates.get("parallel") or self.rates.get("parallel")
                    self.spread_lunes.update(self.bcv_lunes, paralelo)
                    self._update_converter_spreads(self.rates.get("bcv"), paralelo)
                    self.do_conversion()
                else:
                    self.bcv_lunes = None
                    self.bcv_lunes_updated_at = None
                    save_config(0)
                    self.card_lunes.update_rate(None)
                    self.spread_lunes.update(None, None)
                    self._update_converter_spreads(None, None)
            except (ValueError, TypeError) as e:
                logger.warning("Error parseando BCV Lunes: %s", e)
            dialog.destroy()

        def on_cancel() -> None:
            dialog.destroy()

        def on_delete() -> None:
            self.bcv_lunes = None
            self.bcv_lunes_updated_at = None
            save_config(0)
            self.card_lunes.update_rate(None)
            self.spread_lunes.update(None, None)
            self._update_converter_spreads(None, None)
            self._update_conv_rate_labels(self.converter_rates)
            self.do_conversion()
            dialog.destroy()

        ctk.CTkButton(
            btn_frame, text="Cancelar", font=FONTS["section"],
            fg_color=c.input_bg, text_color=c.secondary,
            hover_color=c.accent, corner_radius=6,
            command=on_cancel,
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        if self.bcv_lunes is not None:
            ctk.CTkButton(
                btn_frame, text="Borrar", font=FONTS["section"],
                fg_color=c.highlight, text_color="#ffffff",
                hover_color=c.highlight, corner_radius=6,
                command=on_delete,
            ).pack(side="left", fill="x", expand=True, padx=(1, 1))

        ctk.CTkButton(
            btn_frame, text="Guardar", font=FONTS["section"],
            fg_color=c.bcv_lunes, text_color="#ffffff",
            hover_color=c.bcv_lunes, corner_radius=6,
            command=on_save,
        ).pack(side="right", fill="x", expand=True, padx=(2, 0))

        entry.bind("<Return>", lambda _e: on_save())
        entry.bind("<Escape>", lambda _e: on_cancel())

        dialog.grab_set()
        dialog.after(50, lambda: entry.focus_set())
        dialog.after(50, lambda: entry.selection_range(0, tk.END))

    # ─── Recordatorio viernes ──────────────────────────────────────

    def _was_entered_today(self) -> bool:
        """Verifica si la tasa BCV Lunes fue ingresada hoy."""
        if not self.bcv_lunes_updated_at:
            return False
        try:
            updated = datetime.fromisoformat(self.bcv_lunes_updated_at.replace("Z", "+00:00"))
            return updated.date() == datetime.now().date()
        except (ValueError, TypeError) as e:
            logger.warning("Error verificando si se ingresó hoy: %s", e)
            return False

    def _toggle_reminder(self) -> None:
        """Activa/desactiva el recordatorio de los viernes."""
        self.reminder_enabled = self.reminder_var.get()
        save_config(reminder_enabled=self.reminder_enabled)
        if self.reminder_enabled:
            self._reminder_shown_this_friday = False
            self._check_reminder()

    def _start_reminder_check(self) -> None:
        """Inicia la verificación periódica del recordatorio."""
        def _check() -> None:
            if self.reminder_enabled and not self._reminder_shown_this_friday:
                self._check_reminder()
            self._reminder_timer = self.window.after(30000, _check)
        _check()

    def _check_reminder(self) -> None:
        """Verifica si se deben mostrar condiciones para el recordatorio."""
        now = datetime.now()
        # Viernes = weekday 4 (Monday=0, ..., Friday=4)
        if now.weekday() != 4:
            return
        # Entre 6:00 PM y 6:30 PM
        current_minute = now.hour * 60 + now.minute
        reminder_minute = 18 * 60  # 6:00 PM
        if current_minute < reminder_minute or current_minute > reminder_minute + 30:
            return
        entered_today = self._was_entered_today()
        self._show_reminder_popup(entered_today)
        self._reminder_shown_this_friday = True
        logger.info("Recordatorio de viernes mostrado (ya_ingresado=%s)", entered_today)

    def _show_reminder_popup(self, already_entered: bool) -> None:
        """Muestra un popup de recordatorio con estilo premium."""
        c = self.actual_theme
        popup = ctk.CTkToplevel(self.window)
        popup.title("Recordatorio BCV (Lunes)")
        popup.resizable(False, False)
        popup.transient(self.window)
        popup.attributes("-topmost", True)

        x = self.window.winfo_x() + (self.window.winfo_width() - 340) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 180) // 2
        popup.geometry(f"340x180+{x}+{y}")

        frame = ctk.CTkFrame(popup, fg_color=c.card, corner_radius=0)
        frame.pack(fill="both", expand=True, padx=20, pady=20)

        icon_text = "✅" if already_entered else "📅"
        ctk.CTkLabel(
            frame, text=icon_text, font=("Segoe UI", 28), fg_color="transparent",
        ).pack(pady=(0, 8))

        if already_entered:
            ctk.CTkLabel(
                frame, text="Ya ingresaste la tasa de hoy",
                text_color=c.primary, font=("Segoe UI", 12, "bold"), fg_color="transparent",
            ).pack()
            ctk.CTkLabel(
                frame, text="Recuerda revisar si el BCV publicó una nueva.",
                text_color=c.secondary, font=("Segoe UI", 9), wraplength=280, fg_color="transparent",
            ).pack(pady=(4, 0))
        else:
            ctk.CTkLabel(
                frame, text="¿Ya viste la tasa del lunes?",
                text_color=c.primary, font=("Segoe UI", 12, "bold"), fg_color="transparent",
            ).pack()
            ctk.CTkLabel(
                frame, text="El BCV publicó la tasa del lunes. ¡Ingrésala en la app!",
                text_color=c.secondary, font=("Segoe UI", 9), wraplength=280, fg_color="transparent",
            ).pack(pady=(4, 0))

        btn_frame = ctk.CTkFrame(frame, fg_color="transparent", corner_radius=0)

        ctk.CTkButton(
            btn_frame, text="Ingresar tasa", font=FONTS["button"],
            fg_color=c.bcv_lunes, text_color="#ffffff",
            hover_color=c.bcv_lunes, corner_radius=6,
            command=lambda: self._edit_bcv_lunes() or popup.destroy(),
        ).pack(side="left", fill="x", expand=True, padx=(0, 4))

        ctk.CTkButton(
            btn_frame, text="Recordar después", font=FONTS["section"],
            fg_color=c.input_bg, text_color=c.secondary,
            hover_color=c.accent, corner_radius=6,
            command=popup.destroy,
        ).pack(side="right", fill="x", expand=True, padx=(4, 0))

        popup.after(12000, lambda: popup.destroy() if popup.winfo_exists() else None)
        popup.grab_set()

    # ─── Countdown ─────────────────────────────────────────────────

    def _start_countdown(self) -> None:
        """Inicia la cuenta regresiva para la próxima actualización."""
        def tick() -> None:
            if self._countdown > 0:
                self._countdown -= 1
            else:
                self._countdown = REFRESH_MINUTES * 60

            if hasattr(self, "timer_bar") and self.timer_bar.winfo_exists():
                self.timer_bar.update(self._countdown)

            self._countdown_timer = self.window.after(1000, tick)

        self._countdown = REFRESH_MINUTES * 60
        tick()

    # ─── Events ────────────────────────────────────────────────────

    def _set_mode(self, mode: str) -> None:
        """Cambia el modo de conversión USD↔Bs."""
        self.conv_mode.set(mode)
        c = self.actual_theme
        accent_bg = c.accent
        if mode == "usd_to_bs":
            self.btn_usd.configure(fg_color=accent_bg, text_color=c.primary)
            self.btn_bs.configure(fg_color=c.input_bg, text_color=c.muted)
        else:
            self.btn_bs.configure(fg_color=accent_bg, text_color=c.primary)
            self.btn_usd.configure(fg_color=c.input_bg, text_color=c.muted)
        self.do_conversion()

    def _on_rate_change(self) -> None:
        """Se ejecuta cuando cambia la tasa seleccionada en el conversor."""
        self.do_conversion()

    def _start_theme_polling(self) -> None:
        """Inicia la verificación periódica del tema del sistema."""
        def _poll() -> None:
            if self.theme_mode == "system":
                new_system = ctk.get_appearance_mode().lower()
                current_name = self.actual_theme.name
                expected_name = "oscuro" if new_system == "dark" else "claro"
                if current_name != expected_name:
                    logger.info("Tema del sistema cambió a %s, reconstruyendo UI", new_system)
                    self._rebuild_ui()
                    return
            self._theme_poll_timer = self.window.after(5000, _poll)

        self._theme_poll_timer = self.window.after(5000, _poll)

    def _bind_events(self) -> None:
        """Vincula eventos de la ventana y atajos de teclado."""
        self.window.protocol("WM_DELETE_WINDOW", self._on_close)

        # ─── Atajos de teclado ────────────────────────────────────
        self.window.bind("<Control-r>", lambda _e: self.refresh_rates())
        self.window.bind("<Control-R>", lambda _e: self.refresh_rates())
        self.window.bind("<Control-c>", lambda _e: self._copy_bcv_rate())
        self.window.bind("<Control-C>", lambda _e: self._copy_bcv_rate())
        self.window.bind("<Control-Shift-C>", lambda _e: self._copy_all_rates())
        self.window.bind("<Control-Shift-c>", lambda _e: self._copy_all_rates())
        self.window.bind("<Escape>", lambda _e: self._close_active_dialog())
        self.window.bind("<Control-w>", lambda _e: self._toggle_widget())
        self.window.bind("<Control-W>", lambda _e: self._toggle_widget())
        self.window.bind("<Control-q>", lambda _e: self._quit_from_tray())
        self.window.bind("<Control-Q>", lambda _e: self._quit_from_tray())

    def _copy_bcv_rate(self) -> None:
        """Copia la tasa BCV al portapapeles (Ctrl+C)."""
        # No interferir con copia de texto en inputs
        if isinstance(self.window.focus_get(), ctk.CTkEntry):
            return
        rate_text = self.card_bcv.rate_var.get()
        if rate_text and rate_text not in ("—", "Cargando...", "Error"):
            self.window.clipboard_clear()
            self.window.clipboard_append(f"Bs. {rate_text}")
            self._show_toast("BCV copiado", f"Bs. {rate_text}")
            logger.info("Tasa BCV copiada: %s", rate_text)

    def _copy_all_rates(self) -> None:
        """Copia todas las tasas al portapapeles (Ctrl+Shift+C)."""
        lines = []
        cards = [
            ("BCV", self.card_bcv),
            ("Paralelo", self.card_parallel),
            ("Euro", self.card_eur),
            ("Binance P2P", self.card_binance),
        ]
        for name, card in cards:
            val = card.rate_var.get()
            if val and val not in ("—", "Cargando...", "Error"):
                lines.append(f"{name}: Bs. {val}")
        if self.bcv_lunes:
            lines.append(f"BCV Lunes: Bs. {self.bcv_lunes:,.2f}")

        if lines:
            text = "\n".join(lines)
            self.window.clipboard_clear()
            self.window.clipboard_append(text)
            self._show_toast("Tasas copiadas", f"{len(lines)} tasas")
            logger.info("Todas las tasas copiadas (%d)", len(lines))

    def _close_active_dialog(self) -> None:
        """Cierra el diálogo activo si hay uno (Esc)."""
        if self._active_dialog and self._active_dialog.winfo_exists():
            self._active_dialog.destroy()
            self._active_dialog = None

    def _show_toast(self, title: str, message: str) -> None:
        """Muestra un toast temporal de feedback."""
        toast = ctk.CTkToplevel(self.window)
        toast.overrideredirect(True)
        toast.attributes("-topmost", True)
        toast.configure(fg_color=self.actual_theme.bg)

        x = self.window.winfo_x() + (self.window.winfo_width() - 220) // 2
        y = self.window.winfo_y() + 40
        toast.geometry(f"220x38+{x}+{y}")

        frame = ctk.CTkFrame(
            toast, fg_color=self.actual_theme.card,
            corner_radius=10, border_width=1,
            border_color=self.actual_theme.card_border,
        )
        frame.pack(fill="both", expand=True, padx=0, pady=0)

        ctk.CTkLabel(
            frame, text=f"✓ {message}", text_color=self.actual_theme.primary,
            font=("Segoe UI", 10), fg_color="transparent",
        ).pack(padx=16, pady=8)

        toast.after(1800, lambda: toast.destroy() if toast.winfo_exists() else None)

    # ─── System Tray ─────────────────────────────────────────────

    def _init_tray(self) -> None:
        """Inicia el system tray después de que la UI esté lista."""
        self.window.after(2000, lambda: start_tray(
            on_show=self._restore_from_tray,
            on_quit=self._quit_from_tray,
            on_refresh=self.refresh_rates,
        ))

    def _restore_from_tray(self) -> None:
        """Restaura la ventana desde la bandeja."""
        self.window.deiconify()
        self.window.lift()
        self.window.focus_force()

    def _quit_from_tray(self) -> None:
        """Cierra la app desde la bandeja."""
        self._cancel_timers()
        self._executor.shutdown(wait=False)
        if self.widget:
            self.widget.destroy()
        stop_tray()
        self.window.quit()

    def _on_close(self) -> None:
        """Maneja el cierre de la aplicación."""
        self.window.withdraw()  # minimizar a bandeja en lugar de cerrar
        send_notification(
            "Tasa del Día",
            "La app sigue corriendo en segundo plano. Haz clic en el icono de la bandeja para abrirla.",
        )
        logger.info("App minimizada a bandeja")

    def _cancel_timers(self) -> None:
        """Cancela todos los timers activos."""
        for timer_name in ["_refresh_timer", "_theme_poll_timer",
                           "_countdown_timer", "_reminder_timer"]:
            timer = getattr(self, timer_name, None)
            if timer:
                try:
                    self.window.after_cancel(timer)
                except Exception as e:
                    logger.warning("Error cancelando timer %s: %s", timer_name, e)

    # ─── Auto Update ────────────────────────────────────────────

    def _check_updates_silent(self) -> None:
        """Verifica actualizaciones en segundo plano sin molestar."""
        def _check() -> None:
            try:
                result = check_for_updates()
                if result and result.get("has_update"):
                    self.window.after(0, self._show_update_available, result)
            except Exception as e:
                logger.debug("Error checking updates: %s", e)
        self._executor.submit(_check)

    def _check_updates_manual(self) -> None:
        """Verifica actualizaciones manualmente (desde botón)."""
        from tkinter import messagebox
        try:
            result = check_for_updates()
            if result and result.get("has_update"):
                self._show_update_available(result)
            else:
                messagebox.showinfo(
                    "Actualizaciones",
                    f"Tienes la última versión ({APP_VERSION}).",
                )
        except Exception as e:
            messagebox.showerror("Error", f"No se pudo verificar: {e}")

    def _show_update_available(self, result: dict) -> None:
        """Muestra un diálogo cuando hay una actualización disponible."""
        from tkinter import messagebox
        c = self.actual_theme

        dialog = ctk.CTkToplevel(self.window)
        self._active_dialog = dialog
        dialog.title("Actualización disponible")
        dialog.resizable(False, False)
        dialog.transient(self.window)

        x = self.window.winfo_x() + (self.window.winfo_width() - 360) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 220) // 2
        dialog.geometry(f"360x220+{x}+{y}")

        frame = ctk.CTkFrame(dialog, fg_color=c.card, corner_radius=0)
        frame.pack(fill="both", expand=True, padx=20, pady=20)

        ctk.CTkLabel(
            frame, text="🚀 Nueva versión disponible", text_color=c.primary,
            font=("Segoe UI", 14, "bold"), fg_color="transparent",
        ).pack(anchor="w")

        ctk.CTkLabel(
            frame,
            text=f"Versión actual: {APP_VERSION}\nNueva versión: {result.get('latest_version', '?')}",
            text_color=c.secondary, font=("Segoe UI", 10),
            anchor="w", justify="left", fg_color="transparent",
        ).pack(fill="x", pady=(8, 4))

        if result.get("release_notes"):
            ctk.CTkLabel(
                frame, text=result["release_notes"][:200],
                text_color=c.muted, font=("Segoe UI", 8),
                anchor="w", wraplength=320, justify="left", fg_color="transparent",
            ).pack(fill="x")

        btn_frame = ctk.CTkFrame(frame, fg_color="transparent", corner_radius=0)
        btn_frame.pack(fill="x", pady=(12, 0))

        def _download() -> None:
            import webbrowser
            url = result.get("download_url", result.get("release_url", ""))
            if url:
                webbrowser.open(url)
            dialog.destroy()
            self._active_dialog = None

        ctk.CTkButton(
            btn_frame, text="📥 Descargar", font=FONTS["button"],
            fg_color=c.info, text_color="#ffffff",
            hover_color=c.highlight, corner_radius=6,
            command=_download,
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        ctk.CTkButton(
            btn_frame, text="Recordar después", font=FONTS["section"],
            fg_color=c.input_bg, text_color=c.secondary,
            hover_color=c.accent, corner_radius=6,
            command=lambda: (dialog.destroy(), setattr(self, "_active_dialog", None)),
        ).pack(side="right", fill="x", expand=True, padx=(2, 0))

        dialog.grab_set()

    # ─── Offline Mode ──────────────────────────────────────────────

    def _set_offline_mode(self, offline: bool, cached_at: str = "") -> None:
        """Muestra u oculta el banner de modo offline."""
        self.offline_mode = offline
        if not hasattr(self, "offline_banner") or not self.offline_banner.winfo_exists():
            return
        c = self.actual_theme
        if offline:
            time_str = ""
            if cached_at:
                try:
                    dt = datetime.fromisoformat(cached_at.replace("Z", "+00:00"))
                    time_str = dt.strftime("%d/%m %I:%M %p")
                except (ValueError, TypeError):
                    pass
            if time_str:
                self.offline_label.configure(
                    text=f"Sin conexión — Mostrando últimas tasas ({time_str})"
                )
            else:
                self.offline_label.configure(text="Sin conexión — Mostrando últimas tasas")
            try:
                info_bar = self.info_label.master.master
                if info_bar.winfo_exists():
                    self.offline_banner.pack(fill="x", padx=12, pady=(0, 2), before=info_bar)
                else:
                    self.offline_banner.pack(fill="x", padx=12, pady=(0, 2))
            except Exception:
                self.offline_banner.pack(fill="x", padx=12, pady=(0, 2))
            self.info_label.configure(text="Las tasas se actualizarán cuando haya conexión")
        else:
            self.offline_banner.pack_forget()
            self.info_label.configure(text="Las tasas se actualizan cada 25 minutos")

    # ─── API ────────────────────────────────────────────────────────

    def _poll_queue(self) -> None:
        """Procesa resultados de la API desde el hilo secundario."""
        try:
            while True:
                kind, data = self._result_queue.get_nowait()
                logger.debug("_poll_queue: procesando %s", kind)
                if kind == "rates":
                    self._on_rates_loaded(data)
                elif kind == "error":
                    self._on_rates_error(data)
                else:
                    logger.warning("_poll_queue: tipo desconocido %s", kind)
        except queue.Empty:
            pass
        except Exception:
            logger.exception("_poll_queue: error procesando resultados")
        self.window.after(200, self._poll_queue)

    def refresh_rates(self) -> None:
        """Inicia la actualización de tasas en segundo plano."""
        if self.is_loading:
            logger.debug("Ya hay una carga en progreso, ignorando")
            return
        self.is_loading = True
        self.card_bcv.show_loading()
        self.card_parallel.show_loading()
        self.card_eur.show_loading()
        self.card_binance.show_loading()
        self._update_conv_rate_labels({})
        self._executor.submit(self._fetch_rates_thread)
        logger.info("Iniciando actualización de tasas...")

    def _fetch_rates_thread(self) -> None:
        """Hilo que obtiene las tasas de la API."""
        try:
            rates = fetch_all_rates()
            self._result_queue.put(("rates", rates))
        except ApiError as e:
            logger.error("Error de API al obtener tasas: %s", e)
            self._result_queue.put(("error", str(e)))
        except Exception as e:
            logger.exception("Error inesperado obteniendo tasas: %s", e)
            self._result_queue.put(("error", str(e)))

    def _on_rates_loaded(self, rates: RatesDict) -> None:
        """Procesa las tasas recibidas exitosamente."""
        logger.info("_on_rates_loaded INVOCADO con BCV=%s, Paralelo=%s",
                     rates.get("bcv"), rates.get("parallel"))
        c = self.actual_theme
        self.rates = rates
        self.converter_rates = {
            "bcv": rates.get("bcv"),
            "binance_p2p": rates.get("binance_p2p"),
            "eur": rates.get("eur"),
            "parallel": rates.get("parallel"),
            "bcv_lunes": self.bcv_lunes,
        }
        self.is_loading = False

        # Reset countdown
        self._countdown = REFRESH_MINUTES * 60

        # Update cards
        self.card_bcv.update_rate(rates.get("bcv"), rates.get("fetched_at"))
        self.card_parallel.update_rate(rates.get("parallel"), rates.get("fetched_at"))
        self.card_eur.update_rate(rates.get("eur"), rates.get("fetched_at"))
        self.card_binance.update_rate(rates.get("binance_p2p"), rates.get("fetched_at"))
        self.card_lunes.update_rate(self.bcv_lunes, self.bcv_lunes_updated_at)
        self._update_conv_rate_labels(self.converter_rates)

        # Update spread indicators
        self.spread_indicator.update(rates.get("bcv"), rates.get("parallel"))
        self.spread_lunes.update(self.bcv_lunes, rates.get("parallel"))
        self._update_converter_spreads(rates.get("bcv"), rates.get("parallel"))

        # Update info label
        if rates.get("fetched_at"):
            try:
                fetched = str(rates["fetched_at"]).replace("Z", "+00:00")
                dt = datetime.fromisoformat(fetched)
                time_str = dt.strftime("%d/%m/%Y %I:%M %p")
                self.info_label.configure(text=f"✓ Actualizado: {time_str}")
            except (ValueError, TypeError) as e:
                logger.warning("Error formateando fetched_at: %s", e)

        # Update widget
        self._update_widget_rates(
            rates.get("bcv"), rates.get("parallel"), rates.get("fetched_at")
        )

        # Notificación si la brecha es muy alta
        bcv = rates.get("bcv")
        paralelo = rates.get("parallel")
        if bcv and paralelo and bcv > 0:
            brecha = ((paralelo - bcv) / bcv) * 100
            if brecha > 20 and not self._brecha_notified:
                send_notification(
                    "⚠️ Brecha BCV vs Paralelo alta",
                    f"La brecha es de {brecha:.1f}%.\nBCV: Bs. {bcv:,.2f} | Paralelo: Bs. {paralelo:,.2f}",
                )
                self._brecha_notified = True
            elif brecha <= 20:
                self._brecha_notified = False

        # Save to offline cache
        save_cache_rates(rates)

        # Hide offline banner
        self._set_offline_mode(False)

        # Auto-save today's historical rates
        logger.info(
            "_on_rates_loaded: guardando histórico — BCV=%s, Paralelo=%s, Euro=%s, Binance=%s",
            rates.get("bcv"), rates.get("parallel"),
            rates.get("eur"), rates.get("binance_p2p"),
        )
        save_today_historical_rate(
            bcv=rates.get("bcv"),
            paralelo=rates.get("parallel"),
            binance_p2p=rates.get("binance_p2p"),
            euro=rates.get("eur"),
        )

        # Update trend chart
        logger.debug("_on_rates_loaded: actualizando pestaña de historial")
        self._update_history_tab()

        # Schedule next refresh
        if self._refresh_timer:
            self.window.after_cancel(self._refresh_timer)
        self._refresh_timer = self.window.after(
            REFRESH_MINUTES * 60 * 1000, self.refresh_rates
        )
        self.do_conversion()
        logger.info("Tasas actualizadas correctamente")

    def _on_rates_error(self, error_msg: str) -> None:
        """Maneja errores al obtener tasas."""
        self.is_loading = False
        logger.warning("Error obteniendo tasas: %s", error_msg)

        # Try to load from cache
        cache = load_cache_rates()
        if cache and cache.get("bcv") is not None:
            self.cached_rates = cache
            self.rates = {
                "bcv": cache.get("bcv"),
                "parallel": cache.get("paralelo"),
                "eur": cache.get("euro"),
                "binance_p2p": cache.get("binance_p2p"),
                "fetched_at": cache.get("fetched_at"),
            }
            self._set_offline_mode(True, cache.get("cached_at", ""))

            self.card_bcv.update_rate(cache.get("bcv"), cache.get("fetched_at"))
            self.card_parallel.update_rate(cache.get("paralelo"), cache.get("fetched_at"))
            self.card_eur.update_rate(cache.get("euro"), cache.get("fetched_at"))
            self.card_binance.update_rate(cache.get("binance_p2p"), cache.get("fetched_at"))
            self.card_lunes.update_rate(self.bcv_lunes, self.bcv_lunes_updated_at)

            self.converter_rates = {
                "bcv": cache.get("bcv"),
                "binance_p2p": cache.get("binance_p2p"),
                "eur": cache.get("euro"),
                "parallel": cache.get("paralelo"),
                "bcv_lunes": self.bcv_lunes,
            }
            self._update_conv_rate_labels(self.converter_rates)
            self.spread_indicator.update(cache.get("bcv"), cache.get("paralelo"))
            self.spread_lunes.update(self.bcv_lunes, cache.get("paralelo"))
            self._update_converter_spreads(cache.get("bcv"), cache.get("paralelo"))

            # Auto-save cached rates to historical (para que la tendencia funcione)
            save_today_historical_rate(
                bcv=cache.get("bcv"),
                paralelo=cache.get("paralelo"),
                binance_p2p=cache.get("binance_p2p"),
                euro=cache.get("euro"),
            )
            self._update_history_tab()

            # Update widget with cached rates
            self._update_widget_rates(
                cache.get("bcv"),
                cache.get("paralelo"),
                cache.get("fetched_at"),
            )

            self.do_conversion()
        else:
            # No cache available
            self.card_bcv.show_error()
            self.card_parallel.show_error()
            self.card_eur.show_error()
            self.card_binance.show_error()
            self.info_label.configure(text=f"⚠ Error: {error_msg}")

        if self._refresh_timer:
            self.window.after_cancel(self._refresh_timer)
        self._refresh_timer = self.window.after(30000, self.refresh_rates)

    def _update_conv_rate_labels(self, rates: Dict[str, Any]) -> None:
        """Actualiza las etiquetas de tasas en el conversor."""
        labels = getattr(self, "_rate_value_labels", {})
        for key, label in labels.items():
            val = rates.get(key)
            if key == "bcv_lunes":
                val = self.bcv_lunes
            if val is not None:
                label.configure(text=f"Bs. {val:,.2f}")
            else:
                label.configure(text="—")

    # ─── Conversion ────────────────────────────────────────────────

    def do_conversion(self) -> None:
        """Realiza la conversión USD ↔ Bs."""
        try:
            amount_text = self.amount_entry.get().strip().replace(",", ".")
            if not amount_text:
                return
            amount = float(amount_text)
            if amount <= 0:
                return
        except ValueError:
            self.result_from.configure(text="")
            self.result_to.configure(text="Monto inválido")
            self.result_info.configure(text="")
            return

        rate_key = self.rate_var_conv.get()
        rate: Optional[float]
        if rate_key == "bcv_lunes":
            rate = self.bcv_lunes
        else:
            rate = self.converter_rates.get(rate_key)

        if rate is None or rate <= 0:
            self.result_from.configure(text="")
            self.result_to.configure(text="Tasa no disponible")
            self.result_info.configure(text="")
            return

        mode = self.conv_mode.get()
        if mode == "usd_to_bs":
            result = amount * rate
            self.result_from.configure(text=f"${amount:,.2f} USD")
            self.result_to.configure(text=f"Bs. {result:,.2f}")
            self.result_info.configure(text=f"Tasa: 1 USD = Bs. {rate:,.2f}")
        else:
            result = amount / rate
            self.result_from.configure(text=f"Bs. {amount:,.2f}")
            self.result_to.configure(text=f"${result:,.2f} USD")
            self.result_info.configure(text=f"Tasa: Bs. {rate:,.2f} = 1 USD")

    # ─── Converter Spreads ────────────────────────────────────────

    def _update_converter_spreads(
        self,
        bcv_rate: Optional[float],
        paralelo_rate: Optional[float],
    ) -> None:
        """Actualiza los indicadores de brecha en el conversor."""
        if hasattr(self, "cv_spread_bcv") and hasattr(self, "cv_spread_lunes"):
            self.cv_spread_bcv.update(bcv_rate, paralelo_rate)
            self.cv_spread_lunes.update(self.bcv_lunes, paralelo_rate)

    # ─── Quick amounts & Paste ────────────────────────────────────

    def _set_quick_amount(self, val: int) -> None:
        """Establece un monto rápido en el conversor."""
        self.amount_entry.delete(0, tk.END)
        self.amount_entry.insert(0, str(val))
        self.do_conversion()

    def _paste_from_clipboard(self) -> None:
        """Pega desde el portapapeles al campo de monto."""
        try:
            text = self.window.clipboard_get()
            if text:
                cleaned = ""
                for ch in text:
                    if ch.isdigit() or ch in ",.":
                        cleaned += ch
                    elif ch in (" ", "\n", "\r"):
                        break
                if cleaned:
                    self.amount_entry.delete(0, tk.END)
                    self.amount_entry.insert(0, cleaned)
                    # Flash feedback
                    old_bg = self._paste_btn.cget("fg_color")
                    self._paste_btn.configure(fg_color=self.actual_theme.success, text_color="#ffffff")
                    self.window.after(
                        500,
                        lambda: self._paste_btn.configure(fg_color=old_bg, text_color=self.actual_theme.muted)
                        if self._paste_btn.winfo_exists()
                        else None,
                    )
                    self.do_conversion()
        except Exception as e:
            logger.warning("Error pegando desde portapapeles: %s", e)

    def _copy_result_text(self, text: str) -> None:
        """Copia el texto del resultado al portapapeles."""
        if text and text.strip():
            self.window.clipboard_clear()
            self.window.clipboard_append(text.strip())
            if self._result_copy_timer:
                self.window.after_cancel(self._result_copy_timer)
            self.result_copy_feedback.configure(text="✓ Copiado al portapapeles")
            self._result_copy_timer = self.window.after(
                2000,
                lambda: self.result_copy_feedback.configure(text="")
                if self.result_copy_feedback.winfo_exists()
                else None,
            )