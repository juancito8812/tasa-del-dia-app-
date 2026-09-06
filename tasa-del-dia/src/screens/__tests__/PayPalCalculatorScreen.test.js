import React from 'react';
import TestRenderer from 'react-test-renderer';
import PayPalCalculatorScreen from '../PayPalCalculatorScreen';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      card: '#f5f5f5',
      cardBorder: '#e0e0e0',
      border: '#e0e0e0',
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      textMuted: '#999999',
      highlight: '#2b6cb0',
    },
    isDark: false,
    theme: 'light',
    uiStyle: 'original',
    loaded: true,
  }),
}));

jest.mock('../../hooks/useRatesData', () => () => ({
  data: {
    tasaBCV: 37.5,
    tasaParalelo: 39.5,
    tasaBinanceP2P: 40.5,
    tasaEuro: 1.08,
  },
}));

jest.mock('../../utils/haptics', () => ({
  hapticLight: jest.fn(),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('expo-blur', () => ({
  BlurView: ({ children }) => children,
}));

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Share = { share: jest.fn() };
  return RN;
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return {
    Ionicons: (props) => React.createElement('Text', null, props.name),
  };
});

describe('PayPalCalculatorScreen', () => {
  it('renders without crashing', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<PayPalCalculatorScreen />);
    });
    const tree = renderer.toJSON();
    expect(tree).toBeTruthy();
  });

  it('displays header title', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<PayPalCalculatorScreen />);
    });
    const instance = renderer.root;
    const texts = instance.findAllByType('Text');
    const labels = texts.map((t) => t.props.children).filter(Boolean);
    expect(labels).toContain('Calculadora PayPal');
  });

  it('shows mode toggle buttons', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<PayPalCalculatorScreen />);
    });
    const instance = renderer.root;
    const texts = instance.findAllByType('Text');
    const labels = texts.map((t) => t.props.children).filter(Boolean);
    expect(labels).toContain('¿Cuánto recibo?');
    expect(labels).toContain('¿Cuánto cobro?');
  });

  it('shows fee type options', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<PayPalCalculatorScreen />);
    });
    const instance = renderer.root;
    const texts = instance.findAllByType('Text');
    const labels = texts.map((t) => t.props.children).filter(Boolean);
    expect(labels).toContain('Enviar a amigos');
    expect(labels).toContain('Recibir pago');
    expect(labels).toContain('Enviar pago');
    expect(labels).toContain('Vender (Goods & Services)');
  });

  it('shows info disclaimer', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<PayPalCalculatorScreen />);
    });
    const instance = renderer.root;
    const texts = instance.findAllByType('Text');
    const labels = texts.map((t) => t.props.children).filter(Boolean);
    const hasInfo = labels.some((l) => typeof l === 'string' && l.includes('Tarifas oficiales'));
    expect(hasInfo).toBe(true);
  });
});
