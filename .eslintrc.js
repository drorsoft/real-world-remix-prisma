/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    '@remix-run/eslint-config',
    '@remix-run/eslint-config/node',
    'plugin:react-hooks/recommended',
    'plugin:playwright/playwright-test',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/padding-line-between-statements': [
      'warn',
      {
        blankLine: 'always',
        prev: [
          'block-like',
          'multiline-const',
          'expression',
          'for',
          'function',
          'if',
          'throw',
          'try',
          'class',
        ],
        next: '*',
      },
      {
        blankLine: 'always',
        prev: '*',
        next: [
          'return',
          'block-like',
          'expression',
          'for',
          'function',
          'if',
          'throw',
          'try',
          'class',
        ],
      },
    ],
    'import/order': [
      'warn',
      {
        pathGroups: [
          {
            pattern: '~/**',
            group: 'external',
            position: 'after',
          },
        ],
        distinctGroup: false,
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'react/jsx-sort-props': 1,
  },
}
