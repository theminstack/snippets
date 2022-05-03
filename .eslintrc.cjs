/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: { browser: true, es2021: true, jest: true, node: true },
  extends: ['rational', 'rational/warn', 'rational/react', 'rational/prettier'],
  ignorePatterns: ['node_modules', 'lib', 'out', 'dist'],
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      parserOptions: { sourceType: 'script' },
    },
    {
      env: { node: false },
      extends: ['rational', 'rational/react', 'rational/typescript', 'rational/warn', 'rational/prettier'],
      files: ['*.ts', '*.tsx'],
      parserOptions: { project: './tsconfig.json' },
    },
  ],
  root: true,
};
