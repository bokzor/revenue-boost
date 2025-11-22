import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'happy-dom',
    watch: false,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      'tests/unit/**/*.integration.test.ts', // Exclude integration tests (require real database)
    ],
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

