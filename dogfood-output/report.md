# Reporte de QA — Tasa del Día v1.4.6

**Dispositivo:** Samsung Galaxy A12 (SM-A125M, Android 12, SDK 31) vía adb
**Build probada:** `TasaDelDia-v1.4.6.apk` (release oficial GitHub, firma EAS SHA-256 `299073e3…`, versionCode 10406)
**Fecha:** 20-Ago-2026 · **Método:** uiautomator dump + input tap/swipe + logcat (QA funcional, sin inspección visual directa)

> Nota de instalación: el A12 tenía la v1.4.5 con firma **debug** (`fac61745…`); se desinstaló e instaló la v1.4.6 EAS (los datos locales de la app en el teléfono se borraron; el histórico se recarga de DolarApi).

## Resumen ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| Crítico | 0 |
| Alto | 0 |
| Medio | 1 |
| Bajo | 4 |
| Info/Observaciones | 3 |

**Resultado general:** la app es **estable**: 0 crashes, 0 errores JS en logcat durante toda la sesión (~1h de uso intensivo), arranque rápido con datos al instante (SWR), offline sólido, matemática de conversión/gasolina/brechas correcta. 1 bug de consistencia entre pestañas (medio) y 4 mejoras de UX (bajas).

## Alcance probado

- Pantalla Tasas: hero BCV en vivo, Paralelo, Euro, Binance P2P, BCV (Lunes), chips de brechas, switch de recordatorio, gasolina (1/5/10/20/30 L), toggle tema
- Conversor: modos USD→Bs / Bs→USD, decimales con coma, quick amounts adaptativos, cambio de tasa, Pegar, Copiar resultado
- Historial: chips últimos 10 días, chart (932 registros), detalle por día, copiar/copiar todo, lista de días
- BCV (Lunes): modal de edición, guardado, persistencia
- BackHandler Android (navegación entre pestañas)
- Modo offline (avión/Wi-Fi off) y reconexión

---

## ISSUE 1 — [MEDIO] BCV (Lunes) guardado no se refleja en el Conversor hasta reiniciar

- **Categoría:** Funcional · Consistencia entre pestañas
- **Dónde:** Tasas → editar BCV (Lunes) → Conversor
- **Descripción:** tras guardar una tasa del lunes en Tasas, la fila "BCV (Lunes)" del Conversor muestra **"Cargando…" indefinidamente** (aunque el valor guardado ya se muestra en la tarjeta de Tasas). Solo se actualiza tras `force-stop` + reinicio (verificado: tras reiniciar muestra 780,50).
- **Reproducción:**
  1. Abrir app → pestaña Conversor (monta `useConverterData`)
  2. Ir a Tasas → tap en icono de edición de "BCV (Lunes)" → escribir tasa → Guardar
  3. Volver al Conversor → fila "BCV (Lunes): Cargando…" sin actualizar
- **Esperado:** el valor guardado debe aparecer al instante (o al re-montar la pestaña).
- **Causa probable:** `useConverterData.loadRates()` solo lee `getStoredBCVLunes()` en el montaje (src/hooks/useConverterData.js:48-51); el estado `rates.bcv_lunes` queda en `null` cuando el guardado ocurre después del montaje. Las pestañas son lazy-mount (solo se montan al visitarlas), por lo que si el usuario guarda el lunes desde Tasas *después* de haber montado el Conversor, este no se entera.

---

## ISSUE 2 — [BAJO] Validación de monto inválido usa Alert nativo del sistema

- **Categoría:** UX
- **Dónde:** Conversor → Convertir con monto 0/vacío
- **Descripción:** aparece un diálogo del sistema "Error — Ingresa un monto válido" con botón OK, rompiendo la estética glass de la app (el resto de la UI usa componentes propios).
- **Reproducción:** cambiar a modo Bs→USD (el input se reinicia a 0) → tocar Convertir.
- **Sugerencia:** validación inline (borde rojo + mensaje en la tarjeta) o toast con estilo de la app. (src/hooks/useConverterData.js:107-109)

## ISSUE 3 — [BAJO] Montos pequeños en Bs→USD se redondean a 0,00 USD

- **Categoría:** Funcional (precisión de display)
- **Dónde:** Conversor, modo Bs→USD
- **Descripción:** el resultado fijo a 2 decimales convierte montos pequeños en ceros engañosos: 1,5 Bs → "0,00 USD"; 6 Bs → "0,01 USD" (real: 0,0077). El usuario puede creer que la conversión falló.
- **Sugerencia:** mostrar 4+ decimales (o notación compacta) cuando el resultado < ~0,1, o un aviso "menos de 0,01 USD".

## ISSUE 4 — [BAJO] Modal BCV (Lunes): el teclado tapa los botones Guardar/Cancelar

