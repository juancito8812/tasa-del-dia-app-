import logging
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

from PySide6.QtCore import QTimer, Qt
from PySide6.QtWidgets import (
    QWidget, QFrame, QHBoxLayout, QVBoxLayout, QApplication,
    QDialog, QPushButton, QLabel, QLineEdit,
)

from winup_app.winup_shim import ui, component, style

from app.api import fetch_all_rates, ApiError
from app.storage import (
    load_config, save_config, load_cache_rates, save_cache_rates,
    get_historical_rates, save_today_historical_rate,
    get_today_key, format_date_key, parse_date_from_display,
    set_manual_historical_rate,
)
from app.auto_update import check_for_updates, APP_VERSION
from app.system_tray import send_notification, start_tray, stop_tray

logger = logging.getLogger(__name__)

REFRESH_MINUTES = 25

theme_colors = {
    "dark": {
        "bg": "#07070d",
        "card": "#111120",
        "card_border": "#1e1e3a",
        "primary": "#f0f0ff",
        "secondary": "#8888b0",
        "muted": "#55557a",
        "accent": "#1c1c38",
        "highlight": "#ff4060",
        "success": "#00d4a0",
        "warning": "#fbbf24",
        "info": "#38bdf8",
        "bcv_lunes": "#c084fc",
        "input_bg": "#0d0d1a",
        "input_text": "#f0f0ff",
    },
    "light": {
        "bg": "#f4f6fa",
        "card": "#ffffff",
        "card_border": "#e2e4ee",
        "primary": "#0f0f1a",
        "secondary": "#4a4a6a",
        "muted": "#9494b8",
        "accent": "#e8ecf4",
        "highlight": "#e93555",
        "success": "#059669",
        "warning": "#d97706",
        "info": "#0284c7",
        "bcv_lunes": "#7c3aed",
        "input_bg": "#eef0f6",
        "input_text": "#0f0f1a",
    },
}

current_theme_mode = "system"
_current_theme = "dark"

_rates: Dict[str, Any] = {}
_converter_rates: Dict[str, Any] = {}
_bcv_lunes: Optional[float] = None
_bcv_lunes_updated_at: Optional[str] = None
_offline_mode = False
_brecha_notified = False
_reminder_enabled = False
_reminder_shown_this_friday = False
_widget_enabled = False
_is_loading = False
_hist_selected_date: Optional[str] = None
_converter_selected = "bcv"
_converter_mode = "usd_to_bs"

_widgets: Dict[str, Any] = {}
_widget_styles: List[Tuple[Any, Any]] = []
_hist_copied_field: Optional[str] = None


def _register_style(widget, updater):
    _widget_styles.append((widget, updater))


def resolve_theme(mode: str) -> str:
    if mode == "system":
        try:
            import darkdetect
            return "dark" if darkdetect.theme() == "Dark" else "light"
        except Exception:
            return "dark"
    return mode


def c() -> dict:
    return theme_colors[_current_theme]


def blend_color(color: str, alpha: float) -> str:
    cols = c()
    bg = cols["bg"]
    if color.startswith("#") and len(color) == 7 and bg.startswith("#") and len(bg) == 7:
        r = int(color[1:3], 16)
        g = int(color[3:5], 16)
        b = int(color[5:7], 16)
        bg_r = int(bg[1:3], 16)
        bg_g = int(bg[3:5], 16)
        bg_b = int(bg[5:7], 16)
        return f"#{int(r * alpha + bg_r * (1 - alpha)):02x}{int(g * alpha + bg_g * (1 - alpha)):02x}{int(b * alpha + bg_b * (1 - alpha)):02x}"
    return color


def _format_time(updated_at: Optional[str]) -> str:
    if not updated_at:
        return ""
    try:
        dt = datetime.fromisoformat(str(updated_at).replace("Z", "+00:00"))
        return dt.strftime("%d/%m %I:%M %p")
    except (ValueError, TypeError):
        return ""


def _set_global_stylesheet():
    cols = c()
    qss = f"""
        QWidget {{
            font-family: "Segoe UI";
            font-size: 10pt;
            background-color: {cols["bg"]};
            color: {cols["primary"]};
        }}
        QTabWidget::pane {{
            border: none;
            background-color: {cols["bg"]};
        }}
        QTabBar::tab {{
            background-color: {cols["card"]};
            color: {cols["secondary"]};
            padding: 8px 16px;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
            margin-right: 2px;
        }}
        QTabBar::tab:selected {{
            background-color: {cols["accent"]};
            color: {cols["primary"]};
        }}
        QScrollBar:vertical {{
            background: {cols["bg"]};
            width: 8px;
            border-radius: 4px;
        }}
        QScrollBar::handle:vertical {{
            background: {cols["accent"]};
            border-radius: 4px;
            min-height: 30px;
        }}
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
            height: 0;
        }}
        QLineEdit {{
            background-color: {cols["input_bg"]};
            color: {cols["input_text"]};
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: bold;
        }}
        QPushButton {{
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
        }}
        QCheckBox {{
            spacing: 8px;
            color: {cols["primary"]};
        }}
        QCheckBox::indicator {{
            width: 36px;
            height: 18px;
            border-radius: 9px;
        }}
        QCheckBox::indicator:unchecked {{
            background-color: {cols["card_border"]};
        }}
        QCheckBox::indicator:checked {{
            background-color: {cols["success"]};
        }}
    """
    app = QApplication.instance()
    if app:
        app.setStyleSheet(qss)


@component
def App():
    config = load_config()
    global _bcv_lunes, _bcv_lunes_updated_at, _reminder_enabled, _widget_enabled
    _bcv_lunes = config.get("bcv_lunes")
    _bcv_lunes_updated_at = config.get("bcv_lunes_updated_at")
    _reminder_enabled = config.get("reminder_enabled", False)
    _widget_enabled = config.get("widget_enabled", False)
    cached_theme = config.get("last_known_theme", "dark")
    global current_theme_mode
    current_theme_mode = cached_theme
    global _current_theme
    _current_theme = resolve_theme(current_theme_mode)

    _set_global_stylesheet()

    col = ui.Column(
        children=[
            _build_title_bar(),
            (_build_tab_view(), 1),
        ],
        props={"spacing": 4, "margin": 0},
    )

    QTimer.singleShot(100, _init_app)
    return col


# ─── Title Bar ─────────────────────────────────────────────────

def _build_title_bar() -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet(f"background-color: {cols['bg']}; border: none; margin: 0;")
    layout = QHBoxLayout(container)
    layout.setContentsMargins(16, 12, 16, 4)
    layout.setSpacing(8)

    icon_f = QFrame()
    icon_f.setFixedSize(40, 40)
    icon_f.setStyleSheet(f"background-color: {blend_color(cols['highlight'], 0.1)}; border-radius: 10px;")
    il = QHBoxLayout(icon_f)
    il.setContentsMargins(0, 0, 0, 0)
    il.addWidget(QLabel("📉"), alignment=Qt.AlignCenter)
    layout.addWidget(icon_f)

    title_area = QFrame()
    title_area.setStyleSheet("background: transparent;")
    tl = QVBoxLayout(title_area)
    tl.setContentsMargins(0, 0, 0, 0)
    tl.setSpacing(0)
    t = QLabel("Tasa del Día")
    t.setStyleSheet(f"font-size: 20px; font-weight: bold; color: {cols['primary']}; background: transparent;")
    tl.addWidget(t)
    sub = QLabel("Tasas de cambio del Bolívar Venezolano")
    sub.setStyleSheet(f"font-size: 10px; color: {cols['secondary']}; background: transparent;")
    tl.addWidget(sub)
    layout.addWidget(title_area, stretch=1)

    _theme_btn = QPushButton("🌙")
    _theme_btn.setStyleSheet(f"background-color: {cols['card']}; color: {cols['secondary']}; border-radius: 6px; padding: 4px 8px;")
    _theme_btn.clicked.connect(_switch_theme)
    layout.addWidget(_theme_btn)
    _widgets["theme_btn"] = _theme_btn

    _widget_btn = QPushButton("📌")
    _widget_btn.setStyleSheet(f"background-color: {cols['card']}; color: {cols['secondary']}; border-radius: 6px; padding: 4px 8px;")
    _widget_btn.clicked.connect(_toggle_widget)
    layout.addWidget(_widget_btn)
    _widgets["widget_btn"] = _widget_btn

    return container





