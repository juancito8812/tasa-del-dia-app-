# Memory — Tasa del Día

> Última actualización: 06-Sep-2026

## Estado Actual

- **Versión:** 1.6.2 (versionCode 10602)
- **Rama:** `main`
- **Tests:** 439/439 passing (32 suites)
- **Lint:** 0 errors, 0 warnings
- **Typecheck:** 0 errores (`checkJs: true`)

## Features Activos

| Feature | Estado | Archivos clave |
|---------|--------|----------------|
| Tasas en vivo (BCV, Paralelo, Euro, Binance P2P) | ✅ | `api.js`, `useRatesData.js` |
| Conversor Bs/USD | ✅ | `useConverterData.js`, `ConverterScreen.js` |
| Historial 900+ registros | ✅ | `useHistoryData.js`, `HistoryScreen.js` |
| Selector UI (Original/Terminal/Editorial) | ✅ | `ui/index.js`, `ThemeContext.js` |
| Auto-update desde GitHub | ✅ | `autoUpdate.js`, `UpdateModal.js` |
| Datos Bancarios (CRUD + búsqueda bancos) | ✅ | `bankData.js`, `BankDataScreen.js`, `BankAccountForm.js` |
| PayPal Calculator (5.4% + $0.30) | ✅ | `paypalFees.js`, `PayPalCalculatorScreen.js` |

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
│   └── BankAccountForm.js       # Bottom sheet, 3 secciones digitales
├── services/
│   ├── api.js                   # DolarApi + Binance P2P
│   ├── autoUpdate.js
│   ├── bankData.js              # CRUD + cache 24h + sanitizeId()
│   └── notifications.js
├── hooks/
│   ├── useRatesData.js          # SWR + pub/sub BCV Lunes
│   ├── useConverterData.js      # calcSpread() DRY, useMemo
│   └── useHistoryData.js
├── constants/
│   ├── banks.js                 # 19 bancos venezolanos
│   ├── documentTypes.js
│   └── paypalFees.js            # 2 tipos tarifa (5.4% + $0.30)
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

## BankAccountForm — Secciones Digitales

| Sección | Campos |
|---------|--------|
| Zelle | email |
| PayPal | email |
| Binance | wallet address, email, binance ID |

Transferencia usa selector de banco con búsqueda independiente.

## Build & Release

- **NUNCA** usar `gradlew assembleRelease` (firma diferente)
- Siempre usar `eas build --local` con EXPO_TOKEN
- SHA-256 keystore EAS: `299073e3f85f9fc471298bc9d3e61f3c207a5dd0b406ec1d1ffc3ede37e528eb`
- `newArchEnabled: true` en app.config.js (Reanimated 4.x lo requiere)
- Git identity: `git config user.name "juancito8812"` / `git config user.email "juancito8812@users.noreply.github.com"`

## Gotchas

- `expo-file-system` v19: usar SIEMPRE `expo-file-system/legacy` para `cacheDirectory`/`createDownloadResumable`/`getContentUriAsync`
- `React.memo(function X() {...})` rompe inferencia de props en `checkJs`. Usar: `function X() {...} export default React.memo(X)`
- Hooks (`useMemo`) nunca después de early returns (rules-of-hooks)
- Para que `React.memo` sirva, handlers pasados como props deben ser `useCallback`
- `ThemeContext` ya memoiza todo (`colors`/`value` estables)
- Reanimated 4.x **congela** los objetos `Animated.Value` de RN — no se puede usar `new Animated.Value()` ni `scrollOffset.setValue()`
- `landmark` no existe en Ionicons — usar `business` para iconos de banco/institución
- Servidor Expo en tunnel mode: `npx expo start --tunnel`
- Puerto 8081 para desarrollo local

## Pendientes

1. Opcional: DownloadManager nativo para descarga que sobreviva cierre
2. Opcional: Migrar AnimatedNumber a Reanimated (hilo UI)
3. Opcional: Test defensivo de `gradlew assembleRelease` en CI
