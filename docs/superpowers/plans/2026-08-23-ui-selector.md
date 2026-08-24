# Selector de Diseño de UI — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el usuario cambie al instante entre los diseños Original, Terminal y Editorial desde un botón cíclico, con preferencia persistida.

**Architecture:** Los diseños Terminal y Editorial viven como paquetes de componentes en `src/ui/<estilo>/`; el Original permanece en su ubicación actual. Un registro (`src/ui/index.js`) resuelve el paquete activo según `uiStyle`, un nuevo eje dentro de `ThemeContext` (persistido en AsyncStorage). La lógica de negocio (hooks/servicios/utils) se comparte; solo se duplican archivos visuales.

**Tech Stack:** React Native + Expo, React context, AsyncStorage, jest (preset expo) + react-test-renderer, TypeScript check-js (JSDoc).

**Spec:** `docs/superpowers/specs/2026-08-23-ui-selector-design.md`

## Global Constraints

- Trabajar SIEMPRE en la rama `feature/ui-selector` (se crea en Task 1).
- Comandos de test/lint/typecheck se ejecutan desde `tasa-del-dia/`: `npx jest <ruta>`, `npm run typecheck`, `npm run lint`.
- Prohibido agregar dependencias nuevas (solo hay que usar las existentes).
- El estilo Original NO debe cambiar de comportamiento visual ni romper sus ~190 tests existentes.
- Todos los objetos de paleta exponen las mismas 31 claves (contrato en Task 2).
- Copias de estilo: comentarios de cabecera en español, JSDoc `@type/@property` como el resto del código.
- Commits convencionales en español, estilo del repo (`feat(ui): …`, `test: …`, `docs: …`).
- Nunca ejecutar `git checkout <rama> -- ruta/en/vivo` sobre archivos activos: usar `git show <rama>:<ruta> > <destino>`.
- UI copy y accessibility labels en español.

---

### Task 1: Base git limpia (commits editoriales + rama de trabajo)

**Files:**
- Modify: `.gitignore` (1 línea)
- Create (implícito): snapshot commits en `feature/ui-editorial`

**Interfaces:**
- Produces: rama `feature/ui-selector` basada en Editorial commiteado; tag `editorial-snapshot` apuntando al commit con el working tree Editorial (lo consume Task 5).

- [ ] **Step 1: Verificar estado limpio**

```bash
git status   # debe decir "En la rama feature/ui-editorial", sin rebase/cherry-pick
```

- [ ] **Step 2: Commitear el trabajo Editorial en dos commits**

```bash
git add tasa-del-dia/src/constants/themes.js tasa-del-dia/src/components/
git commit -m "feat(ui): tema editorial monocromo premium (tokens y componentes)"
git add tasa-del-dia/src/screens/
git commit -m "feat(ui): pantallas con estilo editorial"
git tag editorial-snapshot
```

- [ ] **Step 3: Ignorar artefactos de sesión y crear la rama de trabajo**

```bash
printf '\n# Artefactos de sesion brainstorm\n.superpowers/\n' >> .gitignore
git add .gitignore && git commit -m "chore: ignorar artefactos de sesión (.superpowers/)"
git checkout -b feature/ui-selector
```

- [ ] **Step 4: Baseline de tests**

Run: `cd tasa-del-dia && npx jest --silent` 
Expected: todas las suites en verde (~190 tests). Si algo falla aquí, PARAR y arreglar antes de continuar (los fallos serían preexistentes al plan).

---

### Task 2: Paletas por estilo (contrato de 31 claves)

**Files:**
- Modify: `tasa-del-dia/src/constants/themes.js` (agregar 3 tokens a cada tema original)
- Create: `tasa-del-dia/src/ui/editorial/palette.js`
- Create: `tasa-del-dia/src/ui/terminal/palette.js`
- Test: `tasa-del-dia/src/ui/__tests__/palettes.test.js`

**Interfaces:**
- Produces: `darkThemeEditorial`, `lightThemeEditorial` (desde `ui/editorial/palette.js`); `darkThemeTerminal`, `lightThemeTerminal` (desde `ui/terminal/palette.js`). Las consume Task 3 (`ThemeContext`) y Task 9 (mocks de suites).

- [ ] **Step 1: Escribir el test del contrato (falla primero)**

Crear `tasa-del-dia/src/ui/__tests__/palettes.test.js`:

```js
import { darkTheme, lightTheme } from '../../constants/themes';
import { darkThemeEditorial, lightThemeEditorial } from '../editorial/palette';
import { darkThemeTerminal, lightThemeTerminal } from '../terminal/palette';

const REQUIRED_KEYS = [
  'primary', 'secondary', 'accent',
  'cardBg', 'cardBorder', 'glassCard', 'glassTabBar', 'glassOverlay',
  'success', 'glowBcv', 'highlight', 'glowParalelo',
  'info', 'glowEuro', 'warning', 'glowGasolina',
  'bcvLunes', 'glowBcvLunes',
  'textPrimary', 'textSecondary', 'textMuted',
  'inputBg', 'inputBorder',
  'tabBar', 'tabBarBorder',
  'onAccent', 'barTrack', 'dimmed',
  'flagYellow', 'flagBlue', 'flagRed',
];

const PALETTES = [
  ['original/dark', darkTheme], ['original/light', lightTheme],
  ['editorial/dark', darkThemeEditorial], ['editorial/light', lightThemeEditorial],
  ['terminal/dark', darkThemeTerminal], ['terminal/light', lightThemeTerminal],
];

describe.each(PALETTES)('paleta %s', (_name, palette) => {
  it.each(REQUIRED_KEYS)('expone la clave %s', (key) => {
    expect(palette).toHaveProperty(key);
    expect(typeof palette[key]).toBe('string');
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `cd tasa-del-dia && npx jest src/ui/__tests__/palettes.test.js` 
Expected: FAIL — no existen `../editorial/palette` ni `../terminal/palette`.

- [ ] **Step 3: Agregar los 3 tokens nuevos a los temas originales**

En `tasa-del-dia/src/constants/themes.js`, restaurar primero el original y luego extender:

```bash
git show editorial-snapshot:tasa-del-dia/src/constants/themes.js > /tmp/opencode/themes-editorial.js
git show a865e5c:tasa-del-dia/src/constants/themes.js > tasa-del-dia/src/constants/themes.js
```

Dentro de `export const darkTheme` (justo antes de `// Venezuela flag accent`) añadir:

