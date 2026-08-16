import React from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';
import PressableScale from '../PressableScale';

describe('PressableScale', () => {
  it('renders children', () => {
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <PressableScale><Text>Hola</Text></PressableScale>
      );
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    expect(texts.length).toBeGreaterThan(0);
    expect(texts[0].props.children).toBe('Hola');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <PressableScale onPress={onPress}><Text>X</Text></PressableScale>
      );
    });
    const root = renderer.root;
    const pressables = root.findAllByProps({ onPress });
    expect(pressables.length).toBeGreaterThan(0);
    TestRenderer.act(() => {
      pressables[0].props.onPress();
    });
    expect(onPress).toHaveBeenCalled();
  });
});