- **Categoría:** UX
- **Dónde:** Tasas → editar BCV (Lunes)
- **Descripción:** con el teclado abierto, los botones quedan detrás del teclado y el tap no llega (reproducido: el primer tap en Guardar no hizo nada; solo funciona tras cerrar el teclado con BACK). A pesar de `windowSoftInputMode=adjustResize` (verificado en el manifest), el Modal de RN no se redimensiona.
- **Sugerencia:** `KeyboardAvoidingView` en el modal, o anclar los botones al contenido (scroll) para que queden accesibles con teclado abierto.

## ISSUE 5 — [BAJO] Prefill del modal BCV (Lunes) muestra "780.5" en vez de "780,50"

- **Categoría:** UX / Formato
- **Dónde:** Tasas → editar BCV (Lunes) tras guardar 780,50
- **Descripción:** al reabrir el modal, el valor aparece con punto decimal y sin los ceros (`780.5`), inconsistente con el formato local es-VE usado en el resto de la app (`780,50`). El parseo de guardado es correcto (780,50 → 780.5 float), solo falla el formateo del prefill (`String(tasaBCVLunes)`).
- **Sugerencia:** formatear con `toLocaleString('es-VE')` en el prefill.

---

## Observaciones (INFO, no bugs)

1. **"?" y hero BCV no responden al tap**: el nodo es `clickable` en la jerarquía pero no abre nada; el "?" parece decorativo. Verificar intención (¿debería abrir info de la fuente?).
2. **Hora del Euro**: muestra "12:00 a.m." mientras BCV/Paralelo muestran la hora actual (13:47). Es la hora que reporta el API (`eurCapturedAt`) — verificar si DolarApi entrega ese campo correctamente o si hay un fallo de parsing.
3. **Scroll "que no funcionaba"**: falsa alarma del QA — en algunos estados el contenido cabe en pantalla y el ScrollView no tiene recorrido (comportamiento correcto). No es bug.

## Verificado y CORRECTO

| Área | Resultado |
|---|---|
| Tasas en vivo | BCV 777,42 · Paralelo 877,35 · Euro 906,83 · Binance P2P 912-913 (varía por fetch) |
| Gasolina (Tasas) | 1L 388,71 · 5L 1.943,54 · 10L 3.887,08 · 20L 7.774,16 · 30L 11.661,24 — consistentes con la tasa interna (777,4161) |
| Brechas | "BCV: 12.9%" y tras guardar lunes "Lunes: 12.4%" (877,35/780,50−1) — matemática correcta |
| Conversor USD→Bs | 100 USD → 77.741,61 Bs (tasa interna ×100) |
| Conversor Bs→USD | 6 Bs → 0,01 USD; modo y quick amounts se recalculan al cambiar tasa (BCV 777,42 → Paralelo 877,35: 50.000 → 64 → 57) |
| Decimales con coma | 1,5 × 877,35 = 1.316,02 Bs ✓ |
| Pegar | pega "853,85" del clipboard con coma ✓ |
| Historial | 932 registros, chips 10 días, detalle por día (16/08 Dom sin BCV/Euro — correcto), Copiar/Copiar todo |
| BCV (Lunes) | guardado + persistencia tras reinicio ✓ |
| Recordatorio viernes | toggle Off→"Vie 6PM", notificación `RTC_WAKEUP` agendada (viernes 18:00, expo.notifications) ✓, desactivación ✓ |
| BackHandler | Historial→Conversor→Tasas→cierra app ✓ |
| Offline | banner "Sin conexión — Mostrando últimas tasas (hora)" + datos al instante + conversión offline OK |
| Reconexión | banner desaparece, tasas frescas (1:47 p.m.) ✓ |
| Estabilidad | 0 FATAL, 0 errores ReactNativeJS, 0 errores de red en toda la sesión |

## Notas de prueba

- El QA fue funcional vía uiautomator/logcat (el modelo no puede inspeccionar imágenes); captura `screenshots/qa-01-tasas.png` disponible para revisión visual humana.
- El A12 quedó con la **v1.4.6 oficial (firma EAS)** instalada y la app detenida; red restaurada.
- La tasa de prueba del BCV (Lunes) **780,50 quedó guardada** en el dispositivo — si se quiere estado limpio, borrar datos de la app.

---

## Estado de los hallazgos — 20-Ago-2026

| Hallazgo | Estado | Fix |
|---|---|---|
| ISSUE 1 (MEDIO) BCV Lunes → Conversor | ✅ Arreglado | pub/sub `subscribeBcvLunes`/`emitBcvLunesChanged` (api.js) — useRatesData emite al guardar, useConverterData actualiza `rates.bcv_lunes` al instante |
| ISSUE 2 Alert nativo validación | ✅ Arreglado | `validationError` inline (rojo bajo botón Convertir) + `loadError` inline en header — sin Alert |
| ISSUE 3 Bs→USD redondeo 0,00 | ✅ Arreglado | `formatCurrencySmart` — hasta 6 decimales cuando el valor < 1 (1,5 Bs → "0,0017 USD") |
| ISSUE 4 teclado tapa botones modal | ✅ Arreglado | `KeyboardAvoidingView behavior="height"` en Android (Modal RN no responde a adjustResize) |
| ISSUE 5 prefill "780.5" | ✅ Arreglado | prefill con `formatCurrency` es-VE → "780,50" |
| Obs 1 hero "?" clickeable | ✅ Arreglado | solo se envuelven en PressableScale las tarjetas con `onEdit`; el "?" no existe en el código |
| Obs 2 hora Euro 12:00 a.m. | ✅ Verificado — no es bug | DolarApi entrega `fechaActualizacion: 00:00-04:00` (medianoche Caracas, publicación diaria del euro) |
| Obs 3 scroll | ✅ Verificado — no es bug | contenido que cabe en pantalla, comportamiento correcto |

