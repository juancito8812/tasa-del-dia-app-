import React from 'react';
import TestRenderer from 'react-test-renderer';
import CustomTabBar from '../CustomTabBar';

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, style, ...props }) =>
      React.createElement(View, { style, ...props }, children),
  };
});

const mockColors = {
  glassTabBar: 'rgba(255,255,255,0.08)',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  highlight: '#e94560',
  textMuted: '#636e82',
  textPrimary: '#ffffff',
};

describe('CustomTabBar', () => {
  it('renders 3 tabs with text labels', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <CustomTabBar activeIndex={0} onTabPress={jest.fn()} colors={mockColors} />
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const labels = texts.map(t => t.props.children).flat().filter(c => typeof c === 'string');
    expect(labels).toContain('Tasas');
    expect(labels).toContain('Conversor');
    expect(labels).toContain('Historial');
  });

  it('calls onTabPress when a tab is pressed', () => {
    const onPress = jest.fn();
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <CustomTabBar activeIndex={0} onTabPress={onPress} colors={mockColors} />
      );
    });
    const root = renderer.root;
    const conversorTab = root.findByProps({ accessibilityLabel: 'Conversor' });
    TestRenderer.act(() => {
      conversorTab.props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith(1);
  });

  it('renders active tab with selected accessibility state', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <CustomTabBar activeIndex={1} onTabPress={jest.fn()} colors={mockColors} />
      );
    });
    const root = renderer.root;
    const tasasTab = root.findByProps({ accessibilityLabel: 'Tasas' });
    const conversorTab = root.findByProps({ accessibilityLabel: 'Conversor' });
    const historialTab = root.findByProps({ accessibilityLabel: 'Historial' });
    expect(tasasTab.props.accessibilityState.selected).toBe(false);
    expect(conversorTab.props.accessibilityState.selected).toBe(true);
    expect(historialTab.props.accessibilityState.selected).toBe(false);
  });
});