```js
  // Auxiliares compartidos por los diseños Terminal/Editorial
  onAccent: '#ffffff',
  barTrack: 'rgba(255, 255, 255, 0.10)',
  dimmed: '#6b7294',
```

Dentro de `export const lightTheme` (misma posición):

```js
  // Auxiliares compartidos por los diseños Terminal/Editorial
  onAccent: '#ffffff',
  barTrack: 'rgba(0, 0, 0, 0.08)',
  dimmed: '#8a8fa8',
```

- [ ] **Step 4: Crear la paleta Editorial**

Generar `tasa-del-dia/src/ui/editorial/palette.js` desde el snapshot y renombrar exports:

```bash
mkdir -p tasa-del-dia/src/ui/editorial
sed -e 's/export const darkTheme = {/export const darkThemeEditorial = {/' \
    -e 's/export const lightTheme = {/export const lightThemeEditorial = {/' \
    /tmp/opencode/themes-editorial.js > tasa-del-dia/src/ui/editorial/palette.js
```

Luego editar a mano la primera línea del archivo para que el comentario de cabecera diga:

```js
// 🎨 Tasa del Día — Paleta Editorial Financiero (monocromo premium)
// Extraída del rediseño aprobado (snapshot feature/ui-editorial).
```

(El resto del contenido NO se toca: ya tiene las claves `onAccent`, `barTrack`, `dimmed`.)

- [ ] **Step 5: Crear la paleta Terminal (dark de la rama aprobada + light nueva)**

Crear `tasa-del-dia/src/ui/terminal/palette.js` con este contenido completo:

```js
// 🎨 Tasa del Día — Paleta Terminal (monocromo 2 colores)
// Dark: aprobado en feature/ui-monocromo. Light: variante clara aprobada en spec.

export const darkThemeTerminal = {
  primary: '#000000',
  secondary: '#101010',
  accent: '#1a1a1a',

  cardBg: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  glassCard: 'rgba(255, 255, 255, 0.06)',
  glassTabBar: 'rgba(0, 0, 0, 0.9)',
  glassOverlay: 'rgba(255, 255, 255, 0.03)',

  success: '#ffffff',
  glowBcv: 'rgba(255, 255, 255, 0.18)',
  highlight: '#ffffff',
  glowParalelo: 'rgba(255, 255, 255, 0.18)',
  info: '#ffffff',
  glowEuro: 'rgba(255, 255, 255, 0.18)',
  warning: '#ffffff',
  glowGasolina: 'rgba(255, 255, 255, 0.18)',
  bcvLunes: '#ffffff',
  glowBcvLunes: 'rgba(255, 255, 255, 0.18)',

  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#6b6b6b',
  onAccent: '#000000',

  inputBg: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.18)',

  tabBar: '#000000',
  tabBarBorder: 'rgba(255, 255, 255, 0.1)',
  barTrack: '#222222',
  dimmed: '#888888',

  flagYellow: '#e0e0e0',
  flagBlue: '#8a8a8a',
  flagRed: '#b0b0b0',
};

export const lightThemeTerminal = {
  primary: '#ffffff',
  secondary: '#f2f2f2',
  accent: '#e5e5e5',

  cardBg: '#ffffff',
  cardBorder: 'rgba(0, 0, 0, 0.15)',
  glassCard: 'rgba(255, 255, 255, 0.9)',
  glassTabBar: 'rgba(255, 255, 255, 0.95)',
  glassOverlay: 'rgba(0, 0, 0, 0.02)',

  success: '#111111',
  glowBcv: 'rgba(0, 0, 0, 0.1)',
  highlight: '#111111',
  glowParalelo: 'rgba(0, 0, 0, 0.1)',
  info: '#111111',
  glowEuro: 'rgba(0, 0, 0, 0.1)',
  warning: '#111111',
  glowGasolina: 'rgba(0, 0, 0, 0.1)',
  bcvLunes: '#111111',
  glowBcvLunes: 'rgba(0, 0, 0, 0.1)',

  textPrimary: '#111111',
  textSecondary: '#444444',
  textMuted: '#888888',
  onAccent: '#ffffff',

  inputBg: '#f0f0f0',
  inputBorder: 'rgba(0, 0, 0, 0.15)',

  tabBar: '#ffffff',
  tabBarBorder: 'rgba(0, 0, 0, 0.08)',
  barTrack: '#e0e0e0',
  dimmed: '#777777',

  flagYellow: '#555555',
  flagBlue: '#aaaaaa',
  flagRed: '#888888',
};
```

- [ ] **Step 6: Verificar que pasa**

Run: `cd tasa-del-dia && npx jest src/ui/__tests__/palettes.test.js` 
Expected: PASS (186 aserciones: 31 claves × 6 paletas).

- [ ] **Step 7: Regresión del Original**

