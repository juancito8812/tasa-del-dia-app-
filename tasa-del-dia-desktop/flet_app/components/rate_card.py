"""Componente: card de tasa individual (estilo Win11 glass)."""
import flet as ft
from .. import styles as S


def rate_card(title: str, rate: float | None, color: str, icon: str, updated_at: str | None = None) -> ft.Container:
    bg = ft.Container(
        bgcolor=S.CARD_BG,
        border=ft.border.all(1, S.CARD_BORDER),
        border_radius=16,
        padding=14,
        content=ft.Column(
            controls=[
                ft.Row(
                    controls=[
                        ft.Container(
                            width=28,
                            height=28,
                            border_radius=8,
                            bgcolor=S.INPUT_BG,
                            content=ft.Icon(name=icon, color=color, size=14),
                        ),
                        ft.Text(title, color=S.TEXT_SECONDARY, size=12, weight="w600"),
                    ],
                    spacing=8,
                ),
                ft.Container(
                    padding=ft.Padding.only(top=8, bottom=4),
                    content=ft.Text(
                        f"Bs. {rate:.2f}" if rate is not None else "—",
                        color=S.TEXT_PRIMARY,
                        size=22,
                        weight="w800",
                    ),
                ),
                ft.Text(updated_at or "", color=S.TEXT_MUTED, size=10),
            ],
            spacing=0,
        ),
    )
    return bg
