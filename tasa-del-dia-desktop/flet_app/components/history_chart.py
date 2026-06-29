"""Componente: mini gráfico histórico (placeholder simple para Flet)."""
import flet as ft
from .. import styles as S


def history_chart(points: list[float] | None = None) -> ft.Container:
    data = points or []
    if len(data) < 2:
        return ft.Container(
            bgcolor=S.CARD_BG,
            border_radius=14,
            padding=14,
            content=ft.Text("Sin datos suficientes para graficar", color=S.TEXT_MUTED, size=12),
        )
    min_v = min(data)
    max_v = max(data)
    rng = max_v - min_v or 1
    h = 120
    w = 260
    step = w / max(1, len(data) - 1)
    pts = []
    for idx, v in enumerate(data):
        x = idx * step
        y = h - ((v - min_v) / rng) * h
        pts.append(ft.LineChartPoint(x=x, y=y))

    series = ft.LineChartSeries(
        points=pts,
        stroke_width=2,
        color=S.ACCENT,
        curved=True,
    )
    chart = ft.LineChart(
        data_series=[series],
        min_x=0,
        max_x=w,
        min_y=0,
        max_y=h,
        height=140,
        bgcolor=S.CARD_BG,
        border=ft.border.all(1, S.CARD_BORDER),
        expand=True,
    )
    return chart