Run: `cd tasa-del-dia && npx jest --silent && npm run typecheck` 
Expected: suites verde, typecheck 0 errores.

- [ ] **Step 8: Commit**

```bash
git add tasa-del-dia/src/constants/themes.js tasa-del-dia/src/ui/
git commit -m "feat(ui): paletas por estilo con contrato de 31 tokens"
```

---

### Task 3: Eje `uiStyle` en ThemeContext

**Files:**
- Modify: `tasa-del-dia/src/context/ThemeContext.js` (archivo completo queda como abajo)
- Test: `tasa-del-dia/src/context/__tests__/ThemeContext.test.js` (añadir bloque)

**Interfaces:**
- Produces: `useTheme()` expone `uiStyle: 'original'|'terminal'|'editorial'` y `setUiStyle(id)`. Lo consumen Task 6 (registro vía `App.js`), Task 7 (botón), Task 8 (smoke tests).

- [ ] **Step 1: Añadir los tests nuevos (fallan primero)**

Al FINAL de `tasa-del-dia/src/context/__tests__/ThemeContext.test.js` (antes del último `});` que cierra `describe('ThemeContext')`), añadir:

```js
  describe('uiStyle', () => {
    function UiStyleCapture({ onReady }) {
      const { uiStyle, setUiStyle, colors } = useTheme();
      onReady({ uiStyle, setUiStyle, textPrimary: colors.textPrimary });
      return null;
    }

    function renderWithCapture() {
      let state;
      TestRenderer.act(() => {
        TestRenderer.create(
          <ThemeProvider>
            <UiStyleCapture onReady={(s) => { state = s; }} />
          </ThemeProvider>
        );
      });
      return state;
    }

    it('usa "original" por defecto', () => {
      const state = renderWithCapture();
      expect(state.uiStyle).toBe('original');
    });

    it('persiste el estilo elegido en AsyncStorage', () => {
      let captured;
      function Capture() {
        const { setUiStyle } = useTheme();
        captured = setUiStyle;
        return null;
      }
      TestRenderer.act(() => {
        TestRenderer.create(<ThemeProvider><Capture /></ThemeProvider>);
      });
      TestRenderer.act(() => { captured('terminal'); });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@tasa_del_dia_ui_style', 'terminal');
    });

    it('carga el estilo guardado al montar', async () => {
      await AsyncStorage.setItem('@tasa_del_dia_ui_style', 'editorial');
      let renderer;
      function Capture() {
        const { uiStyle } = useTheme();
        return <test-ui style={uiStyle} />;
      }
      await TestRenderer.act(async () => {
        renderer = TestRenderer.create(<ThemeProvider><Capture /></ThemeProvider>);
      });
      await TestRenderer.act(async () => {});
      expect(renderer.root.findByType('test-ui').props.style).toBe('editorial');
    });

    it('ignora un valor inválido guardado y cae a "original"', async () => {
      await AsyncStorage.setItem('@tasa_del_dia_ui_style', 'hackerman');
      let renderer;
      function Capture() {
        const { uiStyle } = useTheme();
        return <test-ui style={uiStyle} />;
      }
      await TestRenderer.act(async () => {
        renderer = TestRenderer.create(<ThemeProvider><Capture /></ThemeProvider>);
      });
      await TestRenderer.act(async () => {});
      expect(renderer.root.findByType('test-ui').props.style).toBe('original');
    });

    it('resuelve colores según (estilo, modo): terminal oscuro usa blanco', async () => {
      await AsyncStorage.setItem('@tasa_del_dia_theme_pref', 'dark');
      await AsyncStorage.setItem('@tasa_del_dia_ui_style', 'terminal');
      let renderer;
      function Capture() {
        const { colors } = useTheme();
        return <test-colors value={String(colors.textPrimary)} />;
      }
      await TestRenderer.act(async () => {
        renderer = TestRenderer.create(<ThemeProvider><Capture /></ThemeProvider>);
      });
      await TestRenderer.act(async () => {});
      expect(renderer.root.findByType('test-colors').props.value).toBe('#ffffff');
    });
  });
```

- [ ] **Step 2: Verificar que fallan**

Run: `cd tasa-del-dia && npx jest src/context/__tests__/ThemeContext.test.js` 
Expected: FAIL — los 5 casos nuevos (`setUiStyle` undefined, clave no persistida…). Los 7 casos previos siguen en verde.

- [ ] **Step 3: Implementar el eje en ThemeContext**

Reemplazar el contenido completo de `tasa-del-dia/src/context/ThemeContext.js` por:

