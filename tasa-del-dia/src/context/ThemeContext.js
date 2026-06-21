import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme } from '../constants/themes';

const THEME_STORAGE_KEY = '@tasa_del_dia_theme_pref';

const ThemeContext = createContext({
  theme: 'dark',
  colors: darkTheme,
  themePref: 'system',
  setTheme: () => {},
  isDark: true,
  isSystem: true,
  loaded: true,
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePref, setThemePref] = useState('system');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setThemePref(saved);
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

  const effectiveTheme = useMemo(() => {
    if (themePref === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return themePref;
  }, [themePref, systemScheme]);

  const colors = useMemo(() => {
    return effectiveTheme === 'light' ? lightTheme : darkTheme;
  }, [effectiveTheme]);

  const value = useMemo(() => ({
    theme: effectiveTheme,
    colors,
    themePref,
    setTheme: handleSetTheme,
    isDark: effectiveTheme === 'dark',
    isSystem: themePref === 'system',
    loaded,
  }), [effectiveTheme, colors, themePref, handleSetTheme, loaded]);

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