# ─── Tab View ──────────────────────────────────────────────────

def _build_tab_view() -> QWidget:
    cols = c()
    tabs = {
        "📊  Tasas": _build_rates_tab(),
        "💱  Conversor": _build_converter_tab(),
        "📅  Historial": _build_history_tab(),
    }
    return ui.TabView(tabs=tabs)


# ─── Rates Tab ─────────────────────────────────────────────────

def _build_rates_tab() -> QWidget:
    cols = c()
    content = _make_column([
        _build_spread("spread_bcv", "⚖️", "BRECHA BCV VS PARALELO", cols["success"], cols["highlight"]),
        _build_spread("spread_lunes", "📅", "BRECHA BCV (LUNES) VS PARALELO", cols["bcv_lunes"], cols["highlight"]),
        _build_rate_card("card_bcv", "🏛️", "BCV (Oficial)", "Banco Central de Venezuela", cols["success"]),
        _build_rate_card("card_parallel", "📈", "Dólar Paralelo", "Mercado paralelo / promedio", cols["highlight"]),
        _build_rate_card("card_eur", "💶", "Euro (BCV)", "Tasa de referencia oficial", cols["info"]),
        _build_rate_card("card_binance", "₿", "Binance P2P", "USDT / VES — Mercado P2P", cols["warning"]),
        _build_rate_card("card_lunes", "📅", "BCV (Lunes)", "Tasa manual del lunes", cols["bcv_lunes"], editable=True),
        _build_reminder_card(),
        _build_offline_banner(),
        _build_info_bar(),
    ])
    sv = ui.ScrollView(content, props={"background-color": cols["bg"], "border": "none"})
    return sv


# ─── Spread Indicator ──────────────────────────────────────────

def _build_spread(key: str, icon: str, title: str, color_a: str, color_b: str) -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet(f"background-color: {cols['card']}; border: 1px solid {cols['card_border']}; border-radius: 8px;")
    _register_style(container, lambda c: f"background-color: {c['card']}; border: 1px solid {c['card_border']}; border-radius: 8px;")
    layout = QVBoxLayout(container)
    layout.setContentsMargins(14, 12, 14, 12)
    layout.setSpacing(8)

    hr = QFrame()
    hr.setStyleSheet("background: transparent;")
    hl = QHBoxLayout(hr)
    hl.setContentsMargins(0, 0, 0, 0)
    hl.addWidget(_ql(f"{icon}  {title}", f"font-size: 10px; font-weight: bold; color: {cols['muted']};"))
    layout.addWidget(hr)

    rr = QFrame()
    rr.setStyleSheet("background: transparent;")
    rl = QHBoxLayout(rr)
    rl.setContentsMargins(0, 0, 0, 0)

    af = QFrame()
    af.setStyleSheet("background: transparent;")
    al2 = QVBoxLayout(af)
    al2.setContentsMargins(0, 0, 0, 0)
    al2.setSpacing(2)
    al2.addWidget(_ql("●  BCV", f"font-size: 9px; color: {cols['muted']};"))
    _a_v = _ql("—", f"font-size: 18px; font-weight: bold; color: {color_a};")
    al2.addWidget(_a_v)
    rl.addWidget(af)

    rl.addWidget(_ql("VS", f"font-size: 10px; font-weight: bold; color: {cols['muted']};"))

    bf = QFrame()
    bf.setStyleSheet("background: transparent;")
    bl2 = QVBoxLayout(bf)
    bl2.setContentsMargins(0, 0, 0, 0)
    bl2.setSpacing(2)
    bl2.addWidget(_ql("●  Paralelo", f"font-size: 9px; color: {cols['muted']};"))
    _b_v = _ql("—", f"font-size: 18px; font-weight: bold; color: {color_b};")
    bl2.addWidget(_b_v)
    rl.addWidget(bf)
    layout.addWidget(rr)

    bar_bg = QFrame()
    bar_bg.setFixedHeight(6)
    bar_bg.setStyleSheet(f"background-color: {cols['input_bg']}; border-radius: 3px;")
    bl3 = QHBoxLayout(bar_bg)
    bl3.setContentsMargins(0, 0, 0, 0)
    _bar_f = QFrame()
    _bar_f.setFixedHeight(6)
    _bar_f.setStyleSheet(f"background-color: {cols['success']}; border-radius: 3px;")
    _bar_f.setFixedWidth(0)
    bl3.addWidget(_bar_f)
    layout.addWidget(bar_bg)

    sf = QFrame()
    sf.setStyleSheet(f"background-color: {cols['input_bg']}; border-radius: 4px;")
    sl = QHBoxLayout(sf)
    sl.setContentsMargins(12, 8, 12, 8)

    df = QFrame()
    df.setStyleSheet("background: transparent;")
    dl = QVBoxLayout(df)
    dl.setContentsMargins(0, 0, 0, 0)
    dl.setSpacing(2)
    dl.addWidget(_ql("DIFERENCIA", f"font-size: 9px; color: {cols['muted']};"))
    _diff = _ql("—", f"font-size: 10px; font-weight: bold; color: {cols['success']};")
    dl.addWidget(_diff)
    sl.addWidget(df)

    pf = QFrame()
    pf.setStyleSheet("background: transparent;")
    pl2 = QVBoxLayout(pf)
    pl2.setContentsMargins(0, 0, 0, 0)
    pl2.setSpacing(2)
    pl2.addWidget(_ql("BRECHA", f"font-size: 9px; color: {cols['muted']};"))
    _pct = _ql("—", f"font-size: 10px; font-weight: bold; color: {cols['success']};")
    pl2.addWidget(_pct)
    sl.addWidget(pf)
    layout.addWidget(sf)

    container.hide()
    _widgets[key] = {"container": container, "a_val": _a_v, "b_val": _b_v, "bar_fill": _bar_f, "diff_val": _diff, "pct_val": _pct}
    return container


# ─── Rate Card ─────────────────────────────────────────────────

def _build_rate_card(key: str, icon: str, title: str, subtitle: str, color: str, editable: bool = False) -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet(f"background-color: {cols['card']}; border: 1px solid {cols['card_border']}; border-radius: 8px;")
    _register_style(container, lambda c: f"background-color: {c['card']}; border: 1px solid {c['card_border']}; border-radius: 8px;")
    layout = QVBoxLayout(container)
    layout.setContentsMargins(16, 14, 16, 14)

    glow = QFrame()
    glow.setFixedHeight(4)
    glow.setStyleSheet(f"background-color: {color}; border-radius: 2px;")
    layout.addWidget(glow)

    hr = QFrame()
    hr.setStyleSheet("background: transparent;")
    hl = QHBoxLayout(hr)
    hl.setContentsMargins(0, 6, 0, 0)

    icf = QFrame()
    icf.setFixedSize(36, 36)
    icf.setStyleSheet(f"background-color: {blend_color(color, 0.12)}; border-radius: 8px;")
    icl = QHBoxLayout(icf)
    icl.setContentsMargins(0, 0, 0, 0)
    icl.addWidget(QLabel(icon), alignment=Qt.AlignCenter)
    hl.addWidget(icf)

    tf = QFrame()
    tf.setStyleSheet("background: transparent;")
    tl3 = QVBoxLayout(tf)
    tl3.setContentsMargins(8, 0, 0, 0)
    tl3.setSpacing(0)
    tl3.addWidget(_ql(title, f"font-size: 13px; font-weight: bold; color: {cols['primary']};"))
    if subtitle:
        tl3.addWidget(_ql(subtitle, f"font-size: 9px; color: {cols['secondary']};"))
    hl.addWidget(tf, stretch=1)
    layout.addWidget(hr)

    rr2 = QFrame()
    rr2.setStyleSheet("background: transparent;")
    rl2 = QHBoxLayout(rr2)
    rl2.setContentsMargins(0, 10, 0, 0)
    rl2.addWidget(_ql("Bs.", f"font-size: 16px; font-weight: bold; color: {color};"))
    _rate = _ql("—", f"font-size: 26px; font-weight: bold; color: {color};")
    rl2.addWidget(_rate, stretch=1)
    layout.addWidget(rr2)

    fr3 = QFrame()
    fr3.setStyleSheet("background: transparent;")
    fl2 = QHBoxLayout(fr3)
    fl2.setContentsMargins(0, 6, 0, 0)
    _time = _ql("", f"font-size: 9px; color: {cols['muted']};")
    fl2.addWidget(_time)
    fl2.addStretch()
    _usd = _ql("", f"font-size: 9px; color: {cols['muted']};")
    fl2.addWidget(_usd)
    if editable:
        eb = QPushButton("✏️")
        eb.setStyleSheet(f"background: transparent; color: {cols['bcv_lunes']}; font-size: 10px; border: none;")
        eb.clicked.connect(_edit_bcv_lunes_dialog)
        fl2.addWidget(eb)
    layout.addWidget(fr3)

    _widgets[key] = {"rate_lbl": _rate, "time_lbl": _time, "usd_lbl": _usd}
    return container


