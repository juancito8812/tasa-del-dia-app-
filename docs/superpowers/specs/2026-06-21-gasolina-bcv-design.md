# Gasolina (BCV) — Design

## Problem

Mostrar el precio equivalente en Bs de la gasolina (fijada en $0.50 USD/L) usando la tasa BCV, para 1L, 5L, 10L, 20L y 30L.

## Location

Al final del scroll en **RatesScreen**, después del bottom bar de brechas y hora de actualización.

## Layout

Un card con fondo `C.cardBg` y borde `C.cardBorder` (mismo estilo que los RateCard), con:

- Header: icono ⛽ y título "Gasolina (BCV)"
- Subtítulo: "$0.50 USD/L — Tasa BCV"
- Grid de 5 filas: cantidad en L → precio en Bs formateado con `toLocaleString('es-VE')`

## Data flow

- El precio por litro es fijo: `GASOLINE_USD = 0.50`
- Toma `data.tasaBCV` del state principal
- Calcula: `precioBs = litros * GASOLINE_USD * data.tasaBCV`
- Se actualiza automáticamente cada vez que se carga una nueva tasa BCV

## Implementation

- Código inline en `RatesScreen.js` (sin componente nuevo)
- Visible siempre que `data.tasaBCV != null`
- Sin estado adicional ni efectos nuevos

## Files affected

- `tasa-del-dia/src/screens/RatesScreen.js` (~+25 líneas)
