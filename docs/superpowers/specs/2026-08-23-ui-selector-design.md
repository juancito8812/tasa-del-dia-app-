# Spec: Selector de diseño de interfaz (3 estilos conmutables)

**Fecha:** 2026-08-23
**Estado:** Aprobado en brainstorming (diseños completos · toggle cíclico · Terminal también en claro)
**Rama de trabajo prevista:** `feature/ui-selector` (desde `feature/ui-editorial`)

## 1. Problema

La app tiene hoy un solo lenguaje visual (paleta "Venezuela 2026" glass). Existen dos
rediseños monocromos aprobados pero incompatibles entre sí: **Terminal** (rama
`feature/ui-monocromo`, commiteado) y **Editorial** (working tree sin commitear).
Se quiere que el usuario elija su diseño desde la app, sin reinstalar ni tocar ajustes
del sistema.

## 2. Objetivos

- Los 3 diseños conviven en una sola APK: **Original**, **Terminal**, **Editorial**.
- El usuario cambia de diseño con un botón, al instante, sin perder datos.
- La preferencia persiste entre sesiones (AsyncStorage).
- Cada diseño se muestra completo y fiel: estructura, tipografía y layout propios,
  no solo colores.

## 3. No objetivos

- No hay pantalla de Ajustes (el toggle cíclico es la única vía por ahora).
- Splash y ErrorBoundary conservan sus colores neutros actuales (hardcodeados).
- Sin cambios en servicios, API de tasas, notificaciones ni distribución (Galaxy Store).

## 4. Decisiones de diseño (aprobadas)

| Decisión | Elección |
|---|---|
| Fidelidad | **Diseños completos**: componentes-variante por estilo (tab bar textual del Terminal, hero invertido, header serif, etc.) |
| Control | **Toggle cíclico** junto al `ThemeToggleMini` en el header de Tasas: `original → terminal → editorial → original` |
| Modos | Los 3 estilos soportan oscuro y claro. La paleta clara del Terminal es **nueva** (Sección 8) |

## 5. Arquitectura

El estilo Original **no se mueve** de su ubicación actual (`src/screens/`,
`src/components/`, `constants/themes.js`). Los diseños nuevos viven en carpetas aditivas:

```
src/ui/
  index.js              ← registro: 'original'|'terminal'|'editorial' → paquete activo
  terminal/
    palette.js          ← { dark, light }
    RatesScreen.js  ConverterScreen.js  HistoryScreen.js
    RateCard.js  RatesHeader.js  CustomTabBar.js  ScreenContainer.js
    BCVModal.js  UpdateModal.js  DateDetailCard.js  HistoryChart.js
  editorial/
    palette.js          ← { dark, light }
    …(mismo set que terminal/)
```

- **Registro** (`src/ui/index.js`): `getUiPackage(uiStyle)` devuelve
  `{ palette, Screens: { RatesScreen, ConverterScreen, HistoryScreen }, TabBar }`.
  Para `original`, resuelve los módulos existentes; para los otros dos, las carpetas nuevas.
  Caso particular: Editorial no reescribió la tab bar, por lo que su paquete usa el
  `CustomTabBar` existente (se re-estila solo vía tokens); Terminal aporta su tab bar
  textual propia.
- **Compartido e intacto:** hooks, servicios, utils, contextos, `AnimatedNumber`,
  `PressableScale`. La lógica de negocio no se duplica.
- **App.js** consume el registro y monta `<Pkg.Screens.* />` en cada tab y pasa
  `tabBar={Pkg.TabBar}` al navegador. La navegación (3 tabs) no cambia.

Los archivos de `terminal/` provienen casi tal cual de `feature/ui-monocromo`
(`git checkout feature/ui-monocromo -- <paths>` + recolocación); los de `editorial/`
del working tree actual de `feature/ui-editorial`.

## 6. Estado y persistencia

Se **extiende `ThemeContext`** (no se crea otro provider) porque los colores dependen
de dos ejes: `(estilo, modo)`.

```js
useTheme() → {
  colors, isDark, themePref, setTheme,   // eje modo (existente)
  uiStyle, setUiStyle,                    // eje estilo (NUEVO)
}
```