# ─── Reminder Card ─────────────────────────────────────────────

def _build_reminder_card() -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet(f"background-color: {cols['card']}; border: 1px solid {cols['card_border']}; border-radius: 8px;")
    _register_style(container, lambda c: f"background-color: {c['card']}; border: 1px solid {c['card_border']}; border-radius: 8px;")
    layout = QHBoxLayout(container)
    layout.setContentsMargins(14, 10, 14, 10)

    layout.addWidget(QLabel("🔔"))
    tf = QFrame()
    tf.setStyleSheet("background: transparent;")
    tl4 = QVBoxLayout(tf)
    tl4.setContentsMargins(8, 0, 0, 0)
    tl4.setSpacing(0)
    tl4.addWidget(_ql("Recordatorio viernes 6:00 PM", f"font-size: 10px; font-weight: bold; color: {cols['primary']};"))
    tl4.addWidget(_ql("Te avisa si aun no has ingresado la tasa", f"font-size: 9px; color: {cols['muted']};"))
    layout.addWidget(tf, stretch=1)

    from PySide6.QtWidgets import QCheckBox
    _rem_sw = QCheckBox()
    _rem_sw.setChecked(_reminder_enabled)
    _rem_sw.toggled.connect(_toggle_reminder)
    layout.addWidget(_rem_sw)
    _widgets["reminder_switch"] = _rem_sw
    return container


# ─── Offline Banner & Info Bar ─────────────────────────────────

def _build_offline_banner() -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet(f"background-color: {cols['warning']}; border-radius: 6px;")
    layout = QHBoxLayout(container)
    layout.setContentsMargins(12, 6, 12, 6)
    layout.addWidget(QLabel("⚠️"))
    _off_lbl = _ql("", "font-size: 9px; color: #ffffff;")
    layout.addWidget(_off_lbl, stretch=1)
    container.hide()
    _widgets["offline_banner"] = container
    _widgets["offline_label"] = _off_lbl
    return container


def _build_info_bar() -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet(f"background-color: {cols['card']}; border: 1px solid {cols['card_border']}; border-radius: 6px;")
    _register_style(container, lambda c: f"background-color: {c['card']}; border: 1px solid {c['card_border']}; border-radius: 6px;")
    layout = QHBoxLayout(container)
    layout.setContentsMargins(14, 8, 14, 8)
    layout.addWidget(QLabel("🔄"))
    _info = _ql("Las tasas se actualizan cada 25 minutos", f"font-size: 9px; color: {cols['muted']};")
    layout.addWidget(_info, stretch=1)
    _widgets["info_label"] = _info
    return container


# ─── Converter Tab ─────────────────────────────────────────────

def _build_converter_tab() -> QWidget:
    cols = c()
    content = _make_column([
        _build_conv_rate_sel(),
        _build_conv_card(),
        _build_spread("cv_spread_bcv", "⚖️", "BRECHA BCV VS PARALELO", cols["success"], cols["highlight"]),
        _build_spread("cv_spread_lunes", "📅", "BRECHA BCV (LUNES) VS PARALELO", cols["bcv_lunes"], cols["highlight"]),
    ])
    return ui.ScrollView(content, props={"background-color": cols["bg"], "border": "none"})


def _build_conv_rate_sel() -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet("background: transparent;")
    layout = QVBoxLayout(container)
    layout.setContentsMargins(0, 0, 0, 0)
    layout.addWidget(_ql("TASA A USAR", f"font-size: 10px; font-weight: bold; color: {cols['muted']};"))
    layout.addSpacing(8)

    _conv_labels = {}
    _conv_btns = {}
    for key, label, color in [
        ("bcv", "BCV (Oficial)", cols["success"]),
        ("parallel", "Dolar Paralelo", cols["highlight"]),
        ("binance_p2p", "Binance P2P", cols["warning"]),
        ("eur", "Euro (BCV)", cols["info"]),
        ("bcv_lunes", "BCV (Lunes)", cols["bcv_lunes"]),
    ]:
        row = QFrame()
        bg = cols["accent"] if key == _converter_selected else cols["card"]
        tc = cols["primary"] if key == _converter_selected else cols["secondary"]
        row.setStyleSheet(f"background-color: {bg}; border-radius: 8px;")
        rl = QHBoxLayout(row)
        rl.setContentsMargins(12, 8, 12, 8)
        btn = QPushButton(label)
        btn.setStyleSheet(f"background: transparent; color: {tc}; font-weight: bold; text-align: left;")
        btn.clicked.connect(lambda checked=False, k=key: _conv_select_rate(k))
        rl.addWidget(btn, stretch=1)
        vl = _ql("—", f"font-size: 11px; font-weight: bold; color: {color};")
        rl.addWidget(vl)
        layout.addWidget(row)
        _conv_labels[key] = vl
        _conv_btns[key] = (row, bg)

    _widgets["conv_rate_labels"] = _conv_labels
    _widgets["conv_rate_btns"] = _conv_btns
    return container


