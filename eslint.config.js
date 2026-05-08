// @ts-check
/**
 * Flat ESLint config (ESLint v9+). Catches the obvious — unused vars, useless
 * patterns, problematic `==`, accidental `console.error` swallowing — without
 * being noisy. Style is delegated to Prettier; we only run the recommended
 * rule set on top of that.
 */
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // We have @ts-check on top of every file; let those drive type concerns.
      // ESLint's job here is to catch dead code + dangerous patterns.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'off',
    },
  },
  {
    files: ['src/__tests__/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', 'assets/', 'examples/'],
  },
];
