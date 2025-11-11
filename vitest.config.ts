import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '~': resolve(__dirname, './app'),
    },
  },
  test: {
    globals: true,
    // Use jsdom for browser-like environment (needed for component tests)
    // Node environment tests work fine with jsdom as well
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['netlify/functions/**/*.{mts,ts}', 'app/components/**/*.tsx'],
      exclude: [
        'netlify/functions/**/*.test.{mts,ts}',
        'netlify/functions/utils/**',
        'app/components/ui/**',
        'app/components/**/*.spec.tsx',
        'app/components/**/*.test.tsx',
      ],
    },
    // Include both backend function tests and component tests
    include: [
      'netlify/functions/**/*.test.{mts,ts}',
      'app/components/**/*.spec.tsx',
      'app/components/**/*.test.tsx',
    ],
  },
});

