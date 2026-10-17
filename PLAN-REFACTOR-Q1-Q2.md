# Plan por fases — Q1 (duplicación de temas) y Q2 (archivos gigantes)

Pendiente por decisión de alcance. Cada fase es independiente, verificable con los 560 tests
existentes + revisión visual en dispositivo. No reescribir todo de golpe.

## Contexto
`src/ui/{terminal,editorial,fintech}/` son copias de `src/screens` y `src/components`. Diffs vs. base:
terminal/ConverterScreen **566**, terminal/RateCard **485**, terminal/RatesScreen **331**,
fintech/RateCard 259, editorial/RateCard 198. La lógica YA está compartida (hooks/utils/servicios);
solo se duplica el JSX/estilos.

## Estrategia: style-factory por tema
Cada tema ya expone `palette.js` con tokens. El objetivo es **un componente por concepto** que
reciba sus estilos desde el tema (registro ya existente en `src/ui/index.js`), en vez de un archivo
copiado. Los tokens que hoy están hardcodeados (p. ej. los degradados de `ScreenContainer`) se mueven
a la paleta.

## Fase 1 — Casi-duplicados (bajo riesgo, alto retorno)
Archivos que difieren solo en colores/rutas (~7–15 líneas):
- `ScreenContainer` (editorial/fintech): mover los 2 degradados a cada paleta.
- `BCVModal`, `UpdateModal`, `HistoryChart`, `DateDetailCard` (editorial/fintech).
- `HistoryScreen` (editorial 15, fintech 55): unificar con estilo por tokens.
Entregable: borrar 5–8 archivos copiados. Verificación: UI idéntica + tests verdes.

## Fase 2 — Pantallas medianas (editorial/fintech)
`RatesScreen` (27/50), `ConverterScreen` (174/203), `RateCard` (198/259):
extraer el `createStyles(C)` a la paleta de cada tema y usar un único componente con
`theme.uiStyle`. El JSX diverge poco; las diferencias son de estilo.

## Fase 3 — Terminal (layout genuinamente distinto)
Diferencias de 300–566 líneas: es un lenguaje visual distinto (rows densas, fuentes mono).
NO unificar a la fuerza. Compartir solo los átomos sin layout (formato de número, estados de
carga) y mantener el layout propio detrás de un `variant`.

## Q2 — Archivos gigantes (independiente de Q1)
- `src/components/BankAccountForm.js` (809): extraer `TextField`, `BankPicker`, `SegmentedControl`, `ChipGroup`.
- `src/screens/PayPalCalculatorScreen.js` (801): extraer `PaypalResultCard`, `BsPurchaseCard`.
- `src/services/api.js` (490): dividir en `ratesApi.js` / `cache.js` / `history.js` re-exportando
  desde `api.js` para no tocar los imports actuales.
