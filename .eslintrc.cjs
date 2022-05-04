/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: { browser: true, es2022: true, jest: true, node: true },
  extends: ['rational', 'rational/warn', 'rational/react', 'rational/prettier'],
  ignorePatterns: ['node_modules', 'lib', 'out', 'dist'],
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      parserOptions: { sourceType: 'script' },
    },
    {
      extends: ['rational/typescript', 'rational/prettier'],
      files: ['*.ts', '*.tsx'],
      parserOptions: { project: './tsconfig.json' },
    },
  ],
  root: true,
  rules: {
    'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
  },
};
