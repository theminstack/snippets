/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['*/**/*.ts', '*/**/*.tsx'],
  coverageDirectory: '.coverage',
  coverageProvider: 'v8',
  coverageReporters: ['text-summary', 'json-summary', 'html', 'lcov'],
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
  moduleNameMapper: {},
  preset: 'ts-jest',
  restoreMocks: true,
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/\\.'],
};
