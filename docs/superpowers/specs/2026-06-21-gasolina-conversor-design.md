# Gasolina (Conversor) — Design

## Problem

Agregar en la pestaña Conversor un campo para ingresar litros de gasolina y obtener el costo en Bs usando la tasa BCV ($0.50 USD/L fijo).

## Location

En `ConverterScreen.js`, al final del scroll, después de las tarjetas de brecha.

## Layout

Un card con mismo estilo que spreadCard, con:
- Header: icono ⛽ y "Gasolina"
- Input numérico para litros (con decimales)
- Resultado en Bs formateado
- Copiable al portapapeles

## Data flow

- `GASOLINE_USD = 0.50`
- Toma `rates.bcv` del state principal
- `precioBs = litros * GASOLINE_USD * rates.bcv`

## Files affected

- `tasa-del-dia/src/screens/ConverterScreen.js` (~+30 líneas, antes del cierre del ScrollView)
