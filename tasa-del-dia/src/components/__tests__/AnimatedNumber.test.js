import React from 'react';
import TestRenderer from 'react-test-renderer';
import AnimatedNumber from '../AnimatedNumber';

// Mock Animated.timing to complete synchronously so animations work in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = jest.fn(() => ({
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
  }));
  return RN;
});

describe('AnimatedNumber', () => {
  it('renders with a numeric value', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={60.5} format={(v) => v.toFixed(2)} />
      );
    });
    const text = renderer.root;
    // Should have a Text element with the formatted number
    const texts = text.findAllByType('Text');
    const numberText = texts.find(t => t.props.children === '60.50');
    expect(numberText).toBeTruthy();
  });

  it('renders dash when value is null', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={null} format={(v) => v.toFixed(2)} />
      );
    });
    const texts = renderer.root.findAllByType('Text');
    const dashText = texts.find(t => t.props.children === '—');
    expect(dashText).toBeTruthy();
  });

  it('renders dash when value is undefined', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={undefined} format={(v) => v.toFixed(2)} />
      );
    });
    const texts = renderer.root.findAllByType('Text');
    const dashText = texts.find(t => t.props.children === '—');
    expect(dashText).toBeTruthy();
  });

  it('uses .toFixed(2) as default formatter', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={42} />
      );
    });
    const texts = renderer.root.findAllByType('Text');
    const numText = texts.find(t => t.props.children === '42.00');
    expect(numText).toBeTruthy();
  });

  it('renders zero correctly', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={0} format={(v) => v.toFixed(2)} />
      );
    });
    const texts = renderer.root.findAllByType('Text');
    const numText = texts.find(t => t.props.children === '0.00');
    expect(numText).toBeTruthy();
  });

  it('does not crash on value change', () => {
    const formatFn = (v) => v.toFixed(2);
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={10} format={formatFn} />
      );
    });

    const texts1 = renderer.root.findAllByType('Text');
    expect(texts1.find(t => t.props.children === '10.00')).toBeTruthy();

    // Update should not throw
    TestRenderer.act(() => {
      renderer.update(<AnimatedNumber value={20} format={formatFn} />);
    });

    // After update, the animation starts; component should still render Text elements
    const texts2 = renderer.root.findAllByType('Text');
    expect(texts2.length).toBeGreaterThan(0);
  });

  it('handles large numbers', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={1234567.89} format={(v) => v.toLocaleString('en-US', { minimumFractionDigits: 2 })} />
      );
    });
    const texts = renderer.root.findAllByType('Text');
    const numText = texts.find(t => t.props.children === '1,234,567.89');
    expect(numText).toBeTruthy();
  });

  it('applies format function correctly', () => {
    const formatFn = (v) => `Bs. ${v.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <AnimatedNumber value={1000.5} format={formatFn} />
      );
    });
    const texts = renderer.root.findAllByType('Text');
    const formatted = texts.find(t => typeof t.props.children === 'string' && t.props.children.includes('Bs.'));
    expect(formatted).toBeTruthy();
  });
});
