import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
  { ignores: ['**/dist/**', '**/node_modules/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // Vite + React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',

      // eslint-plugin-react-hooks v5 added this rule, but synchronous setState in effects
      // is the standard data-fetching pattern here (loading reset, early-return guards).
      'react-hooks/set-state-in-effect': 'off',

      // nice Vite default
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Turn off rules that conflict with Prettier formatting
  prettierConfig,
];
