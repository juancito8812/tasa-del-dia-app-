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
- **Datos Bancarios:** CRUD de cuentas bancarias venezolanas con búsqueda de banco, secciones Pago Móvil, Transferencia, Zelle, PayPal, Binance, Facebank, Zinli y Wally — la copia de Pago Móvil sale compacta (cédula, teléfono y banco corto, lista para pegar)
- **PayPal Calculator:** 5.4% + $0.30 con modos "Para recibir" / "Para enviar" y conversión a BCV/Paralelo/Binance/Euro
- **Pagar compras en BS:** tarjeta que calcula el monto exacto a transferir por PayPal (USD) para cubrir una compra en bolívares (5.4% + $0.30 incluido), con chips de tasa en vivo (BCV/Paralelo/Binance), recomendación de entero superior y vuelto en Bs
- **Historial:** 900+ registros desde 2023 con chart y detalle por día
- **Selector de diseño:** Original / Terminal / Editorial / Fintech (botón en el header, preferencia persistente). Fintech trae paleta crema + vino, panel oscuro con BCV amarillo y tipografías Space Grotesk + JetBrains Mono
- **Auto-update:** descarga APK desde GitHub sin desinstalar

---

## 📱 App Móvil (APK)

| Detalle | Valor |
|---------|-------|
| Plataforma | Android |
| Stack | React Native 0.81 + Expo SDK 54 |
| Versión actual | **1.6.10** (versionCode 10610) |
| Estado | ✅ Activa |
| Fuente de datos | DolarApi.com (BCV, paralelo, euro) + Binance P2P directo |
| Tests | 592/592 passing · 39 suites |
| Lint | 0 errors, 0 warnings (`npx eslint src --quiet`) |
| Typecheck | 0 errores (`npx tsc --noEmit`, `checkJs: true`) |
| Seguridad | Review full-app 17-oct-2026: 0 vulnerabilidades explotables (ver [`INFORME-REVISION.md`](INFORME-REVISION.md)) |
| Arquitectura | 4 estilos de UI sobre un único set de componentes (ver [`docs/architecture.md`](docs/architecture.md)) |

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

> 💡 **Debug standalone:** la variante debug embebe el bundle JS (`debuggableVariants = []` en `android/app/build.gradle`) y usa el sufijo `applicationIdSuffix ".debug"` — corre sin Metro y puede convivir con la app de producción. Tras cambios de JS hay que recompilar la APK; `expo prebuild --clean` borra esta configuración.

> 📦 **APK oficial (última release):** `TasaDelDia-vX.Y.Z.apk` (~76 MB, firma EAS, publicada en GitHub Releases). Instala como la app de producción (`com.tasadeldia.app`). Auto-update desde GitHub desde la v1.6.4. Nota: si antes instalaste la APK tester debug (`com.tasadeldia.app.debug`), desinstálala primero — firmas distintas (debug vs EAS) y Android no permite actualizar entre ellas.
>
> 🔬 **APK tester (solo para validación interna, obsoleta):** `tasa-del-dia/TasaDelDia-v1.6.3-debug-tester.apk` (118 MB, bundle embebido — funciona sin PC, offline). Instala como `com.tasadeldia.app.debug`, así que convive con la app de producción. Solo para pruebas: firma debug ≠ firma EAS, así que NO sirve para auto-update (los testers deben desinstalarla antes de pasar a una release firmada) y NUNCA publicarla (bundle dev sin minificar + keystore debug público). Nota: la APK es full-ABI — RN 0.81 embarca libs prebuilt de AARs que ni `abiFilters` ni packaging excludes remueven; además `gradlew clean` está roto en este proyecto (quirk de CMake codegen) — purgar `android/app/build` manualmente si hace falta.

> ⚠️ **NUNCA uses `gradlew assembleRelease` para builds que se subirán a GitHub Releases.** La APK de release firmada con el keystore local (`CN=Android Debug`) tiene una firma DIFERENTE a la del keystore EAS. Esto causa `"No se instaló la app"` cuando los usuarios intentan auto-update desde una versión firmada con EAS. Para releases, usá **siempre** `eas build --local` (ver abajo).

**Requisitos:** Node.js 22+, Java 17, `ANDROID_HOME` configurado

### 🔄 Auto-Update

La app verifica al iniciar si hay una versión más nueva consultando las releases versionadas de GitHub y muestra un modal para descargar la APK. Incluye cache de 30 min y opción "Saltar versión".

