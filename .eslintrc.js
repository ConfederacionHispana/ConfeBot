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
    'one-var': ['off'],
    '@typescript-eslint/ban-ts-comment': ['warn'],
    '@typescript-eslint/comma-dangle': ['error', 'never'],
    '@typescript-eslint/no-shadow': ['off']
  }
};
