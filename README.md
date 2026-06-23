# 💱 Tasa del Día

<div align="center">

**App para consultar la tasa de cambio del BCV, dólar paralelo, euro y Binance P2P, con conversor Bs/USD en tiempo real.**

<br>

[![Mobile CI](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/mobile-ci.yml)
[![Desktop CI](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/desktop-ci.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/desktop-ci.yml)
[![Build APK](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml)

</div>

---

## 📱 Proyectos

| Proyecto | Plataforma | Stack | Estado |
|----------|-----------|-------|--------|
| **App Móvil** | Android (APK) | React Native + Expo SDK 54 | ✅ Activa |
| **App Desktop** | Windows (.exe) | Python + Flet 0.85 | ✅ Activa (Flet) |
| App Desktop (WinUp) | Windows (.exe) | Python + PySide6 | 🗑️ Deprecada |
| App Desktop (Legacy) | Windows (.exe) | Python + customtkinter | 🗑️ Deprecada |

### Fuente de datos

Las tasas se obtienen de [**DolarApi.com**](https://ve.dolarapi.com) (BCV, paralelo, euro) + Binance P2P directo — sin API key requerida.

---

## 🚀 Instalación

### 📱 App Móvil (APK)

**Opción 1 — Descargar APK (recomendado)**

1. Ve a la pestaña **Actions** de este repositorio
2. Selecciona el workflow **Build APK (React Native)**
3. Abre el último run exitoso y descarga el artefacto
4. Transfiere el APK a tu celular e instálalo

**Opción 2 — Test rápido con Expo Go**

```bash
cd tasa-del-dia
npm install
npx expo start
# Escanea el QR con Expo Go en tu celular
```

**Opción 3 — Compilar APK**

```bash
npx eas build --platform android --profile preview
```

**Requisitos:** Node.js 22+, cuenta Expo

### 🔄 Auto-Update

Cada build exitoso crea automáticamente un Release con tag semver (ej: `v1.0.3`) en GitHub. La app verifica al iniciar si hay una versión más nueva consultando el endpoint `/releases/latest` de GitHub API y muestra un modal para descargar la APK. Incluye cache de 30 min y opción "Saltar versión".

**Comportamiento:** Al abrir la app, detecta automáticamente si hay una versión más nueva. Si la hay, muestra un modal con botones: *Descargar APK* (descarga + abre instalador Android), *Saltar esta versión* (no vuelve a preguntar), *Más tarde* (cierra el modal).

---

### 🖥️ App Desktop (.exe)

```bash
cd tasa-del-dia-desktop
pip install -r requirements.txt
python build_flet.py --quick
# → dist/TasaDelDiaFlet.exe
```

---

## 🔄 Caché Offline

Ambas apps guardan automáticamente las últimas tasas para funcionar sin conexión:
- **Android:** AsyncStorage (interno de la app)
- **Desktop:** `%APPDATA%\TasaDelDia\cache_rates.json`

Cuando no hay conexión:
- ✅ Últimas tasas cacheadas visibles
- ✅ Conversor Bs/USD funcional
- ✅ Reintento automático con backoff (30s → 5min máximo)
- ✅ Banner indicando modo offline vs error de API

---

## 🤖 GitHub Actions

| Workflow | Evento | Producto |
|----------|--------|----------|
| **Mobile CI** | Push/PR a `main` con cambios en `tasa-del-dia/` | Tests (156) + lint |
| **Desktop CI** | Push/PR a `main` con cambios en `tasa-del-dia-desktop/` | Tests (280: 267 pass, 9 legacy, 4 err) |
| **Build APK** | Push a `main` + manual | APK + Release con tag semver automático |
| **Release Automático** | Manual (workflow_dispatch) + tags v* | APK + Release con changelog |
| **Build EXE** | Push a `main` con cambios en `tasa-del-dia-desktop/` | .exe |

> **Nota:** `release-apk.yml` y `android-build.yml` fueron eliminados (redundantes con `build-apk.yml` y `release-automatic.yml`).

---

## 🛠️ Stack Tecnológico

### App Móvil
- React Native 0.81 + Expo SDK 54
- React Navigation 7 (Bottom Tabs)
- AsyncStorage + expo-notifications + expo-background-fetch

### App Desktop
- Python 3.14 + Flet 0.85.3
- UI: `flet_app/main.py` (~1000 ln) con 3 tabs (Tasas/Conversor/Historial)
- Scroll: `ft.Column(scroll=AUTO, expand=True)` (más fiable que `ft.ListView` para contenido intercambiable)
- Thread-safety: `page.run_thread()` para actualizaciones en segundo plano
- Persistencia: `%APPDATA%\TasaDelDia\` (config, cache, historial, logs)
- Build: `python build_flet.py --quick` → `dist/TasaDelDiaFlet.exe` (~80 MB, ~2 min)
- Share: `app/api.py`, `app/storage.py`, `app/auto_update.py`

---

<div align="center">
  <p>Hecho con ❤️ para Venezuela</p>
  <p><a href="https://github.com/juancito8812/tasa-del-dia-app-/issues">Reportar problema</a></p>
</div>
