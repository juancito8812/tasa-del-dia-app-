import React from 'react';
import TestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import RateCard from '../RateCard';

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, style, ...props }) =>
      React.createElement(View, { style, ...props }, children),
  };
});

jest.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    isDark: true,
    colors: require('../palette').darkThemeEditorial,
    uiStyle: 'editorial',
    setUiStyle: jest.fn(),
    themePref: 'dark',
    setTheme: jest.fn(),
    loaded: true,
  }),
}));

describe('componentes editorial', () => {
  it('RateCard monta sin lanzar', () => {
    expect(() =>
      TestRenderer.act(() => {
        TestRenderer.create(
          <RateCard
            title="BCV (Oficial)"
            subtitle="Banco Central de Venezuela"
            rate={60.5}
            icon="bank"
            color="#00b894"
            loading={false}
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
          rate={60.5}
          icon="bank"
          color="#00b894"
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
          color="#00b894"
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
});