```js
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme } from '../constants/themes';
import { darkThemeTerminal, lightThemeTerminal } from '../ui/terminal/palette';
import { darkThemeEditorial, lightThemeEditorial } from '../ui/editorial/palette';

const THEME_STORAGE_KEY = '@tasa_del_dia_theme_pref';
const UI_STYLE_STORAGE_KEY = '@tasa_del_dia_ui_style';

/** @typedef {'original'|'terminal'|'editorial'} UiStyle */

/** @type {Record<UiStyle, {dark: object, light: object}>} */
const PALETTES = {
  original: { dark: darkTheme, light: lightTheme },
  terminal: { dark: darkThemeTerminal, light: lightThemeTerminal },
  editorial: { dark: darkThemeEditorial, light: lightThemeEditorial },
};

// Lista LOCAL (no importar UI_STYLES de src/ui: generaría ciclo de imports,
// porque src/ui/index.js importa las pantallas y éstas importan este contexto).
const UI_STYLES = /** @type {const} */ (['original', 'terminal', 'editorial']);

/**
 * @typedef {object} ThemeContextValue
 * @property {'dark'|'light'} theme
 * @property {typeof darkTheme} colors
 * @property {'system'|'dark'|'light'} themePref
 * @property {(pref: 'system'|'dark'|'light') => void} setTheme
 * @property {UiStyle} uiStyle
 * @property {(id: UiStyle) => void} setUiStyle
 * @property {boolean} isDark
 * @property {boolean} isSystem
 * @property {boolean} loaded
 */

/** @type {ThemeContextValue} */
const defaultThemeContext = {
  theme: 'dark',
  colors: darkTheme,
  themePref: 'system',
  setTheme: () => {},
  uiStyle: 'original',
  setUiStyle: () => {},
  isDark: true,
  isSystem: true,
  loaded: true,
};

const ThemeContext = createContext(defaultThemeContext);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePref, setThemePref] = useState(/** @type {'system'|'dark'|'light'} */ ('system'));
  const [uiStyle, setUiStyleState] = useState(/** @type {UiStyle} */ ('original'));
  const [loaded, setLoaded] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setThemePref(saved);
        }
      } catch {}
      try {
        const savedStyle = await AsyncStorage.getItem(UI_STYLE_STORAGE_KEY);
        if (UI_STYLES.includes(/** @type {any} */ (savedStyle))) {
          setUiStyleState(/** @type {UiStyle} */ (savedStyle));
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Persist preference when it changes
  const handleSetTheme = useCallback((pref) => {
    setThemePref(pref);
    AsyncStorage.setItem(THEME_STORAGE_KEY, pref).catch(() => {});
  }, []);

  const handleSetUiStyle = useCallback((id) => {
    setUiStyleState(id);
    AsyncStorage.setItem(UI_STYLE_STORAGE_KEY, id).catch(() => {});
  }, []);

  const effectiveTheme = useMemo(() => {
    if (themePref === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return themePref;
  }, [themePref, systemScheme]);

  const colors = useMemo(() => {
    const palette = PALETTES[uiStyle] ?? PALETTES.original;
    return effectiveTheme === 'light' ? palette.light : palette.dark;
  }, [uiStyle, effectiveTheme]);

  const value = useMemo(() => ({
    theme: effectiveTheme,
    colors,
    themePref,
    setTheme: handleSetTheme,
    uiStyle,
    setUiStyle: handleSetUiStyle,
    isDark: effectiveTheme === 'dark',
    isSystem: themePref === 'system',
    loaded,
  }), [effectiveTheme, colors, themePref, handleSetTheme, uiStyle, handleSetUiStyle, loaded]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
```

- [ ] **Step 4: Verificar que pasan TODOS los tests del contexto**

Run: `cd tasa-del-dia && npx jest src/context/__tests__/ThemeContext.test.js` 
Expected: PASS (12 tests: 7 previos + 5 nuevos).

- [ ] **Step 5: Commit**

```bash
git add tasa-del-dia/src/context/
git commit -m "feat(ui): eje uiStyle en ThemeContext con persistencia AsyncStorage"
```

---

### Task 4: Trasladar los componentes Terminal a `src/ui/terminal/`

**Files:**
- Create: `tasa-del-dia/src/ui/terminal/{RatesScreen,ConverterScreen,HistoryScreen}.js`
- Create: `tasa-del-dia/src/ui/terminal/{RateCard,RatesHeader,CustomTabBar,ScreenContainer,BCVModal,UpdateModal,DateDetailCard,HistoryChart}.js`

**Interfaces:**
- Consumes: nada nuevo (usan `useTheme` y hooks existentes tras reescribir imports).
- Produces: módulos que exporta el registro en Task 6.

- [ ] **Step 1: Extraer los 11 archivos de la rama aprobada**

```bash
cd tasa-del-dia/src/ui/terminal
for f in RatesScreen ConverterScreen HistoryScreen; do
  git show feature/ui-monocromo:tasa-del-dia/src/screens/$f.js > $f.js
done
for f in RateCard RatesHeader CustomTabBar ScreenContainer BCVModal UpdateModal DateDetailCard HistoryChart; do
  git show feature/ui-monocromo:tasa-del-dia/src/components/$f.js > $f.js
done
```

- [ ] **Step 2: Reescribir imports relativos (profundidad y hermanos)**

```bash
cd tasa-del-dia/src/ui/terminal
sed -i -E \
  -e "s#from '\.\./components/(ShimmerEffect|AnimatedNumber|PressableScale|ThemeToggleMini)'#from '../../components/\1'#g" \
  -e "s#from '\./(ShimmerEffect|AnimatedNumber|PressableScale|ThemeToggleMini)'#from '../../components/\1'#g" \
  -e "s#from '\.\./components/#from './#g" \
  -e "s#from '\.\./screens/#from './#g" \
  -e "s#from '\.\./context/#from '../../context/#g" \
  -e "s#from '\.\./hooks/#from '../../hooks/#g" \
  -e "s#from '\.\./utils/#from '../../utils/#g" \
  -e "s#from '\.\./constants/#from '../../constants/#g" \
  -e "s#from '\.\./services/#from '../../services/#g" *.js
grep -rn -E "from '\./(ShimmerEffect|AnimatedNumber|PressableScale|ThemeToggleMini)|from '\.\./components/" *.js || echo "OK: sin imports rotos"
```

(Las dos primeras reglas redirigen los componentes COMPARTIDOS —que siguen viviendo en `src/components/`— antes de la regla genérica que localiza los del propio diseño. La última cubre servicios como `autoUpdate`.)

Además, anteponer la cabecera a los 11 archivos con:

```bash
cd tasa-del-dia/src/ui/terminal
sed -i '1i // Variante TERMINAL del rediseño monocromo (fuente: feature/ui-monocromo).' *.js
```