def _build_conv_card() -> QWidget:
    cols = c()
    container = QFrame()
    container.setStyleSheet(f"background-color: {cols['card']}; border-radius: 8px;")
    _register_style(container, lambda c: f"background-color: {c['card']}; border-radius: 8px;")
    layout = QVBoxLayout(container)
    layout.setContentsMargins(16, 16, 16, 16)

    mf = QFrame()
    mf.setStyleSheet(f"background-color: {cols['input_bg']}; border-radius: 6px;")
    _register_style(mf, lambda c: f"background-color: {c['input_bg']}; border-radius: 6px;")
    ml = QHBoxLayout(mf)
    ml.setContentsMargins(2, 2, 2, 2)

    _btn_usd = QPushButton("USD → Bs.")
    _btn_usd.setStyleSheet(f"background-color: {cols['accent']}; color: {cols['primary']}; border-radius: 6px; padding: 6px 12px;")
    _btn_usd.clicked.connect(lambda: _set_conv_mode("usd_to_bs"))
    ml.addWidget(_btn_usd)

    _btn_bs = QPushButton("Bs. → USD")
    _btn_bs.setStyleSheet(f"background-color: {cols['input_bg']}; color: {cols['muted']}; border-radius: 6px; padding: 6px 12px;")
    _btn_bs.clicked.connect(lambda: _set_conv_mode("bs_to_usd"))
    ml.addWidget(_btn_bs)
    layout.addWidget(mf)
    _widgets["btn_usd"] = _btn_usd
    _widgets["btn_bs"] = _btn_bs

    layout.addWidget(_ql("MONTO", f"font-size: 9px; font-weight: bold; color: {cols['secondary']};"))
    layout.addSpacing(4)

    ef = QFrame()
    ef.setStyleSheet(f"background-color: {cols['input_bg']}; border-radius: 6px; fill: {cols['input_bg']};")
    _register_style(ef, lambda c: f"background-color: {c['input_bg']}; border-radius: 6px; fill: {c['input_bg']};")
    el = QHBoxLayout(ef)
    el.setContentsMargins(0, 0, 0, 0)

    _conv_inp = QLineEdit()
    _conv_inp.setText("100")
    _conv_inp.setStyleSheet(f"background: transparent; color: {cols['input_text']}; border: none; padding: 8px 12px; font-size: 20px; font-weight: bold;")
    _conv_inp.returnPressed.connect(_do_conversion)
    el.addWidget(_conv_inp, stretch=1)

    paste_btn = QPushButton("📋 Pegar")
    paste_btn.setStyleSheet(f"background: transparent; color: {cols['muted']}; padding: 4px 8px;")
    paste_btn.clicked.connect(_paste_from_clipboard)
    el.addWidget(paste_btn)
    layout.addWidget(ef)
    _widgets["conv_amount"] = _conv_inp
    _widgets["paste_btn"] = paste_btn

    qf = QFrame()
    qf.setStyleSheet("background: transparent;")
    ql = QHBoxLayout(qf)
    ql.setContentsMargins(0, 8, 0, 0)
    ql.setSpacing(2)
    _quick_btns = []
    for val in [100, 500, 1000, 5000, 10000, 50000]:
        b = QPushButton(f"{val:,}".replace(",", "."))
        b.setStyleSheet(f"background-color: {cols['input_bg']}; color: {cols['secondary']}; border-radius: 6px; padding: 4px 6px;")
        b.clicked.connect(lambda checked=False, v=val: _set_quick_amount(v))
        ql.addWidget(b, stretch=1)
        _quick_btns.append(b)
    _widgets["conv_quick_btns"] = _quick_btns
    layout.addWidget(qf)

    conv_btn = QPushButton("💱  Convertir")
    conv_btn.setStyleSheet(f"background-color: {cols['accent']}; color: {cols['primary']}; border-radius: 8px; padding: 10px; font-size: 12px; font-weight: bold;")
    _register_style(conv_btn, lambda c: f"background-color: {c['accent']}; color: {c['primary']}; border-radius: 8px; padding: 10px; font-size: 12px; font-weight: bold;")
    conv_btn.clicked.connect(_do_conversion)
    _widgets["conv_btn"] = conv_btn
    layout.addWidget(conv_btn)

    rf = QFrame()
    rf.setStyleSheet("background: transparent;")
    rl3 = QVBoxLayout(rf)
    rl3.setContentsMargins(0, 12, 0, 0)
    rl3.addWidget(_ql("RESULTADO", f"font-size: 9px; font-weight: bold; color: {cols['secondary']};"))
    rl3.addSpacing(4)

    _res_from = _ql("", f"font-size: 22px; font-weight: bold; color: {cols['primary']};")
    rl3.addWidget(_res_from, alignment=Qt.AlignCenter)
    rl3.addWidget(_ql("▼", f"font-size: 14px; color: {cols['highlight']};"), alignment=Qt.AlignCenter)
    _res_to = _ql("", f"font-size: 22px; font-weight: bold; color: {cols['highlight']};")
    rl3.addWidget(_res_to, alignment=Qt.AlignCenter)
    _res_info = _ql("", f"font-size: 9px; color: {cols['muted']};")
    rl3.addWidget(_res_info, alignment=Qt.AlignCenter)
    layout.addWidget(rf)

    _widgets["result_from"] = _res_from
    _widgets["result_to"] = _res_to
    _widgets["result_info"] = _res_info
    return container


# ─── History Tab ───────────────────────────────────────────────

def _build_history_tab() -> QWidget:
    cols = c()
    content = _make_column([
        _build_hist_header(),
        _build_hist_chips(),
        _build_hist_custom(),
        _build_hist_detail(),
        _build_hist_list_content(),
    ])
    sv = ui.ScrollView(content, props={"background-color": cols["bg"], "border": "none"})
    _widgets["hist_scroll"] = sv
    return sv


def _build_hist_header() -> QWidget:
    cols = c()
    return _ql("SELECCIONAR FECHA", f"font-size: 10px; font-weight: bold; color: {cols['muted']};")


def _build_hist_chips() -> QWidget:
    cols = c()
    c2 = QFrame()
    c2.setStyleSheet("background: transparent;")
    _widgets["hist_chips"] = c2
    return c2


def _build_hist_custom() -> QWidget:
    cols = c()
    c2 = QFrame()
    c2.setStyleSheet("background: transparent;")
    l = QHBoxLayout(c2)
    l.setContentsMargins(0, 0, 0, 0)
    _hist_inp = QLineEdit()
    _hist_inp.setText(datetime.now().strftime("%d/%m/%Y"))
    _hist_inp.setStyleSheet(f"background-color: {cols['input_bg']}; color: {cols['input_text']}; border-radius: 6px; padding: 8px; font-size: 12px; font-weight: bold;")
    _hist_inp.returnPressed.connect(_hist_search_date)
    l.addWidget(_hist_inp, stretch=1)
    _widgets["hist_date_input"] = _hist_inp

    sb = QPushButton("🔍 Ver")
    sb.setStyleSheet(f"background-color: {cols['info']}; color: #ffffff; border-radius: 6px; padding: 8px;")
    sb.clicked.connect(_hist_search_date)
    l.addWidget(sb)
    return c2


def _build_hist_detail() -> QWidget:
    cols = c()
    c2 = QFrame()
    c2.setStyleSheet(f"background-color: {cols['card']}; border-radius: 8px;")
    _register_style(c2, lambda c: f"background-color: {c['card']}; border-radius: 8px;")
    c2.hide()
    _widgets["hist_detail_card"] = c2
    return c2


def _build_hist_list_content() -> QWidget:
    cols = c()
    c2 = QFrame()
    c2.setStyleSheet("background: transparent;")
    _widgets["hist_list"] = c2

    QTimer.singleShot(300, _update_history_tab)
    return c2


# ─── Business Logic ────────────────────────────────────────────

def _init_app():
    start_tray(on_show=_restore_from_tray, on_quit=_quit_from_tray, on_refresh=refresh_rates)
    _start_reminder_check()
    refresh_rates()
    if _widget_enabled:
        QTimer.singleShot(500, _show_widget)
    QTimer.singleShot(5000, _check_updates_silent)
    if _reminder_enabled and not _reminder_shown_this_friday:
        QTimer.singleShot(1000, _check_reminder)


def _ql(text: str, style_str: str = "") -> QLabel:
    lbl = QLabel(text)
    if style_str:
        lbl.setStyleSheet(style_str + " background: transparent;")
    return lbl


def _make_column(children: List[QWidget]) -> QFrame:
    cols = c()
    f = QFrame()
    f.setStyleSheet("background: transparent;")
    l = QVBoxLayout(f)
    l.setContentsMargins(0, 0, 0, 0)
    l.setSpacing(6)
    for child in children:
        l.addWidget(child)
    return f


def _apply_theme():
    global _current_theme
    _current_theme = resolve_theme(current_theme_mode)
    _set_global_stylesheet()

    cols = c()
    for widget, updater in _widget_styles:
        widget.setStyleSheet(updater(cols))

    theme_btn = _widgets.get("theme_btn")
    if theme_btn:
        labels = {"dark": "🌙", "light": "☀️", "system": "🖥️"}
        theme_btn.setText(labels.get(current_theme_mode, "🌙"))
        theme_btn.setStyleSheet(f"background-color: {cols['card']}; color: {cols['secondary']}; border-radius: 6px; padding: 4px 8px;")

    widget_btn = _widgets.get("widget_btn")
    if widget_btn:
        widget_btn.setStyleSheet(f"background-color: {cols['card']}; color: {cols['secondary']}; border-radius: 6px; padding: 4px 8px;")
    if _widget_window:
        _widget_window.setStyleSheet(f"background-color: {cols['card']}; border: 1px solid {cols['card_border']}; border-radius: 8px;")
    info_lbl = _widgets.get("info_label")
    if info_lbl:
        info_lbl.setStyleSheet(f"font-size: 9px; color: {cols['muted']}; background: transparent;")
    for k in ("result_from", "result_to", "result_info"):
        lbl = _widgets.get(k)
        if lbl:
            style = {
                "result_from": f"font-size: 22px; font-weight: bold; color: {cols['primary']};",
                "result_to": f"font-size: 22px; font-weight: bold; color: {cols['highlight']};",
                "result_info": f"font-size: 9px; color: {cols['muted']};",
            }[k]
            lbl.setStyleSheet(style + " background: transparent;")

    save_config(last_known_theme=current_theme_mode)

    _update_rate_cards(_rates)
    _update_spreads(_rates.get("bcv"), _rates.get("parallel"))
    _update_converter_rate_labels()
    _update_conv_ui()


