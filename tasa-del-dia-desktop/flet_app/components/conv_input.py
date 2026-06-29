"""Componente: input del conversor con botones rápidos."""
import flet as ft
from .. import styles as S


def conv_input(ctrl: dict, on_convert, on_paste, on_quick) -> ft.Container:
    amount = ft.TextField(
        value="100",
        text_size=20,
        border=ft.InputBorder.NONE,
        text_style=ft.TextStyle(weight="w600", color=S.TEXT_PRIMARY),
        on_submit=lambda e: on_convert(),
        bgcolor=S.INPUT_BG,
    )
    ctrl["conv_amount"] = amount

    paste = ft.TextButton(
        content=ft.Text("📋 Pegar", color=S.TEXT_MUTED, size=11, weight="w600"),
        on_click=lambda e: on_paste(),
    )
    ctrl["paste_btn"] = paste

    row = ft.Row(
        controls=[
            ft.Container(
                content=ft.Row([amount, paste], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                bgcolor=S.INPUT_BG,
                border_radius=10,
                padding=10,
            )
        ]
    )

    chips = ft.Row(
        controls=[
            ft.ElevatedButton(
                content=ft.Text(str(v), color=S.TEXT_SECONDARY, weight="w600"),
                bgcolor=S.INPUT_BG,
                style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=10), padding=8),
                on_click=lambda e, val=v: on_quick(val),
            )
            for v in [100, 500, 1000, 5000, 10000, 50000]
        ],
        spacing=6,
        wrap=True,
    )

    btn = ft.ElevatedButton(
        content=ft.Text("💱 Convertir", color=S.TEXT_PRIMARY, weight="w700", size=14),
        bgcolor=S.ACCENT,
        style=ft.ButtonStyle(shape=ft.RoundedRectangleBorder(radius=10), elevation=3),
        on_click=lambda e: on_convert(),
        width=220,
    )
    ctrl["conv_btn"] = btn

    return ft.Container(
        content=ft.Column(controls=[row, chips, btn], spacing=10),
        padding=8,
    )
