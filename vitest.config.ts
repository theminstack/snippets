import { EventEmitter } from 'node:events';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

EventEmitter.defaultMaxListeners = 20;

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    root: __dirname,
    setupFiles: [`./vitest.setup.ts`],
    environment: 'jsdom',
    globals: true,
    restoreMocks: true,
    passWithNoTests: true,
    reporters: ['verbose'],
    coverage: {
      enabled: true,
      reportsDirectory: './out/coverage',
      all: true,
      include: ['**/*'],
      exclude: ['**/{.git,.github,.vscode,node_modules,out,lib,dist}', '*.*', '**/*.d.ts'],
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
});