- [ ] **Step 3: Verificar typecheck (los archivos aún no se usan, pero deben compilar)**

Run: `cd tasa-del-dia && npm run typecheck` 
Expected: 0 errores. Si un archivo referenciaba algo inexistente, corregir su import.

- [ ] **Step 4: Commit**

```bash
git add tasa-del-dia/src/ui/terminal/
git commit -m "feat(ui): paquete de componentes terminal (traslado de feature/ui-monocromo)"
```

---

### Task 5: Trasladar los componentes Editorial a `src/ui/editorial/`

**Files:**
- Create: `tasa-del-dia/src/ui/editorial/{RatesScreen,ConverterScreen,HistoryScreen}.js`
- Create: `tasa-del-dia/src/ui/editorial/{RateCard,RatesHeader,ScreenContainer,BCVModal,UpdateModal,DateDetailCard,HistoryChart}.js`
- NOTA: Editorial NO aporta `CustomTabBar` propio (usa el original vía registro).

**Interfaces:**
- Consumes: tag `editorial-snapshot` (creado en Task 1).
- Produces: módulos que exporta el registro en Task 6.

- [ ] **Step 1: Extraer los 10 archivos modificados por Editorial**

(Editorial no tocó `CustomTabBar.js`: su tab bar es la original re-estilizada por tokens; el registro le pondrá la original en Task 6.)

```bash
cd tasa-del-dia/src/ui/editorial
for f in RatesScreen ConverterScreen HistoryScreen; do
  git show editorial-snapshot:tasa-del-dia/src/screens/$f.js > $f.js
done
for f in RateCard RatesHeader ScreenContainer BCVModal UpdateModal DateDetailCard HistoryChart; do
  git show editorial-snapshot:tasa-del-dia/src/components/$f.js > $f.js
done
```

- [ ] **Step 2: Reescribir imports relativos**

Mismos comandos `sed` del Step 2 de Task 4 (ejecutarlos en `tasa-del-dia/src/ui/editorial`), más la cabecera:

```bash
cd tasa-del-dia/src/ui/editorial
sed -i '1i // Variante EDITORIAL del rediseño monocromo premium (snapshot feature/ui-editorial).' *.js
```

- [ ] **Step 3: Typecheck**

Run: `cd tasa-del-dia && npm run typecheck` 
Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add tasa-del-dia/src/ui/editorial/
git commit -m "feat(ui): paquete de componentes editorial (snapshot del rediseño)"
```

---

### Task 6: Registro de paquetes `getUiPackage`

**Files:**
- Create: `tasa-del-dia/src/ui/index.js`
- Test: `tasa-del-dia/src/ui/__tests__/registry.test.js`

**Interfaces:**
- Consumes: módulos de Task 4 y Task 5 + originales de `src/screens/` y `src/components/`.
- Produces: `getUiPackage(uiStyle)` → `{ Screens: { rates, converter, history }, TabBar, ScreenContainer, UpdateModal }`; constante `UI_STYLES`. Lo consume Task 7 (App.js).

- [ ] **Step 1: Test del registro (falla primero)**

Crear `tasa-del-dia/src/ui/__tests__/registry.test.js`:

```js
import { getUiPackage, UI_STYLES } from '../index';

