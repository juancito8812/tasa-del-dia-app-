---
name: check-build-apk
description: Verifica el estado del último build APK en GitHub Actions. Use when necesites saber si el APK de la app móvil se compiló correctamente o quieras revisar errores de build.
---

# Check Build APK — GitHub Actions

Verifica el estado del workflow "Build APK (React Native)" en GitHub Actions.

## Workflow

1. **Navegar a GitHub Actions**:
   Abrir `https://github.com/juancito8812/tasa-del-dia-app-/actions` en el navegador.

2. **Identificar el workflow**:
   Buscar el workflow **"Build APK (React Native)"** — es el que compila la app móvil cuando hay cambios en `tasa-del-dia/`.

3. **Interpretar el estado**:
   - ✅ **Verde (pasó)**: El APK se generó correctamente. Está disponible en los artifacts de la ejecución.
   - ❌ **Rojo (falló)**: Revisar los logs del step que falló. Errores comunes:
     - `private properties are not supported` → Hermes no soporta `#private` fields. Mover el paquete offending a `devDependencies`.
     - `expo doctor` falla → Versiones de dependencias no alineadas con la SDK. Ejecutar `npx expo install --check`.
   - ⏳ **Amarillo (en progreso)**: El build puede tomar 15-30 minutos.

4. **Descargar el APK** (si pasó):
   Ir a la ejecución → sección "Artifacts" → descargar `TasaDelDia.apk`.

## Troubleshooting

- **Build falla con exit code 1 pero no hay error visible**: Expandir los steps en GitHub Actions. El error real está arriba, no en la línea final.
- **"sharp" causa error en Hermes**: Mover `sharp` de `dependencies` a `devDependencies` en `package.json`.
- **Versiones de paquetes incorrectas**: Alinear con Expo SDK 54 usando `~54.x.x` en vez de `^56.x.x`.
- **Workflow no se dispara**: Verificar que los cambios estén en `tasa-del-dia/` (el trigger del workflow).
