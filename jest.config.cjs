/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  bail: 0,
  collectCoverage: true,
  collectCoverageFrom: ['*/**/*.ts', '*/**/*.tsx'],
  coverageDirectory: '.coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/\\.', '\\.d\\.ts$'],
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'html-spa', 'lcov'],
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
  moduleNameMapper: {},
  preset: 'ts-jest/presets/js-with-babel',
  restoreMocks: true,
  roots: ['<rootDir>'],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: [],
  verbose: true,
};