describe('registro de estilos de UI', () => {
  it('declara exactamente los 3 estilos', () => {
    expect([...UI_STYLES]).toEqual(['original', 'terminal', 'editorial']);
  });

  it.each(UI_STYLES)('resuelve el paquete completo para %s', (style) => {
    const pkg = getUiPackage(style);
    expect(typeof pkg.Screens.rates).toBe('function');
    expect(typeof pkg.Screens.converter).toBe('function');
    expect(typeof pkg.Screens.history).toBe('function');
    expect(typeof pkg.TabBar).toBe('function');
    expect(typeof pkg.ScreenContainer).toBe('function');
    expect(typeof pkg.UpdateModal).toBe('function');
  });

  it('cae al paquete original ante un estilo desconocido', () => {
    const fallback = getUiPackage(/** @type {any} */ ('no-existe'));
    const original = getUiPackage('original');
    expect(fallback.Screens.rates).toBe(original.Screens.rates);
    expect(fallback.TabBar).toBe(original.TabBar);
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `cd tasa-del-dia && npx jest src/ui/__tests__/registry.test.js` 
Expected: FAIL — `../index` no existe.

- [ ] **Step 3: Implementar el registro**

Crear `tasa-del-dia/src/ui/index.js`:

```js
// Registro de paquetes de UI por estilo de diseño.
// Cada paquete expone las pantallas, la tab bar y los modales de SU diseño;
// la lógica de negocio (hooks/servicios/utils) se comparte entre los tres.

import RatesScreenOriginal from '../screens/RatesScreen';
import ConverterScreenOriginal from '../screens/ConverterScreen';
import HistoryScreenOriginal from '../screens/HistoryScreen';
import CustomTabBarOriginal from '../components/CustomTabBar';
import ScreenContainerOriginal from '../components/ScreenContainer';
import UpdateModalOriginal from '../components/UpdateModal';

import RatesScreenTerminal from './terminal/RatesScreen';
import ConverterScreenTerminal from './terminal/ConverterScreen';
import HistoryScreenTerminal from './terminal/HistoryScreen';
import CustomTabBarTerminal from './terminal/CustomTabBar';
import ScreenContainerTerminal from './terminal/ScreenContainer';
import UpdateModalTerminal from './terminal/UpdateModal';

// Editorial reutiliza la CustomTabBar original (no la reescribió):
// se re-estila sola vía tokens.
import RatesScreenEditorial from './editorial/RatesScreen';
import ConverterScreenEditorial from './editorial/ConverterScreen';
import HistoryScreenEditorial from './editorial/HistoryScreen';
import ScreenContainerEditorial from './editorial/ScreenContainer';
import UpdateModalEditorial from './editorial/UpdateModal';

export const UI_STYLES = /** @type {const} */ (['original', 'terminal', 'editorial']);

const PACKAGES = {
  original: {
    Screens: {
      rates: RatesScreenOriginal,
      converter: ConverterScreenOriginal,
      history: HistoryScreenOriginal,
    },
    TabBar: CustomTabBarOriginal,
    ScreenContainer: ScreenContainerOriginal,
    UpdateModal: UpdateModalOriginal,
  },
  terminal: {
    Screens: {
      rates: RatesScreenTerminal,
      converter: ConverterScreenTerminal,
      history: HistoryScreenTerminal,
    },
    TabBar: CustomTabBarTerminal,
    ScreenContainer: ScreenContainerTerminal,
    UpdateModal: UpdateModalTerminal,
  },
  editorial: {
    Screens: {
      rates: RatesScreenEditorial,
      converter: ConverterScreenEditorial,
      history: HistoryScreenEditorial,
    },
    TabBar: CustomTabBarOriginal,
    ScreenContainer: ScreenContainerEditorial,
    UpdateModal: UpdateModalEditorial,
  },
};

/**
 * Devuelve el paquete de componentes del estilo indicado.
 * @param {'original'|'terminal'|'editorial'} uiStyle
 */
export function getUiPackage(uiStyle) {
  return PACKAGES[uiStyle] ?? PACKAGES.original;
}
```

- [ ] **Step 4: Verificar que pasa + regresión completa**

Run: `cd tasa-del-dia && npx jest src/ui/ && npx jest --silent` 
Expected: PASS en lo nuevo y verde en toda la suite.

- [ ] **Step 5: Commit**

```bash
git add tasa-del-dia/src/ui/index.js tasa-del-dia/src/ui/__tests__/registry.test.js
git commit -m "feat(ui): registro de paquetes getUiPackage"
```

---

### Task 7: Cablear el registro en App.js (fade por tema Y estilo)

**Files:**
- Modify: `tasa-del-dia/App.js`

**Interfaces:**
- Consumes: `getUiPackage`, `UI_STYLES` (Task 6); `uiStyle` de `useTheme()` (Task 3).
- Produces: app funcional cuyo look depende por completo de `uiStyle` (sin botón todavía).

- [ ] **Step 1: Sustituir imports estáticos por el registro**

En `tasa-del-dia/App.js` eliminar estas líneas (9–13 y 16):

```js
import RatesScreen from './src/screens/RatesScreen';
import ConverterScreen from './src/screens/ConverterScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import CustomTabBar from './src/components/CustomTabBar';
import ScreenContainer from './src/components/ScreenContainer';
import UpdateModal from './src/components/UpdateModal';
```

y añadir:

```js
import { getUiPackage } from './src/ui';
```

- [ ] **Step 2: Resolver el paquete y extender el fade al cambio de estilo**

Dentro de `AnimatedAppContent`, cambiar:

```js
  const { colors: C, isDark, theme, loaded } = useTheme();
```

por:

```js
  const { colors: C, isDark, theme, uiStyle, loaded } = useTheme();
  const Pkg = getUiPackage(uiStyle);
```

y sustituir el efecto de fade (líneas 23 y 33–46) por una versión con clave combinada:

```js
  const prevLookKey = useRef(`${theme}|${uiStyle}`);
```

```js
  useEffect(() => {
    const key = `${theme}|${uiStyle}`;
    if (prevLookKey.current !== key) {
      prevLookKey.current = key;
      fadeAnim.setValue(1);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5, duration: 120, useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();
    }
  }, [theme, uiStyle, fadeAnim]);
```

- [ ] **Step 3: Usar el paquete en el JSX**

En el JSX de `AnimatedAppContent`:

- `<ScreenContainer>` → `<Pkg.ScreenContainer>` (línea 119)
- `{visitedTabs.includes(0) ? <RatesScreen /> : null}` → `{visitedTabs.includes(0) ? <Pkg.Screens.rates /> : null}` (línea 131)
- `{visitedTabs.includes(1) ? <ConverterScreen /> : null}` → `{visitedTabs.includes(1) ? <Pkg.Screens.converter /> : null}` (línea 134)
- `{visitedTabs.includes(2) ? <HistoryScreen /> : null}` → `{visitedTabs.includes(2) ? <Pkg.Screens.history /> : null}` (línea 137)
- `<CustomTabBar` → `<Pkg.TabBar` (línea 140; props `activeIndex`, `scrollOffset`, `onTabPress`, `colors={C}` se mantienen iguales)
- `<UpdateModal` → `<Pkg.UpdateModal` (línea 151; mismas props)

- [ ] **Step 4: Verificación integral**

Run: `cd tasa-del-dia && npx jest --silent && npm run typecheck && npm run lint` 
Expected: suites verde, typecheck 0 errores, lint sin errores nuevos respecto al baseline de Task 1.

- [ ] **Step 5: Commit**

```bash
git add tasa-del-dia/App.js
git commit -m "feat(ui): app resuelve pantallas/tabbar/modales según uiStyle"
```

---

### Task 8: Botón cíclico UiStyleToggle + integración en los 3 headers

**Files:**
- Create: `tasa-del-dia/src/components/UiStyleToggle.js`
- Modify: `tasa-del-dia/src/components/RatesHeader.js` (original, junto a `<ThemeToggleMini />` de la línea 26)
- Modify: `tasa-del-dia/src/ui/terminal/RatesHeader.js` (junto a su `<ThemeToggleMini />`)
- Modify: `tasa-del-dia/src/ui/editorial/RatesHeader.js` (junto a su `<ThemeToggleMini />`)
- Test: `tasa-del-dia/src/components/__tests__/UiStyleToggle.test.js`

**Interfaces:**
- Consumes: `useTheme().uiStyle / setUiStyle` (Task 3).
- Produces: componente compartido `<UiStyleToggle />` usado por los 3 headers.

- [ ] **Step 1: Escribir el test (falla primero)**

Crear `tasa-del-dia/src/components/__tests__/UiStyleToggle.test.js`:

```js
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import UiStyleToggle from '../UiStyleToggle';

const mockTheme = {
  theme: 'dark',
  colors: {
    cardBg: '#1A1A1A', cardBorder: '#333333', textSecondary: '#AAAAAA',
  },
  uiStyle: 'original',
  setUiStyle: jest.fn(),
};

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => mockTheme,
}));

function press(toggle) {
  act(() => {
    toggle.props.onPress();
  });
}

describe('UiStyleToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme.uiStyle = 'original';
  });

  it('cicla original -> terminal al presionar', () => {
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    press(renderer.root.findByType(TouchableOpacity));
    expect(mockTheme.setUiStyle).toHaveBeenCalledWith('terminal');
  });

  it('cicla terminal -> editorial al presionar', () => {
    mockTheme.uiStyle = 'terminal';
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    press(renderer.root.findByType(TouchableOpacity));
    expect(mockTheme.setUiStyle).toHaveBeenCalledWith('editorial');
  });

  it('cicla editorial -> original al presionar', () => {
    mockTheme.uiStyle = 'editorial';
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    press(renderer.root.findByType(TouchableOpacity));
    expect(mockTheme.setUiStyle).toHaveBeenCalledWith('original');
  });

  it('expone accessibilityLabel con actual y siguiente', () => {
    mockTheme.uiStyle = 'terminal';
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    const btn = renderer.root.findByType(TouchableOpacity);
    expect(btn.props.accessibilityLabel).toBe('Diseño actual: Terminal. Toca para cambiar a Editorial');
  });
});
```

- [ ] **Step 2: Verificar que falla**

Run: `cd tasa-del-dia && npx jest src/components/__tests__/UiStyleToggle.test.js` 
Expected: FAIL — no existe `../UiStyleToggle`.

- [ ] **Step 3: Implementar el componente**

Crear `tasa-del-dia/src/components/UiStyleToggle.js`:

```js
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';

const SIZE = 32;
const ICON_SIZE = 16;

const STYLES = /** @type {const} */ ([
  { id: 'original', icon: 'ellipse-outline', label: 'Original', radius: SIZE / 2 },
  { id: 'terminal', icon: 'code-slash', label: 'Terminal', radius: 0 },
  { id: 'editorial', icon: 'book', label: 'Editorial', radius: 4 },
]);

function UiStyleToggle() {
  const { uiStyle, setUiStyle, colors: C } = useTheme();
  const idx = Math.max(0, STYLES.findIndex((s) => s.id === uiStyle));
  const current = STYLES[idx];
  const next = STYLES[(idx + 1) % STYLES.length];

  return (
    <TouchableOpacity
      style={[styles.toggle, { backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: current.radius }]}
      onPress={() => setUiStyle(next.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Diseño actual: ${current.label}. Toca para cambiar a ${next.label}`}
    >
      <Ionicons name={current.icon} size={ICON_SIZE} color={C.textSecondary} />
    </TouchableOpacity>
  );
}

export default React.memo(UiStyleToggle);

const styles = StyleSheet.create({
  toggle: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
```

- [ ] **Step 4: Verificar que pasa**

Run: `cd tasa-del-dia && npx jest src/components/__tests__/UiStyleToggle.test.js` 
Expected: PASS (4 tests).

- [ ] **Step 5: Insertar el botón en los 3 headers**

En cada uno de los tres archivos (`src/components/RatesHeader.js`, `src/ui/terminal/RatesHeader.js`, `src/ui/editorial/RatesHeader.js`):

1. Añadir el import junto al de `ThemeToggleMini` (ajustar ruta relativa según archivo: `./UiStyleToggle` en el original, `../../components/UiStyleToggle` en las copias):

```js
import UiStyleToggle from './UiStyleToggle';
```

2. Localizar la línea con `<ThemeToggleMini />` y dejar ambas juntas en el mismo contenedor:

```jsx
        <ThemeToggleMini />
        <UiStyleToggle />
```

(Si el contenedor de esos botones no deja espacio horizontal suficiente, envolver ambos en `<View style={{ flexDirection: 'row', gap: 6 }}>`.)

- [ ] **Step 6: Regresión + typecheck**

Run: `cd tasa-del-dia && npx jest --silent && npm run typecheck` 
Expected: verde completo (las suites de RatesHeader originales pueden necesitar que el mock de `useTheme` incluya `uiStyle`; si alguna falla por eso, añadir `uiStyle: 'original', setUiStyle: jest.fn()` SOLO al objeto mockeado del test afectado).

- [ ] **Step 7: Commit**

```bash
git add tasa-del-dia/src/components/UiStyleToggle.js tasa-del-dia/src/components/__tests__/UiStyleToggle.test.js tasa-del-dia/src/components/RatesHeader.js tasa-del-dia/src/ui/terminal/RatesHeader.js tasa-del-dia/src/ui/editorial/RatesHeader.js
git commit -m "feat(ui): botón cíclico de diseño en los 3 headers"
```

---

### Task 9: Smoke tests de componentes por estilo

**Files:**
- Create: `tasa-del-dia/src/ui/terminal/__tests__/components.test.js`
- Create: `tasa-del-dia/src/ui/editorial/__tests__/components.test.js`

**Interfaces:**
- Consumes: paletas de Task 2 (`darkThemeTerminal`, `darkThemeEditorial`).

- [ ] **Step 1: Copiar y adaptar la suite de humo Terminal**

Partir de una COPIA literal de `tasa-del-dia/src/components/__tests__/RateCard.test.js` hacia `tasa-del-dia/src/ui/terminal/__tests__/components.test.js` y aplicar esta lista de ediciones exactas:

1. Reemplazar el import del componente por:

```js
import RateCard from '../RateCard';
```

2. Añadir el import de la paleta junto a los existentes:

```js
import { darkThemeTerminal } from '../palette';
```

3. Sustituir el mock de `../../context/ThemeContext` por (nota la profundidad: ahora son 4 niveles):

```js
jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    isDark: true,
    colors: require('../palette').darkThemeTerminal,
    uiStyle: 'terminal',
    setUiStyle: jest.fn(),
    themePref: 'dark',
    setTheme: jest.fn(),
    loaded: true,
  }),
}));
```

4. Dejar UN solo caso de render por componente: conservar el primer `it(...)` con sus props EXACTAS tal cual están en la suite original (no inventar ni recortar props), renombrado a `'RateCard monta sin lanzar'`, envuelto así si hace falta:

```js
expect(() =>
  act(() => { TestRenderer.create(<RateCard {...mismaPropsQueElOriginal} />); })
).not.toThrow();
```

5. Conservar los mocks nativos que la suite original declare (Ionicons, BlurView, LinearGradient, Animated…). Si alguno apunta a rutas de paquete (`expo-blur`, etc.) se queda igual; solo cambian los imports relativos.

- [ ] **Step 2: Suite de humo Editorial**

Repetir el mismo procedimiento desde la misma fuente (`src/components/__tests__/RateCard.test.js`) hacia `tasa-del-dia/src/ui/editorial/__tests__/components.test.js`, con estas diferencias exactas respecto al Step 1:

- Paleta: `require('../palette').darkThemeEditorial` e import `import { darkThemeEditorial } from '../palette';`
- En el mock: `uiStyle: 'editorial'` y `themePref: 'dark'`.
- Describe raíz renombrado a `'componentes editorial'`.

- [ ] **Step 3: Ejecutar las suites nuevas**

Run: `cd tasa-del-dia && npx jest src/ui/terminal/__tests__/components.test.js src/ui/editorial/__tests__/components.test.js` 
Expected: PASS (2 tests, uno por estilo). Si el componente necesita otro mock nativo, añadirlo copiándolo de la suite original correspondiente.

- [ ] **Step 4: Commit**

```bash
git add tasa-del-dia/src/ui/terminal/__tests__/ tasa-del-dia/src/ui/editorial/__tests__/
git commit -m "test: humo de componentes terminal y editorial con sus paletas"
```

---

### Task 10: QA integral + documentación

**Files:**
- Modify: `README.md` (estructura de carpetas)
- Modify: `AI_HANDOFF.md` (entrada de sesión)

- [ ] **Step 1: Suite completa + estáticos**

Run: `cd tasa-del-dia && npx jest --silent && npm run typecheck && npm run lint` 
Expected: todo verde (~200+ tests), 0 errores de tipos, lint sin errores nuevos.

- [ ] **Step 2: Prueba manual en dispositivo/emulador**

```bash
cd tasa-del-dia && npx expo start
```

Checklist manual (anotar resultados):
1. Arranque normal → look Original intacto.
2. Toque del botón nuevo en header Tasas → fade y look Terminal (tab bar textual `[{TAS}]`, hero invertido, monoespaciada).
3. Otro toque → look Editorial (serif, líneas finas, fondo claro dominante).
4. Otro toque → vuelve a Original.
5. Con Terminal activo, alternar modo claro/oscuro con el toggle de siempre → ambos modos legibles.
6. Matar la app y reabrir → se conserva el último estilo elegido.
7. Cambiar de pestaña (Conversor/Historial) en cada estilo → todo coherente con el diseño activo.

- [ ] **Step 3: Actualizar README.md**

En la sección de estructura del proyecto (`│   │   ├── ...`), insertar debajo de `components/`:

```
│   │   ├── ui/                     # Paquetes de diseño alternativos
│   │   │   ├── index.js            # Registro getUiPackage(uiStyle)
│   │   │   ├── terminal/           # Rediseño Terminal (monocromo)
│   │   │   └── editorial/          # Rediseño Editorial (premium)
```

y una línea en Features: "Selector de diseño: Original / Terminal / Editorial (botón en el header de Tasas, preferencia persistente)".

- [ ] **Step 4: Entrada de sesión en AI_HANDOFF.md**

Añadir al inicio de la lista de sesiones una entrada `## Sesión 23-Ago-2026 — Selector de diseño de UI` resumiendo: spec, paletas con contrato de 31 tokens, eje `uiStyle` en ThemeContext (`@tasa_del_dia_ui_style`), registro `getUiPackage`, `UiStyleToggle`, traslados a `src/ui/`, limpieza del rebase/cherry-pick huérfanos del 18-ago y estado de QA.

- [ ] **Step 5: Commit final**

```bash
git add README.md AI_HANDOFF.md
git commit -m "docs: selector de diseño de UI (sesión 23-ago)"
```
