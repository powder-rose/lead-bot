import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    'server/data/**',
  ]),

  {
    files: ['client/**/*.{js,jsx}', 'server/**/*.js', 'eslint.config.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      eqeqeq: ['error', 'always'],

      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      'no-useless-assignment': 'warn',
    },
  },

  {
    files: ['server/**/*.js', 'eslint.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  {
    files: ['client/src/**/*.{js,jsx}'],
    extends: [reactHooks.configs.flat.recommended],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['server/src/scanner.js', 'server/src/fields.js', 'server/debug-trigger.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        CSS: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
  },

  eslintConfigPrettier,
]);
