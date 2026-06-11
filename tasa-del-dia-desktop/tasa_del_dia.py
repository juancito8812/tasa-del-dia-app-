#!/usr/bin/env python3
"""
Tasa del Día — Aplicación de escritorio (Premium Dark Fintech)
Muestra tasas de cambio: BCV, Paralelo, Euro, Binance P2P
Incluye conversor Bs ↔ USD e indicador de brecha cambiaria.
Soporta modo Oscuro, Claro y Sigue el tema del Sistema.
Incluye tasa manual BCV (Lunes) con persistencia y brecha vs Paralelo.
"""

import json
import urllib.request
import urllib.error
import tkinter as tk
from tkinter import ttk
from datetime import datetime
import threading
import os
import sys


def resource_path(relative_path):
    """Get absolute path to resource, works for dev and for PyInstaller."""
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)


# ─── CONFIG PATH ────────────────────────────────────────────────
CONFIG_DIR = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "TasaDelDia")
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")


def load_config():
    """Load all config values from config file."""
    try:
        if not os.path.exists(CONFIG_FILE):
            return {
                "bcv_lunes": None,
                "bcv_lunes_updated_at": None,
                "reminder_enabled": False,
            }
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {
            "bcv_lunes": data.get("bcv_lunes"),
            "bcv_lunes_updated_at": data.get("bcv_lunes_updated_at"),
            "reminder_enabled": data.get("reminder_enabled", False),
        }
    except Exception:
        return {
            "bcv_lunes": None,
            "bcv_lunes_updated_at": None,
            "reminder_enabled": False,
        }


# ─── CACHE ────────────────────────────────────────────────────────
CACHE_FILE = os.path.join(CONFIG_DIR, "cache_rates.json")

def save_cache_rates(rates):
    """Save rates to cache for offline use."""
    try:
        if not os.path.exists(CONFIG_DIR):
            os.makedirs(CONFIG_DIR, exist_ok=True)
        cache = {
            "bcv": rates.get("bcv"),
            "paralelo": rates.get("parallel"),
            "binance_p2p": rates.get("binance_p2p"),
            "euro": rates.get("eur"),
            "fetched_at": rates.get("fetched_at"),
            "cached_at": datetime.now().isoformat(),
        }
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

def load_cache_rates():
    """Load rates from cache for offline use.
    Returns None if cache doesn't exist or is corrupted."""
    try:
        if not os.path.exists(CACHE_FILE):
            return None
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            cache = json.load(f)
        return cache
    except Exception:
        return None

# ─── HISTORICAL RATES ─────────────────────────────────────────────
HISTORICAL_FILE = os.path.join(CONFIG_DIR, "historical_rates.json")