def _switch_theme():
    global current_theme_mode
    modes = ["dark", "light", "system"]
    idx = modes.index(current_theme_mode)
    current_theme_mode = modes[(idx + 1) % len(modes)]
    _apply_theme()


def _update_conv_ui():
    cols = c()
    btns = _widgets.get("conv_rate_btns", {})
    for key, (row, _) in btns.items():
        bg = cols["accent"] if key == _converter_selected else cols["card"]
        tc = cols["primary"] if key == _converter_selected else cols["secondary"]
        row.setStyleSheet(f"background-color: {bg}; border-radius: 8px;")
        btn = row.findChild(QPushButton)
        if btn:
            btn.setStyleSheet(f"background: transparent; color: {tc}; font-weight: bold; text-align: left;")

    cols = c()
    _widgets.get("btn_usd", QPushButton()).setStyleSheet(
        f"background-color: {cols['accent']}; color: {cols['primary']}; border-radius: 6px; padding: 6px 12px;"
        if _converter_mode == "usd_to_bs" else
        f"background-color: {cols['input_bg']}; color: {cols['muted']}; border-radius: 6px; padding: 6px 12px;"
    )
    _widgets.get("btn_bs", QPushButton()).setStyleSheet(
        f"background-color: {cols['accent']}; color: {cols['primary']}; border-radius: 6px; padding: 6px 12px;"
        if _converter_mode == "bs_to_usd" else
        f"background-color: {cols['input_bg']}; color: {cols['muted']}; border-radius: 6px; padding: 6px 12px;"
    )

    inp = _widgets.get("conv_amount")
    if inp:
        inp.setStyleSheet(f"background: transparent; color: {cols['input_text']}; border: none; padding: 8px 12px; font-size: 20px; font-weight: bold;")
    paste = _widgets.get("paste_btn")
    if paste:
        paste.setStyleSheet(f"background: transparent; color: {cols['muted']}; padding: 4px 8px;")
    for b in _widgets.get("conv_quick_btns", []):
        b.setStyleSheet(f"background-color: {cols['input_bg']}; color: {cols['secondary']}; border-radius: 6px; padding: 4px 6px;")





# ─── API / Refresh ─────────────────────────────────────────────

def refresh_rates():
    global _is_loading
    if _is_loading:
        return
    _is_loading = True

    _set_card_loading("card_bcv")
    _set_card_loading("card_parallel")
    _set_card_loading("card_eur")
    _set_card_loading("card_binance")
    for lbl in _widgets.get("conv_rate_labels", {}).values():
        lbl.setText("...")

    try:
        rates = fetch_all_rates()
        _on_rates_loaded(rates)
    except ApiError as e:
        _on_rates_error(str(e))
    except Exception as e:
        _on_rates_error(str(e))
    finally:
        _is_loading = False


def _set_card_loading(key: str):
    card = _widgets.get(key)
    if card:
        card["rate_lbl"].setText("Cargando...")


def _on_rates_loaded(rates):
    global _rates, _converter_rates, _brecha_notified, _is_loading
    _is_loading = False
    _rates = rates
    _converter_rates = {
        "bcv": rates.get("bcv"),
        "binance_p2p": rates.get("binance_p2p"),
        "eur": rates.get("eur"),
        "parallel": rates.get("parallel"),
        "bcv_lunes": _bcv_lunes,
    }
    _update_rate_cards(rates)
    _update_converter_rate_labels()
    _update_spreads(rates.get("bcv"), rates.get("parallel"))
    _update_info_label(f"✓ Actualizado: {_format_time(rates.get('fetched_at'))}")

    bcv = rates.get("bcv")
    paralelo = rates.get("parallel")
    if bcv and paralelo and bcv > 0:
        brecha = ((paralelo - bcv) / bcv) * 100
        if brecha > 20 and not _brecha_notified:
            send_notification("⚠️ Brecha BCV vs Paralelo alta",
                              f"La brecha es de {brecha:.1f}%.\nBCV: Bs. {bcv:,.2f} | Paralelo: Bs. {paralelo:,.2f}")
            _brecha_notified = True
        elif brecha <= 20:
            _brecha_notified = False

    save_cache_rates(rates)
    save_today_historical_rate(
        bcv=rates.get("bcv"), paralelo=rates.get("parallel"),
        binance_p2p=rates.get("binance_p2p"), euro=rates.get("eur"),
    )
    _set_offline_mode(False)
    _update_history_tab()
    _do_conversion()

    QTimer.singleShot(REFRESH_MINUTES * 60 * 1000, refresh_rates)


def _on_rates_error(error_msg: str):
    global _is_loading
    _is_loading = False

    cache = load_cache_rates()
    if cache and cache.get("bcv") is not None:
        _rates = cache
        _converter_rates = {
            "bcv": cache.get("bcv"),
            "binance_p2p": cache.get("binance_p2p"),
            "eur": cache.get("euro"),
            "parallel": cache.get("paralelo"),
            "bcv_lunes": _bcv_lunes,
        }
        _set_offline_mode(True, cache.get("cached_at", ""))
        _update_rate_cards(cache)
        _update_converter_rate_labels()
        _update_spreads(cache.get("bcv"), cache.get("paralelo"))
        save_today_historical_rate(
            bcv=cache.get("bcv"), paralelo=cache.get("paralelo"),
            binance_p2p=cache.get("binance_p2p"), euro=cache.get("euro"),
        )
        _update_history_tab()
        _do_conversion()
    else:
        cols = c()
        _widgets.get("card_bcv", {}).get("rate_lbl", QLabel()).setText("Error")
        _widgets.get("card_parallel", {}).get("rate_lbl", QLabel()).setText("Error")
        _widgets.get("card_eur", {}).get("rate_lbl", QLabel()).setText("Error")
        _widgets.get("card_binance", {}).get("rate_lbl", QLabel()).setText("Error")
        _update_info_label(f"⚠ Error: {error_msg}")

    QTimer.singleShot(30000, refresh_rates)


# ─── UI Updates ────────────────────────────────────────────────

def _update_rate_cards(rates):
    def _upd(key, rate_key):
        card = _widgets.get(key)
        if not card:
            return
        val = rates.get(rate_key)
        fetched = rates.get("fetched_at")
        cols = c()
        if val is not None:
            card["rate_lbl"].setText(f"{val:,.2f}")
            card["usd_lbl"].setText(f"1 USD = {val:,.2f} Bs.")
        else:
            card["rate_lbl"].setText("—")
            card["usd_lbl"].setText("")
        ts = _format_time(fetched)
        card["time_lbl"].setText(f"🕐 {ts}" if ts else "")

    _upd("card_bcv", "bcv")
    _upd("card_parallel", "parallel")
    _upd("card_eur", "eur")
    _upd("card_binance", "binance_p2p")

    lc = _widgets.get("card_lunes")
    if lc:
        if _bcv_lunes is not None:
            lc["rate_lbl"].setText(f"{_bcv_lunes:,.2f}")
            lc["time_lbl"].setText(f"🕐 {_format_time(_bcv_lunes_updated_at)}" if _bcv_lunes_updated_at else "")
        else:
            lc["rate_lbl"].setText("—")


def _update_spreads(bcv, paralelo):
    _upd_spread("spread_bcv", bcv, paralelo)
    _upd_spread("cv_spread_bcv", bcv, paralelo)
    _upd_spread("spread_lunes", _bcv_lunes, paralelo)
    _upd_spread("cv_spread_lunes", _bcv_lunes, paralelo)


