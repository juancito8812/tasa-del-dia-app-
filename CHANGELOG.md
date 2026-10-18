# Changelog — Tasa del Día

Todos los cambios relevantes de la app Android (`com.tasadeldia.app`).
Versionado `major.minor.patch`; `versionCode = major*10000 + minor*100 + patch` (p. ej. 1.6.10 → 10610).

Las notas de cada release se publican además en [GitHub Releases](https://github.com/juancito8812/tasa-del-dia-app-/releases).

## [1.6.10] — 2026-10-18

### Changed
- **Q1 — fin de la duplicación de UI entre temas:** eliminadas **30 copias** de pantallas y componentes en `src/ui/{terminal,editorial,fintech}/`. Un único archivo por concepto (`RatesScreen`, `RateCard`, `RatesHeader`, `BCVModal`, `HistoryScreen`, `HistoryChart`, `DateDetailCard`, `ConverterScreen`, `UpdateModal`, `ScreenContainer`) sirve los 4 estilos mediante un mapa `THEME_STYLES` indexado por `useTheme().uiStyle`. Los estilos de tema que quedan son solo paletas, fuentes fintech y la `CustomTabBar` de Terminal.
- **Q2 — archivos gigantes divididos:** `services/api.js` (493 → 36 líneas) pasa a ser una fachada de re-export sobre `services/api/{network,rates,storage,history,aggregate}.js`; `BankAccountForm.js` (809 → 199) con subcomponentes en `components/bank/`; `PayPalCalculatorScreen.js` (803 → 148) con subcomponentes `PayPal*` y `utils/paypalCalculator.js`.
- Neto del merge: **76 archivos, +4.955 / −8.521 líneas**. Suite ampliada a **39 suites / 592 tests**.

### Added
- Tests de paridad por tema (renderizan cada `uiStyle` y verifican que el token visual realmente se aplique) y test del registro `src/ui/index.js`.

### Fixed
- Diferencias "fantasma" entre temas: las copias habían derivado (props de accesibilidad y fixes presentes solo en el base), ahora todas heredan el comportamiento del componente único.

## [1.6.9] — 2026-10-05

### Fixed
- Icono del BCV corregido (`landmark` → `business`: el primero no existe en Ionicons) en los 4 estilos.
- Estilo Fintech: tasa de Paralelo/Euro a 24px, alineada con las demás tarjetas medianas.
- Tarjetas bento de Fintech con alturas parejas (`flexGrow: 1`).
- +6 tests → 560/560.

## [1.6.8] — 2026-10-01

### Changed
- Sincronización automática de la versión en `package.json` durante las releases en CI.
- Eliminada la dependencia `@expo/ngrok` de producción.
- `AnimatedNumber` blindado para entornos de animación.

## [1.6.6] / [1.6.7] — 2026-10-01

### Added
- Nuevo estilo de diseño **Fintech** (paleta crema + vino granate, panel oscuro con BCV amarillo, tipografías Space Grotesk + JetBrains Mono).
- Compartir/enviar directo en Pago Móvil.

### Changed
- Modernización del CI.

## [1.6.4] — 2026-09-08

### Added
- Tarjeta **"Pagar compras en BS"** en la pestaña PayPal: monto exacto a transferir (USD) para cubrir una compra en Bs (5.4% + $0.30 incluido), chips de tasa en vivo (BCV/Paralelo/Binance), recomendación de entero superior y vuelto.
- Métodos de pago digital nuevos: Facebank (email + cuenta), Zinli (email) y Wally (email).
- Auto-update desde GitHub a partir de esta versión.

### Changed
- BankData: iconos Ionicons serios (sin emojis) en Pago Móvil / Transferencia / Zelle / PayPal / Binance.
- Formato de copia: sección individual compacta (sin etiquetas) y "copiar todo" con etiquetas.
- Limpieza de repo: 4 APKs huérfanas v1.4.x (292 MB), `logs/`, `temp_files/`, `dogfood-output/`; `.gitignore` endurecido.
- Release publicada vía `workflow_dispatch` (run 34278668785). Asset: `TasaDelDia-v1.6.4.apk` (~76 MB, firma EAS).

## [1.6.2] — 2026-09-06

### Fixed
- Fórmulas PayPal corregidas (5.4% + $0.30).

### Changed
- Sección Digital separada en Zelle / PayPal / Binance; Transferencia con selector de banco.
- Migración a Reanimated 4.x. CI: `newArchEnabled=true`, iconos Ionicons, fixes de TypeScript.

## [1.6.0] — 2026-09-05

### Added
- Pestaña **Datos Bancarios**: CRUD de cuentas con caché 24h.
- Pestaña **PayPal Calculator**: tarifa 5.4% + $0.30 y modos "Para recibir" / "Para enviar".

### Changed
- Refactor: `calcSpread()` DRY, `useMemo` en spreads, `sanitizeId()` por seguridad.

## [1.4.7] — 2026-08-20

### Fixed
- QA en Galaxy A12: BCV (Lunes) se refleja al instante en el Conversor sin reiniciar (pub/sub).
- Validación inline en vez de `Alert` nativo; decimales para montos < 1 (1,5 Bs → 0,0019 USD).
- El teclado ya no tapa los botones del modal; prefill con formato es-VE ("780,50"); las tarjetas sin acción ya no parecen botones.

## [1.4.6] — 2026-08

### Fixed
- El auto-update busca APKs que empiecen con `TasaDelDia*` (firma EAS correcta) en vez de cualquier `.apk`, previniendo el "No se instaló la app" por builds con firma debug.

### Verified
- Flujo end-to-end: v1.4.4 detecta v1.4.6 → modal → descarga → instalación nativa → v1.4.6 activa. Sin crashes ni loops.

## [1.4.4]

- Versión usada como base del test end-to-end del auto-update.

---

> Versiones anteriores a la 1.4.4 no están documentadas. El historial por commit está disponible en `git log` y el changelog de cada release en GitHub Releases.
