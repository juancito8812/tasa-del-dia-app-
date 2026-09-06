import React from 'react';
import TestRenderer from 'react-test-renderer';
import BankDataScreen from '../BankDataScreen';

jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#0b0b16',
      card: '#1a1a2e',
      cardBorder: '#2a2a4a',
      textPrimary: '#ffffff',
      textSecondary: '#a0aec0',
      textMuted: '#636e82',
      highlight: '#e94560',
      border: '#2a2a4a',
    },
    isDark: true,
    theme: 'dark',
    uiStyle: 'original',
    loaded: true,
  }),
}));

jest.mock('../../services/bankData', () => ({
  getAccounts: jest.fn(() => Promise.resolve([])),
  deleteAccount: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../components/BankAccountCard', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBankAccountCard = (props) => React.createElement(View, { testID: 'bank-account-card' });
  MockBankAccountCard.displayName = 'BankAccountCard';
  return MockBankAccountCard;
});

jest.mock('../../components/BankAccountForm', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockBankAccountForm = (props) => React.createElement(View, { testID: 'bank-account-form' });
  MockBankAccountForm.displayName = 'BankAccountForm';
  return MockBankAccountForm;
});

describe('BankDataScreen', () => {
  it('renders without crashing', async () => {
    let renderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<BankDataScreen />);
    });
    expect(renderer.toJSON()).toBeTruthy();
  });

  it('renders header title', async () => {
    let renderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<BankDataScreen />);
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const labels = texts.map((t) => t.props.children).flat().filter((c) => typeof c === 'string');
    expect(labels).toContain('Datos Bancarios');
  });

  it('shows empty account count when no accounts', async () => {
    let renderer;
    await TestRenderer.act(async () => {
      renderer = TestRenderer.create(<BankDataScreen />);
    });
    const root = renderer.root;
    const texts = root.findAllByType('Text');
    const labels = texts.map((t) => t.props.children).flat().filter((c) => typeof c === 'string');
    expect(labels).toContain('cuentas');
  });
});
