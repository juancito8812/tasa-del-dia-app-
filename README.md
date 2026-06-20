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

Las tasas se obtienen de [**Cotizave API**](https://cotizave.com) — BCV, paralelo, euro y Binance P2P en tiempo real.

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
echo "COTIZAVE_API_KEY=tu_api_key_aqui" > .env
npm install
npx expo start
# Escanea el QR con Expo Go en tu celular
```

**Opción 3 — Compilar APK**

```bash
npx eas build --platform android --profile preview
```

**Requisitos:** Node.js 22+, cuenta Expo, API key de Cotizave

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
| **Mobile CI** | Push/PR a `main` con cambios en `tasa-del-dia/` | Tests (62) |
| **Desktop CI** | Push/PR a `main` con cambios en `tasa-del-dia-desktop/` | Tests (255+) |
| **Build APK** | Push a `main` con cambios en `tasa-del-dia/` | APK |
| **Build EXE** | Push a `main` con cambios en `tasa-del-dia-desktop/` | .exe |
| **Android Build** | Manual (workflow_dispatch) | APK con perfil seleccionable |

---

## 🛠️ Stack Tecnológico

### App Móvil
- React Native 0.81 + Expo SDK 54
- React Navigation 7 (Bottom Tabs)
- AsyncStorage + expo-notifications + expo-background-fetch

### App Desktop
- Python 3.14 + Flet 0.85
- Share: `app/api.py`, `app/storage.py`, `app/auto_update.py`

---

<div align="center">
  <p>Hecho con ❤️ para Venezuela</p>
  <p><a href="https://github.com/juancito8812/tasa-del-dia-app-/issues">Reportar problema</a></p>
</div>
