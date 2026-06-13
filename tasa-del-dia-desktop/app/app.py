"""
Clase principal TasaDelDiaApp — aplicación de escritorio para tasas de cambio.
"""

from __future__ import annotations

import logging
import threading
import tkinter as tk
from tkinter import ttk
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
from app.theme import FONTS, Theme, get_system_theme, resolve_theme
from app.widgets import REFRESH_MINUTES, RateCard, SpreadIndicator, TimerBar
from app.widget_window import WidgetWindow
from app.system_tray import send_notification, start_tray, stop_tray
from app.auto_update import check_for_updates, APP_VERSION
from app.trend_chart import TrendChart

logger = logging.getLogger(__name__)


class TasaDelDiaApp:
    """Aplicación principal de Tasa del Día."""

    def __init__(self) -> None:
        self.window = tk.Tk()
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

        # Diálogo activo (para Esc)
        self._brecha_notified: bool = False

        # Diálogo activo (para Esc)
        self._active_dialog: Optional[tk.Toplevel] = None

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

        # ─── Teardown flag ───
        self._rebuild_offline_mode: bool = False

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
        return resolve_theme(self.theme_mode)

    def _rebuild_ui(self) -> None:
        """Reconstruye toda la UI (usado al cambiar de tema)."""
        # Cancel timers before rebuilding
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

        if old_rates:
            self._on_rates_loaded(old_rates)

        # Recrear widget si estaba visible
        if self.widget and self.widget.is_visible:
            self.widget.destroy()
            self.widget = WidgetWindow(self, self.actual_theme)
            self.widget.show()
            # Re-aplicar tasas actuales
            bcv = old_rates.get("bcv") if old_rates else None
            paralelo = old_rates.get("parallel") if old_rates else None
            fetched = old_rates.get("fetched_at") if old_rates else None
            self.widget.update_rates(bcv, paralelo, fetched)

        # Restore offline mode after theme rebuild
        if old_offline:
            self._rebuild_offline_mode = True
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
        """Construye todos los elementos de la interfaz."""
        c = self.actual_theme

        # ─── Top Bar ───
        top = tk.Frame(self.window, bg=c.bg)
        top.pack(fill="x", padx=16, pady=(12, 4))

        title_frame = tk.Frame(top, bg=c.bg)
        title_frame.pack(fill="x")

        # Logo container
        logo_frame = tk.Frame(
            title_frame, bg=self._blend_bg(c.highlight, 0.12),
            width=40, height=40
        )
        logo_frame.pack(side="left", padx=(0, 10))
        logo_frame.pack_propagate(False)
        tk.Label(
            logo_frame, text="📉",
            bg=self._blend_bg(c.highlight, 0.12),
            font=("Segoe UI", 18)
        ).pack(expand=True)

        tk.Label(
            title_frame, text="Tasa del Día", bg=c.bg, fg=c.primary,
            font=FONTS["title"]
        ).pack(side="left")

        # Theme switch button
        theme_btn = tk.Button(
            title_frame, text=self._theme_label(), font=("Segoe UI", 9),
            bg=c.card, fg=c.secondary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=8, pady=2, cursor="hand2",
            command=self._switch_theme_mode
        )
        # Widget toggle button
        widget_btn = tk.Button(
            title_frame, text="📌 Widget", font=("Segoe UI", 9),
            bg=c.card, fg=c.secondary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=8, pady=2, cursor="hand2",
            command=self._toggle_widget
        )
        widget_btn.pack(side="right", padx=(2, 0))

        theme_btn.pack(side="right", padx=(4, 0))

        # Venezuela flag badge
        badge = tk.Frame(
            title_frame, bg=c.card,
            highlightbackground=c.card_border, highlightthickness=1
        )
        badge.pack(side="right", padx=(0, 6))
        tk.Label(
            badge, text="🇻🇪", bg=c.card, font=("Segoe UI", 12),
            padx=6, pady=1
        ).pack()

        tk.Label(
            top, text="Tasas de cambio del Bolívar Venezolano",
            bg=c.bg, fg=c.secondary, font=FONTS["subtitle"],
            anchor="w"
        ).pack(fill="x", padx=(50, 0), pady=(0, 4))

        # Separator
        sep = tk.Frame(self.window, bg=c.card_border, height=1)
        sep.pack(fill="x", padx=16, pady=(2, 4))

        # Timer bar
        self.timer_bar = TimerBar(self.window, c)
        self.timer_bar.pack(fill="x", padx=12, pady=(0, 4))

        # ─── Notebook ───
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TNotebook", background=c.bg, borderwidth=0)
        style.configure(
            "TNotebook.Tab",
            background=c.card,
            foreground=c.secondary,
            padding=[22, 6],
            font=FONTS["section"],
        )
        style.map(
            "TNotebook.Tab",
            background=[("selected", c.accent)],
            foreground=[("selected", c.primary)],
        )

        self.notebook = ttk.Notebook(self.window)
        self.notebook.pack(fill="both", expand=True, padx=12, pady=(2, 4))

        # ═══════ TAB 1: TASAS ═══════
        self._build_rates_tab()
        # ═══════ TAB 2: CONVERSOR ═══════
        self._build_converter_tab()
        # ═══════ TAB 3: TENDENCIA ═══════
        self._build_trend_tab()

    def _create_scrollable(self, parent: tk.Widget) -> tk.Frame:
        """Crea un panel con scroll.

        Returns:
            Frame interno donde se pueden agregar widgets.
        """
        c = self.actual_theme
        canvas = tk.Canvas(parent, bg=c.bg, highlightthickness=0)
        scroll_frame = tk.Frame(canvas, bg=c.bg)
        scrollbar = tk.Scrollbar(parent, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=scrollbar.set)

        scrollbar.pack(side="right", fill="y")
        canvas.pack(side="left", fill="both", expand=True)

        canvas.create_window((0, 0), window=scroll_frame, anchor="nw", tags="inner")

        def _cfg_scroll(_e: object = None) -> None:
            canvas.configure(scrollregion=canvas.bbox("all"))
            canvas.itemconfig("inner", width=canvas.winfo_width())

        scroll_frame.bind("<Configure>", _cfg_scroll)
        canvas.bind("<Configure>", _cfg_scroll)

        def _on_enter(_e: object) -> None:
            canvas.bind_all(
                "<MouseWheel>",
                lambda e: canvas.yview_scroll(int(-1 * (e.delta / 120)), "units"),
            )

        def _on_leave(_e: object) -> None:
            canvas.unbind_all("<MouseWheel>")

        canvas.bind("<Enter>", _on_enter)
        canvas.bind("<Leave>", _on_leave)

        setattr(self, "_canvas_rates", canvas)
        return scroll_frame

    def _build_rates_tab(self) -> None:
        """Construye la pestaña de tasas."""
        c = self.actual_theme
        self.tab_rates = tk.Frame(self.notebook, bg=c.bg)
        self.notebook.add(self.tab_rates, text="📊  Tasas")

        scroll_frame = self._create_scrollable(self.tab_rates)

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
        edit_btn = tk.Label(
            self.card_lunes.rate_label.master, text="✏️", bg=c.card,
            fg=c.bcv_lunes, font=("Segoe UI", 10), cursor="hand2", padx=4,
        )
        edit_btn.pack(side="left", padx=(2, 0))
        edit_btn.bind("<Button-1>", lambda _e: self._edit_bcv_lunes())

        # Reminder toggle
        self._build_reminder_card(scroll_frame)

        # Historical rates
        self._build_historical_card(scroll_frame)

        # Offline banner (hidden by default)
        self.offline_banner = tk.Frame(scroll_frame, bg=c.warning, padx=12, pady=6)
        tk.Label(
            self.offline_banner, text="⚠️", bg=c.warning, fg="#ffffff",
            font=("Segoe UI", 11),
        ).pack(side="left", padx=(0, 6))
        self.offline_label = tk.Label(
            self.offline_banner, text="", bg=c.warning, fg="#ffffff",
            font=FONTS["small"], anchor="w",
        )
        self.offline_label.pack(side="left", fill="x", expand=True)

        # Info bar
        info_frame = tk.Frame(
            scroll_frame, bg=c.card,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        info_frame.pack(fill="x", padx=12, pady=(6, 12))
        info_inner = tk.Frame(info_frame, bg=c.card)
        info_inner.pack(padx=14, pady=10, fill="x")

        tk.Label(
            info_inner, text="🔄", bg=c.card, font=("Segoe UI", 11),
        ).pack(side="left", padx=(0, 6))
        self.info_label = tk.Label(
            info_inner, text="Las tasas se actualizan cada 25 minutos",
            bg=c.card, fg=c.muted, font=FONTS["small"], anchor="w",
        )
        self.info_label.pack(side="left", fill="x", expand=True)

    def _build_reminder_card(self, parent: tk.Frame) -> None:
        """Construye la tarjeta de recordatorio de los viernes."""
        c = self.actual_theme
        reminder_card = tk.Frame(
            parent, bg=c.card,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        reminder_card.pack(fill="x", padx=12, pady=(0, 6))
        reminder_inner = tk.Frame(reminder_card, bg=c.card)
        reminder_inner.pack(padx=14, pady=10, fill="x")

        tk.Label(
            reminder_inner, text="🔔", bg=c.card, font=("Segoe UI", 11),
        ).pack(side="left", padx=(0, 8))
        reminder_text_frame = tk.Frame(reminder_inner, bg=c.card)
        reminder_text_frame.pack(side="left", fill="x", expand=True)
        tk.Label(
            reminder_text_frame, text="Recordatorio viernes 6:00 PM",
            bg=c.card, fg=c.primary, font=FONTS["subtitle"], anchor="w",
        ).pack(fill="x")
        tk.Label(
            reminder_text_frame, text="Te avisa si aún no has ingresado la tasa",
            bg=c.card, fg=c.muted, font=FONTS["small"], anchor="w",
        ).pack(fill="x")

        self.reminder_var = tk.BooleanVar(value=self.reminder_enabled)
        reminder_check = tk.Checkbutton(
            reminder_inner, variable=self.reminder_var,
            bg=c.card, activebackground=c.card,
            selectcolor=c.card,
            command=self._toggle_reminder,
        )
        reminder_check.pack(side="right", padx=(8, 0))

    def _build_historical_card(self, parent: tk.Frame) -> None:
        """Construye la tarjeta de acceso a tasas históricas."""
        c = self.actual_theme
        hist_card = tk.Frame(
            parent, bg=c.card,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        hist_card.pack(fill="x", padx=12, pady=(0, 6))
        hist_inner = tk.Frame(hist_card, bg=c.card)
        hist_inner.pack(padx=14, pady=10, fill="x")

        tk.Label(
            hist_inner, text="📅", bg=c.card, font=("Segoe UI", 11),
        ).pack(side="left", padx=(0, 8))
        hist_text_frame = tk.Frame(hist_inner, bg=c.card)
        hist_text_frame.pack(side="left", fill="x", expand=True)
        tk.Label(
            hist_text_frame, text="Tasas Históricas", bg=c.card,
            fg=c.primary, font=FONTS["subtitle"], anchor="w",
        ).pack(fill="x")
        self.hist_count_label = tk.Label(
            hist_text_frame,
            text="Toca para consultar tasas de fechas anteriores",
            bg=c.card, fg=c.muted, font=FONTS["small"], anchor="w",
        )
        self.hist_count_label.pack(fill="x")

        hist_btn = tk.Label(
            hist_inner, text="→", bg=c.card, fg=c.secondary,
            font=("Segoe UI", 14), cursor="hand2", padx=4,
        )
        hist_btn.pack(side="right")

        def _open_hist(_e: object = None) -> None:
            self._show_historical_rates()

        hist_btn.bind("<Button-1>", _open_hist)
        hist_inner.bind("<Button-1>", _open_hist)
        for child in hist_inner.winfo_children():
            child.bind("<Button-1>", _open_hist)

    def _build_converter_tab(self) -> None:
        """Construye la pestaña del conversor Bs/USD."""
        c = self.actual_theme
        self.tab_converter = tk.Frame(self.notebook, bg=c.bg)
        self.notebook.add(self.tab_converter, text="💱  Conversor")

        # Scrollable content
        cv_canvas = tk.Canvas(self.tab_converter, bg=c.bg, highlightthickness=0)
        cv_scroll = tk.Frame(cv_canvas, bg=c.bg)
        cv_sbar = tk.Scrollbar(self.tab_converter, orient="vertical", command=cv_canvas.yview)
        cv_canvas.configure(yscrollcommand=cv_sbar.set)
        cv_sbar.pack(side="right", fill="y")
        cv_canvas.pack(side="left", fill="both", expand=True)
        cv_canvas.create_window((0, 0), window=cv_scroll, anchor="nw", tags="inner2")

        def _cfg_cv(_e: object = None) -> None:
            cv_canvas.configure(scrollregion=cv_canvas.bbox("all"))
            cv_canvas.itemconfig("inner2", width=cv_canvas.winfo_width())

        cv_scroll.bind("<Configure>", _cfg_cv)
        cv_canvas.bind("<Configure>", _cfg_cv)

        def _on_enter_cv(_e: object) -> None:
            cv_canvas.bind_all(
                "<MouseWheel>",
                lambda e: cv_canvas.yview_scroll(int(-1 * (e.delta / 120)), "units"),
            )

        def _on_leave_cv(_e: object) -> None:
            cv_canvas.unbind_all("<MouseWheel>")

        cv_canvas.bind("<Enter>", _on_enter_cv)
        cv_canvas.bind("<Leave>", _on_leave_cv)

        conv_content = tk.Frame(cv_scroll, bg=c.bg)
        conv_content.pack(fill="x", padx=12, pady=12)

        # Rate selector
        tk.Label(
            conv_content, text="TASA A USAR", bg=c.bg,
            fg=c.muted, font=FONTS["section"], anchor="w",
        ).pack(fill="x", pady=(0, 8))

        self.rate_var_conv = tk.StringVar(value="bcv")
        self._rate_value_labels: Dict[str, tk.Label] = {}
        rate_options = [
            ("bcv", "BCV (Oficial)", c.success),
            ("parallel", "Dólar Paralelo", c.highlight),
            ("binance_p2p", "Binance P2P", c.warning),
            ("eur", "Euro (BCV)", c.info),
            ("bcv_lunes", "BCV (Lunes)", c.bcv_lunes),
        ]

        for key, label, color in rate_options:
            frame = tk.Frame(
                conv_content, bg=c.card,
                highlightbackground=c.card_border, highlightthickness=1,
            )
            frame.pack(fill="x", pady=(0, 6))

            rb = tk.Radiobutton(
                frame, text=label, variable=self.rate_var_conv, value=key,
                bg=c.card, fg=c.secondary, selectcolor=c.card,
                activebackground=c.card, activeforeground=c.primary,
                font=FONTS["subtitle"], padx=12, pady=10,
                command=self._on_rate_change,
            )
            rb.pack(side="left", fill="x", expand=True)

            val_label = tk.Label(
                frame, text="—", bg=c.card, fg=color,
                font=("Segoe UI", 10, "bold"), padx=12,
            )
            if key == "bcv_lunes":
                val_label.config(cursor="hand2")
                val_label.bind("<Button-1>", lambda _e: self._edit_bcv_lunes())
            val_label.pack(side="right")
            self._rate_value_labels[key] = val_label

        # Converter card
        conv_card = tk.Frame(
            conv_content, bg=c.card,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        conv_card.pack(fill="x", pady=(8, 0))
        inner = tk.Frame(conv_card, bg=c.card)
        inner.pack(padx=16, pady=16, fill="x")

        # Mode toggle
        self.conv_mode = tk.StringVar(value="usd_to_bs")
        mode_frame = tk.Frame(inner, bg=c.input_bg)
        mode_frame.pack(fill="x", pady=(0, 14))

        accent_bg = c.accent
        self.btn_usd = tk.Button(
            mode_frame, text="USD → Bs.", font=FONTS["button"],
            bg=accent_bg, fg=c.primary,
            activebackground=accent_bg, activeforeground=c.primary,
            relief="flat", padx=20, pady=6,
            command=lambda: self._set_mode("usd_to_bs"),
        )
        self.btn_usd.pack(side="left", fill="x", expand=True, padx=(2, 1), pady=2)

        self.btn_bs = tk.Button(
            mode_frame, text="Bs. → USD", font=FONTS["button"],
            bg=c.input_bg, fg=c.muted,
            activebackground=accent_bg, activeforeground=c.primary,
            relief="flat", padx=20, pady=6,
            command=lambda: self._set_mode("bs_to_usd"),
        )
        self.btn_bs.pack(side="right", fill="x", expand=True, padx=(1, 2), pady=2)

        # Input
        tk.Label(
            inner, text="MONTO", bg=c.card, fg=c.secondary,
            font=FONTS["small"], anchor="w",
        ).pack(fill="x", pady=(0, 4))

        entry_frame = tk.Frame(
            inner, bg=c.input_bg,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        entry_frame.pack(fill="x")

        self.amount_entry = tk.Entry(
            entry_frame, bg=c.input_bg, fg=c.input_text,
            font=("Segoe UI", 20, "bold"), relief="flat",
            insertbackground=c.primary, justify="center",
        )
        self.amount_entry.pack(side="left", fill="x", expand=True, padx=12, pady=10, ipady=4)
        self.amount_entry.insert(0, "100")
        self.amount_entry.bind("<Return>", lambda _e: self.do_conversion())

        # Paste button
        paste_btn = tk.Button(
            entry_frame, text="📋 Pegar", font=FONTS["section"],
            bg=c.input_bg, fg=c.muted,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=8, pady=4, cursor="hand2",
            command=self._paste_from_clipboard,
        )
        paste_btn.pack(side="right", padx=(0, 6))
        self._paste_btn = paste_btn

        # Quick amounts
        quick_frame = tk.Frame(inner, bg=c.card)
        quick_frame.pack(fill="x", pady=(8, 0))

        QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000]
        for val in QUICK_AMOUNTS:
            btn = tk.Button(
                quick_frame, text=f"{val:,}".replace(",", "."),
                font=FONTS["section"],
                bg=c.input_bg, fg=c.secondary,
                activebackground=c.accent, activeforeground=c.primary,
                relief="flat", padx=10, pady=4, cursor="hand2",
                command=lambda v=val: self._set_quick_amount(v),
            )
            btn.pack(side="left", fill="x", expand=True, padx=1)

        # Convert button
        self.convert_btn = tk.Button(
            inner, text="💱  Convertir", font=FONTS["button"],
            bg=c.accent, fg=c.primary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=20, pady=10, cursor="hand2",
            command=self.do_conversion,
        )
        self.convert_btn.pack(fill="x", pady=(12, 0))

        # Result
        result_frame = tk.Frame(
            inner, bg=c.card,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        result_frame.pack(fill="x", pady=(12, 0))
        result_inner = tk.Frame(result_frame, bg=c.card)
        result_inner.pack(padx=16, pady=14, fill="x")

        tk.Label(
            result_inner, text="RESULTADO", bg=c.card, fg=c.secondary,
            font=FONTS["small"], anchor="w",
        ).pack(fill="x")

        self.result_from = tk.Label(
            result_inner, text="", bg=c.card, fg=c.primary,
            font=FONTS["result"], anchor="center", cursor="hand2",
        )
        self.result_from.pack(fill="x", pady=(6, 0))
        self.result_from.bind(
            "<Button-1>",
            lambda _e: self._copy_result_text(self.result_from.cget("text")),
        )

        arrow_frame2 = tk.Frame(result_inner, bg=c.card)
        arrow_frame2.pack(fill="x", pady=2)
        tk.Label(
            arrow_frame2, text="▼", bg=c.card, fg=c.highlight,
            font=("Segoe UI", 14),
        ).pack()

        self.result_to = tk.Label(
            result_inner, text="", bg=c.card, fg=c.highlight,
            font=FONTS["result"], anchor="center", cursor="hand2",
        )
        self.result_to.pack(fill="x")
        self.result_to.bind(
            "<Button-1>",
            lambda _e: self._copy_result_text(self.result_to.cget("text")),
        )

        self.result_info = tk.Label(
            result_inner, text="", bg=c.card, fg=c.muted,
            font=FONTS["small"], anchor="center",
        )
        self.result_info.pack(fill="x", pady=(4, 0))

        self.result_copy_feedback = tk.Label(
            result_inner, text="", bg=c.card, fg=c.success,
            font=("Segoe UI", 8, "bold"), anchor="center",
        )
        self.result_copy_feedback.pack(fill="x", pady=(2, 0))
        self._result_copy_timer: Optional[str] = None

        # Spread indicators in Converter tab
        cv_spread_frame = tk.Frame(cv_scroll, bg=c.bg)
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

    # ─── Trend Chart ────────────────────────────────────────────────

    def _build_trend_tab(self) -> None:
        """Construye la pestaña de gráfico de tendencia."""
        c = self.actual_theme
        self.tab_trend = tk.Frame(self.notebook, bg=c.bg)
        self.notebook.add(self.tab_trend, text="📈  Tendencia")

        self.trend_chart = TrendChart(self.tab_trend, c)
        self.trend_chart.pack(fill="both", expand=True)

    def _update_trend_chart(self) -> None:
        """Actualiza el gráfico de tendencia con los datos actuales."""
        if hasattr(self, "trend_chart"):
            historical = get_historical_rates()
            self.trend_chart.update_chart(historical)

    # ─── Historial de Tasas ────────────────────────────────────────

    def _show_historical_rates(self) -> None:
        """Abre un diálogo para ver y gestionar tasas históricas."""
        c = self.actual_theme
        historical = get_historical_rates()

        dialog = tk.Toplevel(self.window)
        self._active_dialog = dialog
        dialog.title("Tasas Históricas")
        dialog.configure(bg=c.card)
        dialog.resizable(False, False)
        dialog.transient(self.window)

        x = self.window.winfo_x() + (self.window.winfo_width() - 380) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 480) // 2
        dialog.geometry(f"380x480+{x}+{y}")

        frame = tk.Frame(dialog, bg=c.card, padx=20, pady=18)
        frame.pack(fill="both", expand=True)

        tk.Label(
            frame, text="Tasas Históricas", bg=c.card, fg=c.primary,
            font=("Segoe UI", 16, "bold"),
        ).pack(anchor="w")
        tk.Label(
            frame,
            text="Ingresa una fecha (DD/MM/AAAA) para ver o guardar tasas",
            bg=c.card, fg=c.secondary, font=("Segoe UI", 9),
            anchor="w", wraplength=340,
        ).pack(fill="x", pady=(2, 10))

        # Date input
        date_entry_frame = tk.Frame(
            frame, bg=c.input_bg,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        date_entry_frame.pack(fill="x")

        date_var = tk.StringVar()
        date_entry = tk.Entry(
            date_entry_frame, textvariable=date_var,
            bg=c.input_bg, fg=c.input_text,
            font=("Segoe UI", 14, "bold"), relief="flat",
            insertbackground=c.primary, justify="center",
        )
        date_entry.pack(fill="x", padx=12, pady=8, ipady=4)
        date_entry.insert(0, datetime.now().strftime("%d/%m/%Y"))

        # Today shortcut
        today_btn = tk.Button(
            frame, text="📅 Hoy", font=FONTS["section"],
            bg=c.input_bg, fg=c.info,
            activebackground=c.accent, activeforeground=c.info,
            relief="flat", padx=8, pady=2, cursor="hand2",
            command=lambda: date_var.set(datetime.now().strftime("%d/%m/%Y")),
        )
        today_btn.pack(anchor="w", pady=(4, 8))

        # Search button
        search_frame = tk.Frame(frame, bg=c.card)
        search_frame.pack(fill="x", pady=(0, 8))

        tk.Button(
            search_frame, text="🔍 Buscar", font=FONTS["section"],
            bg=c.info, fg="#ffffff",
            activebackground=c.info, activeforeground="#ffffff",
            relief="flat", padx=16, pady=4, cursor="hand2",
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

        # Results area
        result_container = tk.Frame(
            frame, bg=c.input_bg,
            highlightbackground=c.card_border, highlightthickness=1,
        )
        result_container.pack(fill="both", expand=True, pady=(0, 10))

        self._update_hist_display(result_container, c, date_var, historical, dialog)

        # Buttons
        btn_frame = tk.Frame(frame, bg=c.card)
        btn_frame.pack(fill="x")

        tk.Button(
            btn_frame, text="📁 Exportar CSV", font=FONTS["section"],
            bg=c.info, fg="#ffffff",
            activebackground=c.info, activeforeground="#ffffff",
            relief="flat", padx=16, pady=6, cursor="hand2",
            command=lambda: self._export_historical_csv(),
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        tk.Button(
            btn_frame, text="Cerrar", font=FONTS["section"],
            bg=c.input_bg, fg=c.secondary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=16, pady=6, cursor="hand2",
            command=lambda: (dialog.destroy(), setattr(self, "_active_dialog", None)),
        ).pack(side="right", fill="x", expand=True, padx=(2, 0))

        dialog.grab_set()
        date_entry.focus_set()
        date_entry.selection_range(0, tk.END)

    def _update_hist_display(
        self,
        container: tk.Frame,
        c: Theme,
        date_var: tk.StringVar,
        historical: Dict[str, Any],
        parent_dialog: tk.Toplevel,
    ) -> None:
        """Actualiza el área de visualización de tasas históricas."""
        # Clear container
        for w in container.winfo_children():
            w.destroy()

        raw = date_var.get().strip()
        if not raw:
            tk.Label(
                container, text="Ingresa una fecha", bg=c.input_bg,
                fg=c.muted, font=("Segoe UI", 10),
            ).pack(expand=True)
            return

        # Parse date using the validated parser
        date_key = parse_date_from_display(raw)
        if date_key is None:
            tk.Label(
                container, text="Fecha inválida. Usa DD/MM/AAAA", bg=c.input_bg,
                fg=c.highlight, font=("Segoe UI", 10),
            ).pack(expand=True)
            return

        today_key = get_today_key()
        is_today = date_key == today_key

        # Title row
        title_row = tk.Frame(container, bg=c.input_bg)
        title_row.pack(fill="x", padx=10, pady=(8, 4))

        tk.Label(
            title_row, text=format_date_key(date_key), bg=c.input_bg,
            fg=c.primary, font=("Segoe UI", 12, "bold"),
        ).pack(side="left")
        if is_today:
            tk.Label(
                title_row, text="  HOY", bg=c.input_bg,
                fg=c.success, font=("Segoe UI", 8, "bold"),
            ).pack(side="left", padx=(4, 0))

        entry = historical.get(date_key, {})
        if entry:
            # Display saved rates
            fields = [
                ("BCV (Oficial)", entry.get("bcv"), c.success),
                ("Paralelo", entry.get("paralelo"), c.highlight),
                ("Binance P2P", entry.get("binance_p2p"), c.warning),
                ("Euro (BCV)", entry.get("euro"), c.info),
            ]

            for label_text, val, color in fields:
                row = tk.Frame(container, bg=c.input_bg)
                row.pack(fill="x", padx=10, pady=1)
                dot = tk.Label(
                    row, text="●", bg=c.input_bg,
                    fg=color if val is not None else c.muted,
                    font=("Segoe UI", 8),
                )
                dot.pack(side="left", padx=(0, 4))
                tk.Label(
                    row, text=label_text, bg=c.input_bg, fg=c.secondary,
                    font=("Segoe UI", 9), anchor="w",
                ).pack(side="left", fill="x", expand=True)
                val_text = f"Bs. {val:,.2f}" if val is not None else "—"
                tk.Label(
                    row, text=val_text, bg=c.input_bg,
                    fg=color if val is not None else c.muted,
                    font=("Segoe UI", 10, "bold"),
                ).pack(side="right")

            if entry.get("manual"):
                tk.Label(
                    container, text="✏️ Ingresado manualmente", bg=c.input_bg,
                    fg=c.muted, font=("Segoe UI", 8),
                ).pack(pady=(4, 0))

            # Edit button
            edit_frame = tk.Frame(container, bg=c.input_bg)
            edit_frame.pack(fill="x", padx=10, pady=(6, 8))
            tk.Button(
                edit_frame, text="✏️ Editar tasas", font=FONTS["section"],
                bg=c.card, fg=c.secondary,
                activebackground=c.accent, activeforeground=c.primary,
                relief="flat", padx=10, pady=4, cursor="hand2",
                command=lambda: self._show_hist_manual_entry(
                    date_key, entry, parent_dialog, container, date_var, historical, c
                ),
            ).pack(fill="x")
        else:
            # No rates for this date
            empty_frame = tk.Frame(container, bg=c.input_bg)
            empty_frame.pack(expand=True, fill="both")
            tk.Label(
                empty_frame, text="No hay tasas guardadas para esta fecha",
                bg=c.input_bg, fg=c.warning, font=("Segoe UI", 10, "bold"),
            ).pack(pady=(20, 2))
            tk.Label(
                empty_frame, text="Puedes ingresarlas manualmente",
                bg=c.input_bg, fg=c.muted, font=("Segoe UI", 9),
            ).pack()
            tk.Button(
                empty_frame, text="📝 Ingresar tasas manualmente",
                font=FONTS["button"],
                bg=c.info, fg="#ffffff",
                activebackground=c.info, activeforeground="#ffffff",
                relief="flat", padx=14, pady=6, cursor="hand2",
                command=lambda: self._show_hist_manual_entry(
                    date_key, {}, parent_dialog, container, date_var, historical, c
                ),
            ).pack(pady=(10, 20))

    def _show_hist_manual_entry(
        self,
        date_key: str,
        entry: Dict[str, Any],
        parent_dialog: tk.Toplevel,
        container: tk.Frame,
        date_var: tk.StringVar,
        historical: Dict[str, Any],
        c: Theme,
    ) -> None:
        """Muestra un sub-diálogo para ingresar/editar tasas históricas."""
        sub = tk.Toplevel(parent_dialog)
        sub.title("Ingresar tasas")
        sub.configure(bg=c.card)
        sub.resizable(False, False)
        sub.transient(parent_dialog)

        x = parent_dialog.winfo_x() + 30
        y = parent_dialog.winfo_y() + 30
        sub.geometry(f"320x300+{x}+{y}")

        sf = tk.Frame(sub, bg=c.card, padx=20, pady=18)
        sf.pack(fill="both", expand=True)

        tk.Label(
            sf, text=f"Tasas para {format_date_key(date_key)}",
            bg=c.card, fg=c.primary, font=("Segoe UI", 14, "bold"),
        ).pack(anchor="w")
        tk.Label(
            sf, text="Ingresa las tasas que recuerdes (puedes dejar vacío)",
            bg=c.card, fg=c.secondary, font=("Segoe UI", 9),
            anchor="w", wraplength=280,
        ).pack(fill="x", pady=(2, 10))

        # Fields
        fields_def = [
            ("BCV (Oficial)", "bcv", c.success),
            ("Paralelo", "paralelo", c.highlight),
            ("Euro (BCV)", "euro", c.info),
        ]
        field_vars: Dict[str, tk.StringVar] = {}

        for label_text, key, color in fields_def:
            frow = tk.Frame(sf, bg=c.card)
            frow.pack(fill="x", pady=(0, 8))
            tk.Label(
                frow, text=label_text, bg=c.card, fg=c.secondary,
                font=("Segoe UI", 9), anchor="w",
            ).pack(fill="x")
            val = entry.get(key)
            var = tk.StringVar(value=f"{val:,.2f}" if val else "")
            field_vars[key] = var
            e = tk.Entry(
                frow, textvariable=var, bg=c.input_bg, fg=color,
                font=("Segoe UI", 14, "bold"), relief="flat",
                insertbackground=c.primary, justify="center",
            )
            e.pack(fill="x", ipady=4)

        btn_row = tk.Frame(sf, bg=c.card)
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
            # Refresh display
            updated_historical = get_historical_rates()
            self._update_hist_display(container, c, date_var, updated_historical, parent_dialog)
            self._update_hist_count()
            sub.destroy()

        tk.Button(
            btn_row, text="Cancelar", font=FONTS["section"],
            bg=c.input_bg, fg=c.secondary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=16, pady=6, cursor="hand2",
            command=sub.destroy,
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))
        tk.Button(
            btn_row, text="Guardar", font=FONTS["section"],
            bg=c.info, fg="#ffffff",
            activebackground=c.info, activeforeground="#ffffff",
            relief="flat", padx=16, pady=6, cursor="hand2",
            command=on_save_hist,
        ).pack(side="right", fill="x", expand=True, padx=(2, 0))

        sub.grab_set()

    def _update_hist_count(self) -> None:
        """Actualiza el contador de tasas históricas en la UI principal."""
        if hasattr(self, "hist_count_label") and self.hist_count_label.winfo_exists():
            historical = get_historical_rates()
            count = len(historical)
            if count > 0:
                self.hist_count_label.config(
                    text=f"{count} fechas guardadas · Toca para consultar"
                )
            else:
                self.hist_count_label.config(
                    text="Toca para consultar o guardar tasas de una fecha anterior"
                )

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
        self.widget.show()
        self._widget_enabled = True

        # Aplicar tasas actuales si ya están cargadas
        # (evita que el widget aparezca con "—" si _on_rates_loaded
        #  se ejecutó antes de crear el widget)
        if self.rates:
            self._update_widget_rates(
                self.rates.get("bcv"),
                self.rates.get("parallel"),
                self.rates.get("fetched_at"),
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
            self.widget.update_rates(bcv, paralelo, fetched_at)

    # ─── BCV Lunes ─────────────────────────────────────────────────

    def _edit_bcv_lunes(self) -> None:
        """Abre un diálogo para editar la tasa BCV del lunes."""
        c = self.actual_theme
        dialog = tk.Toplevel(self.window)
        self._active_dialog = dialog
        dialog.title("Editar BCV (Lunes)")
        dialog.configure(bg=c.card)
        dialog.resizable(False, False)
        dialog.transient(self.window)

        x = self.window.winfo_x() + (self.window.winfo_width() - 320) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 200) // 2
        dialog.geometry(f"320x200+{x}+{y}")

        frame = tk.Frame(dialog, bg=c.card, padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        tk.Label(
            frame, text="BCV (Lunes)", bg=c.card, fg=c.primary,
            font=("Segoe UI", 14, "bold"),
        ).pack(anchor="w")
        tk.Label(
            frame, text="Ingresa la tasa publicada por el BCV para el lunes:",
            bg=c.card, fg=c.secondary, font=("Segoe UI", 9),
            anchor="w", wraplength=280,
        ).pack(fill="x", pady=(4, 12))

        entry_var = tk.StringVar(value=f"{self.bcv_lunes:,.2f}" if self.bcv_lunes else "")
        entry = tk.Entry(
            frame, textvariable=entry_var, bg=c.input_bg, fg=c.input_text,
            font=("Segoe UI", 18, "bold"), relief="flat",
            insertbackground=c.primary, justify="center",
        )
        entry.pack(fill="x", ipady=6)

        btn_frame = tk.Frame(frame, bg=c.card)
        btn_frame.pack(fill="x", pady=(12, 0))

        def on_save() -> None:
            raw = entry_var.get().strip().replace(",", ".")
            try:
                val = float(raw)
                if val > 0:
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

        tk.Button(
            btn_frame, text="Cancelar", font=FONTS["section"],
            bg=c.input_bg, fg=c.secondary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=16, pady=6, cursor="hand2",
            command=on_cancel,
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        if self.bcv_lunes is not None:
            tk.Button(
                btn_frame, text="Borrar", font=FONTS["section"],
                bg=c.highlight, fg="#ffffff",
                activebackground=c.highlight, activeforeground="#ffffff",
                relief="flat", padx=16, pady=6, cursor="hand2",
                command=on_delete,
            ).pack(side="left", fill="x", expand=True, padx=(1, 1))

        tk.Button(
            btn_frame, text="Guardar", font=FONTS["section"],
            bg=c.bcv_lunes, fg="#ffffff",
            activebackground=c.bcv_lunes, activeforeground="#ffffff",
            relief="flat", padx=16, pady=6, cursor="hand2",
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
        popup = tk.Toplevel(self.window)
        popup.title("Recordatorio BCV (Lunes)")
        popup.configure(bg=c.card)
        popup.resizable(False, False)
        popup.transient(self.window)
        popup.attributes("-topmost", True)

        x = self.window.winfo_x() + (self.window.winfo_width() - 340) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 180) // 2
        popup.geometry(f"340x180+{x}+{y}")

        frame = tk.Frame(popup, bg=c.card, padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        icon_text = "✅" if already_entered else "📅"
        tk.Label(
            frame, text=icon_text, bg=c.card, font=("Segoe UI", 28),
        ).pack(pady=(0, 8))

        if already_entered:
            tk.Label(
                frame, text="Ya ingresaste la tasa de hoy", bg=c.card,
                fg=c.primary, font=("Segoe UI", 12, "bold"),
            ).pack()
            tk.Label(
                frame, text="Recuerda revisar si el BCV publicó una nueva.",
                bg=c.card, fg=c.secondary, font=("Segoe UI", 9), wraplength=280,
            ).pack(pady=(4, 0))
        else:
            tk.Label(
                frame, text="¿Ya viste la tasa del lunes?", bg=c.card,
                fg=c.primary, font=("Segoe UI", 12, "bold"),
            ).pack()
            tk.Label(
                frame, text="El BCV publicó la tasa del lunes. ¡Ingrésala en la app!",
                bg=c.card, fg=c.secondary, font=("Segoe UI", 9), wraplength=280,
            ).pack(pady=(4, 0))

        btn_frame = tk.Frame(frame, bg=c.card)
        btn_frame.pack(fill="x", pady=(10, 0))

        tk.Button(
            btn_frame, text="Ingresar tasa", font=FONTS["button"],
            bg=c.bcv_lunes, fg="#ffffff",
            activebackground=c.bcv_lunes, activeforeground="#ffffff",
            relief="flat", padx=16, pady=6, cursor="hand2",
            command=lambda: self._edit_bcv_lunes() or popup.destroy(),
        ).pack(side="left", fill="x", expand=True, padx=(0, 4))

        tk.Button(
            btn_frame, text="Recordar después", font=FONTS["section"],
            bg=c.input_bg, fg=c.secondary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=16, pady=6, cursor="hand2",
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
            self.btn_usd.config(bg=accent_bg, fg=c.primary)
            self.btn_bs.config(bg=c.input_bg, fg=c.muted)
        else:
            self.btn_bs.config(bg=accent_bg, fg=c.primary)
            self.btn_usd.config(bg=c.input_bg, fg=c.muted)
        self.do_conversion()

    def _on_rate_change(self) -> None:
        """Se ejecuta cuando cambia la tasa seleccionada en el conversor."""
        self.do_conversion()

    def _start_theme_polling(self) -> None:
        """Inicia la verificación periódica del tema del sistema."""
        def _poll() -> None:
            if self.theme_mode == "system":
                new_system = get_system_theme()  # "dark" o "light"
                current_name = self.actual_theme.name  # "oscuro" o "claro"
                expected_name = "oscuro" if new_system == "dark" else "claro"
                if current_name != expected_name:
                    logger.info("Tema del sistema cambió a %s, reconstruyendo UI", new_system)
                    self._rebuild_ui()
                    return
            self._theme_poll_timer = self.window.after(5000, _poll)

        # NO llamar _poll() directamente — programar con after para evitar recursión
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
        if isinstance(self.window.focus_get(), tk.Entry):
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
        toast = tk.Toplevel(self.window)
        toast.overrideredirect(True)
        toast.attributes("-topmost", True)
        toast.configure(bg=self.actual_theme.card)

        x = self.window.winfo_x() + (self.window.winfo_width() - 200) // 2
        y = self.window.winfo_y() + 40
        toast.geometry(f"200x36+{x}+{y}")

        frame = tk.Frame(toast, bg=self.actual_theme.accent, padx=12, pady=6)
        frame.pack(fill="both", expand=True)

        tk.Label(
            frame, text=f"✓ {message}", bg=self.actual_theme.accent,
            fg=self.actual_theme.primary, font=("Segoe UI", 9),
        ).pack()

        toast.after(1500, lambda: toast.destroy() if toast.winfo_exists() else None)

    # ─── System Tray ─────────────────────────────────────────────

    def _init_tray(self) -> None:
        """Inicia el system tray después de que la UI esté lista."""
        self.window.after(2000, lambda: start_tray(
            on_show=self._restore_from_tray,
            on_quit=self._quit_from_tray,
        ))

    def _restore_from_tray(self) -> None:
        """Restaura la ventana desde la bandeja."""
        self.window.deiconify()
        self.window.lift()
        self.window.focus_force()

    def _quit_from_tray(self) -> None:
        """Cierra la app desde la bandeja."""
        self._cancel_timers()
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
                    self._show_update_available(result)
            except Exception as e:
                logger.debug("Error checking updates: %s", e)
        threading.Thread(target=_check, daemon=True).start()

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

        dialog = tk.Toplevel(self.window)
        self._active_dialog = dialog
        dialog.title("Actualización disponible")
        dialog.configure(bg=c.card)
        dialog.resizable(False, False)
        dialog.transient(self.window)

        x = self.window.winfo_x() + (self.window.winfo_width() - 360) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 220) // 2
        dialog.geometry(f"360x220+{x}+{y}")

        frame = tk.Frame(dialog, bg=c.card, padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        tk.Label(
            frame, text="🚀 Nueva versión disponible", bg=c.card,
            fg=c.primary, font=("Segoe UI", 14, "bold"),
        ).pack(anchor="w")

        tk.Label(
            frame,
            text=f"Versión actual: {APP_VERSION}\nNueva versión: {result.get('latest_version', '?')}",
            bg=c.card, fg=c.secondary, font=("Segoe UI", 10),
            anchor="w", justify="left",
        ).pack(fill="x", pady=(8, 4))

        if result.get("release_notes"):
            tk.Label(
                frame, text=result["release_notes"][:200],
                bg=c.card, fg=c.muted, font=("Segoe UI", 8),
                anchor="w", wraplength=320, justify="left",
            ).pack(fill="x")

        btn_frame = tk.Frame(frame, bg=c.card)
        btn_frame.pack(fill="x", pady=(12, 0))

        def _download() -> None:
            import webbrowser
            url = result.get("download_url", result.get("release_url", ""))
            if url:
                webbrowser.open(url)
            dialog.destroy()
            self._active_dialog = None

        tk.Button(
            btn_frame, text="📥 Descargar", font=FONTS["button"],
            bg=c.info, fg="#ffffff",
            activebackground=c.info, activeforeground="#ffffff",
            relief="flat", padx=16, pady=6, cursor="hand2",
            command=_download,
        ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        tk.Button(
            btn_frame, text="Recordar después", font=FONTS["section"],
            bg=c.input_bg, fg=c.secondary,
            activebackground=c.accent, activeforeground=c.primary,
            relief="flat", padx=16, pady=6, cursor="hand2",
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
                self.offline_label.config(
                    text=f"Sin conexión — Mostrando últimas tasas ({time_str})"
                )
            else:
                self.offline_label.config(text="Sin conexión — Mostrando últimas tasas")
            try:
                info_bar = self.info_label.master.master
                if info_bar.winfo_exists():
                    self.offline_banner.pack(fill="x", padx=12, pady=(0, 2), before=info_bar)
                else:
                    self.offline_banner.pack(fill="x", padx=12, pady=(0, 2))
            except Exception:
                self.offline_banner.pack(fill="x", padx=12, pady=(0, 2))
            self.info_label.config(text="Las tasas se actualizarán cuando haya conexión")
        else:
            self.offline_banner.pack_forget()
            self.info_label.config(text="Las tasas se actualizan cada 25 minutos")

    # ─── API ────────────────────────────────────────────────────────

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
        thread = threading.Thread(target=self._fetch_rates_thread, daemon=True)
        thread.start()
        logger.info("Iniciando actualización de tasas...")

    def _fetch_rates_thread(self) -> None:
        """Hilo que obtiene las tasas de la API."""
        try:
            rates = fetch_all_rates()
            self.window.after(0, self._on_rates_loaded, rates)
        except ApiError as e:
            logger.error("Error de API al obtener tasas: %s", e)
            self.window.after(0, self._on_rates_error, str(e))
        except Exception as e:
            logger.exception("Error inesperado obteniendo tasas: %s", e)
            self.window.after(0, self._on_rates_error, str(e))

    def _on_rates_loaded(self, rates: RatesDict) -> None:
        """Procesa las tasas recibidas exitosamente."""
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

        # Update historical rates count
        self._update_hist_count()

        # Update info label
        if rates.get("fetched_at"):
            try:
                fetched = str(rates["fetched_at"]).replace("Z", "+00:00")
                dt = datetime.fromisoformat(fetched)
                time_str = dt.strftime("%d/%m/%Y %I:%M %p")
                self.info_label.config(text=f"✓ Actualizado: {time_str}")
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
        save_today_historical_rate(
            bcv=rates.get("bcv"),
            paralelo=rates.get("parallel"),
            binance_p2p=rates.get("binance_p2p"),
            euro=rates.get("eur"),
        )

        # Update trend chart
        self._update_trend_chart()

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

            self._update_hist_count()
            self._update_trend_chart()

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
            self.info_label.config(text=f"⚠ Error: {error_msg}")

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
                label.config(text=f"Bs. {val:,.2f}")
            else:
                label.config(text="—")

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
            self.result_from.config(text="")
            self.result_to.config(text="Monto inválido")
            self.result_info.config(text="")
            return

        rate_key = self.rate_var_conv.get()
        rate: Optional[float]
        if rate_key == "bcv_lunes":
            rate = self.bcv_lunes
        else:
            rate = self.converter_rates.get(rate_key)

        if rate is None or rate <= 0:
            self.result_from.config(text="")
            self.result_to.config(text="Tasa no disponible")
            self.result_info.config(text="")
            return

        mode = self.conv_mode.get()
        if mode == "usd_to_bs":
            result = amount * rate
            self.result_from.config(text=f"${amount:,.2f} USD")
            self.result_to.config(text=f"Bs. {result:,.2f}")
            self.result_info.config(text=f"Tasa: 1 USD = Bs. {rate:,.2f}")
        else:
            result = amount / rate
            self.result_from.config(text=f"Bs. {amount:,.2f}")
            self.result_to.config(text=f"${result:,.2f} USD")
            self.result_info.config(text=f"Tasa: Bs. {rate:,.2f} = 1 USD")

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
                    old_bg = self._paste_btn.cget("bg")
                    self._paste_btn.config(bg=self.actual_theme.success, fg="#ffffff")
                    self.window.after(
                        500,
                        lambda: self._paste_btn.config(bg=old_bg, fg=self.actual_theme.muted)
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
            self.result_copy_feedback.config(text="✓ Copiado al portapapeles")
            self._result_copy_timer = self.window.after(
                2000,
                lambda: self.result_copy_feedback.config(text="")
                if self.result_copy_feedback.winfo_exists()
                else None,
            )