module.exports = {
  // Do not search for configuration in parent directories
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['import', 'simple-import-sort', 'prettier'],
  rules: {
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-console': 'warn',
    'object-shorthand': 'warn',
    'prefer-const': ['error', { destructuring: 'all' }],
    'simple-import-sort/imports': 'error',
    // no-unresolved cannot resolve modules due to different extension
    'import/no-unresolved': 'off',
    'import/extensions': ['error', 'ignorePackages', { js: 'always' }],
    'import/no-default-export': 'error',
  },
};
