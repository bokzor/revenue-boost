import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Vitest Configuration for Integration Tests
 * 
 * Integration tests require a real PostgreSQL database.
 * Run with: vitest -c vitest.integration.config.ts
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    watch: false,
    include: [
      'tests/unit/**/*.integration.test.ts',
      'tests/integration/**/*.test.ts',
    ],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    // No setupFiles - integration tests use real database, not mocks
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'build/',
        'tests/e2e/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
});

