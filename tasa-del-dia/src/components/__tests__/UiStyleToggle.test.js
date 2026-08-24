import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import UiStyleToggle from '../UiStyleToggle';

const mockTheme = {
  theme: 'dark',
  colors: {
    cardBg: '#1A1A1A', cardBorder: '#333333', textSecondary: '#AAAAAA',
  },
  uiStyle: 'original',
  setUiStyle: jest.fn(),
};

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => mockTheme,
}));

function press(toggle) {
  act(() => {
    toggle.props.onPress();
  });
}

describe('UiStyleToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTheme.uiStyle = 'original';
  });

  it('cicla original -> terminal al presionar', () => {
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    press(renderer.root.findByType(TouchableOpacity));
    expect(mockTheme.setUiStyle).toHaveBeenCalledWith('terminal');
  });

  it('cicla terminal -> editorial al presionar', () => {
    mockTheme.uiStyle = 'terminal';
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    press(renderer.root.findByType(TouchableOpacity));
    expect(mockTheme.setUiStyle).toHaveBeenCalledWith('editorial');
  });

  it('cicla editorial -> original al presionar', () => {
    mockTheme.uiStyle = 'editorial';
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    press(renderer.root.findByType(TouchableOpacity));
    expect(mockTheme.setUiStyle).toHaveBeenCalledWith('original');
  });

  it('expone accessibilityLabel con actual y siguiente', () => {
    mockTheme.uiStyle = 'terminal';
    let renderer;
    act(() => { renderer = TestRenderer.create(<UiStyleToggle />); });
    const btn = renderer.root.findByType(TouchableOpacity);
    expect(btn.props.accessibilityLabel).toBe('Diseño actual: Terminal. Toca para cambiar a Editorial');
  });
});
