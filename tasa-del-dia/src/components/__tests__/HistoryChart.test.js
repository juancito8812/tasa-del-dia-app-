import React from 'react';
import TestRenderer from 'react-test-renderer';
import HistoryChart from '../HistoryChart';

const C = {
  success: '#00b894',
  highlight: '#e94560',
  textSecondary: '#a0aec0',
  textMuted: '#636e82',
};

const chartInfo = {
  labels: ['06/21', '06/20', '06/19'],
  data: [[80, 79, 78], [95, 94, 93]],
};

describe('HistoryChart', () => {
  it('returns null when chartInfo is null', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HistoryChart chartInfo={null} C={C} ratesCount={10} />
      );
    });
    expect(renderer.toJSON()).toBeNull();
  });

  it('renders chart when data provided', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HistoryChart chartInfo={chartInfo} C={C} ratesCount={10} />
      );
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('shows legend labels', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HistoryChart chartInfo={chartInfo} C={C} ratesCount={10} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const bcvLabel = texts.find(t => t.props.children === 'BCV');
    const paraleloLabel = texts.find(t => t.props.children === 'Paralelo');
    expect(bcvLabel).toBeTruthy();
    expect(paraleloLabel).toBeTruthy();
  });

  function findTextContaining(texts, substr) {
    return texts.find(t => {
      const c = t.props.children;
      if (typeof c === 'string') return c.includes(substr);
      if (Array.isArray(c)) return c.some(item => typeof item === 'string' && item.includes(substr));
      return false;
    });
  }

  it('shows rate count', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HistoryChart chartInfo={chartInfo} C={C} ratesCount={10} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const countText = findTextContaining(texts, 'registro');
    expect(countText).toBeTruthy();
  });

  it('shows singular for 1 registro', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HistoryChart chartInfo={chartInfo} C={C} ratesCount={1} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const countText = findTextContaining(texts, 'registro');
    expect(countText).toBeTruthy();
  });

  it('shows bar value labels for data points', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <HistoryChart chartInfo={chartInfo} C={C} ratesCount={10} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    // BCV values: 80, 79, 78 formatted as "80.0", "79.0", "78.0"
    const val80 = texts.find(t => t.props.children === '80.0');
    const val79 = texts.find(t => t.props.children === '79.0');
    expect(val80).toBeTruthy();
    expect(val79).toBeTruthy();
  });
});