def get_historical_rates():
    """Load all historical rates from file."""
    try:
        if os.path.exists(HISTORICAL_FILE):
            with open(HISTORICAL_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
    except Exception:
        return {}

def save_historical_rates(all_rates):
    """Save all historical rates to file."""
    try:
        if not os.path.exists(CONFIG_DIR):
            os.makedirs(CONFIG_DIR, exist_ok=True)
        with open(HISTORICAL_FILE, "w", encoding="utf-8") as f:
            json.dump(all_rates, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def save_today_historical_rate(bcv=None, paralelo=None, binance_p2p=None, euro=None):
    """Auto-save today's rates to historical data."""
    today_key = datetime.now().strftime("%Y-%m-%d")
    try:
        all_rates = get_historical_rates()
        # Only overwrite if doesn't exist or new data is more complete
        if today_key not in all_rates or bcv is not None:
            existing = all_rates.get(today_key, {})
            entry = {
                "bcv": bcv if bcv is not None else existing.get("bcv"),
                "paralelo": paralelo if paralelo is not None else existing.get("paralelo"),
                "binance_p2p": binance_p2p if binance_p2p is not None else existing.get("binance_p2p"),
                "euro": euro if euro is not None else existing.get("euro"),
                "fetchedAt": datetime.now().isoformat(),
            }
            # Preserve manual flag if it exists
            if existing.get("manual"):
                entry["manual"] = True
            all_rates[today_key] = entry
            save_historical_rates(all_rates)
    except Exception:
        pass

def set_manual_historical_rate(date_key, bcv=None, paralelo=None, binance_p2p=None, euro=None):
    """Save manually entered rates for a specific date."""
    try:
        all_rates = get_historical_rates()
        existing = all_rates.get(date_key, {})
        entry = {
            "bcv": bcv if bcv is not None else existing.get("bcv"),
            "paralelo": paralelo if paralelo is not None else existing.get("paralelo"),
            "binance_p2p": binance_p2p if binance_p2p is not None else existing.get("binance_p2p"),
            "euro": euro if euro is not None else existing.get("euro"),
            "fetchedAt": datetime.now().isoformat(),
            "manual": True,
        }
        all_rates[date_key] = entry
        save_historical_rates(all_rates)
    except Exception:
        pass

def format_date_key(date_key):
    """Format YYYY-MM-DD to DD/MM/YYYY for display."""
    if not date_key:
        return ""
    parts = date_key.split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return date_key

def get_today_key():
    return datetime.now().strftime("%Y-%m-%d")

def save_config(bcv_lunes_value=None, reminder_enabled=None):
    """Save config values to file. Pass None for values you don't want to change."""
    try:
        if not os.path.exists(CONFIG_DIR):
            os.makedirs(CONFIG_DIR, exist_ok=True)
        config = load_config()
        if bcv_lunes_value is not None:
            if bcv_lunes_value > 0:
                config["bcv_lunes"] = bcv_lunes_value
                config["bcv_lunes_updated_at"] = datetime.now().isoformat()
            else:
                config["bcv_lunes"] = None
                config["bcv_lunes_updated_at"] = None
        if reminder_enabled is not None:
            config["reminder_enabled"] = bool(reminder_enabled)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


# ─── TEMAS PREMIUM ──────────────────────────────────────────────
DARK = {
    "name": "oscuro",
    "icon": "🌙",
    "bg": "#0a0a14",
    "card": "#16162a",
    "card_border": "#2a2a45",
    "primary": "#ffffff",
    "secondary": "#a0aec0",
    "muted": "#636e82",
    "accent": "#1a1a3e",
    "highlight": "#e94560",
    "success": "#00b894",
    "warning": "#f39c12",
    "info": "#4fc3f7",
    "bcvLunes": "#a855f7",
    "input_bg": "#111126",
    "input_text": "#ffffff",
    "card_bg_rgb": (0x16, 0x16, 0x2a),
}

LIGHT = {
    "name": "claro",
    "icon": "☀️",
    "bg": "#f0f2f5",
    "card": "#ffffff",
    "card_border": "#d1d5db",
    "primary": "#1a1a2e",
    "secondary": "#4a5568",
    "muted": "#9ca3af",
    "accent": "#e2e8f0",
    "highlight": "#e94560",
    "success": "#059669",
    "warning": "#d97706",
    "info": "#0284c7",
    "bcvLunes": "#7c3aed",
    "input_bg": "#f1f5f9",
    "input_text": "#1a1a2e",
    "card_bg_rgb": (0xff, 0xff, 0xff),
}

FONTS = {
    "title": ("Segoe UI", 20, "bold"),
    "subtitle": ("Segoe UI", 10),
    "card_title": ("Segoe UI", 13, "bold"),
    "rate": ("Segoe UI", 26, "bold"),
    "small": ("Segoe UI", 9),
    "button": ("Segoe UI", 11, "bold"),
    "result": ("Segoe UI", 22, "bold"),
    "section": ("Segoe UI", 9, "bold"),
    "timer": ("Segoe UI", 11),
    "spread_big": ("Segoe UI", 18, "bold"),
    "spread_small": ("Segoe UI", 9),
}

# ─── CONFIG ─────────────────────────────────────────────────────
BASE_URL = "https://api.cotizave.com"
REFRESH_MINUTES = 25

MARKET_MAP = {
    "reference": "bcv",
    "eur_reference": "eur",
    "binance": "binance_p2p",
    "parallel": "parallel",
}


# ─── TEMA DEL SISTEMA ──────────────────────────────────────────
def get_system_theme():
    try:
        import winreg
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
        )
        value, _ = winreg.QueryValueEx(key, "AppsUseLightTheme")
        winreg.CloseKey(key)
        return "light" if value == 1 else "dark"
    except Exception:
        return "dark"


# ─── API ────────────────────────────────────────────────────────
def fetch_all_rates():
    url = f"{BASE_URL}/v1/fx/public/calculator?amount=1&from=USD&to=VES"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        try:
            err_data = json.loads(error_body)
            raise Exception(err_data.get("message", f"Error HTTP {e.code}"))
        except json.JSONDecodeError:
            raise Exception(f"Error HTTP {e.code}")
    except urllib.error.URLError as e:
        raise Exception(f"Error de conexion: {e.reason}")
    except Exception as e:
        raise Exception(str(e))

    rates = {}
    fetched_at = data.get("fetched_at")

    for result in data.get("results", []):
        market = result.get("market")
        internal_key = MARKET_MAP.get(market)
        if internal_key:
            rates[internal_key] = {
                "rate": result.get("rate"),
                "fetched_at": fetched_at,
            }

    return {
        "bcv": rates.get("bcv", {}).get("rate"),
        "eur": rates.get("eur", {}).get("rate"),
        "binance_p2p": rates.get("binance_p2p", {}).get("rate"),
        "parallel": rates.get("parallel", {}).get("rate"),
        "fetched_at": fetched_at,
    }


# ─── WIDGET: PREMIUM RATE CARD ──────────────────────────────────
class RateCard(tk.Frame):
    """Tarjeta premium con glow accent, glassmorphism simulado."""

    def __init__(self, parent, title, subtitle, icon, color, colors, **kwargs):
        self._colors = colors
        c = colors
        super().__init__(parent, bg=c["card"], highlightbackground=c["card_border"],
                         highlightthickness=1, **kwargs)
        self.configure(padx=16, pady=14)
        self.color = color
        self.rate_var = tk.StringVar(value="—")
        self.time_var = tk.StringVar(value="")
        self._copy_timer = None

        # Glow accent bar (top)
        glow = tk.Frame(self, bg=color, height=3)
        glow.pack(fill="x", side="top")
        glow.lift()

        # Header
        header = tk.Frame(self, bg=c["card"])
        header.pack(fill="x", pady=(6, 0))

        icon_frame = tk.Frame(header, bg=self._blend(color, 0.15), width=38, height=38)
        icon_frame.pack(side="left", padx=(0, 10))
        icon_frame.pack_propagate(False)
        icon_label = tk.Label(icon_frame, text=icon, bg=self._blend(color, 0.15),
                              fg=color, font=("Segoe UI", 16))
        icon_label.pack(expand=True)

        text_frame = tk.Frame(header, bg=c["card"])
        text_frame.pack(side="left", fill="x", expand=True)

        tk.Label(text_frame, text=title, bg=c["card"], fg=c["primary"],
                 font=FONTS["card_title"], anchor="w").pack(anchor="w")
        if subtitle:
            tk.Label(text_frame, text=subtitle, bg=c["card"], fg=c["secondary"],
                     font=FONTS["small"], anchor="w").pack(anchor="w")

        # Time label top-right
        self.time_label = tk.Label(header, textvariable=self.time_var, bg=c["card"],
                                   fg=c["muted"], font=FONTS["small"])
        self.time_label.pack(side="right", anchor="n", padx=(4, 0))

        # Rate
        rate_frame = tk.Frame(self, bg=c["card"])
        rate_frame.pack(fill="x", pady=(8, 0))

        # Prefix "Bs."
        tk.Label(rate_frame, text="Bs.", bg=c["card"], fg=color,
                 font=("Segoe UI", 16, "bold"), anchor="w").pack(side="left")

        self.rate_label = tk.Label(rate_frame, textvariable=self.rate_var, bg=c["card"],
                                   fg=color, font=FONTS["rate"], anchor="w", cursor="hand2")
        self.rate_label.pack(side="left", padx=(4, 0))

        # Copy button
        self.copy_btn = tk.Label(rate_frame, text="📋", bg=c["card"], fg=c["muted"],
                                 font=("Segoe UI", 10), cursor="hand2", padx=4)
        self.copy_btn.pack(side="left", padx=(2, 0))
        self.copy_btn.bind("<Button-1>", lambda e: self._copy_rate())
        self.rate_label.bind("<Button-1>", lambda e: self._copy_rate())

        # Copy feedback
        self.copy_feedback = tk.Label(self, text="", bg=c["card"], fg=color,
                                      font=("Segoe UI", 8, "bold"), anchor="e")

        # Divider
        divider = tk.Frame(self, bg=c["card_border"], height=1)
        divider.pack(fill="x", pady=(8, 6))

        # 1 USD info
        self.usd_info = tk.Label(self, text="", bg=c["card"], fg=c["muted"],
                                 font=FONTS["small"], anchor="w")
        self.usd_info.pack(fill="x")

    def _blend(self, color, alpha):
        if color.startswith("#") and len(color) == 7:
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            bg_r, bg_g, bg_b = self._colors["card_bg_rgb"]
            blend_r = int(r * alpha + bg_r * (1 - alpha))
            blend_g = int(g * alpha + bg_g * (1 - alpha))
            blend_b = int(b * alpha + bg_b * (1 - alpha))
            return f"#{blend_r:02x}{blend_g:02x}{blend_b:02x}"
        return color

    def update_rate(self, rate_value, updated_at=None):
        if rate_value is not None:
            formatted = f"{rate_value:,.2f}"
            self.rate_var.set(formatted)
            self.usd_info.config(text=f"1 USD = {rate_value:,.2f} Bs.")
        else:
            self.rate_var.set("—")
            self.usd_info.config(text="")
        if updated_at:
            try:
                dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
                time_str = dt.strftime("%d/%m %I:%M %p")
                self.time_var.set(f"🕐 {time_str}")
            except Exception:
                self.time_var.set("")
        else:
            self.time_var.set("")

    def _copy_rate(self):
        rate_text = self.rate_var.get()
        if rate_text and rate_text not in ("—", "Cargando...", "Error"):
            self.clipboard_clear()
            self.clipboard_append("Bs. " + rate_text)
            if self._copy_timer:
                self.after_cancel(self._copy_timer)
            self.copy_feedback.pack(fill="x", pady=(4, 0))
            self.copy_feedback.config(text="✓ Copiado al portapapeles")
            self._copy_timer = self.after(2000, lambda: self.copy_feedback.pack_forget()
                                          if self.copy_feedback.winfo_exists() else None)

    def show_loading(self):
        self.rate_var.set("Cargando...")
        self.rate_label.config(font=("Segoe UI", 14))
        self.time_var.set("")
        self.usd_info.config(text="")

    def show_error(self):
        self.rate_label.config(font=FONTS["rate"])
        self.rate_var.set("Error")
        self.time_var.set("")


# ─── WIDGET: BREAK INDICATOR ────────────────────────────────────
class SpreadIndicator(tk.Frame):
    """Indicador visual de brecha entre dos tasas."""

    def __init__(self, parent, colors, title, icon, color_a, label_a, color_b, label_b, **kwargs):
        self._colors = colors
        c = colors
        super().__init__(parent, bg=c["card"], highlightbackground=c["card_border"],
                         highlightthickness=1, **kwargs)
        self.configure(padx=14, pady=12)
        self.color_a = color_a
        self.color_b = color_b

        self.inner = tk.Frame(self, bg=c["card"])
        self.inner.pack(fill="x")

        # Title
        title_frame = tk.Frame(self.inner, bg=c["card"])
        title_frame.pack(fill="x", pady=(0, 10))

        tk.Label(title_frame, text=icon, bg=c["card"], font=("Segoe UI", 11)).pack(side="left", padx=(0, 6))
        tk.Label(title_frame, text=title, bg=c["card"],
                 fg=c["muted"], font=FONTS["section"], anchor="w").pack(side="left")

        # Rates row
        rates_row = tk.Frame(self.inner, bg=c["card"])
        rates_row.pack(fill="x", pady=(0, 10))

        # Rate A
        a_frame = tk.Frame(rates_row, bg=c["card"])
        a_frame.pack(side="left", expand=True, fill="x")
        tk.Label(a_frame, text=label_a, bg=c["card"], fg=c["muted"],
                 font=FONTS["spread_small"]).pack()
        self.a_value = tk.Label(a_frame, text="—", bg=c["card"], fg=color_a,
                                font=FONTS["spread_big"])
        self.a_value.pack()

        # VS
        vs_frame = tk.Frame(rates_row, bg=c["card"])
        vs_frame.pack(side="left", padx=10)
        tk.Label(vs_frame, text="VS", bg=c["card"], fg=c["muted"],
                 font=("Segoe UI", 10, "bold")).pack()

        # Rate B
        b_frame = tk.Frame(rates_row, bg=c["card"])
        b_frame.pack(side="left", expand=True, fill="x")
        tk.Label(b_frame, text=label_b, bg=c["card"], fg=c["muted"],
                 font=FONTS["spread_small"]).pack()
        self.b_value = tk.Label(b_frame, text="—", bg=c["card"], fg=color_b,
                                font=FONTS["spread_big"])
        self.b_value.pack()

        # Progress bar background
        self.bar_bg = tk.Frame(self.inner, bg=c["input_bg"], height=4)
        self.bar_bg.pack(fill="x", pady=(0, 10))

        # Bar fill
        self.bar_fill = tk.Frame(self.bar_bg, bg=c["success"], height=4)
        self.bar_fill.place(x=0, y=0, relheight=1.0, relwidth=0.0)

        # Stats row
        stats_frame = tk.Frame(self.inner, bg=c["input_bg"])
        stats_frame.pack(fill="x")

        # Diferencia
        diff_frame = tk.Frame(stats_frame, bg=c["input_bg"])
        diff_frame.pack(side="left", expand=True, fill="x", pady=8)
        tk.Label(diff_frame, text="DIFERENCIA", bg=c["input_bg"], fg=c["muted"],
                 font=FONTS["spread_small"]).pack()
        self.diff_value = tk.Label(diff_frame, text="—", bg=c["input_bg"], fg=c["success"],
                                   font=FONTS["section"])
        self.diff_value.pack()

        # Separator
        sep = tk.Frame(stats_frame, bg=c["card_border"], width=1)
        sep.pack(side="left", fill="y", padx=4, pady=6)

        # Brecha %
        pct_frame = tk.Frame(stats_frame, bg=c["input_bg"])
        pct_frame.pack(side="left", expand=True, fill="x", pady=8)
        tk.Label(pct_frame, text="BRECHA", bg=c["input_bg"], fg=c["muted"],
                 font=FONTS["spread_small"]).pack()
        self.pct_value = tk.Label(pct_frame, text="—", bg=c["input_bg"], fg=c["success"],
                                  font=FONTS["section"])
        self.pct_value.pack()

        self.pack_forget()  # hidden by default

    def update(self, rate_a, rate_b):
        """Update with two rates. Calculates brecha as (rate_b - rate_a) / rate_a * 100."""
        if rate_a and rate_b and rate_a > 0:
            diff = rate_b - rate_a
            pct = (diff / rate_a) * 100

            self.a_value.config(text=f"Bs. {rate_a:,.2f}")
            self.b_value.config(text=f"Bs. {rate_b:,.2f}")

            bar_pct = min(pct / 30 * 100, 100)
            self.bar_fill.place(relwidth=bar_pct / 100.0)

            if pct > 15:
                bar_color = self._colors["highlight"]
            elif pct > 8:
                bar_color = self._colors["warning"]
            else:
                bar_color = self._colors["success"]

            self.bar_fill.config(bg=bar_color)
            self.diff_value.config(text=f"Bs. {diff:,.2f}", fg=bar_color)
            self.pct_value.config(text=f"{pct:.2f}%", fg=bar_color)

            if not self.winfo_ismapped():
                parent_siblings = self.master.winfo_children()
                before = parent_siblings[0] if parent_siblings else None
                self.pack(fill="x", padx=12, pady=(0, 8), before=before)
        else:
            self.pack_forget()


# ─── WIDGET: TIMER BAR ─────────────────────────────────────────
class TimerBar(tk.Frame):
    """Barra de cuenta regresiva con estilo premium."""

    def __init__(self, parent, colors, **kwargs):
        self._colors = colors
        c = colors
        super().__init__(parent, bg=c["card"], highlightbackground=c["card_border"],
                         highlightthickness=1, **kwargs)
        self.configure(padx=12, pady=8)

        row = tk.Frame(self, bg=c["card"])
        row.pack(fill="x")

        # Icon
        icon_frame = tk.Frame(row, bg=c["input_bg"], width=22, height=22)
        icon_frame.pack(side="left")
        icon_frame.pack_propagate(False)
        tk.Label(icon_frame, text="🔄", bg=c["input_bg"], font=("Segoe UI", 10)).pack(expand=True)

        self.label = tk.Label(row, text="Actualizando en 25:00", bg=c["card"],
                              fg=c["muted"], font=FONTS["timer"], anchor="w", padx=8)
        self.label.pack(side="left", fill="x", expand=True)

        # Progress bar
        self.bar_bg = tk.Frame(self, bg=c["input_bg"], height=3)
        self.bar_bg.pack(fill="x", pady=(6, 0))

        self.bar_fill = tk.Frame(self.bar_bg, bg=c["accent"], height=3)
        self.bar_fill.place(x=0, y=0, relheight=1.0, relwidth=0.0)

        self.total_seconds = REFRESH_MINUTES * 60

    def update(self, remaining_seconds):
        c = self._colors
        mins = remaining_seconds // 60
        secs = remaining_seconds % 60
        elapsed_pct = (1 - remaining_seconds / self.total_seconds) * 100

        self.bar_fill.place(relwidth=elapsed_pct / 100.0)

        if remaining_seconds < 60:
            self.label.config(text=f"🔄  Actualizando en {remaining_seconds}s…", fg=c["warning"])
            self.bar_fill.config(bg=c["warning"])
        else:
            self.label.config(text=f"🔄  Proxima actualizacion en {mins}:{secs:02d}", fg=c["muted"])
            self.bar_fill.config(bg=c["accent"])


# ─── MAIN APP ───────────────────────────────────────────────────
class TasaDelDiaApp:
    def __init__(self):
        self.window = tk.Tk()
        self.window.title("Tasa del Dia — Venezuela")
        self.window.resizable(True, True)
        self.window.minsize(420, 600)

        # Set window icon
        try:
            icon_path = resource_path("app_icon.ico")
            if os.path.exists(icon_path):
                self.window.iconbitmap(icon_path)
        except Exception:
            pass

        screen_w = self.window.winfo_screenwidth()
        screen_h = self.window.winfo_screenheight()
        x = (screen_w - 500) // 2
        y = (screen_h - 750) // 2
        self.window.geometry(f"500x750+{x}+{max(0, y - 50)}")

        # Offline mode state
        self.offline_mode = False
        self.cached_rates = None

        # Theme state
        self.theme_mode = "system"
        self.actual_theme = self._resolve_theme()
        self.C = DARK if self.actual_theme == "dark" else LIGHT

        self.rates = {}
        self.converter_rates = {}
        self.is_loading = False
        self._refresh_timer = None
        self._theme_poll_timer = None
        self._countdown = REFRESH_MINUTES * 60
        self._countdown_timer = None

        # BCV Lunes state
        bcv_config = load_config()
        self.bcv_lunes = bcv_config.get("bcv_lunes")
        self.bcv_lunes_updated_at = bcv_config.get("bcv_lunes_updated_at")

        # Reminder state
        self.reminder_enabled = bcv_config.get("reminder_enabled", False)
        self._reminder_shown_this_friday = False
        self._reminder_timer = None

        self._build_ui()
        self._bind_events()
        self._start_theme_polling()
        self._start_countdown()
        self._start_reminder_check()
        # Verificar el recordatorio inmediatamente al iniciar (no esperar 30s)
        if self.reminder_enabled and not self._reminder_shown_this_friday:
            self.window.after(1000, self._check_reminder)
        self.refresh_rates()

    def _resolve_theme(self):
        if self.theme_mode == "system":
            return get_system_theme()
        return self.theme_mode

    def _rebuild_ui(self):
        # Cancel timers before rebuilding
        if self._reminder_timer:
            self.window.after_cancel(self._reminder_timer)
            self._reminder_timer = None

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
        self.C = DARK if self.actual_theme == "dark" else LIGHT
        self.window.configure(bg=self.C["bg"])

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

        # Restore offline mode after theme rebuild
        if old_offline:
            self._rebuild_offline_mode = True
            if old_cached:
                self._set_offline_mode(True, old_cached.get("cached_at", ""))
            else:
                self._set_offline_mode(True)

    def _switch_theme_mode(self):
        modes = ["dark", "light", "system"]
        idx = modes.index(self.theme_mode)
        self.theme_mode = modes[(idx + 1) % len(modes)]
        self._rebuild_ui()

    def _theme_label(self):
        labels = {
            "dark": "🌙 Oscuro",
            "light": "☀️ Claro",
            "system": "🖥️ Sistema",
        }
        return labels.get(self.theme_mode, "🌙")

    def _build_ui(self):
        c = self.C

        # ─── Top Bar ───
        top = tk.Frame(self.window, bg=c["bg"])
        top.pack(fill="x", padx=16, pady=(12, 4))

        title_frame = tk.Frame(top, bg=c["bg"])
        title_frame.pack(fill="x")

        # Logo container
        logo_frame = tk.Frame(title_frame, bg=self._blend_bg(c["highlight"], 0.12),
                               width=40, height=40)
        logo_frame.pack(side="left", padx=(0, 10))
        logo_frame.pack_propagate(False)
        tk.Label(logo_frame, text="📉", bg=self._blend_bg(c["highlight"], 0.12),
                 font=("Segoe UI", 18)).pack(expand=True)

        tk.Label(title_frame, text="Tasa del Dia", bg=c["bg"], fg=c["primary"],
                 font=FONTS["title"]).pack(side="left")

        # Theme switch button
        theme_btn = tk.Button(title_frame, text=self._theme_label(), font=("Segoe UI", 9),
                              bg=c["card"], fg=c["secondary"],
                              activebackground=c["accent"], activeforeground=c["primary"],
                              relief="flat", padx=8, pady=2, cursor="hand2",
                              command=self._switch_theme_mode)
        theme_btn.pack(side="right", padx=(4, 0))

        # Venezuela flag badge
        badge = tk.Frame(title_frame, bg=c["card"], highlightbackground=c["card_border"],
                         highlightthickness=1)
        badge.pack(side="right", padx=(0, 6))
        tk.Label(badge, text="🇻🇪", bg=c["card"], font=("Segoe UI", 12),
                 padx=6, pady=1).pack()

        tk.Label(top, text="Tasas de cambio del Bolivar Venezolano",
                 bg=c["bg"], fg=c["secondary"], font=FONTS["subtitle"],
                 anchor="w").pack(fill="x", padx=(50, 0), pady=(0, 4))

        # Separator
        sep = tk.Frame(self.window, bg=c["card_border"], height=1)
        sep.pack(fill="x", padx=16, pady=(2, 4))

        # Timer bar
        self.timer_bar = TimerBar(self.window, c)
        self.timer_bar.pack(fill="x", padx=12, pady=(0, 4))

        # ─── Notebook ───
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TNotebook", background=c["bg"], borderwidth=0)
        style.configure("TNotebook.Tab", background=c["card"], foreground=c["secondary"],
                        padding=[22, 6], font=FONTS["section"])
        style.map("TNotebook.Tab",
                  background=[("selected", c["accent"])],
                  foreground=[("selected", c["primary"])])

        self.notebook = ttk.Notebook(self.window)
        self.notebook.pack(fill="both", expand=True, padx=12, pady=(2, 4))

        # ═══════════════ TAB 1: TASAS ═══════════════
        self.tab_rates = tk.Frame(self.notebook, bg=c["bg"])
        self.notebook.add(self.tab_rates, text="📊  Tasas")

        # Canvas + Scroll
        canvas = tk.Canvas(self.tab_rates, bg=c["bg"], highlightthickness=0)
        scroll_frame = tk.Frame(canvas, bg=c["bg"])
        scrollbar = tk.Scrollbar(self.tab_rates, orient="vertical", command=canvas.yview)
        canvas.configure(yscrollcommand=scrollbar.set)

        scrollbar.pack(side="right", fill="y")
        canvas.pack(side="left", fill="both", expand=True)
        self._canvas_rates = canvas
        canvas.create_window((0, 0), window=scroll_frame, anchor="nw", tags="inner")

        def _cfg_scroll(e):
            canvas.configure(scrollregion=canvas.bbox("all"))
            canvas.itemconfig("inner", width=canvas.winfo_width())
        scroll_frame.bind("<Configure>", _cfg_scroll)
        canvas.bind("<Configure>", _cfg_scroll)

        canvas.bind("<Enter>", lambda e: canvas.bind_all("<MouseWheel>",
                    lambda e: canvas.yview_scroll(int(-1 * (e.delta / 120)), "units")))
        canvas.bind("<Leave>", lambda e: canvas.unbind_all("<MouseWheel>"))

        # Spread indicator - BCV vs Paralelo
        self.spread_indicator = SpreadIndicator(scroll_frame, c,
            title="BRECHA BCV VS PARALELO", icon="⚖️",
            color_a=c["success"], label_a="●  BCV",
            color_b=c["highlight"], label_b="●  Paralelo")

        # Spread indicator - BCV Lunes vs Paralelo
        self.spread_lunes = SpreadIndicator(scroll_frame, c,
            title="BRECHA BCV (LUNES) VS PARALELO", icon="📅",
            color_a=c["bcvLunes"], label_a="●  BCV (Lunes)",
            color_b=c["highlight"], label_b="●  Paralelo")

        # Rate Cards
        self.card_bcv = RateCard(scroll_frame, "BCV (Oficial)", "Banco Central de Venezuela",
                                 "🏛️", c["success"], c)
        self.card_bcv.pack(fill="x", padx=12, pady=(4, 6))

        self.card_parallel = RateCard(scroll_frame, "Dolar Paralelo", "Mercado paralelo / promedio",
                                      "📈", c["highlight"], c)
        self.card_parallel.pack(fill="x", padx=12, pady=6)

        self.card_eur = RateCard(scroll_frame, "Euro (BCV)", "Tasa de referencia oficial",
                                 "💶", c["info"], c)
        self.card_eur.pack(fill="x", padx=12, pady=6)

        self.card_binance = RateCard(scroll_frame, "Binance P2P", "USDT / VES — Mercado P2P",
                                     "₿", c["warning"], c)
        self.card_binance.pack(fill="x", padx=12, pady=6)

        # BCV Lunes card (con editable via click)
        bcv_lunes_color = c["bcvLunes"]
        self.card_lunes = RateCard(scroll_frame, "BCV (Lunes)", "Tasa manual del lunes",
                                   "📅", bcv_lunes_color, c)
        self.card_lunes.pack(fill="x", padx=12, pady=6)
        # Actualizar con el valor actual
        self.card_lunes.update_rate(self.bcv_lunes, self.bcv_lunes_updated_at)

        # Boton Editar visible dentro de la tarjeta BCV Lunes
        edit_btn = tk.Label(self.card_lunes.rate_label.master, text="✏️", bg=c["card"], fg=bcv_lunes_color,
                            font=("Segoe UI", 10), cursor="hand2", padx=4)
        edit_btn.pack(side="left", padx=(2, 0))
        edit_btn.bind("<Button-1>", lambda e: self._edit_bcv_lunes())

        # Reminder toggle card (al lado derecho)
        reminder_card = tk.Frame(scroll_frame, bg=c["card"], highlightbackground=c["card_border"],
                                 highlightthickness=1)
        reminder_card.pack(fill="x", padx=12, pady=(0, 6))
        reminder_inner = tk.Frame(reminder_card, bg=c["card"])
        reminder_inner.pack(padx=14, pady=10, fill="x")

        tk.Label(reminder_inner, text="🔔", bg=c["card"], font=("Segoe UI", 11)).pack(side="left", padx=(0, 8))
        reminder_text_frame = tk.Frame(reminder_inner, bg=c["card"])
        reminder_text_frame.pack(side="left", fill="x", expand=True)
        tk.Label(reminder_text_frame, text="Recordatorio viernes 6:00 PM", bg=c["card"],
                 fg=c["primary"], font=FONTS["subtitle"], anchor="w").pack(fill="x")
        tk.Label(reminder_text_frame, text="Te avisa si aun no has ingresado la tasa", bg=c["card"],
                 fg=c["muted"], font=FONTS["small"], anchor="w").pack(fill="x")

        self.reminder_var = tk.BooleanVar(value=self.reminder_enabled)
        reminder_check = tk.Checkbutton(reminder_inner, variable=self.reminder_var,
                                         bg=c["card"], activebackground=c["card"],
                                         selectcolor=c["card"],
                                         command=self._toggle_reminder)
        reminder_check.pack(side="right", padx=(8, 0))

        # ─── Historical rates card ───
        hist_card = tk.Frame(scroll_frame, bg=c["card"], highlightbackground=c["card_border"],
                              highlightthickness=1)
        hist_card.pack(fill="x", padx=12, pady=(0, 6))
        hist_inner = tk.Frame(hist_card, bg=c["card"])
        hist_inner.pack(padx=14, pady=10, fill="x")

        tk.Label(hist_inner, text="📅", bg=c["card"], font=("Segoe UI", 11)).pack(side="left", padx=(0, 8))
        hist_text_frame = tk.Frame(hist_inner, bg=c["card"])
        hist_text_frame.pack(side="left", fill="x", expand=True)
        tk.Label(hist_text_frame, text="Tasas Historicas", bg=c["card"],
                 fg=c["primary"], font=FONTS["subtitle"], anchor="w").pack(fill="x")
        self.hist_count_label = tk.Label(hist_text_frame, text="Toca para consultar tasas de fechas anteriores", bg=c["card"],
                 fg=c["muted"], font=FONTS["small"], anchor="w")
        self.hist_count_label.pack(fill="x")

        hist_btn = tk.Label(hist_inner, text="→", bg=c["card"], fg=c["secondary"],
                            font=("Segoe UI", 14), cursor="hand2", padx=4)
        hist_btn.pack(side="right")
        def _open_hist(e):
            self._show_historical_rates()
        hist_btn.bind("<Button-1>", _open_hist)
        hist_inner.bind("<Button-1>", _open_hist)
        for child in hist_inner.winfo_children():
            child.bind("<Button-1>", _open_hist)

        # Offline banner (hidden by default)
        self.offline_banner = tk.Frame(scroll_frame, bg=c["warning"], padx=12, pady=6)
        tk.Label(self.offline_banner, text="⚠️", bg=c["warning"], fg="#ffffff",
                 font=("Segoe UI", 11)).pack(side="left", padx=(0, 6))
        self.offline_label = tk.Label(self.offline_banner, text="", bg=c["warning"], fg="#ffffff",
                                      font=FONTS["small"], anchor="w")
        self.offline_label.pack(side="left", fill="x", expand=True)

        # Info bar
        info_frame = tk.Frame(scroll_frame, bg=c["card"], highlightbackground=c["card_border"],
                              highlightthickness=1)
        info_frame.pack(fill="x", padx=12, pady=(6, 12))

        info_inner = tk.Frame(info_frame, bg=c["card"])
        info_inner.pack(padx=14, pady=10, fill="x")

        tk.Label(info_inner, text="🔄", bg=c["card"], font=("Segoe UI", 11)).pack(side="left", padx=(0, 6))
        self.info_label = tk.Label(info_inner, text="Las tasas se actualizan cada 25 minutos",
                                   bg=c["card"], fg=c["muted"], font=FONTS["small"], anchor="w")
        self.info_label.pack(side="left", fill="x", expand=True)

        # ═══════════════ TAB 2: CONVERSOR ═══════════════
        self.tab_converter = tk.Frame(self.notebook, bg=c["bg"])
        self.notebook.add(self.tab_converter, text="💱  Conversor")

        cv_canvas = tk.Canvas(self.tab_converter, bg=c["bg"], highlightthickness=0)
        cv_scroll = tk.Frame(cv_canvas, bg=c["bg"])
        cv_sbar = tk.Scrollbar(self.tab_converter, orient="vertical", command=cv_canvas.yview)
        cv_canvas.configure(yscrollcommand=cv_sbar.set)

        cv_sbar.pack(side="right", fill="y")
        cv_canvas.pack(side="left", fill="both", expand=True)
        self._canvas_converter = cv_canvas
        cv_canvas.create_window((0, 0), window=cv_scroll, anchor="nw", tags="inner2")

        def _cfg_cv(e):
            cv_canvas.configure(scrollregion=cv_canvas.bbox("all"))
            cv_canvas.itemconfig("inner2", width=cv_canvas.winfo_width())
        cv_scroll.bind("<Configure>", _cfg_cv)
        cv_canvas.bind("<Configure>", _cfg_cv)

        cv_canvas.bind("<Enter>", lambda e: cv_canvas.bind_all("<MouseWheel>",
                       lambda e: cv_canvas.yview_scroll(int(-1 * (e.delta / 120)), "units")))
        cv_canvas.bind("<Leave>", lambda e: cv_canvas.unbind_all("<MouseWheel>"))

        conv_content = tk.Frame(cv_scroll, bg=c["bg"])
        conv_content.pack(fill="x", padx=12, pady=12)

        # Rate selector
        tk.Label(conv_content, text="TASA A USAR", bg=c["bg"],
                 fg=c["muted"], font=FONTS["section"], anchor="w").pack(fill="x", pady=(0, 8))

        self.rate_var_conv = tk.StringVar(value="bcv")
        self._rate_value_labels = {}
        rate_options = [
            ("bcv", "BCV (Oficial)", c["success"]),
            ("parallel", "Dolar Paralelo", c["highlight"]),
            ("binance_p2p", "Binance P2P", c["warning"]),
            ("eur", "Euro (BCV)", c["info"]),
            ("bcv_lunes", "BCV (Lunes)", c["bcvLunes"]),
        ]

        for key, label, color in rate_options:
            frame = tk.Frame(conv_content, bg=c["card"], highlightbackground=c["card_border"],
                             highlightthickness=1)
            frame.pack(fill="x", pady=(0, 6))

            rb = tk.Radiobutton(frame, text=label, variable=self.rate_var_conv, value=key,
                                bg=c["card"], fg=c["secondary"], selectcolor=c["card"],
                                activebackground=c["card"], activeforeground=c["primary"],
                                font=FONTS["subtitle"], padx=12, pady=10,
                                command=self._on_rate_change)
            rb.pack(side="left", fill="x", expand=True)

            val_label = tk.Label(frame, text="—", bg=c["card"], fg=color,
                                 font=("Segoe UI", 10, "bold"), padx=12)
            if key == "bcv_lunes":
                val_label.config(cursor="hand2")
                val_label.bind("<Button-1>", lambda e: self._edit_bcv_lunes())
            val_label.pack(side="right")
            self._rate_value_labels[key] = val_label

        # Converter card
        conv_card = tk.Frame(conv_content, bg=c["card"], highlightbackground=c["card_border"],
                             highlightthickness=1)
        conv_card.pack(fill="x", pady=(8, 0))

        inner = tk.Frame(conv_card, bg=c["card"])
        inner.pack(padx=16, pady=16, fill="x")

        # Mode toggle
        self.conv_mode = tk.StringVar(value="usd_to_bs")
        mode_frame = tk.Frame(inner, bg=c["input_bg"])
        mode_frame.pack(fill="x", pady=(0, 14))

        accent_bg = c["accent"]
        self.btn_usd = tk.Button(mode_frame, text="USD → Bs.", font=FONTS["button"],
                                 bg=accent_bg, fg=c["primary"],
                                 activebackground=accent_bg, activeforeground=c["primary"],
                                 relief="flat", padx=20, pady=6,
                                 command=lambda: self._set_mode("usd_to_bs"))
        self.btn_usd.pack(side="left", fill="x", expand=True, padx=(2, 1), pady=2)

        self.btn_bs = tk.Button(mode_frame, text="Bs. → USD", font=FONTS["button"],
                                bg=c["input_bg"], fg=c["muted"],
                                activebackground=accent_bg, activeforeground=c["primary"],
                                relief="flat", padx=20, pady=6,
                                command=lambda: self._set_mode("bs_to_usd"))
        self.btn_bs.pack(side="right", fill="x", expand=True, padx=(1, 2), pady=2)

        # Input
        tk.Label(inner, text="MONTO", bg=c["card"], fg=c["secondary"],
                 font=FONTS["small"], anchor="w").pack(fill="x", pady=(0, 4))

        entry_frame = tk.Frame(inner, bg=c["input_bg"], highlightbackground=c["card_border"],
                               highlightthickness=1)
        entry_frame.pack(fill="x")

        self.amount_entry = tk.Entry(entry_frame, bg=c["input_bg"], fg=c["input_text"],
                                     font=("Segoe UI", 20, "bold"), relief="flat",
                                     insertbackground=c["primary"], justify="center")
        self.amount_entry.pack(side="left", fill="x", expand=True, padx=12, pady=10, ipady=4)
        self.amount_entry.insert(0, "100")
        self.amount_entry.bind("<Return>", lambda e: self.do_conversion())

        # Paste button
        paste_btn = tk.Button(entry_frame, text="📋 Pegar", font=FONTS["section"],
                              bg=c["input_bg"], fg=c["muted"],
                              activebackground=c["accent"], activeforeground=c["primary"],
                              relief="flat", padx=8, pady=4, cursor="hand2",
                              command=self._paste_from_clipboard)
        paste_btn.pack(side="right", padx=(0, 6))
        self._paste_btn = paste_btn

        # Quick amounts row
        quick_frame = tk.Frame(inner, bg=c["card"])
        quick_frame.pack(fill="x", pady=(8, 0))

        QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000, 50000]
        for val in QUICK_AMOUNTS:
            btn = tk.Button(quick_frame, text=f"{val:,}".replace(",", "."), font=FONTS["section"],
                           bg=c["input_bg"], fg=c["secondary"],
                           activebackground=c["accent"], activeforeground=c["primary"],
                           relief="flat", padx=10, pady=4, cursor="hand2",
                           command=lambda v=val: self._set_quick_amount(v))
            btn.pack(side="left", fill="x", expand=True, padx=1)

        # Convert button
        self.convert_btn = tk.Button(inner, text="💱  Convertir", font=FONTS["button"],
                                     bg=c["accent"], fg=c["primary"],
                                     activebackground=c["accent"], activeforeground=c["primary"],
                                     relief="flat", padx=20, pady=10, cursor="hand2",
                                     command=self.do_conversion)
        self.convert_btn.pack(fill="x", pady=(12, 0))

        # Result
        result_frame = tk.Frame(inner, bg=c["card"], highlightbackground=c["card_border"],
                                highlightthickness=1)
        result_frame.pack(fill="x", pady=(12, 0))
        result_inner = tk.Frame(result_frame, bg=c["card"])
        result_inner.pack(padx=16, pady=14, fill="x")

        tk.Label(result_inner, text="RESULTADO", bg=c["card"], fg=c["secondary"],
                 font=FONTS["small"], anchor="w").pack(fill="x")

        self.result_from = tk.Label(result_inner, text="", bg=c["card"], fg=c["primary"],
                                    font=FONTS["result"], anchor="center", cursor="hand2")
        self.result_from.pack(fill="x", pady=(6, 0))
        self.result_from.bind("<Button-1>", lambda e: self._copy_result_text(self.result_from.cget("text")))

        arrow_frame2 = tk.Frame(result_inner, bg=c["card"])
        arrow_frame2.pack(fill="x", pady=2)
        tk.Label(arrow_frame2, text="▼", bg=c["card"], fg=c["highlight"],
                 font=("Segoe UI", 14)).pack()

        self.result_to = tk.Label(result_inner, text="", bg=c["card"], fg=c["highlight"],
                                  font=FONTS["result"], anchor="center", cursor="hand2")
        self.result_to.pack(fill="x")
        self.result_to.bind("<Button-1>", lambda e: self._copy_result_text(self.result_to.cget("text")))

        self.result_info = tk.Label(result_inner, text="", bg=c["card"], fg=c["muted"],
                                    font=FONTS["small"], anchor="center")
        self.result_info.pack(fill="x", pady=(4, 0))

        self.result_copy_feedback = tk.Label(result_inner, text="", bg=c["card"], fg=c["success"],
                                              font=("Segoe UI", 8, "bold"), anchor="center")
        self.result_copy_feedback.pack(fill="x", pady=(2, 0))
        self._result_copy_timer = None

        # ─── Spread indicators in Converter tab ───
        cv_spread_frame = tk.Frame(cv_scroll, bg=c["bg"])
        cv_spread_frame.pack(fill="x", padx=12, pady=(0, 12))

        self.cv_spread_bcv = SpreadIndicator(cv_spread_frame, c,
            title="BRECHA BCV VS PARALELO", icon="⚖️",
            color_a=c["success"], label_a="●  BCV",
            color_b=c["highlight"], label_b="●  Paralelo")
        self.cv_spread_lunes = SpreadIndicator(cv_spread_frame, c,
            title="BRECHA BCV (LUNES) VS PARALELO", icon="📅",
            color_a=c["bcvLunes"], label_a="●  BCV (Lunes)",
            color_b=c["highlight"], label_b="●  Paralelo")

    def _blend_bg(self, color, alpha):
        """Blend color with current background."""
        if color.startswith("#") and len(color) == 7:
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
            bg_color = self.C["bg"]
            bg_r = int(bg_color[1:3], 16) if bg_color.startswith("#") and len(bg_color) == 7 else 0x0a
            bg_g = int(bg_color[3:5], 16) if bg_color.startswith("#") and len(bg_color) == 7 else 0x0a
            bg_b = int(bg_color[5:7], 16) if bg_color.startswith("#") and len(bg_color) == 7 else 0x14
            blend_r = int(r * alpha + bg_r * (1 - alpha))
            blend_g = int(g * alpha + bg_g * (1 - alpha))
            blend_b = int(b * alpha + bg_b * (1 - alpha))
            return f"#{blend_r:02x}{blend_g:02x}{blend_b:02x}"
        return color

    # ─── Historial de Tasas ───
    def _show_historical_rates(self):
        """Open a dialog to view and manage historical rates."""
        c = self.C
        historical = get_historical_rates()

        dialog = tk.Toplevel(self.window)
        dialog.title("Tasas Historicas")
        dialog.configure(bg=c["card"])
        dialog.resizable(False, False)
        dialog.transient(self.window)

        x = self.window.winfo_x() + (self.window.winfo_width() - 380) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 480) // 2
        dialog.geometry(f"380x480+{x}+{y}")

        frame = tk.Frame(dialog, bg=c["card"], padx=20, pady=18)
        frame.pack(fill="both", expand=True)

        tk.Label(frame, text="Tasas Historicas", bg=c["card"], fg=c["primary"],
                 font=("Segoe UI", 16, "bold")).pack(anchor="w")
        tk.Label(frame, text="Ingresa una fecha (DD/MM/AAAA) para ver o guardar tasas",
                 bg=c["card"], fg=c["secondary"], font=("Segoe UI", 9),
                 anchor="w", wraplength=340).pack(fill="x", pady=(2, 10))

        # Date input
        date_entry_frame = tk.Frame(frame, bg=c["input_bg"], highlightbackground=c["card_border"],
                                     highlightthickness=1)
        date_entry_frame.pack(fill="x")

        date_var = tk.StringVar()
        date_entry = tk.Entry(date_entry_frame, textvariable=date_var, bg=c["input_bg"], fg=c["input_text"],
                              font=("Segoe UI", 14, "bold"), relief="flat",
                              insertbackground=c["primary"], justify="center")
        date_entry.pack(fill="x", padx=12, pady=8, ipady=4)
        date_entry.insert(0, datetime.now().strftime("%d/%m/%Y"))

        # Today shortcut
        today_btn = tk.Button(frame, text="📅 Hoy", font=FONTS["section"],
                              bg=c["input_bg"], fg=c["info"],
                              activebackground=c["accent"], activeforeground=c["info"],
                              relief="flat", padx=8, pady=2, cursor="hand2",
                              command=lambda: date_var.set(datetime.now().strftime("%d/%m/%Y")))
        today_btn.pack(anchor="w", pady=(4, 8))

        # Search button
        search_frame = tk.Frame(frame, bg=c["card"])
        search_frame.pack(fill="x", pady=(0, 8))

        tk.Button(search_frame, text="🔍 Buscar", font=FONTS["section"],
                  bg=c["info"], fg="#ffffff",
                  activebackground=c["info"], activeforeground="#ffffff",
                  relief="flat", padx=16, pady=4, cursor="hand2",
                  command=lambda: self._update_hist_display(result_container, c, date_var, get_historical_rates(), dialog)
                  ).pack(side="left", fill="x", expand=True, padx=(0, 2))

        # Also auto-update when the date entry changes (with a small delay to avoid flickering)
        def _on_date_change(*args):
            dialog.after(300, lambda: self._update_hist_display(result_container, c, date_var, get_historical_rates(), dialog))
        date_var.trace_add("write", _on_date_change)

        # Results area (scrollable)
        result_container = tk.Frame(frame, bg=c["input_bg"], highlightbackground=c["card_border"],
                                    highlightthickness=1)
        result_container.pack(fill="both", expand=True, pady=(0, 10))

        self._update_hist_display(result_container, c, date_var, historical, dialog)

        # Buttons
        btn_frame = tk.Frame(frame, bg=c["card"])
        btn_frame.pack(fill="x")

        tk.Button(btn_frame, text="Cerrar", font=FONTS["section"],
                  bg=c["input_bg"], fg=c["secondary"],
                  activebackground=c["accent"], activeforeground=c["primary"],
                  relief="flat", padx=16, pady=6, cursor="hand2",
                  command=dialog.destroy).pack(side="right", fill="x", expand=True, padx=(2, 0))

        dialog.grab_set()
        date_entry.focus_set()
        date_entry.selection_range(0, tk.END)

    def _update_hist_display(self, container, c, date_var, historical, dialog):
        """Update the historical rates display area based on the selected date."""
        # Clear container
        for w in container.winfo_children():
            w.destroy()

        raw = date_var.get().strip()
        if not raw:
            tk.Label(container, text="Ingresa una fecha", bg=c["input_bg"],
                     fg=c["muted"], font=("Segoe UI", 10)).pack(expand=True)
            return

        # Parse date
        parts = raw.replace("/", "-").split("-")
        if len(parts) != 3:
            tk.Label(container, text="Formato invalido. Usa DD/MM/AAAA", bg=c["input_bg"],
                     fg=c["highlight"], font=("Segoe UI", 10)).pack(expand=True)
            return

        try:
            dd, mm, yyyy = int(parts[0]), int(parts[1]), int(parts[2])
            if dd < 1 or dd > 31 or mm < 1 or mm > 12 or yyyy < 2020 or yyyy > 2030:
                raise ValueError
            date_key = f"{yyyy}-{mm:02d}-{dd:02d}"
        except (ValueError, IndexError):
            tk.Label(container, text="Fecha invalida", bg=c["input_bg"],
                     fg=c["highlight"], font=("Segoe UI", 10)).pack(expand=True)
            return

        today_key = get_today_key()
        is_today = date_key == today_key

        # Title row
        title_row = tk.Frame(container, bg=c["input_bg"])
        title_row.pack(fill="x", padx=10, pady=(8, 4))

        tk.Label(title_row, text=format_date_key(date_key), bg=c["input_bg"],
                 fg=c["primary"], font=("Segoe UI", 12, "bold")).pack(side="left")
        if is_today:
            tk.Label(title_row, text="  HOY", bg=c["input_bg"],
                     fg=c["success"], font=("Segoe UI", 8, "bold")).pack(side="left", padx=(4, 0))

        entry = historical.get(date_key, {})
        if entry:
            # Display saved rates
            fields = [
                ("BCV (Oficial)", entry.get("bcv"), c["success"]),
                ("Paralelo", entry.get("paralelo"), c["highlight"]),
                ("Binance P2P", entry.get("binance_p2p"), c["warning"]),
                ("Euro (BCV)", entry.get("euro"), c["info"]),
            ]

            for label, val, color in fields:
                row = tk.Frame(container, bg=c["input_bg"])
                row.pack(fill="x", padx=10, pady=1)
                dot = tk.Label(row, text="●", bg=c["input_bg"], fg=color if val is not None else c["muted"],
                               font=("Segoe UI", 8))
                dot.pack(side="left", padx=(0, 4))
                tk.Label(row, text=label, bg=c["input_bg"], fg=c["secondary"],
                         font=("Segoe UI", 9), anchor="w").pack(side="left", fill="x", expand=True)
                val_text = f"Bs. {val:,.2f}" if val is not None else "—"
                tk.Label(row, text=val_text, bg=c["input_bg"], fg=color if val is not None else c["muted"],
                         font=("Segoe UI", 10, "bold")).pack(side="right")

            if entry.get("manual"):
                tk.Label(container, text="✏️ Ingresado manualmente", bg=c["input_bg"],
                         fg=c["muted"], font=("Segoe UI", 8)).pack(pady=(4, 0))

            # Edit button
            edit_frame = tk.Frame(container, bg=c["input_bg"])
            edit_frame.pack(fill="x", padx=10, pady=(6, 8))
            tk.Button(edit_frame, text="✏️ Editar tasas", font=FONTS["section"],
                      bg=c["card"], fg=c["secondary"],
                      activebackground=c["accent"], activeforeground=c["primary"],
                      relief="flat", padx=10, pady=4, cursor="hand2",
                      command=lambda: self._show_hist_manual_entry(date_key, entry, dialog, container, date_var, historical, c)
                      ).pack(fill="x")
        else:
            # No rates for this date
            empty_frame = tk.Frame(container, bg=c["input_bg"])
            empty_frame.pack(expand=True, fill="both")
            tk.Label(empty_frame, text="No hay tasas guardadas para esta fecha", bg=c["input_bg"],
                     fg=c["warning"], font=("Segoe UI", 10, "bold")).pack(pady=(20, 2))
            tk.Label(empty_frame, text="Puedes ingresarlas manualmente", bg=c["input_bg"],
                     fg=c["muted"], font=("Segoe UI", 9)).pack()
            tk.Button(empty_frame, text="📝 Ingresar tasas manualmente", font=FONTS["button"],
                      bg=c["info"], fg="#ffffff",
                      activebackground=c["info"], activeforeground="#ffffff",
                      relief="flat", padx=14, pady=6, cursor="hand2",
                      command=lambda: self._show_hist_manual_entry(date_key, {}, dialog, container, date_var, historical, c)
                      ).pack(pady=(10, 20))

    def _show_hist_manual_entry(self, date_key, entry, parent_dialog, container, date_var, historical, c):
        """Show a sub-dialog to enter or edit historical rates for a specific date."""
        sub = tk.Toplevel(parent_dialog)
        sub.title("Ingresar tasas")
        sub.configure(bg=c["card"])
        sub.resizable(False, False)
        sub.transient(parent_dialog)

        x = parent_dialog.winfo_x() + 30
        y = parent_dialog.winfo_y() + 30
        sub.geometry(f"320x300+{x}+{y}")

        sf = tk.Frame(sub, bg=c["card"], padx=20, pady=18)
        sf.pack(fill="both", expand=True)

        tk.Label(sf, text=f"Tasas para {format_date_key(date_key)}", bg=c["card"],
                 fg=c["primary"], font=("Segoe UI", 14, "bold")).pack(anchor="w")
        tk.Label(sf, text="Ingresa las tasas que recuerdes (puedes dejar vacio)",
                 bg=c["card"], fg=c["secondary"], font=("Segoe UI", 9),
                 anchor="w", wraplength=280).pack(fill="x", pady=(2, 10))

        # Fields
        fields_def = [
            ("BCV (Oficial)", "bcv", c["success"]),
            ("Paralelo", "paralelo", c["highlight"]),
            ("Euro (BCV)", "euro", c["info"]),
        ]
        field_vars = {}

        for label, key, color in fields_def:
            frow = tk.Frame(sf, bg=c["card"])
            frow.pack(fill="x", pady=(0, 8))
            tk.Label(frow, text=label, bg=c["card"], fg=c["secondary"],
                     font=("Segoe UI", 9), anchor="w").pack(fill="x")
            val = entry.get(key)
            var = tk.StringVar(value=f"{val:,.2f}" if val else "")
            field_vars[key] = var
            e = tk.Entry(frow, textvariable=var, bg=c["input_bg"], fg=color,
                         font=("Segoe UI", 14, "bold"), relief="flat",
                         insertbackground=c["primary"], justify="center")
            e.pack(fill="x", ipady=4)

        btn_row = tk.Frame(sf, bg=c["card"])
        btn_row.pack(fill="x", pady=(10, 0))

        def on_save_hist():
            bcv_raw = field_vars["bcv"].get().strip().replace(",", ".")
            paralelo_raw = field_vars["paralelo"].get().strip().replace(",", ".")
            euro_raw = field_vars["euro"].get().strip().replace(",", ".")

            def parse_or_none(s):
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

        tk.Button(btn_row, text="Cancelar", font=FONTS["section"],
                  bg=c["input_bg"], fg=c["secondary"],
                  activebackground=c["accent"], activeforeground=c["primary"],
                  relief="flat", padx=16, pady=6, cursor="hand2",
                  command=sub.destroy).pack(side="left", fill="x", expand=True, padx=(0, 2))
        tk.Button(btn_row, text="Guardar", font=FONTS["section"],
                  bg=c["info"], fg="#ffffff",
                  activebackground=c["info"], activeforeground="#ffffff",
                  relief="flat", padx=16, pady=6, cursor="hand2",
                  command=on_save_hist).pack(side="right", fill="x", expand=True, padx=(2, 0))

        sub.grab_set()

    def _update_hist_count(self):
        """Update the historical rates count label in the main UI."""
        if hasattr(self, "hist_count_label"):
            historical = get_historical_rates()
            count = len(historical)
            if count > 0:
                self.hist_count_label.config(text=f"{count} fechas guardadas · Toca para consultar")
            else:
                self.hist_count_label.config(text="Toca para consultar o guardar tasas de una fecha anterior")

    # ─── BCV Lunes ───
    def _edit_bcv_lunes(self):
        """Open a dialog to edit the BCV Lunes rate."""
        c = self.C
        dialog = tk.Toplevel(self.window)
        dialog.title("Editar BCV (Lunes)")
        dialog.configure(bg=c["card"])
        dialog.resizable(False, False)
        dialog.transient(self.window)

        # Center on parent
        x = self.window.winfo_x() + (self.window.winfo_width() - 320) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 200) // 2
        dialog.geometry(f"320x200+{x}+{y}")

        frame = tk.Frame(dialog, bg=c["card"], padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        tk.Label(frame, text="BCV (Lunes)", bg=c["card"], fg=c["primary"],
                 font=("Segoe UI", 14, "bold")).pack(anchor="w")

        tk.Label(frame, text="Ingresa la tasa publicada por el BCV para el lunes:",
                 bg=c["card"], fg=c["secondary"], font=("Segoe UI", 9),
                 anchor="w", wraplength=280).pack(fill="x", pady=(4, 12))

        entry_var = tk.StringVar(value=f"{self.bcv_lunes:,.2f}" if self.bcv_lunes else "")
        entry = tk.Entry(frame, textvariable=entry_var, bg=c["input_bg"], fg=c["input_text"],
                         font=("Segoe UI", 18, "bold"), relief="flat",
                         insertbackground=c["primary"], justify="center")
        entry.pack(fill="x", ipady=6)

        btn_frame = tk.Frame(frame, bg=c["card"])
        btn_frame.pack(fill="x", pady=(12, 0))

        def on_save():
            raw = entry_var.get().strip().replace(",", ".")
            try:
                val = float(raw)
                if val > 0:
                    self.bcv_lunes = val
                    self.bcv_lunes_updated_at = datetime.now().isoformat()
                    save_config(val)
                    self.card_lunes.update_rate(self.bcv_lunes, self.bcv_lunes_updated_at)
                    # Update converter
                    self._update_conv_rate_labels(self.converter_rates)
                    # Update spread
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
            except (ValueError, TypeError):
                pass
            dialog.destroy()

        def on_cancel():
            dialog.destroy()

        def on_delete():
            self.bcv_lunes = None
            self.bcv_lunes_updated_at = None
            save_config(0)
            self.card_lunes.update_rate(None)
            self.spread_lunes.update(None, None)
            self._update_converter_spreads(None, None)
            self._update_conv_rate_labels(self.converter_rates)
            self.do_conversion()
            dialog.destroy()

        tk.Button(btn_frame, text="Cancelar", font=FONTS["section"],
                  bg=c["input_bg"], fg=c["secondary"],
                  activebackground=c["accent"], activeforeground=c["primary"],
                  relief="flat", padx=16, pady=6, cursor="hand2",
                  command=on_cancel).pack(side="left", fill="x", expand=True, padx=(0, 2))

        if self.bcv_lunes is not None:
            tk.Button(btn_frame, text="Borrar", font=FONTS["section"],
                      bg=c["highlight"], fg="#ffffff",
                      activebackground=c["highlight"], activeforeground="#ffffff",
                      relief="flat", padx=16, pady=6, cursor="hand2",
                      command=on_delete).pack(side="left", fill="x", expand=True, padx=(1, 1))

        tk.Button(btn_frame, text="Guardar", font=FONTS["section"],
                  bg=c["bcvLunes"], fg="#ffffff",
                  activebackground=c["bcvLunes"], activeforeground="#ffffff",
                  relief="flat", padx=16, pady=6, cursor="hand2",
                  command=on_save).pack(side="right", fill="x", expand=True, padx=(2, 0))

        entry.bind("<Return>", lambda e: on_save())
        entry.bind("<Escape>", lambda e: on_cancel())

        # Hacer modal
        dialog.grab_set()
        # Dar tiempo a Windows para que pinte la ventana antes de asignar foco
        # focus_set() es mas confiable que focus_force() en Windows
        dialog.after(50, lambda: entry.focus_set())
        dialog.after(50, lambda: entry.selection_range(0, tk.END))

    # ─── Recordatorio viernes ───
    def _was_entered_today(self):
        """Check if BCV Lunes was entered today."""
        if not self.bcv_lunes_updated_at:
            return False
        try:
            updated = datetime.fromisoformat(self.bcv_lunes_updated_at.replace("Z", "+00:00"))
            return updated.date() == datetime.now().date()
        except Exception:
            return False

    def _toggle_reminder(self):
        """Toggle the Friday reminder on/off."""
        self.reminder_enabled = self.reminder_var.get()
        save_config(reminder_enabled=self.reminder_enabled)
        if self.reminder_enabled:
            self._reminder_shown_this_friday = False
            self._check_reminder()

    def _start_reminder_check(self):
        """Start periodic check for Friday 6 PM reminder."""
        def _check():
            if self.reminder_enabled and not self._reminder_shown_this_friday:
                self._check_reminder()
            self._reminder_timer = self.window.after(30000, _check)
        _check()

    def _check_reminder(self):
        """Check if conditions are met to show the Friday reminder."""
        now = datetime.now()
        # Viernes = weekday 4 (Monday=0, ..., Friday=4)
        if now.weekday() != 4:
            return
        # Entre 6:00 PM y 6:05 PM, o si acaba de abrir la app y ya pasaron las 6 PM
        current_minute = now.hour * 60 + now.minute
        reminder_minute = 18 * 60  # 6:00 PM
        if current_minute < reminder_minute or current_minute > reminder_minute + 30:
            return
        # Si ya ingreso la tasa hoy, no molestar (solo mostrar recordatorio suave)
        entered_today = self._was_entered_today()
        self._show_reminder_popup(entered_today)
        self._reminder_shown_this_friday = True

    def _show_reminder_popup(self, already_entered):
        """Show a premium-styled reminder popup."""
        c = self.C
        popup = tk.Toplevel(self.window)
        popup.title("Recordatorio BCV (Lunes)")
        popup.configure(bg=c["card"])
        popup.resizable(False, False)
        popup.transient(self.window)
        popup.attributes("-topmost", True)

        # Center on parent
        x = self.window.winfo_x() + (self.window.winfo_width() - 340) // 2
        y = self.window.winfo_y() + (self.window.winfo_height() - 180) // 2
        popup.geometry(f"340x180+{x}+{y}")

        frame = tk.Frame(popup, bg=c["card"], padx=20, pady=20)
        frame.pack(fill="both", expand=True)

        # Icon
        icon_text = "✅" if already_entered else "📅"
        tk.Label(frame, text=icon_text, bg=c["card"], font=("Segoe UI", 28)).pack(pady=(0, 8))

        if already_entered:
            tk.Label(frame, text="Ya ingresaste la tasa de hoy", bg=c["card"],
                     fg=c["primary"], font=("Segoe UI", 12, "bold")).pack()
            tk.Label(frame, text="Recuerda revisar si el BCV publico una nueva.", bg=c["card"],
                     fg=c["secondary"], font=("Segoe UI", 9), wraplength=280).pack(pady=(4, 0))
        else:
            tk.Label(frame, text="¿Ya viste la tasa del lunes?", bg=c["card"],
                     fg=c["primary"], font=("Segoe UI", 12, "bold")).pack()
            tk.Label(frame, text="El BCV publico la tasa del lunes. Ingresala en la app!", bg=c["card"],
                     fg=c["secondary"], font=("Segoe UI", 9), wraplength=280).pack(pady=(4, 0))

        btn_frame = tk.Frame(frame, bg=c["card"])
        btn_frame.pack(fill="x", pady=(10, 0))

        tk.Button(btn_frame, text="Ingresar tasa", font=FONTS["button"],
                  bg=c["bcvLunes"], fg="#ffffff",
                  activebackground=c["bcvLunes"], activeforeground="#ffffff",
                  relief="flat", padx=16, pady=6, cursor="hand2",
                  command=lambda: self._edit_bcv_lunes() or popup.destroy()
                  ).pack(side="left", fill="x", expand=True, padx=(0, 4))

        tk.Button(btn_frame, text="Recordar despues", font=FONTS["section"],
                  bg=c["input_bg"], fg=c["secondary"],
                  activebackground=c["accent"], activeforeground=c["primary"],
                  relief="flat", padx=16, pady=6, cursor="hand2",
                  command=popup.destroy).pack(side="right", fill="x", expand=True, padx=(4, 0))

        # Auto-close after 12 seconds
        popup.after(12000, lambda: popup.destroy() if popup.winfo_exists() else None)

        popup.grab_set()

    # ─── Countdown ───
    def _start_countdown(self):
        def tick():
            if self._countdown > 0:
                self._countdown -= 1
            else:
                self._countdown = REFRESH_MINUTES * 60

            if hasattr(self, "timer_bar"):
                self.timer_bar.update(self._countdown)

            self._countdown_timer = self.window.after(1000, tick)

        self._countdown = REFRESH_MINUTES * 60
        tick()

    # ─── Events ───
    def _set_mode(self, mode):
        self.conv_mode.set(mode)
        c = self.C
        accent_bg = c["accent"]
        if mode == "usd_to_bs":
            self.btn_usd.config(bg=accent_bg, fg=c["primary"])
            self.btn_bs.config(bg=c["input_bg"], fg=c["muted"])
        else:
            self.btn_bs.config(bg=accent_bg, fg=c["primary"])
            self.btn_usd.config(bg=c["input_bg"], fg=c["muted"])
        self.do_conversion()

    def _on_rate_change(self):
        self.do_conversion()

    def _start_theme_polling(self):
        def _poll():
            if self.theme_mode == "system":
                new_theme = get_system_theme()
                if new_theme != self.actual_theme:
                    self._rebuild_ui()
                    return
            self._theme_poll_timer = self.window.after(5000, _poll)
        _poll()

    def _bind_events(self):
        self.window.protocol("WM_DELETE_WINDOW", self._on_close)

    def _on_close(self):
        if self._refresh_timer:
            self.window.after_cancel(self._refresh_timer)
        if self._theme_poll_timer:
            self.window.after_cancel(self._theme_poll_timer)
        if self._countdown_timer:
            self.window.after_cancel(self._countdown_timer)
        if self._reminder_timer:
            self.window.after_cancel(self._reminder_timer)
        self.window.destroy()

    # ─── Offline Mode ───
    def _set_offline_mode(self, offline, cached_at=""):
        """Show or hide the offline mode banner."""
        self.offline_mode = offline
        if not hasattr(self, "offline_banner") or not self.offline_banner.winfo_exists():
            return
        if offline:
            # Format the cache timestamp
            time_str = ""
            if cached_at:
                try:
                    dt = datetime.fromisoformat(cached_at.replace("Z", "+00:00"))
                    time_str = dt.strftime("%d/%m %I:%M %p")
                except:
                    pass
            if time_str:
                self.offline_label.config(text=f"Sin conexion — Mostrando ultimas tasas ({time_str})")
            else:
                self.offline_label.config(text="Sin conexion — Mostrando ultimas tasas")
            # Place banner before the info bar (both are siblings in scroll_frame)
            try:
                info_bar = self.info_label.master.master
                if info_bar.winfo_exists():
                    self.offline_banner.pack(fill="x", padx=12, pady=(0, 2), before=info_bar)
                else:
                    self.offline_banner.pack(fill="x", padx=12, pady=(0, 2))
            except Exception:
                self.offline_banner.pack(fill="x", padx=12, pady=(0, 2))
            self.info_label.config(text="Las tasas se actualizaran cuando haya conexion")
        else:
            self.offline_banner.pack_forget()
            self.info_label.config(text="Las tasas se actualizan cada 25 minutos")

    # ─── API ───
    def refresh_rates(self):
        if self.is_loading:
            return
        self.is_loading = True
        self.card_bcv.show_loading()
        self.card_parallel.show_loading()
        self.card_eur.show_loading()
        self.card_binance.show_loading()
        self._update_conv_rate_labels({})
        thread = threading.Thread(target=self._fetch_rates_thread, daemon=True)
        thread.start()

    def _fetch_rates_thread(self):
        try:
            rates = fetch_all_rates()
            self.window.after(0, self._on_rates_loaded, rates)
        except Exception as e:
            self.window.after(0, self._on_rates_error, str(e))

    def _on_rates_loaded(self, rates):
        self.rates = rates
        self.converter_rates = {
            "bcv": rates.get("bcv"),
            "binance_p2p": rates.get("binance_p2p"),
            "eur": rates.get("eur"),
            "parallel": rates.get("parallel"),
            "bcv_lunes": self.bcv_lunes,
        }
        self.is_loading = False

        # Reset countdown on successful refresh
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
                dt = datetime.fromisoformat(rates["fetched_at"].replace("Z", "+00:00"))
                time_str = dt.strftime("%d/%m/%Y %I:%M %p")
                self.info_label.config(text=f"✓ Actualizado: {time_str}")
            except Exception:
                pass

        # Save to offline cache
        save_cache_rates(rates)

        # Hide offline banner (we're online)
        self._set_offline_mode(False)

        # Auto-save today's historical rates
        save_today_historical_rate(
            bcv=rates.get("bcv"),
            paralelo=rates.get("parallel"),
            binance_p2p=rates.get("binance_p2p"),
            euro=rates.get("eur"),
        )

        # Schedule next refresh
        if self._refresh_timer:
            self.window.after_cancel(self._refresh_timer)
        self._refresh_timer = self.window.after(
            REFRESH_MINUTES * 60 * 1000, self.refresh_rates)
        self.do_conversion()

    def _on_rates_error(self, error_msg):
        self.is_loading = False

        # Try to load from cache for offline mode
        cache = load_cache_rates()
        if cache and cache.get("bcv") is not None:
            # Show cached rates with offline indicator
            self.cached_rates = cache
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
            self.do_conversion()
        else:
            # No cache available, show error state
            self.card_bcv.show_error()
            self.card_parallel.show_error()
            self.card_eur.show_error()
            self.card_binance.show_error()
            self.info_label.config(text=f"⚠ Error: {error_msg}")

        if self._refresh_timer:
            self.window.after_cancel(self._refresh_timer)
        self._refresh_timer = self.window.after(30000, self.refresh_rates)

    def _update_conv_rate_labels(self, rates):
        labels = getattr(self, "_rate_value_labels", {})
        for key, label in labels.items():
            val = rates.get(key)
            if key == "bcv_lunes":
                val = self.bcv_lunes
            if val is not None:
                label.config(text=f"Bs. {val:,.2f}")
            else:
                label.config(text="—")

    # ─── Conversion ───
    def do_conversion(self):
        try:
            amount_text = self.amount_entry.get().strip().replace(",", ".")
            if not amount_text:
                return
            amount = float(amount_text)
            if amount <= 0:
                return
        except ValueError:
            self.result_from.config(text="")
            self.result_to.config(text="Monto invalido")
            self.result_info.config(text="")
            return

        rate_key = self.rate_var_conv.get()
        # BCV Lunes se obtiene de self.bcv_lunes (no de converter_rates)
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

    # ─── Converter Spreads ───
    def _update_converter_spreads(self, bcv_rate, paralelo_rate):
        """Update spread indicators in the converter tab."""
        if hasattr(self, "cv_spread_bcv") and hasattr(self, "cv_spread_lunes"):
            self.cv_spread_bcv.update(bcv_rate, paralelo_rate)
            self.cv_spread_lunes.update(self.bcv_lunes, paralelo_rate)

    # ─── Quick amounts & Paste ───
    def _set_quick_amount(self, val):
        """Set a quick amount in the converter entry."""
        self.amount_entry.delete(0, tk.END)
        self.amount_entry.insert(0, str(val))
        self.do_conversion()

    def _paste_from_clipboard(self):
        """Paste from clipboard into the amount entry."""
        try:
            text = self.window.clipboard_get()
            if text:
                # Clean the text: keep only digits, comma, and dot
                cleaned = ""
                for ch in text:
                    if ch.isdigit() or ch in ",.":
                        cleaned += ch
                    elif ch == " " or ch == "\n" or ch == "\r":
                        break
                if cleaned:
                    self.amount_entry.delete(0, tk.END)
                    self.amount_entry.insert(0, cleaned)
                    # Flash feedback
                    old_bg = self._paste_btn.cget("bg")
                    self._paste_btn.config(bg=self.C["success"], fg="#ffffff")
                    self.window.after(500, lambda: self._paste_btn.config(bg=old_bg, fg=self.C["muted"])
                                      if self._paste_btn.winfo_exists() else None)
                    self.do_conversion()
        except Exception:
            pass

    def _copy_result_text(self, text):
        """Copy conversion result text to clipboard."""
        if text and text.strip():
            self.window.clipboard_clear()
            self.window.clipboard_append(text.strip())
            if self._result_copy_timer:
                self.window.after_cancel(self._result_copy_timer)
            self.result_copy_feedback.config(text="✓ Copiado al portapapeles")
            self._result_copy_timer = self.window.after(2000, lambda: self.result_copy_feedback.config(text="")
                                                        if self.result_copy_feedback.winfo_exists() else None)

    # ─── MAIN ───────────────────────────────────────────────────────
def main():
    app = TasaDelDiaApp()
    app.window.mainloop()


if __name__ == "__main__":
    main()
