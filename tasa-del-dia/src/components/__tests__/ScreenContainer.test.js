import React from 'react';
import TestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import ScreenContainer from '../ScreenContainer';
import { useTheme } from '../../context/ThemeContext';
import { darkThemeEditorial } from '../../ui/editorial/palette';
import { darkThemeFintech } from '../../ui/fintech/palette';
import { darkThemeTerminal } from '../../ui/terminal/palette';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../ui/fintech/fonts', () => ({
  FintechFontsProvider: ({ children }) =>
    require('react').createElement('mock-fintech-fonts', null, children),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style, ...props }) =>
      require('react').createElement(View, { style, ...props }, children),
  };
});

describe('ScreenContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders container in dark mode', () => {
    useTheme.mockReturnValue({ isDark: true });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ScreenContainer>
          <React.Fragment />
        </ScreenContainer>
      );
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('renders container in light mode', () => {
    useTheme.mockReturnValue({ isDark: false });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ScreenContainer>
          <React.Fragment />
        </ScreenContainer>
      );
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('wraps children', () => {
    useTheme.mockReturnValue({ isDark: true });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ScreenContainer>
          <React.Fragment>
            <mock-test-child />
          </React.Fragment>
        </ScreenContainer>
      );
    });
    expect(renderer.toJSON()).not.toBeNull();
  });

  it('toma el degradado de la paleta del tema activo (Q1: sin copias por tema)', () => {
    useTheme.mockReturnValue({
      isDark: true,
      uiStyle: 'editorial',
      colors: darkThemeEditorial,
    });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<ScreenContainer />);
    });
    const props = renderer.root.findAllByType('View')[0].props;
    expect(props.colors).toEqual(darkThemeEditorial.screenGradient.colors);
    expect(props.locations).toEqual(darkThemeEditorial.screenGradient.locations);
  });

  it('terminal (screenGradient null) pinta fondo sólido con C.primary', () => {
    useTheme.mockReturnValue({
      isDark: true,
      uiStyle: 'terminal',
      colors: darkThemeTerminal,
    });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<ScreenContainer />);
    });
    const view = renderer.root.findAllByType('View')[0];
    expect(view.props.colors).toBeUndefined();
    expect(StyleSheet.flatten(view.props.style).backgroundColor).toBe(darkThemeTerminal.primary);
  });

  it('envuelve con FintechFontsProvider solo en el estilo fintech', () => {
    const render = (uiStyle, colors) => {
      useTheme.mockReturnValue({ isDark: true, uiStyle, colors });
      let renderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<ScreenContainer />);
      });
      return renderer;
    };
    expect(
      render('fintech', darkThemeFintech).root.findAllByType('mock-fintech-fonts').length
    ).toBe(1);
    expect(
      render('editorial', darkThemeEditorial).root.findAllByType('mock-fintech-fonts').length
    ).toBe(0);
  });
});
