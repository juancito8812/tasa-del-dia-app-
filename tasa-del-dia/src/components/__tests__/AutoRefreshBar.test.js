import React from 'react';
import TestRenderer from 'react-test-renderer';
import AutoRefreshBar from '../AutoRefreshBar';

jest.mock('../../constants', () => ({
  API_CONFIG: {
    BASE_URL: 'https://api.cotizave.com',
    API_KEY: 'test-api-key',
    REFRESH_INTERVAL: 1200000,
  },
  darkTheme: {},
  lightTheme: {},
}));

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      cardBg: '#111120',
      cardBorder: '#1e1e3a',
      accent: '#1a1a3e',
      highlight: '#e94560',
      success: '#00b894',
      warning: '#f39c12',
      textPrimary: '#ffffff',
      textSecondary: '#a0aec0',
      textMuted: '#636e82',
      inputBg: 'rgba(255, 255, 255, 0.04)',
      glassOverlay: 'rgba(255, 255, 255, 0.03)',
    },
    isDark: true,
    theme: 'dark',
  }),
}));

describe('AutoRefreshBar', () => {
  it('renders with normal countdown', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<AutoRefreshBar countdown={600} />);
    });
    const json = renderer.toJSON();
    expect(json).toBeTruthy();
  });

  it('renders warning state when countdown is low', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<AutoRefreshBar countdown={30} />);
    });
    const root = renderer.root;

    // Find Text components
    const texts = root.findAllByType('Text');
    const warningText = texts.find(t =>
      t.props.children &&
      typeof t.props.children === 'string' &&
      t.props.children.includes('Actualizando en')
    );
    expect(warningText).toBeTruthy();
  });

  it('renders in compact mode', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<AutoRefreshBar countdown={600} compact />);
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('renders at 0 seconds', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<AutoRefreshBar countdown={0} />);
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('renders with time format for normal state', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<AutoRefreshBar countdown={600} />);
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const normalText = texts.find(t =>
      t.props.children &&
      typeof t.props.children === 'string' &&
      t.props.children.includes('Próxima actualización')
    );
    expect(normalText).toBeTruthy();
  });
});
