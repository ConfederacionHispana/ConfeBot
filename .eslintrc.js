module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'class-methods-use-this': ['error', {
      exceptMethods: ['exec']
    }],
    'comma-dangle': ['error', 'never'],
    'consistent-return': ['off'],
    'curly': ['error', 'multi-or-nest'],
    'eol-last': ['error', 'always'],
    'guard-for-in': ['off'],
    'max-len': ['error', 120, 2, {
      ignoreUrls: true,
      ignoreComments: true,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'no-await-in-loop': ['off'],
    'no-continue': ['off'],
    'no-restricted-syntax': [
      'error',
      'LabeledStatement',
      'WithStatement',
    ],
    'one-var': ['off'],
    '@typescript-eslint/ban-ts-comment': ['warn'],
    '@typescript-eslint/comma-dangle': ['error', 'never'],
    '@typescript-eslint/no-non-null-assertion': ['off'],
    '@typescript-eslint/no-shadow': ['off']
  }
};