def _upd_spread(key, a, b):
    sp = _widgets.get(key)
    if not sp:
        return
    cols = c()
    if a and b and a > 0:
        diff = b - a
        pct = (diff / a) * 100
        sp["a_val"].setText(f"Bs. {a:,.2f}")
        sp["b_val"].setText(f"Bs. {b:,.2f}")
        bar_pct = min(pct / 30 * 100, 100)
        p = sp["bar_fill"].parent()
        pw = p.width() if p and p.width() > 0 else 200
        sp["bar_fill"].setFixedWidth(int(pw * bar_pct / 100))
        if pct > 15:
            bc = cols["highlight"]
        elif pct > 8:
            bc = cols["warning"]
        else:
            bc = cols["success"]
        sp["bar_fill"].setStyleSheet(f"background-color: {bc}; border-radius: 3px;")
        sp["diff_val"].setText(f"Bs. {diff:,.2f}")
        sp["diff_val"].setStyleSheet(f"font-size: 10px; font-weight: bold; color: {bc}; background: transparent;")
        sp["pct_val"].setText(f"{pct:.2f}%")
        sp["pct_val"].setStyleSheet(f"font-size: 10px; font-weight: bold; color: {bc}; background: transparent;")
        sp["container"].show()
    else:
        sp["container"].hide()


def _update_info_label(text):
    lbl = _widgets.get("info_label")
    if lbl:
        lbl.setText(text)


def _set_offline_mode(offline, cached_at=""):
    global _offline_mode
    _offline_mode = offline
    banner = _widgets.get("offline_banner")
    label = _widgets.get("offline_label")
    info = _widgets.get("info_label")
    if not banner or not label:
        return
    if offline:
        ts = ""
        if cached_at:
            try:
                dt = datetime.fromisoformat(str(cached_at).replace("Z", "+00:00"))
                ts = dt.strftime("%d/%m %I:%M %p")
            except (ValueError, TypeError):
                pass
        msg = "Sin conexion — Mostrando ultimas tasas"
        if ts:
            msg += f" ({ts})"
        label.setText(msg)
        banner.show()
        if info:
            info.setText("Las tasas se actualizaran cuando haya conexion")
    else:
        banner.hide()
        if info:
            info.setText("Las tasas se actualizan cada 25 minutos")


def _update_converter_rate_labels():
    labels = _widgets.get("conv_rate_labels", {})
    for key, lbl in labels.items():
        val = _converter_rates.get(key) if key != "bcv_lunes" else _bcv_lunes
        if val is not None:
            lbl.setText(f"Bs. {val:,.2f}")
        else:
            lbl.setText("—")


# ─── Converter ─────────────────────────────────────────────────

def _conv_select_rate(key):
    global _converter_selected
    _converter_selected = key
    _update_conv_ui()
    _do_conversion()


def _set_conv_mode(mode):
    global _converter_mode
    _converter_mode = mode
    _update_conv_ui()
    _do_conversion()


def _set_quick_amount(val):
    inp = _widgets.get("conv_amount")
    if inp:
        inp.setText(str(val))
    _do_conversion()


def _do_conversion():
    inp = _widgets.get("conv_amount")
    if not inp:
        return
    try:
        amt = inp.text().strip().replace(",", ".")
        if not amt:
            return
        amount = float(amt)
        if amount <= 0:
            return
    except ValueError:
        _widgets.get("result_from", QLabel()).setText("")
        _widgets.get("result_to", QLabel()).setText("Monto invalido")
        _widgets.get("result_info", QLabel()).setText("")
        return

    rate_key = _converter_selected
    rate = _converter_rates.get(rate_key) if rate_key != "bcv_lunes" else _bcv_lunes

    if rate is None or rate <= 0:
        _widgets.get("result_from", QLabel()).setText("")
        _widgets.get("result_to", QLabel()).setText("Tasa no disponible")
        _widgets.get("result_info", QLabel()).setText("")
        return

    mode = _converter_mode
    if mode == "usd_to_bs":
        result = amount * rate
        _widgets["result_from"].setText(f"${amount:,.2f} USD")
        _widgets["result_to"].setText(f"Bs. {result:,.2f}")
        _widgets["result_info"].setText(f"Tasa: 1 USD = Bs. {rate:,.2f}")
    else:
        result = amount / rate
        _widgets["result_from"].setText(f"Bs. {amount:,.2f}")
        _widgets["result_to"].setText(f"${result:,.2f} USD")
        _widgets["result_info"].setText(f"Tasa: Bs. {rate:,.2f} = 1 USD")


def _paste_from_clipboard():
    cb = QApplication.clipboard()
    text = cb.text()
    if text:
        cleaned = ""
        for ch in text:
            if ch.isdigit() or ch in ",.":
                cleaned += ch
            elif ch in (" ", "\n", "\r"):
                break
        if cleaned:
            inp = _widgets.get("conv_amount")
            if inp:
                inp.setText(cleaned)
            _do_conversion()


# ─── History ───────────────────────────────────────────────────

def _hist_select_date(date_key: str):
    global _hist_selected_date
    if _hist_selected_date == date_key:
        _hist_selected_date = None
    else:
        _hist_selected_date = date_key
    _update_history_tab()


def _hist_search_date():
    inp = _widgets.get("hist_date_input")
    if not inp:
        return
    raw = inp.text().strip()
    date_key = parse_date_from_display(raw)
    if date_key is None:
        return
    historical = get_historical_rates()
    if date_key not in historical:
        return
    global _hist_selected_date
    _hist_selected_date = date_key
    _update_history_tab()


def _clear_layout(widget):
    if widget.layout():
        while widget.layout().count():
            item = widget.layout().takeAt(0)
            if item and item.widget():
                item.widget().deleteLater()
    return widget.layout()


def _ensure_layout(widget):
    layout = _clear_layout(widget)
    if layout is None:
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(6)
    return layout