**Comportamiento:** Al abrir la app, detecta automáticamente si hay una versión más nueva. Si la hay, muestra un modal con botones: *Descargar APK* (descarga + abre instalador Android), *Saltar esta versión* (no vuelve a preguntar), *Más tarde* (cierra el modal).

**Verificado end-to-end:** v1.4.4 detecta v1.4.6 → modal → descarga → instalación nativa → v1.4.6 activa. Sin crashes, sin loops infinitos.

Endurecimiento: solo se descargan APKs HTTPS de hosts GitHub cuyo nombre empiece con `TasaDelDia` (`isTrustedApkUrl`, ver `src/services/autoUpdate.js`) — se descartó el nombre genérico `.apk` para no bajar builds con firma de debug.

> 📜 **Historial de cambios por versión:** [`CHANGELOG.md`](CHANGELOG.md).

### 🔒 Revisión de calidad y seguridad (17-oct-2026)

Auditoría completa de calidad + seguridad + lógica (versión revisada: 1.6.9). **Informe:** [`INFORME-REVISION.md`](INFORME-REVISION.md). Resultado: **0 vulnerabilidades explotables**; se corrigieron privacidad, integridad de datos y accesibilidad.

**Seguridad**
- **Datos bancarios cifrados:** las cuentas pasan de AsyncStorage en claro a **`expo-secure-store`** (Keystore/Keychain del sistema), una cuenta por clave, con **migración automática** del formato anterior. `allowBackup=false` saca el sandbox de las copias ADB.
- **Auto-update endurecido:** la descarga/instalación del APK valida HTTPS + host de GitHub (`isTrustedApkUrl`).
- **Manifest mínimo:** `blockedPermissions` corta `READ/WRITE_EXTERNAL_STORAGE` y `SYSTEM_ALERT_WINDOW`.
- **CI supply-chain:** las acciones de GitHub Actions quedan fijadas a commit SHA.

**Lógica / datos**
- **Historial:** el "BCV Lunes" manual ya no sobreescribe el `bcv` oficial del día (campo propio `bcv_lunes`).
- **Un solo origen de tasas:** `RatesContext` comparte una única instancia de `useRatesData` (antes Tasas y PayPal duplicaban el auto-guardado y el reintento offline).
- **PayPal:** el vuelto negativo se etiqueta "Faltante por cubrir".

**Calidad / rendimiento / a11y**
- `getSeverityKey()` centraliza los umbrales de brecha (>15/>8); items del historial reutilizan estilos; fuentes fintech cargadas una sola vez (`FintechFontsProvider`); `accessibilityLabel`/`accessibilityRole` en todos los botones solo-icono.

> ⚠️ **Requiere rebuild nativo:** `expo-secure-store` es un módulo nativo nuevo. Hay que recompilar la APK (prebuild + CI) antes de distribuir; un build viejo sin el módulo fallaría al leer cuentas bancarias.

### 🧹 Refactor estructural Q1/Q2 (18-oct-2026 — v1.6.10)

- **Q1 — duplicación de UI entre temas:** eliminadas **30 copias** de componentes y pantallas en `src/ui/{terminal,editorial,fintech}/`. El mismo archivo (`RatesScreen`, `RateCard`, `RatesHeader`, `BCVModal`, `HistoryScreen`, `HistoryChart`, `DateDetailCard`, `ConverterScreen`, `UpdateModal`, `ScreenContainer`) sirve los 4 estilos resolviendo las diferencias visuales con un mapa `THEME_STYLES` indexado por `useTheme().uiStyle`.
- **Q2 — archivos gigantes:** `services/api.js` 493→36 líneas (fachada de re-export sobre `services/api/{network,rates,storage,history,aggregate}.js`), `BankAccountForm.js` 809→199 (+ `components/bank/*`), `PayPalCalculatorScreen.js` 803→148 (+ subcomponentes `PayPal*` y `utils/paypalCalculator.js`).
- Neto del merge: **76 archivos, +4.955 / −8.521 líneas**. Sin cambios de comportamiento; suite de 39 suites / 592 tests verde.
- Detalle del plan y su cierre: [`PLAN-REFACTOR-Q1-Q2.md`](PLAN-REFACTOR-Q1-Q2.md) · cómo funciona el sistema de temas: [`docs/architecture.md`](docs/architecture.md).

### 🔐 Signing Policy (importante)

