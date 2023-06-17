const path = require('path');

module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
    },
  },
  // Configuration for JavaScript files
  extends: [
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', 'unused-imports', 'simple-import-sort'],
  // files: ['**/*.jsx', '**/*.js'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        endOfLine: 'auto',
      },
    ],
    'react/prop-types': 'off',
    'react/destructuring-assignment': 'off', // Vscode doesn't support automatically destructuring, it's a pain to add a new variable
    'react/require-default-props': 'off', // Allow non-defined react props as undefined
    'import/prefer-default-export': 'off', // Named export is easier to refactor automatically
    'simple-import-sort/imports': 'error', // Import configuration for `eslint-plugin-simple-import-sort`
    'simple-import-sort/exports': 'error', // Export configuration for `eslint-plugin-simple-import-sort`
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  // overrides: [
  //   // Configuration for TypeScript files
  //   {
  //     files: ['**/*.jsx', '**/*.js'],
  //     plugins: ['unused-imports', 'simple-import-sort'],
  //     extends: ['plugin:prettier/recommended'],
  //     rules: {
  //       'prettier/prettier': [
  //         'error',
  //         {
  //           singleQuote: true,
  //           endOfLine: 'auto',
  //         },
  //       ],
  //       'react/destructuring-assignment': 'off', // Vscode doesn't support automatically destructuring, it's a pain to add a new variable
  //       'react/require-default-props': 'off', // Allow non-defined react props as undefined
  //       'import/prefer-default-export': 'off', // Named export is easier to refactor automatically
  //       'simple-import-sort/imports': 'error', // Import configuration for `eslint-plugin-simple-import-sort`
  //       'simple-import-sort/exports': 'error', // Export configuration for `eslint-plugin-simple-import-sort`
  //       'unused-imports/no-unused-imports': 'error',
  //       'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  //     },
  //   },
  // ],
};
