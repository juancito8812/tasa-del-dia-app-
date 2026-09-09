# Memory — Tasa del Día

> Última actualización: 08-Sep-2026

## Estado Actual

- **Versión:** 1.6.4 en producción (versionCode 10604) · v1.6.5 pendiente
- **Rama:** `main` (6 commits nuevos desde v1.6.3: f44ee74, e4170be, 048e319, 2bbea56, 9277b9c, 76cf61d + merge-bot)
- **Tests:** 475/475 passing (32 suites)
- **Lint:** 0 errors, 0 warnings
- **Typecheck:** 0 errores (`checkJs: true`)
- **Seguridad:** reviews completadas (06-07-sep-2026): security-review del diff + full-app → 0 vulnerabilidades explotables; code-review-and-quality (5 ejes) del feature → Aprobado. 2 notas "needs verification" pendientes de decisión (rangos de plausibilidad para tasas del API, `allowBackup=true` con datos bancarios en backups de nube)

## Features Activos

| Feature | Estado | Archivos clave |
|---------|--------|----------------|
| Tasas en vivo (BCV, Paralelo, Euro, Binance P2P) | ✅ | `api.js`, `useRatesData.js` |
| Conversor Bs/USD | ✅ | `useConverterData.js`, `ConverterScreen.js` |
| Historial 900+ registros | ✅ | `useHistoryData.js`, `HistoryScreen.js` |
| Selector UI (Original/Terminal/Editorial) | ✅ | `ui/index.js`, `ThemeContext.js` |
| Auto-update desde GitHub | ✅ | `autoUpdate.js`, `UpdateModal.js` |
| Datos Bancarios (CRUD + 6 métodos de pago) | ✅ | `bankData.js`, `BankDataScreen.js`, `BankAccountForm.js` |
| PayPal Calculator (5.4% + $0.30) | ✅ | `paypalFees.js`, `PayPalCalculatorScreen.js` |
| Pagar compras en BS (tarjeta en pestaña PayPal) | ✅ | `calculateBsPurchase()` en `paypalFees.js`, `PayPalCalculatorScreen.js` |

## Stack

- React Native 0.81 + Expo SDK 54
- Reanimated 4.x (useSharedValue, withSpring, useAnimatedStyle)
- AsyncStorage (local, sin cloud sync)
- PagerView + CustomTabBar (sin react-navigation)
- DolarApi.com + Binance P2P directo
- 3 paquetes UI: Original, Terminal, Editorial

## Estructura de Pestañas

| Índice | Pestaña | Icono |
|--------|---------|-------|
| 0 | Tasas | chart |
| 1 | Conversor | swap |
| 2 | Datos Bancarios | card |
| 3 | PayPal Calculator | logo-paypal |
| 4 | Historial | time |

## Archivos Clave

```
src/
├── screens/
│   ├── RatesScreen.js
│   ├── ConverterScreen.js
│   ├── BankDataScreen.js
│   ├── PayPalCalculatorScreen.js
│   └── HistoryScreen.js
├── components/
│   ├── RateCard.js
│   ├── CustomTabBar.js          # Reanimated 4.x
│   ├── BankAccountCard.js
│   └── BankAccountForm.js       # Bottom sheet, 6 secciones digitales (Zelle/PayPal/Binance/Facebank/Zinli/Wally)
├── services/
│   ├── api.js                   # DolarApi + Binance P2P
│   ├── autoUpdate.js
│   ├── bankData.js              # CRUD + cache 24h + sanitizeId() + formatAccountText/formatSectionText + has* helpers
│   └── notifications.js
├── hooks/
│   ├── useRatesData.js          # SWR + pub/sub BCV Lunes
│   ├── useConverterData.js      # calcSpread() DRY, useMemo
│   └── useHistoryData.js
├── constants/
│   ├── banks.js                 # 19 bancos venezolanos
│   ├── documentTypes.js
│   └── paypalFees.js            # tarifas (5.4% + $0.30) + calculateBsPurchase (Pagar compras en BS)
├── context/
│   └── ThemeContext.js           # 3 UI styles, dark/light/system
└── ui/
    ├── index.js                 # getUiPackage(uiStyle)
    ├── terminal/
    └── editorial/
```

## Datos de PayPal (Venezuela, 2026)

| Tipo | Fórmula | Modo |
|------|---------|------|
| Recibir pago | 5.4% + $0.30 | Para enviar |
| Enviar pago | 5.4% + $0.30 | Para recibir |

**Fórmulas:**
- Para recibir (net → gross): `gross = (net + $0.30) / (1 - 5.4%)`
- Para enviar (gross → net): `net = gross × (1 - 5.4%) - $0.30`
- Fuente: vendercomprardolares.com

**Pagar compras en BS** (`calculateBsPurchase(montoBs, tasaCambio)`): cadena sin redondeos intermedios salvo el pago exacto (round2, alimenta el ceil) y el vuelto (round2):
- `netoUsd = montoBs / tasaCambio`
- `pagoExactoUsd = round2((netoUsd + $0.30) / (1 - 5.4%))` ← monto a transferir
- `pagoRecomendadoUsd = Math.ceil(pagoExactoUsd)` → `comision = recom × 5.4% + $0.30` → `netoRecibido = recom − comision`
- `equivalenteBs = netoRecibido × tasa` → `vueltoBs = round2(equivalenteBs − montoBs)`
- Ejemplo: 1000 Bs @ 37.5 → transferir **$28.51** · recomendado $29 · vuelto Bs 17.52
- Devuelve `null` con inputs ≤ 0 o no finitos. Edge: el round2 del pago exacto puede dejar vuelto levemente negativo (centavos)