**Verificación:** 186 tests ✅ · `expo lint` 0 warnings ✅ · `tsc --noEmit` ✅ (20-Ago-2026).

---

## Verificación en dispositivo — v1.4.7 (20-Ago-2026)

**Build:** `TasaDelDia-v1.4.7.apk` (EAS local, firma `299073e3…` verificada con apksigner, versionCode 10407). Instalada sobre la v1.4.6 con `adb install -r` (sin borrar datos — la tasa 780,50 persistió).

| Fix | Verificación en el A12 | Resultado |
|---|---|---|
| ISSUE 1 (pub/sub BCV Lunes) | Guardé 800 en Tasas → abrí Conversor → "BCV (Lunes), Bs. 800,00" al instante, sin reiniciar; conversión 15 Bs ÷ 800 = 0,01875 correcta | ✅ |
| ISSUE 2 (validación inline) | Convertir con monto vacío → "Ingresa un monto válido" inline bajo el botón; sin diálogo nativo | ✅ |
| ISSUE 3 (decimales < 1) | 15,00 Bs → **0,01875 USD** (antes 0,02) | ✅ |
| ISSUE 4 (teclado tapa botones) | Con teclado abierto: Guardar/Cancelar visibles (y≈955); Guardar funcionó al primer toque | ✅ |
| ISSUE 5 (prefill es-VE) | Modal reabierto → "780,50" (antes "780.5") | ✅ |
| Obs 1 (hero clickeable) | "?" del hero ahora `clickable="false"` en la jerarquía uiautomator | ✅ |

**Post-prueba:** tasa restaurada a 780,50 en el dispositivo.

**Publicación:** commit `277bc9f` → main; tag/release **v1.4.7** vía `release-automatic.yml` (build EAS en CI, verificación de firma, APK `TasaDelDia-v1.4.7.apk` subido). Changelog automático vacío (tag pre-existente) → notas editadas con `gh release edit`.

---

## QA full — release oficial v1.4.7 (20-Ago-2026, segunda pasada)

**Build probada:** APK oficial de la release de GitHub (`TasaDelDia-v1.4.7.apk`, 75,8 MB) — firma EAS `299073e3…` y versionCode 10407 verificados con apksigner/aapt **antes** de instalar. Instalada sobre el build local v1.4.7 con `adb install -r` (sin borrar datos).

| Área | Resultado |
|---|---|
| Tasas en vivo | BCV 777,42 · Paralelo 905,36 · Euro 906,83 · Binance P2P 918,96 ✓ |
| BCV (Lunes) | 800,00 persistió tras reinstalar; brechas correctas (BCV 16,5% · Lunes 13,2% = 905,36/800−1) ✓ |
| Gasolina (BCV) | 1L 388,71 → 30L 11.661,24 consistentes ✓ |
| Conversor USD→Bs | 100 USD × 777,42 = **77.741,61 Bs** ✓ |
| Cambio de tasa | Paralelo 905,36 → 100 USD = **90.535,84 Bs** ✓ |
| ISSUE 3 en release | 1,5 Bs → **0,001657 USD** (6 decimales) ✓ |
| ISSUE 2 en release | monto vacío → "Ingresa un monto válido" inline, sin Alert ✓ |
| ISSUE 1 en release | guardar 810 en Tasas → "BCV (Lunes), Bs. 810,00" en el Conversor al instante ✓ |
| ISSUE 5 en release | modal con prefill "800,00" es-VE ✓ |
| ISSUE 4 en release | teclado abierto (mInputShown=true): Guardar/Cancelar en y≈955; Guardar al primer toque ✓ |
| Historial | 932 registros, chips 10 días, detalle 19/08 (BCV 775,34 · Paralelo 906,81 + Copiar) ✓ |
| Offline | banner "Sin conexión — Mostrando últimas tasas (5:57 p. m.)" + conversor con caché (50 Bs → 0,055227 USD) ✓ |
| Reconexión | banner desaparece tras re-activar red ✓ |
| BackHandler | Conversor → Tasas ✓ |
| Estabilidad | 0 FATAL, 0 errores JS en logcat; RAM 154 MB PSS ✓ |

**Estado final del dispositivo:** v1.4.7 (release oficial), tasa BCV (Lunes) restaurada a 780,50, red activa.
**Limitación:** toggle de tema presionado pero no verificable visualmente (modelo sin visión).