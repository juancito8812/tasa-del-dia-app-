# Arquitectura — Tasa del Día

Documento técnico del repo. Explica cómo está organizado el código y, sobre todo, **cómo funcionan los 4 estilos de UI sobre un único set de componentes** (resultado del refactor Q1/Q2 de la v1.6.10).

App: `tasa-del-dia/` (React Native 0.81 + Expo SDK 54, Android). No es un monorepo de paquetes: el subdirectorio es la app.

## Capas

```
src/screens/      Pantallas (una por pestaña): Rates, Converter, BankData, PayPalCalculator, History
src/components/   Componentes reutilizables (RateCard, UpdateModal, ScreenContainer, bank/*, PayPal*, ...)
src/hooks/        Estado + acceso a datos: useRatesData, useConverterData, useHistoryData
src/services/     Servicios: api (fachada) + api/*, autoUpdate, bankData, notifications, backgroundTasks
src/context/      ThemeContext, RatesContext, DistributionContext
src/constants/    banks.js, documentTypes.js, paypalFees.js
src/utils/        Helpers puros (paypalCalculator, fechas, formato)
src/ui/           Sistema de estilos por tema (ver abajo)
```

Regla dura: **la lógica de negocio nunca se duplica por tema.** Hooks, servicios y utils son únicos; solo cambia la capa visual.

## Sistema de estilos (`src/ui/`)

La app ofrece 4 estilos seleccionables: `original`, `terminal`, `editorial`, `fintech` (preferencia persistente, botón en el header).

### Registro

`src/ui/index.js` es el **único** punto de mapeo estilo → componentes. Expone `UI_STYLES` y `getUiPackage(uiStyle)`, que devuelve `{ Screens, TabBar, ScreenContainer, UpdateModal }`.

Desde Q1, las 4 entradas apuntan **a los mismos archivos compartidos** (`src/screens/*`, `src/components/*`). Lo único específico por estilo que sobrevive:

- `src/ui/original` → no tiene carpeta: usa `src/constants/themes.js`.
- `src/ui/editorial/palette.js`, `src/ui/fintech/palette.js`, `src/ui/terminal/palette.js` → paletas (dark + light).
- `src/ui/fintech/fonts.js` → `FintechFontsProvider` + `useFintechFonts` (Space Grotesk / JetBrains Mono).
- `src/ui/terminal/CustomTabBar.js` → la tab bar de Terminal es un componente propio (no duplicación: su layout difiere).

Antes de Q1 había una copia completa de cada pantalla/componente en `src/ui/{terminal,editorial,fintech}/` (30 archivos, todos eliminados en v1.6.10).

### Patrón `THEME_STYLES`

Cada componente compartido con diferencias por tema declara un mapa co-locado con el componente (no hay módulo central de tokens, para evitar contención de escritura y porque se revisa mejor):

```js
// Deltas visuales por estilo. Solo lo que difiere del estilo `original`.
const THEME_STYLES = {
  original: {},
  editorial: {},
  fintech: { fonts: true, styles: { sheet: { borderRadius: 18 }, title: { fontWeight: '600' } } },
  terminal: { variant: 'terminal', prompt: '>', styles: { /* sin radios, mayúsculas */ } },
};

const t = THEME_STYLES[useTheme().uiStyle] ?? {};
```

Componentes que lo usan: `RateCard`, `RatesHeader`, `BCVModal`, `HistoryScreen`, `HistoryChart`, `DateDetailCard`, `ConverterScreen`, `UpdateModal`.

Reglas del patrón:

1. **El base (`original`) es la fuente de verdad** de lógica, props de accesibilidad y bug fixes. Si una copia de tema divergía, esa divergencia se descarta: solo se conservan deltas visuales deliberados (radios, pesos y tamaños de fuente, colores semánticos elegidos a mano, familias tipográficas).
2. Los valores que no se expresan con tokens simples (p. ej. colores de serie monocromos de un chart) se agregan como tokens del mapa y se cubren con un test.
3. `THEME_STYLES[useTheme().uiStyle] ?? {}`: `useTheme()` tiene default seguro (`uiStyle: 'original'`), así que un componente compartido renderiza fuera del provider sin explotar.
4. Cada componente compartido tiene un **test de paridad**: renderiza bajo cada `uiStyle` y verifica que el delta realmente se aplique (`*.themes.test.js`).

