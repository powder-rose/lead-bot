import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
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
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
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
  },

  {
    files: ['client/src/**/*.jsx'],
    extends: [reactRefresh.configs.vite()],
  },

  eslintConfigPrettier,
]);
