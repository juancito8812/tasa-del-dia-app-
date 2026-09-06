# Memory — Tasa del Día

> Última actualización: 05-Sep-2026

## Estado Actual

- **Versión:** 1.6.0 (versionCode 10600)
- **Rama:** `main`
- **Tests:** 444/444 passing (32 suites)
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
| Datos Bancarios (CRUD) | ✅ | `bankData.js`, `BankDataScreen.js` |
| PayPal Calculator (4 tarifas) | ✅ | `paypalFees.js`, `PayPalCalculatorScreen.js` |

## Stack

- React Native 0.81 + Expo SDK 54
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
| 3 | PayPal Calculator | logo-paypal / PP |
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
│   ├── CustomTabBar.js
│   ├── BankAccountCard.js
│   └── BankAccountForm.js
├── services/
│   ├── api.js              # 490+ líneas, múltiples responsabilidades
│   ├── autoUpdate.js
│   ├── bankData.js         # CRUD + cache 24h + sanitizeId()
│   └── notifications.js
├── hooks/
│   ├── useRatesData.js     # SWR + pub/sub BCV Lunes
│   ├── useConverterData.js # calcSpread() DRY, useMemo
│   └── useHistoryData.js
├── constants/
│   ├── banks.js            # 19 bancos venezolanos
│   ├── documentTypes.js
│   └── paypalFees.js       # 4 tipos tarifa + calculateNet/Gross
├── context/
│   └── ThemeContext.js      # 3 UI styles, dark/light/system
└── ui/
    ├── index.js             # getUiPackage(uiStyle)
    ├── terminal/
    └── editorial/
```

## Datos de PayPal (Venezuela, May 2026)

| Tipo | Fórmula |
|------|---------|
| Enviar amigos (internacional) | USD 4.99 + 3.4% + $0.30 |
| Recibir pago (conversión) | 3.50% |
| Enviar pago (conversión) | 4.50% |
| Vender (Bienes/Servicios) | 4.4% + $0.30 |

## Build & Release

- **NUNCA** usar `gradlew assembleRelease` (firma diferente)
- Siempre usar `eas build --local` con EXPO_TOKEN
- SHA-256 keystore EAS: `299073e3f85f9fc471298bc9d3e61f3c207a5dd0b406ec1d1ffc3ede37e528eb`
- Git identity: `git config user.name "juancito8812"` / `git config user.email "juancito8812@users.noreply.github.com"`

## Gotchas

- `expo-file-system` v19: usar SIEMPRE `expo-file-system/legacy` para `cacheDirectory`/`createDownloadResumable`/`getContentUriAsync`
- `React.memo(function X() {...})` rompe inferencia de props en `checkJs`. Usar: `function X() {...} export default React.memo(X)`
- Hooks (`useMemo`) nunca después de early returns (rules-of-hooks)
- Para que `React.memo` sirva, handlers pasados como props deben ser `useCallback`
- `ThemeContext` ya memoiza todo (`colors`/`value` estables)
- Servidor Expo en tunnel mode: `npx expo start --tunnel`
- Puerto 8081 para desarrollo local

## Pendientes

1. Probar en Expo Go en dispositivo (nuevas pestañas)
2. Build EAS release v1.6.0
3. Opcional: DownloadManager nativo para descarga que sobreviva cierre
4. Opcional: Migrar AnimatedNumber a Reanimated (hilo UI)
5. Opcional: Test defensivo de `gradlew assembleRelease` en CI
