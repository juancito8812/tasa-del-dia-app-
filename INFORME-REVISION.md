# Informe de revisión — Tasa del Día (React Native / Expo)

Fecha: 2026-10-14 · Versión revisada: **1.6.9** · Rama: `main`
Alcance: calidad, seguridad y lógica. Método: revisión de código de 5 ejes (correctitud, legibilidad, arquitectura, seguridad, rendimiento) + verificación real.

## Verificación ejecutada
| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 errores** |
| `npx eslint .` | **limpio** |
| `npx jest` | **554/554 tests OK** (34 suites) |
| Secretos en repo (git grep) | **ninguno** |
| APKs en git | **no trackeados** (`.gitignore` los cubre) |

Nota: Jest avisa `worker process failed to exit gracefully` (timers sin cerrar). Higiene de tests, no un fallo.

## Veredicto
**No hay vulnerabilidades críticas ni explotables.** Postura de seguridad sólida para una app cliente: solo HTTPS, `usesCleartextTraffic=false`, sin secretos, sin `eval`/inyección, salidas escapadas por RN. Los problemas reales son de **privacidad de datos en reposo**, **duplicación de UI** y **una inconsistencia de datos del historial**.

---

## 1. Seguridad

### [S1] PII bancaria almacenada sin cifrar — **Medio**
- **Ubicación**: `src/services/bankData.js` (`AsyncStorage` `@bank_accounts`), `src/services/api.js`.
- **Issue**: cédula, teléfono, cuentas, emails, direcciones wallet y PayPal se guardan en texto plano en AsyncStorage (sin cifrado). El manifest Android trae `android:allowBackup="true"`, por lo que un `adb backup` (o un dispositivo rooteado) expone todos esos datos.
- **Fix**: usar `expo-secure-store` para las cuentas (o cifrar el blob), y `android.allowBackup=false` (config plugin / `expo-build-properties`). Como mínimo, documentar el modelo de amenaza.

### [S2] Auto-actualización instala el APK sin verificar integridad — **Medio**
- **Ubicación**: `src/services/autoUpdate.js:135` (`downloadAndInstall`), permiso `REQUEST_INSTALL_PACKAGES`.
- **Issue**: descarga el APK desde `browser_download_url` de GitHub Releases y lo pasa al instalador. No se valida hash ni firma (solo confía en el repo y en la verificación nativa de Android al reinstalar). Un asset de release comprometido se instalaría.
- **Fix**: publicar el SHA-256 del APK en las notas/asset y compararlo antes de `startActivityAsync`; idealmente verificar el `signingCertificate` esperado.