### Fondos de pantalla y paletas

`screenGradient` vive en cada paleta como `{ colors: [...], locations: [...] }` — o `null`, que significa fondo sólido `C.primary`. El `ScreenContainer` compartido es uno solo y lee la paleta activa; por eso los degradados que estaban hardcodeados en las copias terminaron en los tokens.

`ThemeContext` resuelve `{ theme, colors, themePref, setTheme, uiStyle, setUiStyle }` a partir de `themePref` (dark/light/system) × `uiStyle`, y expone `PALETTES[uiStyle]`.

## Servicios: `api.js` como fachada

`src/services/api.js` (36 líneas) **re-exporta** todo lo que exportaba antes de Q2, para que los imports existentes no cambien:

```
src/services/api/network.js     → fetch base con timeout (AbortController)
src/services/api/rates.js       → BCV / paralelo / EUR / Binance P2P
src/services/api/storage.js     → cache local (AsyncStorage) y pub/sub de BCV Lunes
src/services/api/history.js     → histórico de tasas
src/services/api/aggregate.js   → fetchAllData y fallback offline
```

Si agregás una función de API, implementala en el módulo de dominio y **re-exportala desde la fachada**; no importes `services/api/*` directo desde pantallas ni hooks.

## Cómo agregar un estilo nuevo

1. Agregá la clave a `UI_STYLES` y su entrada en `PACKAGES` (`src/ui/index.js`).
2. Creá `src/ui/<estilo>/palette.js` (dark + light) con los mismos tokens que las otras paletas.
3. Si el estilo necesita tipografías propias, seguí el modelo de `ui/fintech/fonts.js` (provider + hook que degrada a `{}` fuera del provider).
4. Extendé los mapas `THEME_STYLES` de los componentes que deban verse distintos. **No crees copias de componentes.**
5. Corré `npx jest --forceExit` + `npx tsc --noEmit` + `npx eslint src --quiet`.

## Reglas de código

- **Tipado:** el código es `.js` plano pero `npx tsc --noEmit` lo typechequea (`checkJs: true`). Está **prohibido** usar sintaxis TS-only (`expr as T` → error TS8016 que además rompe Babel/jest). Usá el cast JSDoc: `/** @type {any} */ (expr)`. `LinearGradient` necesita sus arrays asertados (las paletas infieren `string[]`/`number[]`, el componente exige tuplas readonly).
- **Tamaño:** apuntá a < ~250 líneas por archivo. Los componentes compartidos con `THEME_STYLES` son la excepción legítima (`RateCard` ~710 líneas consolida lo que antes eran 4 archivos).
- **Verificación antes de push:** `npx jest --forceExit`, `npx tsc --noEmit`, `npx eslint src --quiet` en verde, y el job `test` del PR.
- **`src/ui/index.js` es un choke point:** se actualiza al final, cuando las copias ya se borraron y los importadores apuntan a los componentes compartidos.

## Tests

39 suites / 592 tests (`npx jest --forceExit`). Además de los tests por unidad hay tests estructurales:

- `src/ui/__tests__/registry.test.js` — el registro devuelve componentes válidos para los 4 estilos.
- `src/ui/__tests__/palettes.test.js` — todas las paletas exponen los mismos tokens.
- `src/ui/{terminal,editorial,fintech}/__tests__/components.test.js` — paridad por tema.
- `src/components/__tests__/*.themes.test.js` — el delta visual se aplica de verdad.

No hay un total "correcto" de tests: cada unificación agrega tests de paridad, así que el número crece a propósito. Se juzga salud por **suites en verde y 0 errores de tsc**, no por el total.
