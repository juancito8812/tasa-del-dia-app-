import React from 'react';
import TestRenderer from 'react-test-renderer';
import ScreenContainer from '../ScreenContainer';
import { useTheme } from '../../context/ThemeContext';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style, ...props }) =>
      require('react').createElement(View, { style, ...props }, children),
  };
});

describe('ScreenContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders container in dark mode', () => {
    useTheme.mockReturnValue({ isDark: true });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ScreenContainer>
          <React.Fragment />
        </ScreenContainer>
      );
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('renders container in light mode', () => {
    useTheme.mockReturnValue({ isDark: false });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ScreenContainer>
          <React.Fragment />
        </ScreenContainer>
      );
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('wraps children', () => {
    useTheme.mockReturnValue({ isDark: true });
    let renderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <ScreenContainer>
          <React.Fragment>
            <mock-test-child />
          </React.Fragment>
        </ScreenContainer>
      );
    });
    expect(renderer.toJSON()).not.toBeNull();
  });
});
