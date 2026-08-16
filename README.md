# 💱 Tasa del Día

<div align="center">

**App para consultar la tasa de cambio del BCV, dólar paralelo, euro y Binance P2P, con conversor Bs/USD en tiempo real.**

<br>

[![Mobile CI](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/mobile-ci.yml)
[![Build APK](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml)

</div>

---

## 📱 App Móvil (APK)

| Detalle | Valor |
|---------|-------|
| Plataforma | Android |
| Stack | React Native + Expo SDK 54 |
| Estado | ✅ Activa |
| Fuente de datos | DolarApi.com (BCV, paralelo, euro) + Binance P2P directo |

### Instalación

**Opción 1 — Descargar APK (recomendado)**

1. Ve a la pestaña **Actions** de este repositorio
2. Selecciona el workflow **Build APK (React Native)**
3. Abre el último run exitoso y descarga el artefacto
4. Transfiere el APK a tu celular e instálalo

> Nota: la release pública actual corresponde a `main`. Para probar los cambios del rediseño usá la rama `redesign`.

**Opción 2 — Probar rama `redesign`**

```bash
git checkout redesign
cd tasa-del-dia
npm install --legacy-peer-deps
npx expo start
# Escanea el QR con Expo Go en tu celular
```

**Opción 3 — Compilar APK local**

```bash
git checkout redesign
cd tasa-del-dia
npm install --legacy-peer-deps
npx expo prebuild --clean --non-interactive
cd android
./gradlew.bat assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

**Requisitos:** Node.js 22+, Java 17, `ANDROID_HOME` configurado

> Si `cd android && ./gradlew.bat assembleDebug` falla por `ANDROID_HOME`, creá o editá `android/local.properties` con tu ruta SDK, por ejemplo: `sdk.dir=C:\\Users\\<usuario>\\AppData\\Local\\Android\\Sdk`

### 🔄 Auto-Update

Cada build exitoso puede generar una Release con tag semver. La app verifica al iniciar si hay una versión más nueva consultando las releases versionadas de GitHub y muestra un modal para descargar la APK. Incluye cache de 30 min y opción "Saltar versión".

**Comportamiento:** Al abrir la app, detecta automáticamente si hay una versión más nueva. Si la hay, muestra un modal con botones: *Descargar APK* (descarga + abre instalador Android), *Saltar esta versión* (no vuelve a preguntar), *Más tarde* (cierra el modal).

---

## 📂 Estructura del repo

```
tasa-del-dia-app/
├── tasa-del-dia/             # App móvil React Native + Expo
├── .github/workflows/        # CI/CD mobile
├── README.md
└── AI_HANDOFF.md
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
| **Mobile CI** | Push/PR a `main` con cambios en `tasa-del-dia/` | Tests (162) + lint + typecheck |
| **Build APK** | Push a `main` + manual | APK + Release con tag semver automático |
| **Release Automático** | Manual (workflow_dispatch) + tags v* | APK + Release con changelog |

---

## 🛠️ Stack Tecnológico

- React Native 0.81 + Expo SDK 54
- Navegación por pestañas con `react-native-pager-view` + `CustomTabBar` (sin react-navigation)
- AsyncStorage + expo-notifications + expo-background-fetch
- Typecheck real con `checkJs` (`npm run typecheck` / `npx tsc --noEmit`)
- DolarApi.com + Binance P2P directo

---

<div align="center">
  <p>Hecho con ❤️ para Venezuela</p>
  <p><a href="https://github.com/juancito8812/tasa-del-dia-app-/issues">Reportar problema</a></p>
</div>
