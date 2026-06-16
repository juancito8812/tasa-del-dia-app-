import flet as ft
import threading
import time
import webbrowser
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.api import fetch_all_rates, ApiError
from app.storage import (
    load_config, save_config, load_cache_rates, save_cache_rates,
    get_historical_rates, save_today_historical_rate,
    get_today_key, format_date_key, parse_date_from_display,
    set_manual_historical_rate,
)
from app.auto_update import check_for_updates, APP_VERSION

REFRESH_MINUTES = 25

THEMES = {
    "dark": {
        "bg": "#07070d", "card": "#111120", "card_border": "#1e1e3a",
        "primary": "#f0f0ff", "secondary": "#8888b0", "muted": "#55557a",
        "accent": "#1c1c38", "highlight": "#ff4060", "success": "#00d4a0",
        "warning": "#fbbf24", "info": "#38bdf8", "bcv_lunes": "#c084fc",
        "input_bg": "#0d0d1a", "input_text": "#f0f0ff",
    },
    "light": {
        "bg": "#f4f6fa", "card": "#ffffff", "card_border": "#e2e4ee",
        "primary": "#0f0f1a", "secondary": "#4a4a6a", "muted": "#9494b8",
        "accent": "#e8ecf4", "highlight": "#e93555", "success": "#059669",
        "warning": "#d97706", "info": "#0284c7", "bcv_lunes": "#7c3aed",
        "input_bg": "#eef0f6", "input_text": "#0f0f1a",
    },
}

_rates: Dict[str, Any] = {}
_converter_rates: Dict[str, Any] = {}
_bcv_lunes: Optional[float] = None
_bcv_lunes_updated_at: Optional[str] = None
_offline_mode = False
_brecha_notified = False
_reminder_enabled = False
_reminder_shown_this_friday = False
_is_loading = False
_hist_selected_date: Optional[str] = None
_converter_selected = "bcv"
_converter_mode = "usd_to_bs"
_current_theme = "dark"
_theme_mode = "system"

page: ft.Page = None
ctrl = {}  # control references for updates


def c() -> dict:
    return THEMES[_current_theme]


def resolve_theme(mode: str) -> str:
    if mode == "system":
        return "dark"
    return mode


def format_time(updated_at: Optional[str]) -> str:
    if not updated_at:
        return ""
    try:
        dt = datetime.fromisoformat(str(updated_at).replace("Z", "+00:00"))
        return dt.strftime("%d/%m %I:%M %p")
    except (ValueError, TypeError):
        return ""


def make_text(value, size=10, weight="normal", color=None, font_family="Segoe UI"):
    return ft.Text(value=value, size=size, weight=weight, color=color or c()["primary"],
                   font_family=font_family)


def card_container(content, padding=16, bg=None, border=None, border_radius=8):
    colors = c()
    return ft.Container(
        content=content,
        bgcolor=bg or colors["card"],
        border=border or ft.border.all(1, colors["card_border"]),
        border_radius=border_radius,
        padding=padding,
    )


def make_column(controls, spacing=6):
    return ft.Column(controls=controls, spacing=spacing, scroll=ft.ScrollMode.AUTO)


# ─── Title Bar ────────────────────────────────────────────────

