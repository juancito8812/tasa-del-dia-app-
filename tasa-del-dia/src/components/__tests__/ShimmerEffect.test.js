import React from 'react';
import TestRenderer from 'react-test-renderer';
import ShimmerEffect from '../ShimmerEffect';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      cardBg: '#111120',
      cardBorder: '#1e1e3a',
      primary: '#0a0a14',
      secondary: '#0f0f1e',
      accent: '#1a1a3e',
      highlight: '#e94560',
      success: '#00b894',
      warning: '#f39c12',
      info: '#4fc3f7',
      bcvLunes: '#a855f7',
      textPrimary: '#ffffff',
      textSecondary: '#a0aec0',
      textMuted: '#636e82',
      inputBg: 'rgba(255, 255, 255, 0.04)',
      inputBorder: 'rgba(255, 255, 255, 0.1)',
      tabBar: '#0a0a14',
      tabBarBorder: 'rgba(255, 255, 255, 0.06)',
      glassOverlay: 'rgba(255, 255, 255, 0.03)',
    },
    isDark: true,
    theme: 'dark',
    themePref: 'dark',
    setTheme: jest.fn(),
    loaded: true,
  }),
}));

describe('ShimmerEffect', () => {
  it('renders placeholder elements', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<ShimmerEffect />);
    });
    const root = renderer.root;
    // Should find View elements (the placeholder bars)
    const views = root.findAllByType('View');
    expect(views.length).toBeGreaterThanOrEqual(5);
  });

  it('accepts custom style prop', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<ShimmerEffect style={{ opacity: 0.5 }} />);
    });
    const json = renderer.toJSON();
    expect(json).toBeTruthy();
    expect(json.props.style).toBeDefined();
  });

  it('creates shimmer animation on mount', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<ShimmerEffect />);
    });
    // Should not throw - animation loop starts on mount
    expect(() => TestRenderer.act(() => renderer.unmount())).not.toThrow();
  });
});
