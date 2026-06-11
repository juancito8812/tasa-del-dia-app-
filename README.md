# 💱 Tasa del Día

<div align="center">

**App para consultar la tasa de cambio del BCV, dólar paralelo, euro y Binance P2P, con conversor Bs/USD en tiempo real.**

<br>

[![Build APK](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-apk.yml)
[![Build EXE](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-exe.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/build-exe.yml)
[![Release APK](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/release-apk.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/release-apk.yml)
[![Release EXE](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/release-exe.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/release-exe.yml)
[![Auto-Sync](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/auto-sync.yml/badge.svg)](https://github.com/juancito8812/tasa-del-dia-app-/actions/workflows/auto-sync.yml)

</div>

---

## 📱 Proyectos

| Proyecto | Plataforma | Stack |
|----------|-----------|-------|
| **App Móvil** | Android (APK) | React Native + Expo SDK 54 |
| **App Desktop** | Windows (.exe) | Python + PyInstaller |

### Fuente de datos

Las tasas se obtienen de [**Cotizave API**](https://cotizave.com) — BCV, paralelo, euro y Binance P2P en tiempo real.

---

## 🚀 Instalación

### 📱 App Móvil (APK)

**Opción 1 — Descargar APK (recomendado)**

1. Ve a la pestaña **Actions** de este repositorio
2. Selecciona el workflow **Build APK (React Native)**
3. Abre el último run exitoso y descarga el artefacto `TasaDelDia.apk`
4. Transfiere el APK a tu celular e instálalo
5. En Android, acepta "Instalar apps de orígenes desconocidos"

**Opción 2 — Compilar desde código**

```bash
# 1. Clonar el repositorio
git clone https://github.com/juancito8812/tasa-del-dia-app-.git
cd tasa-del-dia-app-/tasa-del-dia

# 2. Crear archivo .env con tu API key de Cotizave
echo "COTIZAVE_API_KEY=tu_api_key_aqui" > .env

# 3. Instalar dependencias
npm install

# 4. Iniciar en desarrollo
npx expo start

# 5. Compilar APK (requiere cuenta Expo)
npx eas build --platform android --profile preview
```

**Requisitos:**
- Node.js 22+
- Expo CLI
- Cuenta en [expo.dev](https://expo.dev)
- API key de [Cotizave](https://cotizave.com)

---

### 🖥️ App Desktop (.exe)

**Opción 1 — Descargar .exe**

1. Ve a la pestaña **Actions** de este repositorio
2. Selecciona el workflow **Build .EXE (Desktop)**
3. Abre el último run exitoso y descarga el artefacto `TasaDelDia.exe`
4. Ejecuta directamente (no requiere instalación)

**Opción 2 — Compilar desde código**

```bash
# 1. Clonar y entrar al directorio
git clone https://github.com/juancito8812/tasa-del-dia-app-.git
cd tasa-del-dia-app-/tasa-del-dia-desktop

# 2. Compilar (genera dist/TasaDelDia.exe)
python build.py

# 3. O build rápido (sin regenerar icono)
python build.py --quick
```

**Requisitos:**
- Python 3.10+
- PyInstaller (se instala automáticamente)

---

## 🔄 Caché Offline

Ambas apps guardan automáticamente las últimas tasas consultadas para funcionar sin conexión:

| App | Almacenamiento | Archivo |
|-----|---------------|---------|
| **Android** | AsyncStorage | Interno de la app |
| **Desktop** | Archivo JSON | `%APPDATA%\TasaDelDia\cache_rates.json` |

Cuando no hay conexión:
- ✅ Se muestran las últimas tasas cacheadas
- ✅ El conversor Bs/USD sigue funcionando
- ✅ Aparece un banner indicando modo offline
- ✅ Se reintenta cada 30 segundos hasta recuperar conexión

---

## 🤖 GitHub Actions

| Workflow | Cuándo se ejecuta | Producto |
|----------|-------------------|----------|
| **Build APK** | Push a `main` con cambios en `tasa-del-dia/` | APK (artefacto) |
| **Build EXE** | Push a `main` con cambios en `tasa-del-dia-desktop/` | .exe (artefacto) |
| **Release APK** | Tag `v*` o Release publicado | APK adjuntada al release |
| **Release EXE** | Tag `v*` o Release publicado | .exe adjuntado al release |
| **Auto-Sync** | ⏰ Diario (6:00 AM UTC) o manual | Git commit + push automático |

### Configurar builds automáticos

1. **Crear un release:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   Esto dispara ambos workflows de Release.

2. **Ejecutar build manual:**
   Desde la pestaña **Actions** → seleccionar workflow → **Run workflow**.

3. **Secreto requerido (APK):**
   - `EXPO_TOKEN` — Token de acceso de [Expo](https://expo.dev/accounts/jr8812/settings/access-tokens)

---

## 🛠️ Stack Tecnológico

### App Móvil
- **Framework:** React Native 0.81 + Expo SDK 54
- **Navegación:** React Navigation 7 (Bottom Tabs)
- **Íconos:** @expo/vector-icons (Ionicons)
- **Almacenamiento:** AsyncStorage
- **Notificaciones:** expo-notifications
- **Build:** EAS Build (nube)

### App Desktop
- **Lenguaje:** Python 3.12
- **GUI:** tkinter + ttkbootstrap
- **Build:** PyInstaller 6.20
- **Icono:** Generado con Pillow (PNG → .ico)

### CI/CD
- **Plataforma:** GitHub Actions
- **Runner EXE:** windows-latest
- **Runner APK:** ubuntu-latest + EAS Build

---

## 🧠 Agent Skills

Este proyecto incluye **24 skills** del repositorio [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) — workflows estructurados para que agentes de IA sigan buenas prácticas de ingeniería de producción.

| Ciclo | Skills incluidos |
|-------|-----------------|
| **🔍 Define** | `interview-me`, `idea-refine`, `spec-driven-development` |
| **📋 Plan** | `planning-and-task-breakdown` |
| **🛠 Build** | `incremental-implementation`, `test-driven-development`, `context-engineering`, `source-driven-development`, `doubt-driven-development`, `frontend-ui-engineering`, `api-and-interface-design` |
| **✅ Verify** | `browser-testing-with-devtools`, `debugging-and-error-recovery` |
| **👁️ Review** | `code-review-and-quality`, `code-simplification`, `security-and-hardening`, `performance-optimization` |
| **🚢 Ship** | `git-workflow-and-versioning`, `ci-cd-and-automation`, `deprecation-and-migration`, `documentation-and-adrs`, `observability-and-instrumentation`, `shipping-and-launch` |

### 📁 Estructura

```
skills/
├── 24 skills/           # Cada skill es un directorio con SKILL.md
├── agents/              # 4 personas especialistas (code-reviewer, security, test, webperf)
├── references/          # 5 checklists de referencia
├── commands/            # 8 comandos slash
└── docs/                # Guías de setup por herramienta
```

---

<div align="center">
  <p>Hecho con ❤️ para Venezuela</p>
  <p>
    <a href="https://github.com/juancito8812/tasa-del-dia-app-/issues">Reportar un problema</a>
    ·
    <a href="https://github.com/juancito8812/tasa-del-dia-app-/discussions">Sugerir mejora</a>
  </p>
</div>
