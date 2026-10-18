# Plan por fases — Q1 (duplicación de temas) y Q2 (archivos gigantes)

**Estado: ✅ CERRADO y mergeado** — implementado en la rama `refactor/q1-q2-stylefactory`, PR [#11](https://github.com/juancito8812/tasa-del-dia-app-/pull/11), merge `4e96c34`, publicado como **v1.6.10** (18-oct-2026).
Este documento queda como registro del plan y de sus resultados; el estado vigente del código está en [`docs/architecture.md`](docs/architecture.md).

## Contexto original

`src/ui/{terminal,editorial,fintech}/` eran copias de `src/screens` y `src/components`. Diffs vs. base en la foto inicial: `terminal/ConverterScreen` **566**, `terminal/RateCard` **485**, `terminal/RatesScreen` **331**, `fintech/RateCard` 259, `editorial/RateCard` 198. La lógica YA estaba compartida (hooks/utils/servicios); solo se duplicaban JSX y estilos.

## Estrategia aplicada: style-factory por tema

Un componente por concepto que resuelve sus diferencias desde un mapa `THEME_STYLES` co-locado, indexado por `useTheme().uiStyle`, en vez de un archivo copiado. Los tokens hardcodeados (p. ej. los degradados de `ScreenContainer`) se movieron a la paleta de cada tema.

## Fase 1 — Casi-duplicados (bajo riesgo, alto retorno) ✅

Unificados `ScreenContainer` (degradados → `screenGradient` en cada paleta), `BCVModal`, `UpdateModal`, `HistoryChart`, `DateDetailCard`, `HistoryScreen`.
**Resultado:** las copias de esos 6 conceptos en los 3 temas se borraron.

## Fase 2 — Pantallas medianas ✅

`RatesScreen` (27/50), `RateCard` (198/259), `RatesHeader`, `ConverterScreen` (174/203) unificados con `THEME_STYLES`. El JSX divergía poco; las diferencias eran de estilo.
**Resultado:** los 4 estilos comparten un único archivo por pantalla/componente.

## Fase 3 — Terminal (layout genuinamente distinto) ✅

Terminal no se unificó a la fuerza: sus deltas (rows densas, fuentes mono, textos en mayúsculas, prompt `>`, tags `[BCV]/[PAR]/[BNC]/[EUR]/[LUN]`, radios a 0) viven como `variant`/tokens dentro del mismo componente. Único archivo que sigue siendo propio del estilo: `src/ui/terminal/CustomTabBar.js` (no es duplicación, su layout difiere).

## Q2 — Archivos gigantes ✅

| Archivo | Antes | Después | Extracción |
|---|---|---|---|
| `src/services/api.js` | 493 | **36** | `services/api/{network,rates,storage,history,aggregate}.js` + fachada de re-export (los imports no cambian) |
| `src/components/BankAccountForm.js` | 809 | **199** | `components/bank/{BankAccountFormConfig,BankAccountFormStyles,PersonalFields,PagoMovilFields,TransferenciaFields,DigitalFields,BankSearchField}.js` |
| `src/screens/PayPalCalculatorScreen.js` | 803 | **148** | subcomponentes `PayPal*` (`PayPalResultCard`, `PayPalBsPurchaseCard`, `PayPalAmountInput`, `PayPalCalculatorHeader`, `PayPalInfoCard`, `PayPalModeToggle`, `PayPalCalculatorScreenStyles`) + `utils/paypalCalculator.js` |

## Verificación del cierre

- **30 copias borradas** en `src/ui/{editorial,fintech,terminal}/` (10 conceptos × 3 temas).
- `git show --shortstat 4e96c34` → **76 archivos, +4.955 / −8.521 líneas**.
- `npx jest --forceExit` → **39 suites / 592 tests PASS**; `npx tsc --noEmit` → 0 errores; `npx eslint src --quiet` → limpio. CI del PR (#11) y de `main` en verde.
- Sin cambios de comportamiento: los tests de paridad por tema verifican que cada `uiStyle` siga aplicando su delta visual.
- No se tocó `package.json` desde los agentes; el único pendiente derivado se separó a un issue propio (`npm audit fix` sin `--force`, issue #12).
