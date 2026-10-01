import React from 'react';
import TestRenderer from 'react-test-renderer';
import RateCard from '../RateCard';
import { darkThemeFintech, lightThemeFintech } from '../palette';

// Las tipografías del paquete (Space Grotesk / JetBrains Mono) no se cargan en
// Jest: el hook devuelve el fallback vacío (fuente del sistema).
jest.mock('../fonts', () => ({
  useFintechFonts: () => ({}),
}));

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    isDark: true,
    colors: require('../palette').darkThemeFintech,
    uiStyle: 'fintech',
    setUiStyle: jest.fn(),
    themePref: 'dark',
    setTheme: jest.fn(),
    loaded: true,
  }),
}));

describe('componentes fintech', () => {
  it('RateCard monta sin lanzar', () => {
    expect(() =>
      TestRenderer.act(() => {
        TestRenderer.create(
          <RateCard
            title="BCV (Oficial)"
            subtitle="Banco Central de Venezuela"
            rate={860.18}
            icon="bank"
            color="#FFD93D"
            loading={false}
          />
        );
      })
    ).not.toThrow();
  });

  it('RateCard hero (large) monta con chip EN VIVO y edición', () => {
    expect(() =>
      TestRenderer.act(() => {
        TestRenderer.create(
          <RateCard
            title="BCV (Oficial)"
            subtitle="Banco Central de Venezuela"
            rate={860.18}
            icon="bank"
            color="#FFD93D"
            loading={false}
            size="large"
            type="bcv"
            updatedAt="2026-10-01T12:00:00Z"
          />
        );
      })
    ).not.toThrow();
  });
});

describe('paleta fintech — tokens del sitio', () => {
  it('dark usa el panel oscuro cálido y el amarillo BCV', () => {
    expect(darkThemeFintech.primary).toBe('#14130F'); // --v3-dark
    expect(darkThemeFintech.secondary).toBe('#1B1916'); // .rc-stat
    expect(darkThemeFintech.success).toBe('#FFD93D'); // --v3-yellow
    expect(darkThemeFintech.highlight).toBe('#74D99A'); // .rc-val.up
  });

  it('light usa la página crema con acento vino', () => {
    expect(lightThemeFintech.primary).toBe('#FBFAF7'); // --v3-bg
    expect(lightThemeFintech.cardBorder).toBe('#ECEAE3'); // --v3-line
    expect(lightThemeFintech.textPrimary).toBe('#1B1B1A'); // --v3-ink
    expect(lightThemeFintech.bcvLunes).toBe('#7A1F2B'); // --v3-vino
    expect(lightThemeFintech.warning).toBe('#C0392B'); // --v3-danger
  });
});
