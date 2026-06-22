import React from 'react';
import TestRenderer from 'react-test-renderer';
import RatesHeader from '../RatesHeader';

jest.mock('../ThemeToggleMini', () => () => null);

const C = {
  highlight: '#e94560',
  textPrimary: '#ffffff',
  textMuted: '#636e82',
  cardBg: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.08)',
  warning: '#f39c12',
};

describe('RatesHeader', () => {
  it('renders title', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RatesHeader C={C} error={null} offlineMode={false} offlineCachedAt={null} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const titleText = texts.find(t => t.props.children === 'Tasa del Día');
    expect(titleText).toBeTruthy();
  });

  it('shows error banner when error is present and not offline', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RatesHeader C={C} error="Error de red" offlineMode={false} offlineCachedAt={null} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const errText = texts.find(t => t.props.children === 'Error de red');
    expect(errText).toBeTruthy();
  });

  function findTextContaining(texts, substr) {
    return texts.find(t => {
      const c = t.props.children;
      if (typeof c === 'string') return c.includes(substr);
      if (Array.isArray(c)) return c.some(item => typeof item === 'string' && item.includes(substr));
      return false;
    });
  }

  it('shows offline banner when offline', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RatesHeader C={C} error={null} offlineMode={true} offlineCachedAt={null} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const offlineText = findTextContaining(texts, 'Sin conexión');
    expect(offlineText).toBeTruthy();
  });

  it('hides error banner when offline mode is active', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RatesHeader C={C} error="Error de red" offlineMode={true} offlineCachedAt={null} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    // Offline banner should show, not the error banner
    const offlineText = findTextContaining(texts, 'Sin conexión');
    expect(offlineText).toBeTruthy();

    function findExact(texts, str) {
      return texts.find(t => {
        const c = t.props.children;
        if (typeof c === 'string') return c === str;
        if (Array.isArray(c)) return c.includes(str);
        return false;
      });
    }
    const errText = findExact(texts, 'Error de red');
    expect(errText).toBeFalsy();
  });

  it('renders Venezuela flag badge', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <RatesHeader C={C} error={null} offlineMode={false} offlineCachedAt={null} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const flag = texts.find(t => t.props.children === '🇻🇪');
    expect(flag).toBeTruthy();
  });
});