**Todas las APKs de release DEBEN** ser construidas con `eas build --local` para que usen el mismo keystore EAS y los usuarios puedan hacer upgrade sobre versiones anteriores.

```bash
# ✅ CORRECTO — usa el keystore EAS (misma firma que CI)
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
│   ├── app.config.js              # Config Expo: versión, permisos, plugins
│   ├── src/
│   │   ├── screens/               # RatesScreen, ConverterScreen, BankDataScreen, PayPalCalculatorScreen, HistoryScreen
│   │   ├── components/            # RateCard, UpdateModal, ScreenContainer, BankAccountCard, CustomTabBar, PayPal*
│   │   │   └── bank/              # Subcomponentes de BankAccountForm (PersonalFields, PagoMovilFields, ...)
│   │   ├── ui/                    # Paquetes de diseño
│   │   │   ├── index.js           # Registro getUiPackage(uiStyle) — único dueño del mapeo estilo → componente
│   │   │   ├── terminal/          # paleta monocroma + CustomTabBar propia
│   │   │   ├── editorial/         # paleta editorial (premium)
│   │   │   └── fintech/           # paleta crema + vino y fuentes Space Grotesk + JetBrains Mono
│   │   ├── services/              # reglas de negocio y acceso a datos
│   │   │   ├── api.js             # fachada de re-export (los imports no cambian)
│   │   │   └── api/               # network / rates / storage / history / aggregate
│   │   ├── hooks/                 # useRatesData, useConverterData, useHistoryData
│   │   ├── constants/             # banks.js, documentTypes.js, paypalFees.js
│   │   ├── context/               # ThemeContext (dark/light/system + uiStyle), DistributionContext, RatesContext
│   │   └── utils/                 # helpers (paypalCalculator, fechas, formato...)
│   └── android/                   # Generated by expo prebuild (no commitear APKs)
├── .github/workflows/             # CI/CD (4 workflows, acciones fijadas a SHA)
├── docs/                          # architecture.md, privacy-policy.md, galaxy-store-checklist.md
├── CHANGELOG.md                   # Historial de versiones
├── INFORME-REVISION.md            # Auditoría de calidad + seguridad (17-oct-2026)
├── PLAN-REFACTOR-Q1-Q2.md         # Plan Q1/Q2: cerrado en la v1.6.10
├── README.md                      # Este archivo
└── .gitignore                     # Ignora archivos sensibles y temporales
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
| **Mobile CI** (`mobile-ci.yml`) | Push a `main` y PR que toquen `tasa-del-dia/` | Tests (592) + lint + typecheck — es el gate de las ramas |
| **Build APK** (`build-apk.yml`) | Push a `main`/`master` + manual | APK (EAS local) + verificación de firma + Release |
| **Release Automático** (`release-automatic.yml`) | Manual (`workflow_dispatch` con `version`) + tags `v*` | Corre tests, bumpea versión, compila APK, verifica firma y publica la GitHub Release |
| **Auto-Sync** (`auto-sync.yml`) | Cron diario 06:00 UTC + manual | Auto-commit de cambios pendientes en `main` (rama fija, `-uno`, `pull --rebase`, sin `--force`) |

> Las ramas **no** generan APK ni preview web: `build-apk.yml` solo corre en `main`. El gate honesto de un PR es `gh pr checks <n>` (job `test`, ~1 min) y la APK aparece recién al mergear.

**Publicar una release:**

```bash
gh workflow run release-automatic.yml --ref main -f version=1.6.11   # ~20-25 min
gh run watch <run-id> --exit-status                                   # seguir el progreso
gh release view v1.6.11                                               # verificar asset y notas
```

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
- Reanimated 4.x (animaciones en hilo UI)
- Navegación por pestañas con `react-native-pager-view` + `CustomTabBar` (sin react-navigation)
- AsyncStorage + `expo-secure-store` + expo-notifications + expo-background-fetch
- Typecheck real con `checkJs` (`npm run typecheck` / `npx tsc --noEmit`)
- DolarApi.com + Binance P2P directo
- React Compiler lint rules (desactivadas las experimentales: `react-hooks/refs`, `react-hooks/set-state-in-effect`)

---

<div align="center">
  <p>Hecho con ❤️ para Venezuela</p>
  <p><a href="https://github.com/juancito8812/tasa-del-dia-app-/releases">Descargar última APK</a> · <a href="https://github.com/juancito8812/tasa-del-dia-app-/issues">Reportar problema</a></p>
</div>