- Nueva clave AsyncStorage: `@tasa_del_dia_ui_style`.
- Valores válidos: `'original' | 'terminal' | 'editorial'`. Default: `'original'`.
  Valores inválidos/corruptos: ignorados → default (patrón ya usado para el tema).
- Resolución memoizada: `colors = PALETTES[uiStyle][modo]`.
- El gate anti-flash de `App.js` espera ambas preferencias cargadas antes del primer render.
- Al cambiar de estilo se reutiliza el fade animado existente para cambios de tema.
- `setUiStyle` persiste inmediatamente (mismo patrón que `handleSetTheme`).

## 7. Botón selector

- Ubicación: header de Tasas, junto a `ThemeToggleMini`. **Presente en las 3 variantes**
  del header para poder cambiar siempre.
- Toque: cicla estilo + feedback háptico + fade global.
- Icono según estilo activo (Ionicons): `ellipse-outline` = Original,
  `code-slash` = Terminal, `book` = Editorial.
- Accesibilidad: `accessibilityLabel` dinámico — "Diseño actual: X. Toca para cambiar a Y".
- Estilizado propio en cada variante (pill glass / `[TERM]` en corchetes / subrayado serif).

## 8. Paleta Terminal clara (nueva)

Misma monoespaciada, barras y bloques invertidos que el dark aprobado:

| Token | Dark (aprobado) | Light (nuevo) |
|---|---|---|
| Fondo primario | `#000000` | `#FFFFFF` |
| Superficie secundaria | `#101010` | `#F2F2F2` |
| Texto principal | `#FFFFFF` | `#111111` |
| Texto secundario/muted | grises sobre negro | `#444444` / `#888888` |
| Bloque hero invertido | fondo blanco + texto negro | fondo negro + texto blanco |
| Track de barras | `#222222` | `#E0E0E0` |
| Acentos (monocromo único) | `#FFFFFF` | `#111111` |
| Bordes | `rgba(255,255,255,0.12)` | `rgba(0,0,0,0.15)` |

Contrato: ambas variantes exponen las mismas ~32 claves de tokens que el resto de los
temas (incluyendo `onAccent`, `dimmed`, `barTrack`). El registro valida ese contrato.

## 9. Plan de integración (ramas)

1. ✅ Limpiar estado git huérfano (rebase + cherry-pick del 18-ago) — hecho.
2. Commitear el trabajo Editorial en `feature/ui-editorial`.
3. Crear `feature/ui-selector` desde ahí (ya contiene main + Galaxy Store + Editorial).
4. Trasladar archivos Terminal desde `feature/ui-monocromo` a `src/ui/terminal/`.
5. Implementar registro + eje `uiStyle` + botón + paleta Terminal clara.
6. QA: tests completos, typecheck, lint, build de APK de prueba.

## 10. Casos borde

- Cambiar de estilo remonta las pantallas: el estado efímero (p. ej. el buscador del
  Historial) se reinicia. Aceptable y documentado.
- Preferencia corrupta en AsyncStorage → cae a `original` sin crash.
- Primer arranque sin preferencia guardada → `original` (comportamiento idéntico al actual).
- Los mocks de tests que fijan la paleta vieja siguen válidos para las suites del Original;
  las suites nuevas usan las paletas propias de cada estilo.

## 11. Testing

- **Contexto:** nuevos casos con molde `ThemeContext.test.js`: persistir `uiStyle`,
  cargarlo al montar, ignorar valor inválido, resolver `colors` por `(estilo, modo)`.
- **Contrato del registro:** test que recorre los 3 estilos × 2 modos y verifica que
  cada paleta expone todas las claves requeridas y que el paquete resuelve pantallas+tab bar.
- **Componentes:** portar/adaptar suites relevantes para Terminal y Editorial mockeando
  su paleta; las suites existentes del Original no se tocan.
- **Meta:** suite completa verde (~190 tests actuales + nuevos), typecheck 0 errores
  (`checkJs: true`), lint sin errores nuevos.
