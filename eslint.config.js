// SPDX-FileCopyrightText: 2026 Soul Consciousness Studios
// SPDX-License-Identifier: LicenseRef-Eidovara-Source-Available-1.0
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'dist-mac/', '.wrangler/'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-console': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Sanitizer regexes legitimately match control characters (e.g. stripping NUL bytes)
      'no-control-regex': 'off',
    },
  },
  {
    // TODO(refactor): STRINGS is one flat object holding repeated keys per
    // language section (en/es/fr/de). Restructure into per-locale objects so
    // no-dupe-keys can be re-enabled here.
    files: ['src/renderer/localization.js'],
    rules: {
      'no-dupe-keys': 'off',
    },
  },
  {
    files: ['tests/**/*.test.js'],
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2024,
      globals: {
        ...globals.node,
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  {
    files: ['tests/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        test: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  {
    files: ['docs/sw.js'],
    languageOptions: {
      globals: {
        clients: 'readonly',
        skipWaiting: 'readonly',
        caches: 'readonly',
        self: 'readonly',
      },
    },
  },
  {
    files: ['docs/sw.js'],
    languageOptions: {
      globals: {
        clients: 'readonly',
        skipWaiting: 'readonly',
        caches: 'readonly',
        self: 'readonly',
      },
    },
  },
];
