const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'android/**', 'ios/**'],
  },
  {
    languageOptions: {
      globals: {
        __DEV__: 'readonly',
      },
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.js', '**/*.spec.js', 'jest.setup.js'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      // Patrón válido en tests: capturar setters de hooks en variables externas.
      'react-hooks/globals': 'off',
    },
  },
  {
    files: ['scripts/**'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Reglas experimentales del react-compiler: producen falsos positivos
    // con patrones estándar de React Native (p.ej. useRef(...).current en render).
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // Falso positivo: expo-file-system es CJS y el resolver no lo resuelve.
      'import/namespace': 'off',
    },
  },
]);
