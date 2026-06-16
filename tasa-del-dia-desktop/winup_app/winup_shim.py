"""WinUp shim — reemplaza import winup con PySide6 puro.
Provee las mismas APIs (component, ui.Column, ui.Row, TabView, ScrollView, style)
sin depender del paquete winup.
"""

from PySide6.QtCore import QTimer, Qt
from PySide6.QtWidgets import (
    QWidget, QFrame, QHBoxLayout, QVBoxLayout,
    QTabWidget, QScrollArea, QSizePolicy,
)


def component(func):
    return func


class ui:
    @staticmethod
    def Column(*args, children=None, props=None, spacing=None, margins=None, style_cb=None):
        items = children if children is not None else list(args)
        spacing = spacing or 6
        f = QFrame()
        f.setStyleSheet("background: transparent;")
        l = QVBoxLayout(f)
        l.setSpacing(spacing)
        if margins:
            l.setContentsMargins(*margins)
        else:
            l.setContentsMargins(0, 0, 0, 0)
        for c in items:
            if isinstance(c, tuple):
                _add_with_stretch(l, c)
            elif callable(c):
                _add_with_stretch(l, c())
            else:
                _add_with_stretch(l, c)
        if style_cb:
            style_cb(f)
        return f

    @staticmethod
    def Row(*args, children=None, props=None, spacing=6, margins=None):
        items = children if children is not None else list(args)
        f = QFrame()
        f.setStyleSheet("background: transparent;")
        l = QHBoxLayout(f)
        l.setSpacing(spacing)
        if margins:
            l.setContentsMargins(*margins)
        else:
            l.setContentsMargins(0, 0, 0, 0)
        for c in items:
            if c is None:
                l.addStretch()
            elif isinstance(c, int):
                l.addSpacing(c)
            else:
                w = c() if callable(c) else c
                l.addWidget(w)
        return f

    @staticmethod
    def TabView(tabs, spacing=0):
        tw = QTabWidget()
        tw.setDocumentMode(True)
        tw.setStyleSheet("background: transparent;")
        items = tabs.items() if isinstance(tabs, dict) else tabs
        for label, content in items:
            if callable(content):
                content = content()
            tw.addTab(content, label)
        return tw

    @staticmethod
    def ScrollView(child, scrolly=True, props=None):
        sa = QScrollArea()
        sa.setWidgetResizable(True)
        sa.setFrameShape(QFrame.NoFrame)
        style_sheet = "QScrollArea { background: transparent; border: none; } QScrollBar:vertical { width: 4px; }"
        if props:
            css = "; ".join(f"{k}: {v}" for k, v in props.items())
            style_sheet += f" QScrollArea {{ {css} }}"
        sa.setStyleSheet(style_sheet)
        if scrolly:
            sa.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        else:
            sa.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        sa.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        w = child() if callable(child) else child
        sa.setWidget(w)
        return sa

    @staticmethod
    def Frame():
        f = QFrame()
        f.setStyleSheet("background: transparent;")
        return f

    @staticmethod
    def Label(text="", style=""):
        from PySide6.QtWidgets import QLabel
        lb = QLabel(text)
        if style:
            lb.setStyleSheet(style)
        return lb

    @staticmethod
    def Button(text, style="", on_click=None):
        from PySide6.QtWidgets import QPushButton
        btn = QPushButton(text)
        if style:
            btn.setStyleSheet(style)
        if on_click:
            btn.clicked.connect(on_click)
        return btn

    @staticmethod
    def Input(placeholder="", style=""):
        from PySide6.QtWidgets import QLineEdit
        inp = QLineEdit()
        inp.setPlaceholderText(placeholder)
        if style:
            inp.setStyleSheet(style)
        return inp

    @staticmethod
    def Checkbox(text="", checked=False, on_change=None):
        from PySide6.QtWidgets import QCheckBox
        cb = QCheckBox(text)
        cb.setChecked(checked)
        if on_change:
            cb.toggled.connect(on_change)
        return cb

    @staticmethod
    def Switch(checked=False, on_change=None):
        from PySide6.QtWidgets import QPushButton
        btn = QPushButton("ON" if checked else "OFF")
        btn.setCheckable(True)
        btn.setChecked(checked)
        if on_change:
            btn.toggled.connect(on_change)
        return btn

    @staticmethod
    def Slider(min_v=0, max_v=100, value=0, orientation="horizontal", on_change=None):
        from PySide6.QtWidgets import QSlider
        sl = QSlider(Qt.Horizontal if orientation == "horizontal" else Qt.Vertical)
        sl.setMinimum(min_v)
        sl.setMaximum(max_v)
        sl.setValue(value)
        if on_change:
            sl.valueChanged.connect(on_change)
        return sl

    @staticmethod
    def clear_layout(widget):
        if widget.layout():
            while widget.layout().count():
                item = widget.layout().takeAt(0)
                if item and item.widget():
                    item.widget().deleteLater()


class style:
    _current = "dark"
    _callbacks = []

    @staticmethod
    def init_app(app):
        pass

    @staticmethod
    def set_theme(mode):
        style._current = mode
        for cb in style._callbacks:
            cb(mode)

    @staticmethod
    def on_change(cb):
        style._callbacks.append(cb)

    @staticmethod
    def current():
        return style._current


def _add_with_stretch(layout, item):
    if item is None:
        layout.addStretch()
    elif isinstance(item, tuple):
        w, stretch = item
        actual = w() if callable(w) else w
        layout.addWidget(actual, stretch)
    else:
        actual = item() if callable(item) else item
        layout.addWidget(actual)
