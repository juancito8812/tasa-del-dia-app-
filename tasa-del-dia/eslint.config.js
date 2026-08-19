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
    rules: {
      // React Compiler experimental rules: falsos positivos con patrones RN estándar
      // (useRef().current en render, setState en useEffect, etc.)
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Falso positivo: expo-file-system es CJS y el resolver no lo resuelve.
      'import/namespace': 'off',
    },
  },
]);
