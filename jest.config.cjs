/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  bail: 0,
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{ts,tsx}'],
  coverageDirectory: '.coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/\\.', '/_', '/index\\.tsx?$', '\\.d\\.ts$'],
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'html-spa', 'lcov'],
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': { useESM: true },
  },
  moduleNameMapper: {
    // Remove the .js extension (required for ES Module support) from TS file imports.
    '^(\\.{1,2}/.*)\\.jsx?$': '$1',
  },
  preset: 'ts-jest',
  restoreMocks: true,
  roots: ['<rootDir>'],
  setupFilesAfterEnv: [],
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['/node_modules/core-js/'],
  verbose: true,
};
