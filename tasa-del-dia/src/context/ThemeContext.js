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
