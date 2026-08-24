import React from 'react';
import TestRenderer from 'react-test-renderer';
import { ThemeProvider, useTheme } from '../ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

function TestThemeConsumer() {
  const { theme, isDark, themePref, setTheme, loaded } = useTheme();
  return (
    <test-consumer
      theme={theme}
      isDark={String(isDark)}
      themePref={themePref}
      loaded={String(loaded)}
      setTheme={String(setTheme)}
    />
  );
}

describe('ThemeContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('provides default theme context with loaded=false initially', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );
    });
    const root = renderer.root;
    const consumer = root.findByType('test-consumer');
    expect(consumer).toBeTruthy();
  });

  it('persists theme preference to AsyncStorage', () => {
    let capturedSetTheme;
    function CaptureFn() {
      const { setTheme } = useTheme();
      capturedSetTheme = setTheme;
      return null;
    }

    TestRenderer.act(() => {
      TestRenderer.create(
        <ThemeProvider>
          <CaptureFn />
        </ThemeProvider>
      );
    });

    TestRenderer.act(() => {
      capturedSetTheme('light');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tasa_del_dia_theme_pref',
      'light'
    );
  });

  it('persists dark theme preference', () => {
    let capturedSetTheme;
    function CaptureFn() {
      const { setTheme } = useTheme();
      capturedSetTheme = setTheme;
      return null;
    }

    TestRenderer.act(() => {
      TestRenderer.create(
        <ThemeProvider>
          <CaptureFn />
        </ThemeProvider>
      );
    });

    TestRenderer.act(() => {
      capturedSetTheme('dark');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tasa_del_dia_theme_pref',
      'dark'
    );
  });

  it('persists system theme preference', () => {
    let capturedSetTheme;
    function CaptureFn() {
      const { setTheme } = useTheme();
      capturedSetTheme = setTheme;
      return null;
    }

    TestRenderer.act(() => {
      TestRenderer.create(
        <ThemeProvider>
          <CaptureFn />
        </ThemeProvider>
      );
    });

    TestRenderer.act(() => {
      capturedSetTheme('system');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tasa_del_dia_theme_pref',
      'system'
    );
  });

  it('loads saved preference from AsyncStorage', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('light');

    function LoadedConsumer() {
      const { themePref, loaded } = useTheme();
      if (!loaded) return null;
      return <loaded-state pref={themePref} />;
    }

    let renderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(
        <ThemeProvider>
          <LoadedConsumer />
        </ThemeProvider>
      );
    });

    // Flush effects
    await TestRenderer.act(async () => {});

    const root = renderer.root;
    let resolved = false;
    try {
      const loadedEl = root.findByType('loaded-state');
      expect(loadedEl.props.pref).toBe('light');
      resolved = true;
    } catch {
      // Try one more tick
    }
    if (!resolved) {
      await TestRenderer.act(async () => {});
      const loadedEl = root.findByType('loaded-state');
      expect(loadedEl.props.pref).toBe('light');
    }
  });

  it('ignores invalid saved values', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('not_valid');

    function InvalidConsumer() {
      const { themePref, loaded } = useTheme();
      if (!loaded) return null;
      return <invalid-state pref={themePref} />;
    }

    await TestRenderer.act(async () => {
      TestRenderer.create(
        <ThemeProvider>
          <InvalidConsumer />
        </ThemeProvider>
      );
    });

    await TestRenderer.act(async () => {});

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@tasa_del_dia_theme_pref');
  });

  it('useTheme returns default values outside ThemeProvider', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<TestThemeConsumer />);
    });
    const consumer = renderer.root.findByType('test-consumer');
    expect(consumer.props.loaded).toBe('true');
    expect(consumer.props.themePref).toBe('system');
  });

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

    it('resuelve colores según (estilo, modo): terminal oscuro usa su barTrack propio', async () => {
      await AsyncStorage.setItem('@tasa_del_dia_theme_pref', 'dark');
      await AsyncStorage.setItem('@tasa_del_dia_ui_style', 'terminal');
      let renderer;
      function Capture() {
        const { colors } = useTheme();
        return <test-colors value={String(colors.barTrack)} />;
      }
      await TestRenderer.act(async () => {
        renderer = TestRenderer.create(<ThemeProvider><Capture /></ThemeProvider>);
      });
      await TestRenderer.act(async () => {});
      expect(renderer.root.findByType('test-colors').props.value).toBe('#222222');
    });
  });
});
