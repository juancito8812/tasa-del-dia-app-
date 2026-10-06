import React from 'react';
import TestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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

  it('hero BCV usa un nombre de icono Ionicons válido (business, no "?")', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
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
    });
    const icons = renderer.root.findAllByType(Ionicons);
    expect(icons.length).toBeGreaterThan(0);
    expect(icons[0].props.name).toBe('business');
    expect(icons.some((i) => i.props.name === 'bank')).toBe(false);
  });

  it('tasa medium (columna bento) usa fontSize 24 para caber sin desbordar', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RateCard
          title="Dólar Paralelo"
          rate={981.71}
          icon="trending-up"
          color="#74D99A"
          loading={false}
          size="medium"
          type="paralelo"
          updatedAt="2026-10-01T12:00:00Z"
        />
      );
    });
    const texts = renderer.root.findAllByType('Text');
    const valueText = texts.find(
      (t) => typeof t.props.children === 'string' && t.props.children.includes('981,71')
    );
    expect(valueText).toBeTruthy();
    expect(StyleSheet.flatten(valueText.props.style).fontSize).toBe(24);
  });

  it('medium y compact incluyen flexGrow para llenar la altura del bentoHalf (tarjetas parejas)', () => {
    // bentoHalf es columna: alignItems solo estira el ancho; sin flexGrow la
    // tarjeta queda a altura natural y las parejas del bento quedan desiguales
    // cuando un subtítulo hace wrap (bug: Paralelo vs Euro).
    for (const size of ['medium', 'compact']) {
      let renderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <RateCard
            title="Dólar Paralelo"
            subtitle="Mercado promedio"
            rate={981.71}
            icon="trending-up"
            color="#74D99A"
            loading={false}
            size={size}
            type="paralelo"
            updatedAt="2026-10-01T12:00:00Z"
          />
        );
      });
      const card = renderer.root.findAllByType('View')[0];
      expect(StyleSheet.flatten(card.props.style).flexGrow).toBe(1);
    }
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
