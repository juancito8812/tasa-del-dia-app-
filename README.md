# 💱 Tasa del Día

<div align="center">

**App para consultar la tasa de cambio del BCV, dólar paralelo, euro y Binance P2P, con conversor Bs/USD, datos bancarios y calculadora PayPal en tiempo real.**

<br>

[![Mobile CI](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/mobile-ci.yml)
[![Build APK](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml)

</div>

---

## ✨ Características

- **Tasas en vivo:** BCV, Paralelo, Euro, Binance P2P con brechas y gasolina
- **Conversor Bs/USD:** con tasas en tiempo real, modo offline
- **Datos Bancarios:** CRUD de cuentas bancarias venezolanas (entidad, tipo, titular, CI, cuenta, Swift)
- **PayPal Calculator:** 4 tipos de tarifa (enviar amigos, recibir pago, enviar pago, vender) con conversión automática
- **Historial:** 900+ registros desde 2023 con chart y detalle por día
- **Selector de diseño:** Original / Terminal / Editorial (botón en el header, preferencia persistente)
- **Auto-update:** descarga APK desde GitHub sin desinstalar

---

## 📱 App Móvil (APK)

| Detalle | Valor |
|---------|-------|
| Plataforma | Android |
| Stack | React Native 0.81 + Expo SDK 54 |
| Versión actual | **1.6.0** (versionCode 10600) |
| Estado | ✅ Activa |
| Fuente de datos | DolarApi.com (BCV, paralelo, euro) + Binance P2P directo |
| Tests | 444/444 passing · 32 suites |
| Lint | 0 errors, 0 warnings |
| Typecheck | 0 errores (`checkJs: true`) |

### Instalación

**Opción 1 — Descargar APK (recomendado)**

1. Ve a la pestaña **Releases** de este repositorio
2. Descarga la APK de la última release (`TasaDelDia-vX.Y.Z.apk`)
3. Transfiere el APK a tu celular e instálalo

La app se auto-actualiza: al abrir, verifica si hay una versión más nueva y ofrece descargarla.

**Opción 2 — Probar con Expo Go (desarrollo)**

```bash
cd tasa-del-dia
npm install --legacy-peer-deps
npx expo start
# Escanea el QR con Expo Go en tu celular
```

> Limitación: Expo Go no soporta algunas APIs nativas (notifications, background fetch, auto-update), pero las tasas, conversor e historial funcionan.

**Opción 3 — Compilar APK local (⚠️ solo para desarrollo/debug)**

```bash
cd tasa-del-dia
npm install --legacy-peer-deps
npx expo prebuild --clean --non-interactive
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

> ⚠️ **NUNCA uses `gradlew assembleRelease` para builds que se subirán a GitHub Releases.** La APK de release firmada con el keystore local (`CN=Android Debug`) tiene una firma DIFERENTE a la del keystore EAS. Esto causa `"No se instaló la app"` cuando los usuarios intentan auto-update desde una versión firmada con EAS. Para releases, usá **siempre** `eas build --local` (ver abajo).

**Requisitos:** Node.js 22+, Java 17, `ANDROID_HOME` configurado

### 🔄 Auto-Update

La app verifica al iniciar si hay una versión más nueva consultando las releases versionadas de GitHub y muestra un modal para descargar la APK. Incluye cache de 30 min y opción "Saltar versión".

**Comportamiento:** Al abrir la app, detecta automáticamente si hay una versión más nueva. Si la hay, muestra un modal con botones: *Descargar APK* (descarga + abre instalador Android), *Saltar esta versión* (no vuelve a preguntar), *Más tarde* (cierra el modal).

**Verificado end-to-end:** v1.4.4 detecta v1.4.6 → modal → descarga → instalación nativa → v1.4.6 activa. Sin crashes, sin loops infinitos.

**v1.4.6 Fix:** El auto-update ahora busca APKs que empiecen con `TasaDelDia*` (firma EAS correcta) en vez de cualquier `.apk`. Esto previene que se descargue una APK con firma de debug que causaba "No se instaló la app".

**v1.4.7 Fixes (QA en Galaxy A12, 20-ago-2026):** BCV (Lunes) se refleja al instante en el Conversor sin reiniciar (pub/sub), validación inline en vez de Alert nativo, decimales para montos < 1 (1,5 Bs → 0,0019 USD), teclado ya no tapa los botones del modal, prefill con formato es-VE ("780,50"), y tarjetas sin acción ya no parecen botones.

**v1.6.0 Features (05-Sep-2026):** Nueva pestaña "Datos Bancarios" con CRUD de cuentas bancarias y caché 24h. Nueva pestaña "PayPal Calculator" con 4 tipos de tarifa oficiales Venezuela y conversión a BCV/Paralelo/Binance/Euro. Refactor: calcSpread() DRY, useMemo en spreads, sanitizeId() para seguridad.

### 🔐 Signing Policy (importante)

**Todas las APKs de release DEBEN** ser construidas con `eas build --local` para que usen el mismo keystore EAS y los usuarios puedan hacer upgrade sobre versiones anteriores.

```bash
# ✅ CORRECTO — usa el keystore EAS (mismo firma que CI)
EXPO_TOKEN=<tu-token> eas build --platform android --profile preview --local --output TasaDelDia.apk

# ❌ INCORRECTO — usa el debug keystore local (firma diferente)
cd android && ./gradlew assembleRelease
```

**SHA-256 del keystore EAS:** `299073e3f85f9fc471298bc9d3e61f3c207a5dd0b406ec1d1ffc3ede37e528eb`

> Los workflows de CI (`build-apk.yml`, `release-automatic.yml`) verifican automáticamente la firma antes de subir la APK. Si la firma no coincide, el build falla.

---

## 📂 Estructura del repo

```
tasa-del-dia-app/
├── tasa-del-dia/                  # App móvil React Native + Expo
│   ├── App.js                     # Entry point, 5 pestañas + auto-update
│   ├── src/
│   │   ├── screens/               # RatesScreen, ConverterScreen, BankDataScreen, PayPalCalculatorScreen, HistoryScreen
│   │   ├── components/            # RateCard, UpdateModal, CustomTabBar, BankAccountCard, BankAccountForm, etc.
│   │   ├── ui/                     # Paquetes de diseño alternativos
│   │   │   ├── index.js            # Registro getUiPackage(uiStyle)
│   │   │   ├── terminal/           # Rediseño Terminal (monocromo)
│   │   │   └── editorial/          # Rediseño Editorial (premium)
│   │   ├── services/              # api.js, autoUpdate.js, bankData.js, notifications.js, etc.
│   │   ├── hooks/                 # useRatesData, useConverterData, useHistoryData
│   │   ├── constants/             # banks.js, documentTypes.js, paypalFees.js
│   │   ├── context/               # ThemeContext (dark/light/system)
│   │   └── utils/                 # helpers
│   └── android/                   # Generated by expo prebuild (no commitear APKs)
├── .github/workflows/             # CI/CD (4 workflows)
├── README.md                      # Este archivo
└── AI_HANDOFF.md                  # Documento de traspaso para AI agents
```

---

## 🔄 Caché Offline

La app guarda automáticamente las últimas tasas para funcionar sin conexión:
- **Android:** AsyncStorage (interno de la app)

Cuando no hay conexión:
- ✅ Últimas tasas cacheadas visibles
- ✅ Conversor Bs/USD funcional
- ✅ Reintento automático con backoff (30s → 5min máximo)
- ✅ Banner indicando modo offline vs error de API

---

## 🤖 GitHub Actions

| Workflow | Evento | Producto |
|----------|--------|----------|
| **Mobile CI** | Push/PR a `main` con cambios en `tasa-del-dia/` | Tests (444) + lint (0 warnings) + typecheck |
| **Build APK** | Push a `main` + manual | APK (EAS local) + firma verification + Release |
| **Release Automático** | Manual (workflow_dispatch) + tags v* | APK + Release con changelog + firma verification |
| **Auto-Sync** | Cron diario 6AM UTC + manual | Auto-commit de cambios pendientes en `main` |

---

## 🏎️ Rendimiento (Galaxy A12 — Android 12, 3.75 GB RAM)

| Métrica | Resultado |
|---------|-----------|
| Cold start | **533ms** avg (5 intentos) |
| RAM | **113 MB** PSS (~3% de RAM total) |
| CPU | 15% idle, 70% pico (durante fetch de APIs) |
| FPS | **60/60** |
| Crashes | **0** en todas las pruebas |
| Stress test (10 swipes) | 0 crashes, PID estable |
| APIs | Todas < 1s (DolarApi 0.28-0.60s, Binance 0.39s) |

---

## 🛠️ Stack Tecnológico

- React Native 0.81 + Expo SDK 54
- Navegación por pestañas con `react-native-pager-view` + `CustomTabBar` (sin react-navigation)
- AsyncStorage + expo-notifications + expo-background-fetch
- Typecheck real con `checkJs` (`npm run typecheck` / `npx tsc --noEmit`)
- DolarApi.com + Binance P2P directo
- React Compiler lint rules (desactivadas las experimentales: `react-hooks/refs`, `react-hooks/set-state-in-effect`)

---

<div align="center">
  <p>Hecho con ❤️ para Venezuela</p>
  <p><a href="https://github.com/juancito8812/tasa-del-dia-app-/releases">Descargar última APK</a> · <a href="https://github.com/juancito8812/tasa-del-dia-app-/issues">Reportar problema</a></p>
</div>