def build_title_bar():
    colors = c()
    title = ft.Row(
        controls=[
            ft.Container(
                content=ft.Text("📉", size=20),
                bgcolor=blend_color(colors["highlight"], 0.1),
                border_radius=10, padding=ft.padding.all(8), width=40, height=40,
            ),
            ft.Column(
                controls=[
                    ft.Text("Tasa del Día", size=20, weight="bold", color=colors["primary"]),
                    ft.Text("Tasas de cambio del Bolívar Venezolano", size=10, color=colors["secondary"]),
                ],
                spacing=0,
            ),
        ],
        spacing=8,
        vertical_alignment=ft.CrossAxisAlignment.CENTER,
    )
    theme_btn = ft.IconButton(
        icon=ft.icons.DARK_MODE,
        icon_color=colors["secondary"],
        on_click=switch_theme,
    )
    ctrl["theme_btn"] = theme_btn
    return ft.Container(
        content=ft.Row(controls=[title, theme_btn], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        padding=ft.padding.only(left=16, right=16, top=12, bottom=4),
    )


def blend_color(color: str, alpha: float) -> str:
    colors = c()
    bg = colors["bg"]
    if color.startswith("#") and len(color) == 7 and bg.startswith("#") and len(bg) == 7:
        r = int(color[1:3], 16); g = int(color[3:5], 16); b = int(color[5:7], 16)
        bg_r = int(bg[1:3], 16); bg_g = int(bg[3:5], 16); bg_b = int(bg[5:7], 16)
        return f"#{int(r * alpha + bg_r * (1 - alpha)):02x}{int(g * alpha + bg_g * (1 - alpha)):02x}{int(b * alpha + bg_b * (1 - alpha)):02x}"
    return color


# ─── Rates Tab ────────────────────────────────────────────────

def build_rates_tab():
    tab = ft.Column(spacing=6, scroll=ft.ScrollMode.AUTO)
    ctrl["rates_tab"] = tab
    tab.controls = [
        build_spread("spread_bcv", "BRECHA BCV VS PARALELO"),
        build_spread("spread_lunes", "BRECHA BCV (LUNES) VS PARALELO"),
        build_rate_card("card_bcv", "🏛️", "BCV (Oficial)", "Banco Central de Venezuela", "success"),
        build_rate_card("card_parallel", "📈", "Dólar Paralelo", "Mercado paralelo / promedio", "highlight"),
        build_rate_card("card_eur", "💶", "Euro (BCV)", "Tasa de referencia oficial", "info"),
        build_rate_card("card_binance", "₿", "Binance P2P", "USDT / VES — Mercado P2P", "warning"),
        build_rate_card("card_lunes", "📅", "BCV (Lunes)", "Tasa manual del lunes", "bcv_lunes", editable=True),
        build_reminder_card(),
        build_offline_banner(),
        build_info_bar(),
    ]
    return tab


def build_spread(key: str, title: str):
    colors = c()
    card = ft.Container(
        content=ft.Column(controls=[
            ft.Text(title, size=10, weight="bold", color=colors["muted"]),
            ft.Row(controls=[
                ft.Column(controls=[
                    ft.Text("●  BCV", size=9, color=colors["muted"]),
                    ft.Text("—", size=18, weight="bold", color=colors["success"]),
                ], spacing=2),
                ft.Text("VS", size=10, weight="bold", color=colors["muted"]),
                ft.Column(controls=[
                    ft.Text("●  Paralelo", size=9, color=colors["muted"]),
                    ft.Text("—", size=18, weight="bold", color=colors["highlight"]),
                ], spacing=2),
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            ft.ProgressBar(value=0, color=colors["success"], bgcolor=colors["input_bg"], height=6),
            ft.Container(
                content=ft.Row(controls=[
                    ft.Column(controls=[
                        ft.Text("DIFERENCIA", size=9, color=colors["muted"]),
                        ft.Text("—", size=10, weight="bold", color=colors["success"]),
                    ], spacing=2),
                    ft.Column(controls=[
                        ft.Text("BRECHA", size=9, color=colors["muted"]),
                        ft.Text("—", size=10, weight="bold", color=colors["success"]),
                    ], spacing=2),
                ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                bgcolor=colors["input_bg"], border_radius=4, padding=12,
            ),
        ], spacing=8),
        bgcolor=colors["card"],
        border=ft.border.all(1, colors["card_border"]),
        border_radius=8, padding=14,
    )
    ctrl[key] = {
        "card": card, "a_val": card.content.controls[1].controls[0].controls[1],
        "b_val": card.content.controls[1].controls[2].controls[1],
        "bar": card.content.controls[2],
        "diff_val": card.content.controls[3].content.controls[0].controls[1],
        "pct_val": card.content.controls[3].content.controls[1].controls[1],
    }
    return card


def build_rate_card(key: str, icon: str, title: str, subtitle: str, color_key: str, editable: bool = False):
    colors = c()
    color_map = {"success": colors["success"], "highlight": colors["highlight"],
                 "info": colors["info"], "warning": colors["warning"], "bcv_lunes": colors["bcv_lunes"]}
    clr = color_map.get(color_key, colors["primary"])
    actions = []
    if editable:
        edit_btn = ft.IconButton(icon=ft.icons.EDIT, icon_size=14, icon_color=colors["bcv_lunes"],
                                 on_click=lambda e: edit_bcv_lunes())
        actions.append(edit_btn)
    card = ft.Container(
        content=ft.Column(controls=[
            ft.Container(height=4, bgcolor=clr, border_radius=2),
            ft.Row(controls=[
                ft.Container(
                    content=ft.Text(icon, size=18),
                    bgcolor=blend_color(clr, 0.12), border_radius=8,
                    width=36, height=36, alignment=ft.alignment.center,
                ),
                ft.Column(controls=[
                    ft.Text(title, size=13, weight="bold", color=colors["primary"]),
                    ft.Text(subtitle, size=9, color=colors["secondary"]),
                ], spacing=0),
            ], spacing=8),
            ft.Row(controls=[
                ft.Text("Bs.", size=16, weight="bold", color=clr),
                ft.Text("—", size=26, weight="bold", color=clr),
            ], alignment=ft.MainAxisAlignment.START),
            ft.Row(controls=[
                ft.Text("", size=9, color=colors["muted"]),
                ft.Text("", size=9, color=colors["muted"]),
            ] + actions, alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
        ], spacing=6),
        bgcolor=colors["card"], border=ft.border.all(1, colors["card_border"]),
        border_radius=8, padding=16,
    )
    ctrl[key] = {
        "rate_lbl": card.content.controls[2].controls[1],
        "time_lbl": card.content.controls[3].controls[0],
        "usd_lbl": card.content.controls[3].controls[1],
    }
    return card


def build_reminder_card():
    colors = c()
    switch = ft.Switch(value=_reminder_enabled, on_change=toggle_reminder)
    ctrl["reminder_switch"] = switch
    return ft.Container(
        content=ft.Row(controls=[
            ft.Text("🔔"),
            ft.Column(controls=[
                ft.Text("Recordatorio viernes 6:00 PM", size=10, weight="bold", color=colors["primary"]),
                ft.Text("Te avisa si aun no has ingresado la tasa", size=9, color=colors["muted"]),
            ], spacing=0),
            switch,
        ]),
        bgcolor=colors["card"], border=ft.border.all(1, colors["card_border"]),
        border_radius=8, padding=ft.padding.only(left=14, right=14, top=10, bottom=10),
    )


def build_offline_banner():
    colors = c()
    banner = ft.Container(
        content=ft.Row(controls=[
            ft.Text("⚠️"),
            ft.Text("", size=9, color="#ffffff"),
        ]),
        bgcolor=colors["warning"], border_radius=6, padding=ft.padding.all(6), visible=False,
    )
    ctrl["offline_banner"] = banner
    ctrl["offline_label"] = banner.content.controls[1]
    return banner


def build_info_bar():
    colors = c()
    label = ft.Text("Las tasas se actualizan cada 25 minutos", size=9, color=colors["muted"])
    ctrl["info_label"] = label
    return ft.Container(
        content=ft.Row(controls=[ft.Text("🔄"), label]),
        bgcolor=colors["card"], border=ft.border.all(1, colors["card_border"]),
        border_radius=6, padding=ft.padding.only(left=14, right=14, top=8, bottom=8),
    )


# ─── Converter Tab ────────────────────────────────────────────

def build_converter_tab():
    tab = ft.Column(spacing=6, scroll=ft.ScrollMode.AUTO)
    ctrl["converter_tab"] = tab
    tab.controls = [
        build_conv_rate_sel(),
        build_conv_card(),
        build_spread("cv_spread_bcv", "BRECHA BCV VS PARALELO"),
        build_spread("cv_spread_lunes", "BRECHA BCV (LUNES) VS PARALELO"),
    ]
    return tab


def build_conv_rate_sel():
    colors = c()
    labels = {}
    btns = {}
    rows = []
    for key, label, color_key in [
        ("bcv", "BCV (Oficial)", "success"),
        ("parallel", "Dolar Paralelo", "highlight"),
        ("binance_p2p", "Binance P2P", "warning"),
        ("eur", "Euro (BCV)", "info"),
        ("bcv_lunes", "BCV (Lunes)", "bcv_lunes"),
    ]:
        clr = {"success": colors["success"], "highlight": colors["highlight"],
               "warning": colors["warning"], "info": colors["info"], "bcv_lunes": colors["bcv_lunes"]}[color_key]
        val_lbl = ft.Text("—", size=11, weight="bold", color=clr)
        bg = colors["accent"] if key == _converter_selected else colors["card"]
        tc = colors["primary"] if key == _converter_selected else colors["secondary"]
        row = ft.Container(
            content=ft.Row(controls=[
                ft.TextButton(text=label, on_click=lambda e, k=key: conv_select_rate(k),
                              style=ft.ButtonStyle(color=tc)),
                val_lbl,
            ], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
            bgcolor=bg, border_radius=8, padding=ft.padding.all(8),
        )
        rows.append(row)
        labels[key] = val_lbl
        btns[key] = (row, bg)
    ctrl["conv_rate_labels"] = labels
    ctrl["conv_rate_rows"] = rows
    ctrl["conv_rate_btns"] = btns
    return ft.Column(controls=[
        ft.Text("TASA A USAR", size=10, weight="bold", color=colors["muted"]),
        *rows,
    ], spacing=4)


def build_conv_card():
    colors = c()
    usd_btn = ft.ElevatedButton(text="USD → Bs.", on_click=lambda e: set_conv_mode("usd_to_bs"),
                                style=ft.ButtonStyle(bgcolor=colors["accent"], color=colors["primary"]))
    bs_btn = ft.ElevatedButton(text="Bs. → USD", on_click=lambda e: set_conv_mode("bs_to_usd"),
                               style=ft.ButtonStyle(bgcolor=colors["input_bg"], color=colors["muted"]))
    ctrl["btn_usd"] = usd_btn
    ctrl["btn_bs"] = bs_btn

    amount_input = ft.TextField(value="100", text_size=20, weight="bold",
                                 border=ft.InputBorder.NONE, text_style=ft.TextStyle(color=colors["input_text"]),
                                 on_submit=lambda e: do_conversion())
    ctrl["conv_amount"] = amount_input

    paste_btn = ft.TextButton(text="📋 Pegar", on_click=lambda e: paste_from_clipboard(),
                              style=ft.ButtonStyle(color=colors["muted"]))
    ctrl["paste_btn"] = paste_btn

    quick_btns = []
    for val in [100, 500, 1000, 5000, 10000, 50000]:
        fmt = f"{val:,}".replace(",", ".")
        b = ft.ElevatedButton(text=fmt, on_click=lambda e, v=val: set_quick_amount(v),
                              style=ft.ButtonStyle(bgcolor=colors["input_bg"], color=colors["secondary"],
                                                   padding=4))
        quick_btns.append(b)
    ctrl["conv_quick_btns"] = quick_btns

    conv_btn = ft.ElevatedButton(text="💱  Convertir", on_click=lambda e: do_conversion(),
                                 style=ft.ButtonStyle(bgcolor=colors["accent"], color=colors["primary"]))
    ctrl["conv_btn"] = conv_btn

    res_from = ft.Text("", size=22, weight="bold", color=colors["primary"])
    res_to = ft.Text("", size=22, weight="bold", color=colors["highlight"])
    res_info = ft.Text("", size=9, color=colors["muted"])
    ctrl["result_from"] = res_from
    ctrl["result_to"] = res_to
    ctrl["result_info"] = res_info

    return ft.Container(
        content=ft.Column(controls=[
            ft.Container(
                content=ft.Row(controls=[usd_btn, bs_btn]),
                bgcolor=colors["input_bg"], border_radius=6, padding=2,
            ),
            ft.Text("MONTO", size=9, weight="bold", color=colors["secondary"]),
            ft.Container(
                content=ft.Row(controls=[amount_input, paste_btn]),
                bgcolor=colors["input_bg"], border_radius=6, padding=ft.padding.only(left=4),
            ),
            ft.Row(controls=quick_btns, spacing=2),
            conv_btn,
            ft.Column(controls=[
                ft.Text("RESULTADO", size=9, weight="bold", color=colors["secondary"]),
                res_from, ft.Text("▼", size=14, color=colors["highlight"]),
                res_to, res_info,
            ], spacing=4, horizontal_alignment=ft.CrossAxisAlignment.CENTER),
        ], spacing=8),
        bgcolor=colors["card"], border_radius=8, padding=16,
    )


def conv_select_rate(key: str):
    global _converter_selected
    _converter_selected = key
    update_conv_ui()
    do_conversion()
    page.update()


def set_conv_mode(mode: str):
    global _converter_mode
    _converter_mode = mode
    update_conv_ui()
    do_conversion()
    page.update()


def set_quick_amount(val: int):
    inp = ctrl.get("conv_amount")
    if inp:
        inp.value = str(val)
        page.update()


def paste_from_clipboard():
    inp = ctrl.get("conv_amount")
    if inp:
        try:
            import pyperclip
            inp.value = pyperclip.paste().replace(",", ".")
        except Exception:
            pass
        page.update()


def update_conv_ui():
    colors = c()
    btns = ctrl.get("conv_rate_btns", {})
    for key, (row, _) in btns.items():
        bg = colors["accent"] if key == _converter_selected else colors["card"]
        tc = colors["primary"] if key == _converter_selected else colors["secondary"]
        row.bgcolor = bg
        btn = row.content.controls[0]
        btn.style = ft.ButtonStyle(color=tc)
    usd_btn = ctrl.get("btn_usd")
    bs_btn = ctrl.get("btn_bs")
    if usd_btn:
        usd_btn.style = ft.ButtonStyle(
            bgcolor=colors["accent"], color=colors["primary"]
        ) if _converter_mode == "usd_to_bs" else ft.ButtonStyle(
            bgcolor=colors["input_bg"], color=colors["muted"]
        )
    if bs_btn:
        bs_btn.style = ft.ButtonStyle(
            bgcolor=colors["accent"], color=colors["primary"]
        ) if _converter_mode == "bs_to_usd" else ft.ButtonStyle(
            bgcolor=colors["input_bg"], color=colors["muted"]
        )


# ─── History Tab ──────────────────────────────────────────────

def build_history_tab():
    colors = c()
    chips = ft.Row(spacing=4, scroll=ft.ScrollMode.AUTO)
    ctrl["hist_chips"] = chips
    date_inp = ft.TextField(value=datetime.now().strftime("%d/%m/%Y"), text_size=12,
                             border=ft.InputBorder.NONE,
                             text_style=ft.TextStyle(color=colors["input_text"]),
                             on_submit=lambda e: hist_search_date())
    ctrl["hist_date_input"] = date_inp
    search_btn = ft.ElevatedButton(text="🔍 Ver", on_click=lambda e: hist_search_date(),
                                    style=ft.ButtonStyle(bgcolor=colors["info"], color="#ffffff"))
    detail_card = ft.Container(visible=False, bgcolor=colors["card"], border_radius=8, padding=12)
    ctrl["hist_detail_card"] = detail_card
    list_content = ft.Column(spacing=2)
    ctrl["hist_list"] = list_content
    tab = ft.Column(spacing=6, scroll=ft.ScrollMode.AUTO, controls=[
        ft.Text("SELECCIONAR FECHA", size=10, weight="bold", color=colors["muted"]),
        chips,
        ft.Row(controls=[date_inp, search_btn]),
        detail_card,
        list_content,
    ])
    ctrl["history_tab"] = tab
    threading.Timer(0.3, update_history_tab).start()
    return tab


def hist_search_date():
    inp = ctrl.get("hist_date_input")
    if inp and inp.value:
        global _hist_selected_date
        _hist_selected_date = inp.value.strip()
        update_history_tab()


def update_history_tab():
    if not page:
        return
    colors = c()
    hist = get_historical_rates()
    dates = sorted(hist.keys(), reverse=True) if hist else []
    chips = ctrl.get("hist_chips")
    if chips:
        chips.controls.clear()
        for d in dates[:20]:
            lbl = ft.TextButton(text=d, on_click=lambda e, dt=d: select_hist_date(dt))
            chips.controls.append(lbl)
        page.update()


def select_hist_date(date_str: str):
    global _hist_selected_date
    _hist_selected_date = date_str
    inp = ctrl.get("hist_date_input")
    if inp:
        inp.value = date_str
    update_history_tab()


# ─── Dialogs ──────────────────────────────────────────────────

def edit_bcv_lunes():
    colors = c()
    inp = ft.TextField(value=str(_bcv_lunes) if _bcv_lunes else "",
                       label="Tasa BCV Lunes", keyboard_type=ft.KeyboardType.NUMBER)

    def save(e):
        global _bcv_lunes, _bcv_lunes_updated_at
        try:
            val = float(inp.value.replace(",", "."))
            if val > 0:
                _bcv_lunes = val
                _bcv_lunes_updated_at = datetime.now().isoformat()
                save_config(bcv_lunes=val, bcv_lunes_updated_at=_bcv_lunes_updated_at)
                set_manual_historical_rate(val, _bcv_lunes_updated_at)
                update_rate_cards(_rates)
                update_spreads(_rates.get("bcv"), _rates.get("parallel"))
                if page:
                    page.close(dialog)
                    page.update()
        except (ValueError, AttributeError):
            pass

    def cancel(e):
        if page:
            page.close(dialog)

    dialog = ft.AlertDialog(
        title=ft.Text("Editar BCV Lunes"),
        content=inp,
        actions=[
            ft.TextButton("Guardar", on_click=save),
            ft.TextButton("Cancelar", on_click=cancel),
        ],
    )
    if page:
        page.open(dialog)
        page.update()


# ─── Theme ─────────────────────────────────────────────────────

def switch_theme(e):
    global _theme_mode
    modes = ["dark", "light", "system"]
    idx = modes.index(_theme_mode)
    _theme_mode = modes[(idx + 1) % len(modes)]
    apply_theme()


def apply_theme():
    global _current_theme
    _current_theme = resolve_theme(_theme_mode)
    colors = c()
    if not page:
        return
    page.theme_mode = ft.ThemeMode.DARK if _current_theme == "dark" else ft.ThemeMode.LIGHT
    theme_btn = ctrl.get("theme_btn")
    if theme_btn:
        icons = {"dark": ft.icons.DARK_MODE, "light": ft.icons.LIGHT_MODE, "system": ft.icons.SETTINGS}
        theme_btn.icon = icons.get(_theme_mode, ft.icons.DARK_MODE)
    save_config(last_known_theme=_theme_mode)
    update_rate_cards(_rates)
    update_spreads(_rates.get("bcv"), _rates.get("parallel"))
    update_conv_rate_labels()
    update_conv_ui()
    info_lbl = ctrl.get("info_label")
    if info_lbl:
        info_lbl.color = colors["muted"]
    for k in ("result_from", "result_to", "result_info"):
        lbl = ctrl.get(k)
        if lbl:
            lbl.color = {"result_from": colors["primary"], "result_to": colors["highlight"],
                         "result_info": colors["muted"]}[k]
    page.update()


# ─── Reminder ─────────────────────────────────────────────────

def toggle_reminder(e):
    global _reminder_enabled
    _reminder_enabled = e.control.value
    save_config(reminder_enabled=_reminder_enabled)


def start_reminder_check():
    def check():
        global _reminder_shown_this_friday
        while True:
            time.sleep(30)
            if _reminder_enabled and not _reminder_shown_this_friday:
                now = datetime.now()
                if now.weekday() == 4 and now.hour >= 18:
                    _reminder_shown_this_friday = True
                    if page:
                        page.open(ft.SnackBar(content=ft.Text("🔔 Recuerda actualizar la tasa BCV")))
                        page.update()
            time.sleep(300)
    threading.Thread(target=check, daemon=True).start()


# ─── API / Refresh ────────────────────────────────────────────

def refresh_rates():
    global _is_loading
    if _is_loading:
        return
    _is_loading = True
    set_card_loading("card_bcv")
    set_card_loading("card_parallel")
    set_card_loading("card_eur")
    set_card_loading("card_binance")
    for lbl in ctrl.get("conv_rate_labels", {}).values():
        lbl.value = "..."
    if page:
        page.update()
    try:
        rates = fetch_all_rates()
        on_rates_loaded(rates)
    except ApiError as e:
        on_rates_error(str(e))
    except Exception as e:
        on_rates_error(str(e))
    finally:
        _is_loading = False


def set_card_loading(key: str):
    card = ctrl.get(key)
    if card:
        card["rate_lbl"].value = "Cargando..."


def on_rates_loaded(rates):
    global _rates, _converter_rates, _brecha_notified
    _rates = rates
    _converter_rates = {
        "bcv": rates.get("bcv"), "binance_p2p": rates.get("binance_p2p"),
        "eur": rates.get("eur"), "parallel": rates.get("parallel"),
        "bcv_lunes": _bcv_lunes,
    }
    update_rate_cards(rates)
    update_conv_rate_labels()
    update_spreads(rates.get("bcv"), rates.get("parallel"))
    update_info_label(f"✓ Actualizado: {format_time(rates.get('fetched_at'))}")
    bcv = rates.get("bcv")
    paralelo = rates.get("parallel")
    if bcv and paralelo and bcv > 0:
        brecha = ((paralelo - bcv) / bcv) * 100
        if brecha > 20 and not _brecha_notified:
            if page:
                page.open(ft.SnackBar(content=ft.Text(f"⚠️ Brecha BCV vs Paralelo: {brecha:.1f}%")))
            _brecha_notified = True
        elif brecha <= 20:
            _brecha_notified = False
    save_cache_rates(rates)
    save_today_historical_rate(
        bcv=rates.get("bcv"), paralelo=rates.get("parallel"),
        binance_p2p=rates.get("binance_p2p"), euro=rates.get("eur"),
    )
    set_offline_mode(False)
    update_history_tab()
    do_conversion()
    if page:
        page.update()
    threading.Timer(REFRESH_MINUTES * 60, refresh_rates).start()


def on_rates_error(error_msg: str):
    global _is_loading
    _is_loading = False
    cache = load_cache_rates()
    if cache and cache.get("bcv") is not None:
        _rates = cache
        _converter_rates = {
            "bcv": cache.get("bcv"), "binance_p2p": cache.get("binance_p2p"),
            "eur": cache.get("euro"), "parallel": cache.get("paralelo"),
            "bcv_lunes": _bcv_lunes,
        }
        set_offline_mode(True, cache.get("cached_at", ""))
        update_rate_cards(cache)
        update_conv_rate_labels()
        update_spreads(cache.get("bcv"), cache.get("paralelo"))
        save_today_historical_rate(
            bcv=cache.get("bcv"), paralelo=cache.get("paralelo"),
            binance_p2p=cache.get("binance_p2p"), euro=cache.get("euro"),
        )
        update_history_tab()
        do_conversion()
    else:
        for key in ("card_bcv", "card_parallel", "card_eur", "card_binance"):
            card = ctrl.get(key)
            if card:
                card["rate_lbl"].value = "Error"
        update_info_label(f"⚠ Error: {error_msg}")
    if page:
        page.update()
    threading.Timer(30, refresh_rates).start()


# ─── UI Updates ───────────────────────────────────────────────

def update_rate_cards(rates):
    def upd(key, rate_key):
        card = ctrl.get(key)
        if not card:
            return
        val = rates.get(rate_key)
        fetched = rates.get("fetched_at")
        if val is not None:
            card["rate_lbl"].value = f"{val:,.2f}"
            card["usd_lbl"].value = f"1 USD = {val:,.2f} Bs."
        else:
            card["rate_lbl"].value = "—"
            card["usd_lbl"].value = ""
        ts = format_time(fetched)
        card["time_lbl"].value = f"🕐 {ts}" if ts else ""
    upd("card_bcv", "bcv")
    upd("card_parallel", "parallel")
    upd("card_eur", "eur")
    upd("card_binance", "binance_p2p")
    lc = ctrl.get("card_lunes")
    if lc:
        if _bcv_lunes is not None:
            lc["rate_lbl"].value = f"{_bcv_lunes:,.2f}"
            lc["time_lbl"].value = f"🕐 {format_time(_bcv_lunes_updated_at)}" if _bcv_lunes_updated_at else ""
        else:
            lc["rate_lbl"].value = "—"


def update_spreads(bcv, paralelo):
    upd_spread("spread_bcv", bcv, paralelo)
    upd_spread("cv_spread_bcv", bcv, paralelo)
    upd_spread("spread_lunes", _bcv_lunes, paralelo)
    upd_spread("cv_spread_lunes", _bcv_lunes, paralelo)


def upd_spread(key, a, b):
    sp = ctrl.get(key)
    if not sp or a is None or b is None:
        return
    diff = abs(b - a)
    pct = ((b - a) / a) * 100 if a > 0 else 0
    sp["a_val"].value = f"Bs. {a:,.2f}"
    sp["b_val"].value = f"Bs. {b:,.2f}"
    sp["diff_val"].value = f"Bs. {diff:,.2f}"
    pct_str = f"{'+' if pct >= 0 else ''}{pct:.2f}%"
    sp["pct_val"].value = pct_str
    bar_pct = min(abs(pct) / 50, 1.0)
    sp["bar"].value = bar_pct
    is_high = abs(pct) > 20
    clr_key = "highlight" if is_high else "success"
    colors = c()
    clr = colors[clr_key]
    sp["bar"].color = clr
    sp["diff_val"].color = clr
    sp["pct_val"].color = clr


def update_conv_rate_labels():
    colors = c()
    labels = ctrl.get("conv_rate_labels", {})
    color_map = {"bcv": colors["success"], "parallel": colors["highlight"],
                 "binance_p2p": colors["warning"], "eur": colors["info"], "bcv_lunes": colors["bcv_lunes"]}
    for key, lbl in labels.items():
        val = _converter_rates.get(key)
        clr = color_map.get(key, colors["primary"])
        if val is not None:
            lbl.value = f"{val:,.2f}"
        else:
            lbl.value = "—"
        lbl.color = clr


def update_info_label(text: str):
    lbl = ctrl.get("info_label")
    if lbl:
        lbl.value = text


def set_offline_mode(offline: bool, cached_at: str = ""):
    global _offline_mode
    _offline_mode = offline
    banner = ctrl.get("offline_banner")
    label = ctrl.get("offline_label")
    if banner and label:
        banner.visible = offline
        if offline and cached_at:
            label.value = f"Usando datos offline desde {cached_at}"


# ─── Conversion ───────────────────────────────────────────────

def do_conversion():
    colors = c()
    rate = _converter_rates.get(_converter_selected)
    inp = ctrl.get("conv_amount")
    if not inp or rate is None:
        return
    try:
        amount = float(inp.value.replace(",", ".")) if inp.value else 0
    except (ValueError, AttributeError):
        amount = 0
    res_from = ctrl.get("result_from")
    res_to = ctrl.get("result_to")
    res_info = ctrl.get("result_info")
    if not res_from:
        return
    if _converter_mode == "usd_to_bs":
        result = amount * rate
        res_from.value = f"USD {amount:,.2f}"
        res_to.value = f"Bs. {result:,.2f}"
        res_info.value = f"Tasa: {rate:,.2f}"
    else:
        result = amount / rate if rate > 0 else 0
        res_from.value = f"Bs. {amount:,.2f}"
        res_to.value = f"USD {result:,.2f}"
        res_info.value = f"Tasa: 1 USD = {rate:,.2f} Bs."
    res_from.color = colors["primary"]
    res_to.color = colors["highlight"]
    res_info.color = colors["muted"]
    if page:
        page.update()


# ─── Check Updates ────────────────────────────────────────────

def check_updates():
    try:
        result = check_for_updates()
        if result and result.get("has_update") and page:
            def download(e):
                url = result.get("download_url", result.get("release_url", ""))
                if url:
                    webbrowser.open(url)
                page.close(dialog)
            def later(e):
                page.close(dialog)
            dialog = ft.AlertDialog(
                title=ft.Text("🚀 Nueva versión disponible"),
                content=ft.Text(f"Actual: {APP_VERSION}\nNueva: {result.get('latest_version', '?')}"),
                actions=[
                    ft.TextButton("📥 Descargar", on_click=download),
                    ft.TextButton("Recordar después", on_click=later),
                ],
            )
            page.open(dialog)
            page.update()
    except Exception:
        pass


# ─── Main ─────────────────────────────────────────────────────

def init_app():
    start_reminder_check()
    refresh_rates()


def main(p: ft.Page):
    global page
    page = p
    page.title = "Tasa del Día — Venezuela"
    page.window.width = 500
    page.window.height = 750
    page.window.min_width = 480
    page.window.min_height = 680
    page.fonts = {"Segoe UI": "Segoe UI"}
    page.theme = ft.Theme(font_family="Segoe UI")

    config = load_config()
    global _bcv_lunes, _bcv_lunes_updated_at, _reminder_enabled, _theme_mode
    _bcv_lunes = config.get("bcv_lunes")
    _bcv_lunes_updated_at = config.get("bcv_lunes_updated_at")
    _reminder_enabled = config.get("reminder_enabled", False)
    _theme_mode = config.get("last_known_theme", "dark")
    apply_theme()

    page.add(
        ft.Column(controls=[
            build_title_bar(),
            ft.Tabs(
                selected_index=0,
                animation_duration=200,
                tabs=[
                    ft.Tab(text="📊  Tasas", content=build_rates_tab()),
                    ft.Tab(text="💱  Conversor", content=build_converter_tab()),
                    ft.Tab(text="📅  Historial", content=build_history_tab()),
                ],
                expand=True,
            ),
        ], spacing=4),
    )
    page.update()
    threading.Timer(0.1, init_app).start()
    threading.Timer(5.0, check_updates).start()


ft.app(target=main)
