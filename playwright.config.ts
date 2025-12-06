import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '.env.staging.env'),
  override: true,
});

/**
 * Playwright Configuration for E2E Tests
 *
 * Supports two types of tests:
 * 1. Admin tests - Test the admin UI (use mock-bridge to avoid CAPTCHA)
 * 2. Storefront tests - Test the storefront extension (real E2E)
 *
 * Pre-flight checks run before all tests to verify:
 * - Staging store exists in staging database
 * - Correct app is installed (staging, not production)
 * - App Proxy and backend are responding
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Run pre-flight checks before all tests
  globalSetup: './tests/e2e/global-setup.ts',

  // Maximum time one test can run for
  timeout: 60 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Single worker for staging tests to avoid race conditions
  // The staging environment has caching that causes issues with parallel tests
  workers: 1,

  // Reporter to use
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/reports/junit.xml" }],
    ["json", { outputFile: "test-results/reports/results.json" }],
    ["list"], // Show test progress in console
  ],
  outputDir: "test-results/artifacts",

  // Shared settings for all the projects below
  use: {
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure for debugging
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    // Admin tests - run against mock Shopify admin
    {
      name: 'admin',
      testMatch: '**/admin-*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Admin tests use the mock admin URL (not the app URL directly)
        baseURL: 'http://localhost:3080',
      },
    },

    // Storefront tests - run against real Shopify store
    // Uses single worker to avoid race conditions with shared staging environment
    {
      name: 'storefront',
      testMatch: '**/storefront-*.spec.ts',
      // Force single worker for storefront tests to avoid race conditions
      // The staging environment has caching that causes issues with parallel tests
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        // Storefront tests don't use baseURL - they use STORE_URL directly
      },
    },
  ],

  // Run your local dev server before starting the tests
  // Commented out - start server manually before running tests
  // This gives you more control and better debugging
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:56687',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