def _update_history_tab():
    cols = c()
    historical = get_historical_rates()
    sorted_dates = sorted(historical.keys(), reverse=True)
    last_5 = sorted_dates[:5]

    months = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
              "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

    chips = _widgets.get("hist_chips")
    if chips:
        cl = _clear_layout(chips)
        if cl is None:
            cl = QHBoxLayout(chips)
            cl.setContentsMargins(0, 0, 0, 0)

        if last_5:
            for dk in last_5:
                is_sel = dk == _hist_selected_date
                entry = historical.get(dk, {})
                is_today = dk == get_today_key()
                parts = dk.split("-")
                day = parts[2]
                mon = months[int(parts[1])]
                txt = f"{day}\n{mon}"
                if is_today:
                    txt = f"{day}\n¡Hoy!"
                btn = QPushButton(txt)
                btn.setStyleSheet(
                    f"background-color: {cols['accent'] if is_sel else cols['card']}; "
                    f"color: {cols['primary'] if is_sel else cols['secondary']}; "
                    f"border-radius: 6px; padding: 8px 12px; font-size: 9px; font-weight: bold;"
                )
                btn.clicked.connect(lambda checked=False, d=dk: _hist_select_date(d))
                cl.addWidget(btn)
                has_data = any([entry.get(k) for k in ("bcv", "paralelo", "binance_p2p", "euro")])
                if has_data:
                    dot = QLabel("●")
                    dot.setStyleSheet(f"color: {cols['success']}; font-size: 6px; background: transparent;")
                    cl.addWidget(dot)
        else:
            cl.addWidget(_ql("No hay fechas guardadas aun", f"font-size: 9px; color: {cols['muted']};"))
        cl.addStretch()

    # Detail card
    detail = _widgets.get("hist_detail_card")
    if detail:
        _clear_layout(detail)
        if _hist_selected_date and _hist_selected_date in historical:
            entry = historical[_hist_selected_date]
            dl = _ensure_layout(detail)
            dl.setContentsMargins(14, 12, 14, 12)

            hdr = QFrame()
            hdr.setStyleSheet("background: transparent;")
            hl = QHBoxLayout(hdr)
            hl.setContentsMargins(0, 0, 0, 0)
            hl.addWidget(_ql(f"📅 {format_date_key(_hist_selected_date)}",
                             f"font-size: 14px; font-weight: bold; color: {cols['primary']};"))
            if _hist_selected_date == get_today_key():
                hl.addWidget(_ql("  HOY", f"font-size: 8px; font-weight: bold; color: {cols['success']};"))
            if entry.get("manual"):
                hl.addWidget(_ql("  ✏️ Manual", f"font-size: 8px; color: {cols['muted']};"))
            hl.addStretch()

            close_btn = QPushButton("✕")
            close_btn.setStyleSheet(f"background: transparent; color: {cols['muted']}; font-size: 10px; border: none;")
            close_btn.clicked.connect(lambda: _hist_select_date(_hist_selected_date or ""))
            hl.addWidget(close_btn)
            dl.addWidget(hdr)

            for lbl, key, color in [
                ("BCV (Oficial)", "bcv", cols["success"]),
                ("Paralelo", "paralelo", cols["highlight"]),
                ("Binance P2P", "binance_p2p", cols["warning"]),
                ("Euro (BCV)", "euro", cols["info"]),
            ]:
                val = entry.get(key)
                row = QFrame()
                row.setStyleSheet(f"background-color: {cols['input_bg']}; border-radius: 4px;")
                rl = QHBoxLayout(row)
                rl.setContentsMargins(8, 6, 8, 6)
                rl.addWidget(_ql(f"●  {lbl}", f"font-size: 10px; color: {color if val else cols['muted']};"))
                rl.addStretch()
                val_text = f"Bs. {val:,.2f}" if val else "—"
                rl.addWidget(_ql(val_text, f"font-size: 12px; font-weight: bold; color: {color if val else cols['muted']};"))
                dl.addWidget(row)

            detail.show()
        else:
            detail.hide()

    # List
    lst = _widgets.get("hist_list")
    if lst:
        _clear_layout(lst)
        ll = _ensure_layout(lst)
        ll.setContentsMargins(0, 0, 0, 0)

        if not _hist_selected_date:
            if sorted_dates:
                for dk in sorted_dates:
                    entry = historical[dk]
                    card = QFrame()
                    card.setStyleSheet(f"background-color: {cols['card']}; border: 1px solid {cols['card_border']}; border-radius: 6px;")
                    cl2 = QVBoxLayout(card)
                    cl2.setContentsMargins(12, 8, 12, 8)

                    hdr2 = QFrame()
                    hdr2.setStyleSheet("background: transparent;")
                    hl2 = QHBoxLayout(hdr2)
                    hl2.setContentsMargins(0, 0, 0, 0)
                    hl2.addWidget(_ql(f"📅 {format_date_key(dk)}",
                                      f"font-size: 11px; font-weight: bold; color: {cols['primary']};"))
                    if entry.get("manual"):
                        hl2.addWidget(_ql("  ✏️ Manual", f"font-size: 8px; color: {cols['muted']};"))
                    hl2.addStretch()

                    view_btn = QPushButton("Ver detalle")
                    view_btn.setStyleSheet(
                        f"background-color: {cols['accent']}; color: {cols['primary']}; "
                        f"border-radius: 6px; padding: 4px 8px; font-size: 9px;"
                    )
                    view_btn.clicked.connect(lambda checked=False, d=dk: _hist_select_date(d))
                    hl2.addWidget(view_btn)
                    cl2.addWidget(hdr2)

                    rr = QFrame()
                    rr.setStyleSheet("background: transparent;")
                    rl = QHBoxLayout(rr)
                    rl.setContentsMargins(0, 4, 0, 0)
                    for lbl, key, color in [
                        ("BCV", "bcv", cols["success"]),
                        ("Paralelo", "paralelo", cols["highlight"]),
                        ("Binance", "binance_p2p", cols["warning"]),
                        ("Euro", "euro", cols["info"]),
                    ]:
                        col = QFrame()
                        col.setStyleSheet("background: transparent;")
                        cl3 = QVBoxLayout(col)
                        cl3.setContentsMargins(0, 0, 0, 0)
                        cl3.setSpacing(2)
                        cl3.addWidget(_ql(lbl, f"font-size: 8px; color: {cols['muted']};"))
                        val = entry.get(key)
                        vt = f"Bs. {val:,.2f}" if val else "—"
                        cl3.addWidget(_ql(vt, f"font-size: 10px; font-weight: bold; color: {color if val else cols['muted']};"))
                        rl.addWidget(col, stretch=1)
                    cl2.addWidget(rr)
                    ll.addWidget(card)
            else:
                ll.addWidget(_ql(
                    "No hay tasas historicas guardadas aun.\nSe guardaran automaticamente al obtener las tasas del dia.",
                    f"font-size: 9px; color: {cols['muted']};"))


# ─── Reminder ──────────────────────────────────────────────────

def _toggle_reminder(checked):
    global _reminder_enabled
    _reminder_enabled = checked
    save_config(reminder_enabled=checked)
    if checked:
        global _reminder_shown_this_friday
        _reminder_shown_this_friday = False
        _check_reminder()


def _start_reminder_check():
    def _check():
        if _reminder_enabled and not _reminder_shown_this_friday:
            _check_reminder()
        QTimer.singleShot(30000, _check)
    QTimer.singleShot(30000, _check)


def _check_reminder():
    now = datetime.now()
    if now.weekday() != 4:
        return
    cm = now.hour * 60 + now.minute
    if cm < 18 * 60 or cm > 18 * 60 + 30:
        return
    global _reminder_shown_this_friday
    _reminder_shown_this_friday = True


# ─── BCV Lunes Dialog ──────────────────────────────────────────

def _edit_bcv_lunes_dialog():
    from PySide6.QtWidgets import QMessageBox
    cols = c()

    dialog = QDialog()
    dialog.setWindowTitle("Editar BCV (Lunes)")
    dialog.setFixedSize(320, 200)
    dialog.setStyleSheet(f"background-color: {cols['bg']};")

    layout = QVBoxLayout(dialog)
    layout.setContentsMargins(20, 20, 20, 20)

    layout.addWidget(_ql("BCV (Lunes)", f"font-size: 14px; font-weight: bold; color: {cols['primary']};"))
    layout.addWidget(_ql("Ingresa la tasa publicada por el BCV para el lunes:",
                         f"font-size: 9px; color: {cols['secondary']};"))

    entry = QLineEdit()
    entry.setStyleSheet(f"background-color: {cols['input_bg']}; color: {cols['input_text']}; "
                        f"border: none; border-radius: 6px; padding: 8px; font-size: 18px; font-weight: bold;")
    if _bcv_lunes is not None:
        entry.setText(f"{_bcv_lunes:,.2f}")
    layout.addWidget(entry)

    btn_row = QFrame()
    btn_row.setStyleSheet("background: transparent;")
    bl = QHBoxLayout(btn_row)
    bl.setContentsMargins(0, 12, 0, 0)

    def on_save():
        raw = entry.text().strip().replace(",", ".")
        try:
            val = float(raw)
            if val > 0:
                if val > 500:
                    QMessageBox.warning(dialog, "Valor alto",
                                        f"La tasa ingresada es muy alta ({val:,.2f}). Verifica que sea correcta.")
                    return
                global _bcv_lunes, _bcv_lunes_updated_at
                _bcv_lunes = val
                _bcv_lunes_updated_at = datetime.now().isoformat()
                save_config(val)
                _update_rate_cards({"fetched_at": None})
                _update_converter_rate_labels()
                _update_spreads(_rates.get("bcv"), _rates.get("parallel"))
                _do_conversion()
            else:
                _bcv_lunes = None
                _bcv_lunes_updated_at = None
                save_config(0)
                _update_rate_cards({"fetched_at": None})
                _update_spreads(None, None)
        except (ValueError, TypeError):
            pass
        dialog.accept()

    def on_delete():
        global _bcv_lunes, _bcv_lunes_updated_at
        _bcv_lunes = None
        _bcv_lunes_updated_at = None
        save_config(0)
        _update_rate_cards({"fetched_at": None})
        _update_spreads(None, None)
        _update_converter_rate_labels()
        _do_conversion()
        dialog.accept()

    cancel_btn = QPushButton("Cancelar")
    cancel_btn.setStyleSheet(f"background-color: {cols['input_bg']}; color: {cols['secondary']}; border-radius: 6px; padding: 6px;")
    cancel_btn.clicked.connect(dialog.reject)
    bl.addWidget(cancel_btn)

    if _bcv_lunes is not None:
        del_btn = QPushButton("Borrar")
        del_btn.setStyleSheet(f"background-color: {cols['highlight']}; color: #ffffff; border-radius: 6px; padding: 6px;")
        del_btn.clicked.connect(on_delete)
        bl.addWidget(del_btn)

    save_btn = QPushButton("Guardar")
    save_btn.setStyleSheet(f"background-color: {cols['bcv_lunes']}; color: #ffffff; border-radius: 6px; padding: 6px;")
    save_btn.clicked.connect(on_save)
    bl.addWidget(save_btn)

    layout.addWidget(btn_row)
    entry.returnPressed.connect(on_save)
    dialog.exec()


