import React from 'react';
import TestRenderer from 'react-test-renderer';
import RateCard from '../RateCard';

import { darkThemeEditorial } from '../palette';

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
});