## BankAccountForm — Secciones Digitales

| Sección | Campos |
|---------|--------|
| Zelle | email |
| PayPal | email |
| Binance | wallet address, email, binance ID |
| Facebank | email, account |
| Zinli | email |
| Wally | email |

Transferencia usa selector de banco con búsqueda independiente.

## Build & Release

- **NUNCA** usar `gradlew assembleRelease` (firma diferente)
- Siempre usar `eas build --local` con EXPO_TOKEN
- SHA-256 keystore EAS: `299073e3f85f9fc471298bc9d3e61f3c207a5dd0b406ec1d1ffc3ede37e528eb`
- `newArchEnabled: true` en app.config.js (Reanimated 4.x lo requiere)
- `app.config.js` (`const VERSION`) es la fuente de la versión; los workflows la bump-ean vía sed. ⚠️ `package.json` quedó en 1.6.1 (inconsistencia conocida, cosmética)
- APK debug standalone: `debuggableVariants = []` + `applicationIdSuffix ".debug"` en `android/app/build.gradle` — corre sin Metro y convive con producción (ver Gotchas)
- **APK release v1.6.4:** `TasaDelDia-v1.6.4.apk` (76 MB, firma EAS verificada) — publicada en GitHub Releases el 08-Sep-2026 via workflow_dispatch (run 34278668785, 21:06→21:27 UTC). Changelog generado con 8 entradas desde v1.6.3. ~~APK tester compartible~~ deshecho: la release oficial lo reemplaza (la debug era solo para validación interna).
- **APK debug standalone (deshecho):** `TasaDelDia-v1.6.3-debug-tester.apk` (118 MB) quedó solo en disco como artefacto de la sesión de validación — nunca entró a git (`*.apk` en `.gitignore`). La release v1.6.4 lo hace obsoleto:users deben desinstalar la debug para instalar la EAS (firmas distintas).
- **Build.gradle generado corregido** en sesión: el `android/app/build.gradle` (gitignored, prebuild) decía v1.4.6/10406 de un prebuild viejo → ahora 1.6.3/10603, consistente con `app.config.js` al momento del bump
- Git identity: `git config user.name "juancito8812"` / `git config user.email "juancito8812@users.noreply.github.com"`

## Gotchas

- APK debug standalone (sin Metro): `debuggableVariants = []` dentro del bloque `react {}` de `android/app/build.gradle` embebe el bundle JS en la APK (por defecto RN salta el bundling en debug). El sufijo `applicationIdSuffix ".debug"` en `buildTypes.debug` permite instalarla junto a la de producción. Tras cambios de JS: recompilar con `./gradlew assembleDebug`. `android/` es generado (gitignore) — editarlo con `sed`/heredoc, y `expo prebuild --clean` borra estos cambios

- `expo-file-system` v19: usar SIEMPRE `expo-file-system/legacy` para `cacheDirectory`/`createDownloadResumable`/`getContentUriAsync`
- `gradlew clean` está ROTO en este proyecto (quirk CMake/codegen RN) — si hace falta un build limpio, borrar `android/app/build` a mano
- Reducir tamaño de APK debug: `abiFilters` y packaging excludes NO remueven las libs prebuilt de los AARs de RN 0.81 (quedan stubs) — full-ABI (118 MB) es el estado aceptado; si el tamaño importa de verdad, usar buildType `release` con keystore debug
- `React.memo(function X() {...})` rompe inferencia de props en `checkJs`. Usar: `function X() {...} export default React.memo(X)`
- Hooks (`useMemo`) nunca después de early returns (rules-of-hooks)
- Para que `React.memo` sirva, handlers pasados como props deben ser `useCallback`
- `ThemeContext` ya memoiza todo (`colors`/`value` estables)
- Reanimated 4.x **congela** los objetos `Animated.Value` de RN — no se puede usar `new Animated.Value()` ni `scrollOffset.setValue()`
- `landmark` no existe en Ionicons — usar `business` para iconos de banco/institución
- Servidor Expo en tunnel mode: `npx expo start --tunnel`
- Puerto 8081 para desarrollo local

## Pendientes

1. **Siguiente release v1.6.5** — siguiente bump cuando haya nuevo feature/fix (flujo: `app.config.js` bump → commit → workflow de release)
2. Opcional: DownloadManager nativo para descarga que sobreviva cierre
3. Opcional: Migrar AnimatedNumber a Reanimated (hilo UI)
4. Opcional: Test defensivo de `gradlew assembleRelease` en CI
5. Opcional (seguridad, needs-verification pendientes de decisión): rango de plausibilidad para tasas del API antes de auto-llenar chips · excluir `@bank_accounts` de backups (`allowBackup`/`dataExtractionRules`)
6. Opcional (consistencia): alinear `package.json` (1.6.4) con `app.config.js` (1.6.4) — ambos en 1.6.4 tras el bump del release-bot
