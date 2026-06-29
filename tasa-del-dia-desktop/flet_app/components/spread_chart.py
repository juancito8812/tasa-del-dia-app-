"""Componente: card de brecha/spread con barra de progreso."""
import flet as ft
from .. import styles as S


def spread_card(title: str, diff: float | None, pct: float | None, color: str) -> ft.Container:
    bar_w = max(0.0, min(100.0, (pct or 0.0) * 2.0))
    return ft.Container(
        bgcolor=S.CARD_BG,
        border=ft.border.all(1, S.CARD_BORDER),
        border_radius=14,
        padding=12,
        content=ft.Column(
            controls=[
                ft.Row(
                    controls=[
                        ft.Text(title, color=S.TEXT_SECONDARY, size=12, weight="w600"),
                        ft.Text(f"{pct:.1f}%" if pct is not None else "", color=color, weight="w800"),
                    ],
                    alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                ),
                ft.Container(
                    height=4,
                    border_radius=2,
                    bgcolor=S.INPUT_BG,
                    content=ft.Container(width=bar_w, bgcolor=color, border_radius=2),
                ),
                ft.Text(
                    f"Diferencia: Bs. {diff:.2f}" if diff is not None else "",
                    color=S.TEXT_MUTED,
                    size=10,
                ),
            ],
            spacing=6,
        ),
    )
