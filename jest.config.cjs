/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/configuration
 */

const ignorePatterns = ['/node_modules/', '/\\.', '/_', '/index\\.tsx?$', '\\.d\\.ts$'];

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  bail: 0,
  collectCoverage: true,
  collectCoverageFrom: ['**/*.{ts,tsx}'],
  coverageDirectory: '.coverage',
  coveragePathIgnorePatterns: ignorePatterns,
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'html-spa', 'lcov'],
  coverageThreshold: { global: { branches: 100, functions: 100, lines: 100, statements: 100 } },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    // Remove the .js extension (required for ES Module support) from TS file imports.
    '^(\\.{1,2}/.*)\\.jsx?$': '$1',
  },
  preset: 'ts-jest/presets/default-esm',
  restoreMocks: true,
  roots: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ignorePatterns,
  transformIgnorePatterns: ['/node_modules/core-js/'],
  verbose: true,
};
