import React from 'react';
import TestRenderer from 'react-test-renderer';
import RateCard from '../RateCard';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      cardBg: '#111120',
      cardBorder: '#1e1e3a',
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
  }),
}));

describe('RateCard', () => {
  it('renders title and rate value', () => {
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
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const titleText = texts.find(t => t.props.children === 'BCV (Oficial)');
    expect(titleText).toBeTruthy();

    // with es-VE locale, 60.50 formats as "60,50"
    const rateText = texts.find(t =>
      typeof t.props.children === 'string' &&
      t.props.children.includes('60,50')
    );
    expect(rateText).toBeTruthy();
  });

  it('renders shimmer when loading is true', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RateCard
          title="BCV (Oficial)"
          rate={null}
          icon="bank"
          color="#00b894"
          loading={true}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    // When loading, ShimmerEffect renders placeholder lines, not the title
    const titleText = texts.find(t => t.props.children === 'BCV (Oficial)');
    expect(titleText).toBeFalsy();
  });

  it('shows USD info when rate is available and not compact', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RateCard
          title="BCV (Oficial)"
          rate={60.5}
          icon="bank"
          color="#00b894"
          loading={false}
          compact={false}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const usdText = texts.find(t => {
      // children may be a string or an array of strings
      const children = t.props.children;
      if (Array.isArray(children)) {
        return children.some(c => typeof c === 'string' && c.includes('1 USD'));
      }
      return typeof children === 'string' && children.includes('1 USD');
    });
    expect(usdText).toBeTruthy();
  });

  it('hides USD info in compact mode', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RateCard
          title="BCV (Oficial)"
          rate={60.5}
          icon="bank"
          color="#00b894"
          loading={false}
          compact={true}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const usdText = texts.find(t =>
      typeof t.props.children === 'string' &&
      t.props.children.includes('1 USD')
    );
    expect(usdText).toBeFalsy();
  });

  it('renders subtitle when provided', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RateCard
          title="BCV (Oficial)"
          subtitle="Banco Central"
          rate={60.5}
          icon="bank"
          color="#00b894"
          loading={false}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const subText = texts.find(t => t.props.children === 'Banco Central');
    expect(subText).toBeTruthy();
  });

  it('handles null rate gracefully', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RateCard
          title="BCV (Oficial)"
          rate={null}
          icon="bank"
          color="#00b894"
          loading={false}
        />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const titleText = texts.find(t => t.props.children === 'BCV (Oficial)');
    expect(titleText).toBeTruthy();
  });

  it('renders with edit button callback when onEdit is provided', () => {
    const onEditMock = jest.fn();
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RateCard
          title="BCV (Lunes)"
          rate={58.5}
          icon="calendar"
          color="#a855f7"
          loading={false}
          onEdit={onEditMock}
        />
      );
    });
    // Component should render without crashing when onEdit is provided
    expect(renderer.toJSON()).toBeTruthy();
  });
});