# ─── Widget ────────────────────────────────────────────────────

_widget_window = None

def _toggle_widget():
    global _widget_enabled, _widget_window
    if _widget_window and _widget_window.isVisible():
        _widget_window.hide()
        _widget_enabled = False
    else:
        _show_widget()


def _show_widget():
    global _widget_enabled, _widget_window
    if not _widget_window:
        _widget_window = QWidget()
        _widget_window.setWindowTitle("Tasa del Dia")
        _widget_window.setWindowFlags(
            Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint
        )
        _widget_window.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, False)
        _widget_window.setFixedSize(260, 130)

        cols = c()
        _widget_window.setStyleSheet(f"background-color: {cols['card']}; border: 1px solid {cols['card_border']}; border-radius: 8px;")

        _widget_window._drag_pos = None

        def _widget_mouse_press(e):
            if e.button() == Qt.MouseButton.LeftButton:
                _widget_window._drag_pos = e.globalPosition().toPoint()

        def _widget_mouse_move(e):
            if _widget_window._drag_pos:
                delta = e.globalPosition().toPoint() - _widget_window._drag_pos
                _widget_window._drag_pos = e.globalPosition().toPoint()
                pos = _widget_window.pos() + delta
                screen = _widget_window.screen()
                if screen:
                    sg = screen.geometry()
                    pos.setX(max(sg.left(), min(pos.x(), sg.right() - _widget_window.width())))
                    pos.setY(max(sg.top(), min(pos.y(), sg.bottom() - _widget_window.height())))
                _widget_window.move(pos)

        def _widget_mouse_release(e):
            if e.button() == Qt.MouseButton.LeftButton:
                _widget_window._drag_pos = None

        _widget_window.mousePressEvent = _widget_mouse_press
        _widget_window.mouseMoveEvent = _widget_mouse_move
        _widget_window.mouseReleaseEvent = _widget_mouse_release

        layout = QVBoxLayout(_widget_window)
        layout.setContentsMargins(0, 0, 0, 0)

        header = QFrame()
        header.setStyleSheet(f"background-color: {cols['accent']}; border-radius: 0px;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(10, 4, 8, 4)
        hl.addWidget(_ql("📉  Tasa del Dia", f"font-size: 10px; font-weight: bold; color: {cols['primary']};"))
        hl.addStretch()
        close_btn = QLabel("✕")
        close_btn.setStyleSheet(f"font-size: 10px; font-weight: bold; color: {cols['muted']}; background: transparent;")
        close_btn.mousePressEvent = lambda e: _hide_widget()
        hl.addWidget(close_btn)
        layout.addWidget(header)

        body = QFrame()
        body.setStyleSheet("background: transparent;")
        bl = QVBoxLayout(body)
        bl.setContentsMargins(12, 8, 12, 4)

        bcv_row = QFrame()
        bcv_row.setStyleSheet("background: transparent;")
        brl = QHBoxLayout(bcv_row)
        brl.setContentsMargins(0, 0, 0, 0)
        brl.addWidget(_ql("🏛️  BCV", f"font-size: 10px; color: {cols['muted']};"))
        _w_bcv = _ql("—", f"font-size: 14px; font-weight: bold; color: {cols['success']};")
        brl.addWidget(_w_bcv, alignment=Qt.AlignRight)
        bl.addWidget(bcv_row)

        par_row = QFrame()
        par_row.setStyleSheet("background: transparent;")
        prl = QHBoxLayout(par_row)
        prl.setContentsMargins(0, 0, 0, 0)
        prl.addWidget(_ql("📈  Paralelo", f"font-size: 10px; color: {cols['muted']};"))
        _w_par = _ql("—", f"font-size: 14px; font-weight: bold; color: {cols['highlight']};")
        prl.addWidget(_w_par, alignment=Qt.AlignRight)
        bl.addWidget(par_row)

        footer = QFrame()
        footer.setStyleSheet("background: transparent;")
        fl = QHBoxLayout(footer)
        fl.setContentsMargins(12, 0, 12, 4)
        _w_time = _ql("", f"font-size: 8px; color: {cols['muted']};")
        fl.addWidget(_w_time)
        layout.addWidget(footer)
        layout.addWidget(body)

        _widgets["widget_bcv"] = _w_bcv
        _widgets["widget_par"] = _w_par
        _widgets["widget_time"] = _w_time

    _widget_window.show()
    _widget_enabled = True
    screen = _widget_window.screen()
    if screen:
        sg = screen.geometry()
        pos = _widget_window.pos()
        if pos.x() == 0 and pos.y() == 0:
            _widget_window.move(sg.right() - _widget_window.width() - 20,
                                sg.bottom() - _widget_window.height() - 60)
    if _rates:
        _update_widget_rates(_rates.get("bcv"), _rates.get("parallel"), _rates.get("fetched_at"))


def _hide_widget():
    global _widget_enabled, _widget_window
    if _widget_window:
        _widget_window.hide()
    _widget_enabled = False


def _update_widget_rates(bcv, paralelo, fetched_at=None):
    w_bcv = _widgets.get("widget_bcv")
    w_par = _widgets.get("widget_par")
    w_time = _widgets.get("widget_time")
    if not w_bcv:
        return
    w_bcv.setText(f"Bs. {bcv:,.2f}" if bcv is not None else "—")
    w_par.setText(f"Bs. {paralelo:,.2f}" if paralelo is not None else "—")
    if fetched_at:
        try:
            dt = datetime.fromisoformat(str(fetched_at).replace("Z", "+00:00"))
            w_time.setText(f"🕐 {dt.strftime('%d/%m %I:%M %p')}")
        except (ValueError, TypeError):
            pass
    else:
        w_time.setText("")


# ─── Auto Update ───────────────────────────────────────────────

def _check_updates_silent():
    try:
        result = check_for_updates()
        if result and result.get("has_update"):
            _show_update_dialog(result)
    except Exception:
        pass


def _show_update_dialog(result):
    import webbrowser
    cols = c()
    dialog = QDialog()
    dialog.setWindowTitle("Actualizacion disponible")
    dialog.setFixedSize(360, 220)
    dialog.setStyleSheet(f"background-color: {cols['bg']};")

    layout = QVBoxLayout(dialog)
    layout.setContentsMargins(20, 20, 20, 20)

    layout.addWidget(_ql("🚀 Nueva version disponible",
                         f"font-size: 14px; font-weight: bold; color: {cols['primary']};"))
    layout.addWidget(_ql(
        f"Version actual: {APP_VERSION}\nNueva version: {result.get('latest_version', '?')}",
        f"font-size: 10px; color: {cols['secondary']};"))

    if result.get("release_notes"):
        layout.addWidget(_ql(result["release_notes"][:200],
                             f"font-size: 8px; color: {cols['muted']};"))

    btn_row = QFrame()
    btn_row.setStyleSheet("background: transparent;")
    bl = QHBoxLayout(btn_row)
    bl.setContentsMargins(0, 12, 0, 0)

    def _download():
        url = result.get("download_url", result.get("release_url", ""))
        if url:
            webbrowser.open(url)
        dialog.accept()

    dl_btn = QPushButton("📥 Descargar")
    dl_btn.setStyleSheet(f"background-color: {cols['info']}; color: #ffffff; border-radius: 6px; padding: 6px;")
    dl_btn.clicked.connect(_download)
    bl.addWidget(dl_btn)

    later_btn = QPushButton("Recordar despues")
    later_btn.setStyleSheet(f"background-color: {cols['input_bg']}; color: {cols['secondary']}; border-radius: 6px; padding: 6px;")
    later_btn.clicked.connect(dialog.reject)
    bl.addWidget(later_btn)

    layout.addWidget(btn_row)
    dialog.exec()


# ─── System Tray ───────────────────────────────────────────────

def _restore_from_tray():
    for w in QApplication.topLevelWidgets():
        if w.windowTitle() and "Tasa" in w.windowTitle():
            w.show()
            w.raise_()
            w.activateWindow()
            break


def _quit_from_tray():
    stop_tray()
    QApplication.instance().quit()
