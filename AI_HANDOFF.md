# Documento de Traspaso (AI Handoff Document)

Este documento está diseñado para proporcionar contexto a futuros agentes de Inteligencia Artificial o desarrolladores que retomen el trabajo en este repositorio.

## 📌 Contexto del Proyecto
**Tasa del Día** es una aplicación multiplataforma para consultar tasas de cambio en Venezuela (BCV, Paralelo, Binance P2P, Euro).
El proyecto se divide en dos partes:
1. `tasa-del-dia/`: Aplicación móvil (Android) usando React Native (Expo SDK 54).
2. `tasa-del-dia-desktop/`: Aplicación de escritorio (Windows .exe) usando Python y Tkinter.

## 🚀 Últimos Cambios Realizados (Sesión Actual)
En la última sesión de trabajo, nos enfocamos en la aplicación móvil (`tasa-del-dia/`) y se implementaron las siguientes características:

1. **Pestaña de Historial (History Tab)**:
   - Se creó `src/screens/HistoryScreen.js`.
   - Se añadió a la navegación principal (Bottom Tabs) en `App.js`.
   - Incluye un gráfico de líneas (usando `react-native-chart-kit` y `react-native-svg`) para visualizar la tendencia de las tasas (BCV y Paralelo) de los últimos 7 días.
   - Muestra una lista hacia abajo con todas las fechas anteriores guardadas.
   - Se eliminó el botón de modal antiguo en `RatesScreen.js` para limpiar la interfaz.

2. **Autoguardado en Segundo Plano**:
   - Se implementó `expo-background-fetch` y `expo-task-manager` en `src/services/backgroundTasks.js`.
   - La tarea obtiene las tasas y las guarda automáticamente en el historial (`AsyncStorage`) periódicamente, incluso sin necesidad de abrir la aplicación.

3. **Solución de Errores de Compilación (CI/CD)**:
   - **Dependencias**: Se agregó un `.npmrc` con `legacy-peer-deps=true` para solucionar conflictos de versiones con React 19 en Expo SDK 54.
   - **GitHub Actions**: Se modificó `.github/workflows/build-apk.yml`. Como la cuenta de EAS alcanzó el límite de compilaciones gratuitas en la nube, la Acción ahora compila el APK *localmente* en los servidores de Linux de GitHub (`eas build --local`), lo que es completamente gratuito y automático.
   - **Carpeta Android**: Se eliminó la carpeta nativa `android/` del repositorio. Esto obliga al servidor de GitHub a ejecutar `npx expo prebuild` de forma limpia cada vez, asegurando que los ejecutables (como `gradlew`) se generen con los saltos de línea de Linux (`LF`), evitando errores de `bad interpreter` en los flujos de CI/CD al trabajar desde Windows.

## 🛠️ Estado Actual y Flujo de Trabajo
- Todo el código está funcionando, *commiteado* y subido a la rama `main`.
- **Generación de APK**: Para obtener el instalador para Android, simplemente haz `push` a la rama `main` de GitHub. Ve a la pestaña **Actions**, busca la última ejecución y descarga el archivo `TasaDelDia.apk` en la sección de artefactos.
- **Ejecución Local**: Ve a la carpeta `tasa-del-dia/` y ejecuta `npx expo start` o `npm start`.

## ⏭️ Siguientes Pasos Posibles
Si deseas continuar con el desarrollo, puedes considerar:
- **App de Escritorio**: Actualizar la versión de Python (`tasa-del-dia-desktop`) para incorporar el historial de tasas visual en Windows.
- **Mejoras UI**: Personalizar la visualización de los gráficos (por ejemplo, hacer que se puedan ver más de 7 días seleccionando un rango).
- **Notificaciones**: Mejorar el sistema de notificaciones integrado para alertar activamente si hay un pico repentino en el paralelo.

---
*Fin del documento de traspaso.*
