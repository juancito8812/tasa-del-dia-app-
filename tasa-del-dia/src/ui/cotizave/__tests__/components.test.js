import React from 'react';
import TestRenderer from 'react-test-renderer';
import RateCard from '../RateCard';
import { darkThemeCotizave, lightThemeCotizave } from '../palette';

// Las tipografías del paquete (Space Grotesk / JetBrains Mono) no se cargan en
// Jest: el hook devuelve el fallback vacío (fuente del sistema).
jest.mock('../fonts', () => ({
  useCotizaveFonts: () => ({}),
}));

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    isDark: true,
    colors: require('../palette').darkThemeCotizave,
    uiStyle: 'cotizave',
    setUiStyle: jest.fn(),
    themePref: 'dark',
    setTheme: jest.fn(),
    loaded: true,
  }),
}));

describe('componentes cotizave', () => {
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

describe('paleta cotizave — tokens del sitio', () => {
  it('dark usa el panel oscuro cálido y el amarillo BCV de cotizave.com', () => {
    expect(darkThemeCotizave.primary).toBe('#14130F'); // --v3-dark
    expect(darkThemeCotizave.secondary).toBe('#1B1916'); // .rc-stat
    expect(darkThemeCotizave.success).toBe('#FFD93D'); // --v3-yellow
    expect(darkThemeCotizave.highlight).toBe('#74D99A'); // .rc-val.up
  });

  it('light usa la página crema con acento vino', () => {
    expect(lightThemeCotizave.primary).toBe('#FBFAF7'); // --v3-bg
    expect(lightThemeCotizave.cardBorder).toBe('#ECEAE3'); // --v3-line
    expect(lightThemeCotizave.textPrimary).toBe('#1B1B1A'); // --v3-ink
    expect(lightThemeCotizave.bcvLunes).toBe('#7A1F2B'); // --v3-vino
    expect(lightThemeCotizave.warning).toBe('#C0392B'); // --v3-danger
  });
});
