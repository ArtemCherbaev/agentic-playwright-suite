import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

/**
 * Lint rules exist here to stop the two mistakes that quietly ruin a Playwright
 * suite: an assertion nobody awaits, which passes whatever the application
 * does, and a hard wait, which trades a fast failure for a slow one.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'allure-report/**',
      'allure-results/**',
      'test-results/**',
      'reports/**',
      '**/__screenshots__/**',
    ],
  },

  js.configs.recommended,

  // Type aware linting is scoped to TypeScript. The scripts under utils are
  // plain ESM with no project of their own, and the type aware rules throw on
  // them rather than skipping them.
  {
    files: ['**/*.ts'],
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    files: ['tests/**/*.ts', 'vr-tests/**/*.ts', 'api-tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // A suite that ships with a focused test runs one case and reports green.
      'playwright/no-focused-test': 'error',
      // Skips hide; fixme names a defect. The difference matters enough to
      // enforce, and specs/STATUS.md is where the defect gets written down.
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/expect-expect': 'error',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/prefer-web-first-assertions': 'error',
    },
  },

  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly' },
    },
    rules: {
      'no-console': 'off',
    },
  },
);