### [S3] Permisos amplios en el manifest generado — **Bajo / verificar**
- **Ubicación**: `android/app/src/main/AndroidManifest.xml` (carpeta gitignored, la regenera EAS).
- **Issue**: aparecen `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, que no corresponden a funcionalidad visible de la app. `app.config.js` declara `permissions: ['POST_NOTIFICATIONS','REQUEST_INSTALL_PACKAGES']`; conviene confirmar que el build de release NO arrastra las de más y quitarlas.

### [S4] GitHub Actions sin fijar a SHA — **Bajo**
- **Ubicación**: `.github/workflows/*.yml` (`actions/checkout@v4`, `@v6`, etc.).
- **Fix**: fijar a commit SHA para inmunizar contra tags mutables (supply-chain CI). `auto-sync.yml` en cambio está muy bien blindado (rama fija, `-uno`, `add -u` con exclusiones, `pull --rebase`, sin `--force`).

---

## 2. Lógica y correctitud

### [L1] Guardar "BCV Lunes" corrompe el BCV del día en el historial — **Medio**
- **Ubicación**: `src/hooks/useRatesData.js:182` → `saveHistoricalRate(getTodayKey(), { bcv: parsed })`.
- **Issue**: el valor manual de "BCV Lunes" se guarda en el campo `bcv` del historial de **hoy**, el mismo campo que escribe el auto-guardado con la tasa BCV oficial (`useRatesData.js:120-126`). Quien corra último gana → el gráfico/lista de Historial muestra la tasa del lunes como si fuera el BCV oficial del día, de forma no determinista.
- **Fix**: guardar el valor en un campo propio (`bcv_lunes`) y renderizarlo aparte, o (si la intención es que el lunes manda) no auto-sobrescribir `bcv` ese día y documentarlo.

### [L2] `useRatesData` montado dos veces → doble efecto — **Bajo/Medio**
- **Ubicación**: `src/screens/RatesScreen.js:89` y `src/screens/PayPalCalculatorScreen.js:35`.
- **Issue**: la pantalla "Calculadora PayPal" instancia el hook completo solo para leer `data`. Cada instancia corre su propio `saveHistoricalRate` (efecto de auto-guardado) y su propio bucle de reintento offline (hasta 10 intentos con backoff). Son escrituras y timers duplicados, y efectos secundarios en una pantalla que debería ser de solo lectura. `fetchAllData` sí deduplica la red, pero no los efectos.
- **Fix**: extraer un `useRates()` ligero (solo lectura/caché) para consumidores que no editan, o mover auto-guardado/retry a un provider único.

### [L3] Prefijo de documento omitido al copiar Pago Móvil — **Bajo**
- **Ubicación**: `src/services/bankData.js:81` (`formatAccountText` usa `account.numeroDocumento` sin el tipo).
- **Issue**: la tarjeta muestra `V-12345678` (`formatDocument`) pero el texto copiado/compartido solo lleva `12345678` — inconsistencia que puede confundir al pagador.
- **Fix**: usar `formatDocument(tipoDocumento, numeroDocumento)` en el texto.

### [L4] `vueltoBs` puede salir negativo — **Bajo (documentado)**
- **Ubicación**: `src/constants/paypalFees.js:88`, mostrado en `PayPalCalculatorScreen` como "Vuelto / saldo a favor".
- **Fix**: clamp a 0 o etiquetar "faltante" cuando sea < 0.

---

## 3. Arquitectura y calidad

### [Q1] Duplicación masiva de UI entre temas — **Alto (mantenibilidad)**
- **Ubicación**: `src/ui/{terminal,editorial,fintech}/` son **copias casi completas** de `src/screens/*` y `src/components/*`.
- **Evidencia** (líneas que difieren del base):
  - `terminal/ConverterScreen.js` **566**, `terminal/RateCard.js` **485**, `terminal/RatesScreen.js` **331**, `terminal/HistoryScreen.js` **314**.
  - `fintech/RateCard.js` 259, `fintech/ConverterScreen.js` 203, `editorial/RateCard.js` 198.
- **Bueno**: la lógica sí está compartida (importan `useRatesData`, `useConverterData`, `utils`, `services`); solo el JSX/estilos se duplican.
- **Riesgo**: un bug de UI hay que arreglarlo 4 veces; ya hay drift (p. ej. `CustomTabBar` reutilizada pero `UpdateModal`/`RateCard` no). Es el mayor pasivo técnico del proyecto.
- **Fix**: unificar en componentes base + `style factory` por tokens (`createStyles(C, theme)`), o `variant`/registry. Migrar de a un componente por PR. No hace falta reescribir de golpe.

### [Q2] Archivos grandes — **Medio**
- `BankAccountForm.js` **809**, `PayPalCalculatorScreen.js` **801**, `api.js` **490**.
- **Fix**: `BankAccountForm` → extraer `TextField`, `BankPicker`, `SegmentedControl`; `PayPalCalculatorScreen` → extraer las secciones `PayPalResultCard`/`BsPurchaseCard`; `api.js` → dividir en `ratesApi` / `cache` / `history`.

### [Q3] Lógica de color y variantes repetida — **Bajo**
- El criterio `diffPercent > 15 ? highlight : > 8 ? warning : success` se repite (`useConverterData`, `RatesScreen`, spreads). Extraer un helper `severityColor(pct, C)`.
- `RateCard` resuelve 3 tamaños con cadenas de ternarios (`size === 'large' ? ... : ...`) largas; un mapa de estilos por tamaño lo aclara.

---

## 4. Rendimiento
- **Bueno**: dedupe de fetch en vuelo (`fetchAllDataInFlight`), SWR (muestra caché y revalida), lazy-mount de pestañas, `BlurView` solo en el hero, `AnimatedNumber` animando solo el hero, memoización amplia (`React.memo`, `useMemo`, handlers estables).
- **P1 (Bajo)**: `HistoryListItemView` crea `createStyles(C)` por ítem vía `useMemo` (hasta 10 objetos); subir `createStyles` a un `useMemo` del padre y pasar `styles` por prop.
- **P2 (Bajo)**: `useFintechFonts` (que llama `useFonts`) se invoca en ~9 componentes; expo-font cachea, pero conviene cargar una vez en un provider.

## 5. Accesibilidad
- **A1 (Medio)**: solo ~10 `accessibilityLabel` en toda la app. Botones icon-only sin etiqueta (editar/eliminar cuenta, copiar, pegar, FAB "+", cerrar modales) → inaccesibles para lectores de pantalla.
  **Fix**: `accessibilityLabel` + `accessibilityRole="button"` en cada `TouchableOpacity` de solo icono.
- **Bueno**: `useReduceMotion` respeta "reducir movimiento" del sistema y se aplica en modales/sheets/hero.

---

## Priorización sugerida
1. **L1** (corrupción de datos del historial) — arreglo pequeño y de alto impacto.
2. **S1** (cifrado/allowBackup de PII) — privacidad.
3. **A1** (labels de accesibilidad) — bajo costo.
4. **Q1** (duplicación de temas) — plan por fases, el pasivo más grande.
5. **S2/S3/S4, L2, Q2** — endurecimiento y limpieza incremental.

---

## Estado de correcciones (2026-10-15)
Aplicado y verificado (**560/560 tests, tsc 0, ESLint limpio**). L3 no se toca (decisión del dueño).

| ID | Estado | Cambio |
|---|---|---|
| S1 | ✅ | Cuentas bancarias cifradas con `SecureStore` (Keystore), una por clave, con migración desde el blob antiguo (`bankData.js`). `allowBackup=false` (`app.config.js`). Requiere **rebuild nativo** (nuevo módulo). |
| S2 | ✅ | `isTrustedApkUrl()`: solo APKs HTTPS de hosts GitHub antes de descargar/instalar (`autoUpdate.js`) + tests. |
| S3 | ✅ | `blockedPermissions` para READ/WRITE_EXTERNAL_STORAGE y SYSTEM_ALERT_WINDOW (`app.config.js`). |
| S4 | ✅ | Acciones de CI fijadas a commit SHA en los 4 workflows. |
| L1 | ✅ | El "BCV Lunes" se guarda en `bcv_lunes`; ya no sobreescribe el `bcv` oficial (`api.js`, `useRatesData.js`) + test de regresión. |
| L2 | ✅ | Un solo `useRatesData` vía `RatesContext` (App envuelve; Tasas y PayPal consumen). |
| L4 | ✅ | Vuelto negativo se etiqueta "Faltante por cubrir" (`PayPalCalculatorScreen`). |
| Q3 | ✅ | `getSeverityKey()` centraliza los umbrales >15/>8 (usado en base + editorial + fintech) + test. |
| P1 | ✅ | Items del historial reutilizan los `styles` del padre. |
| P2 | ✅ | Fuentes fintech cargadas una vez en `FintechFontsProvider`. |
| A1 | ✅ | `accessibilityLabel`/`accessibilityRole` en botones solo-icono (BankAccountCard, RateCard base+temas, FAB, cerrar modales, DateDetailCard). |
| Q1/Q2 | 📋 | Plan por fases en `PLAN-REFACTOR-Q1-Q2.md`. |

### Nuevo hallazgo (no corregido) — dependencias de build
`npm audit` reporta **2 críticos / 32 altos** en producción, pero son del **toolchain** (Expo CLI,
Metro, Jest, `tar`, `shell-quote`), no del bundle que se embarca en el APK. La mayoría con
`npm audit fix` (sin `--force`). Se puede aplicar en un PR aparte; no toqué el lock para no
arriesgar el build.

### Notas de despliegue
- `expo-secure-store` exige **recompilar** (prebuild + build). Un build viejo sin el módulo nativo
  fallará al leer cuentas; el resto de la app no depende de él.

## Lo que está muy bien
Separación lógica(compartida)/UI(temas); servicios con timeouts, caché, fallback offline y retry; dedupe de red; tests amplios (554) verdes; CI con guardas en el auto-commit; sin secretos ni `console.log` de datos sensibles; solo HTTPS.
