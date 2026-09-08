import React from 'react';
import TestRenderer from 'react-test-renderer';
import { TextInput } from 'react-native';
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
    expect(labels).toContain('Para enviar');
    expect(labels).toContain('Para recibir');
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

  describe('Pagar compras en BS card', () => {
    const getTextLabels = (instance) =>
      instance.findAllByType('Text').map((t) => t.props.children).filter(Boolean);

    it('renders the section title and input labels', () => {
      let renderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<PayPalCalculatorScreen />);
      });
      const labels = getTextLabels(renderer.root);
      expect(labels).toContain('Pagar compras en BS');
      expect(labels).toContain('Monto a pagar (BS)');
      expect(labels).toContain('Tasa de cambio (BS/USD)');
    });

    it('shows rate chips with live rates', () => {
      let renderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<PayPalCalculatorScreen />);
      });
      const labels = getTextLabels(renderer.root);
      expect(labels).toContain('Tasa BCV');
      expect(labels).toContain('Tasa Paralelo');
      expect(labels).toContain('Tasa Binance');
    });

    it('does not show results when inputs are empty', () => {
      let renderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<PayPalCalculatorScreen />);
      });
      const labels = getTextLabels(renderer.root);
      expect(labels).not.toContain('$ 28.51');
    });

    it('calculates in real time while typing (1000 Bs @ 37.5)', () => {
      let renderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<PayPalCalculatorScreen />);
      });
      const inputs = renderer.root.findAllByType(TextInput);
      // [0] calculadora principal, [1] monto Bs, [2] tasa Bs/USD
      expect(inputs).toHaveLength(3);
      TestRenderer.act(() => {
        inputs[1].props.onChangeText('1000');
      });
      TestRenderer.act(() => {
        inputs[2].props.onChangeText('37.5');
      });
      const labels = getTextLabels(renderer.root);
      expect(labels).toContain('$ 28.51'); // pago exacto
      expect(labels).toContain('$ 29.00'); // recomendado
      expect(labels).toContain('Bs 17,52'); // vuelto
    });

    it('accepts comma decimal input (1000,50 Bs @ 37,5)', () => {
      let renderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(<PayPalCalculatorScreen />);
      });
      const inputs = renderer.root.findAllByType(TextInput);
      TestRenderer.act(() => {
        inputs[1].props.onChangeText('1000,50');
      });
      TestRenderer.act(() => {
        inputs[2].props.onChangeText('37,5');
      });
      const labels = getTextLabels(renderer.root);
      expect(labels).toContain('$ 28.52'); // round2((26.68 + 0.3) / 0.946)
    });
  });
});
