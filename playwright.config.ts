import { defineConfig, devices } from "@playwright/test";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

/**
 * Load environment variables for E2E tests.
 *
 * Priority (first found wins):
 * 1. CI mode: Use environment variables from GitHub secrets
 * 2. E2E_ENV_FILE: Custom env file path
 * 3. .env.e2e: E2E-specific config file
 * 4. .env.staging.env: Legacy support
 * 5. .env: Default fallback
 */
const isCI = process.env.CI === "true";

if (!isCI) {
  const envFileCandidates = [
    process.env.E2E_ENV_FILE,
    path.resolve(process.cwd(), ".env.e2e"),
    path.resolve(process.cwd(), ".env.staging.env"),
    path.resolve(process.cwd(), ".env"),
  ].filter(Boolean) as string[];

  for (const envFile of envFileCandidates) {
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile, override: true });
      break;
    }
  }
}

/**
 * Playwright Configuration for E2E Tests
 *
 * =============================================================================
 * TEST TYPES
 * =============================================================================
 *
 * 1. STOREFRONT TESTS (storefront-*.spec.ts)
 *    - Test popup rendering on real Shopify storefront
 *    - No admin login required
 *    - Works in CI
 *
 * 2. ADMIN TESTS (admin-*.spec.ts) - Two modes:
 *
 *    a) REAL SHOPIFY ADMIN (default, local testing)
 *       - Tests run against real Shopify admin iframe
 *       - Requires ADMIN_EMAIL/ADMIN_PASSWORD
 *       - Run with: npm run test:e2e -- --project=admin --headed
 *
 *    b) TEST_MODE (CI, automated testing)
 *       - Set TEST_MODE=true environment variable
 *       - Tests run against local server (port 3001)
 *       - No Shopify login required
 *       - CI starts its own server, doesn't touch your dev server
 *
 * =============================================================================
 * RUNNING TESTS
 * =============================================================================
 *
 * # Storefront tests (works in CI)
 * npm run test:e2e -- --project=storefront
 *
 * # Admin tests - real Shopify (local, manual)
 * npm run test:e2e -- --project=admin --headed
 *
 * # Admin tests - TEST_MODE (CI, automated)
 * # First start test server: npm run dev:test:ci
 * # Then: TEST_MODE=true npm run test:e2e -- --project=admin-ci
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",

  // Run pre-flight checks before all tests
  globalSetup: "./tests/e2e/global-setup.ts",

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
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure for debugging
    video: "retain-on-failure",

    launchOptions: {
      args: [
        '--start-minimized',  // Chromium
        '--window-position=-2400,-2400',  // Position off-screen
        '--no-startup-window'
      ]
    },
  },

  // Configure projects for different test types
  projects: [
    // =========================================================================
    // ADMIN TESTS - Real Shopify Admin (for local/manual testing)
    // =========================================================================
    // Tests run against real Shopify admin with iframe.
    // Requires: ADMIN_EMAIL, ADMIN_PASSWORD
    // Usage: npm run test:e2e -- --project=admin --headed
    {
      name: "admin",
      testMatch: "**/staging/admin-*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        // No baseURL - tests navigate to Shopify admin directly
      },
    },

    // =========================================================================
    // ADMIN TESTS - TEST_MODE (for CI/automated testing)
    // =========================================================================
    // Tests run against local server with TEST_MODE=true (no Shopify auth).
    // CI starts its own server on port 3001, doesn't touch your dev server.
    // Usage: TEST_MODE=true npm run test:e2e -- --project=admin-ci
    {
      name: "admin-ci",
      testMatch: "**/staging/admin-*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        // Base URL for TEST_MODE - local server
        baseURL: process.env.TEST_SERVER_URL || "http://localhost:3001",
      },
    },

    // =========================================================================
    // STOREFRONT TESTS - Real Shopify Storefront
    // =========================================================================
    // Tests run against real Shopify storefront (popup rendering).
    // No admin login required - works in CI.
    // Usage: npm run test:e2e -- --project=storefront
    {
      name: "storefront",
      testMatch: "**/storefront-*.spec.ts",
      // Force single worker for storefront tests to avoid race conditions
      // The staging environment has caching that causes issues with parallel tests
      fullyParallel: false,
      use: {
        ...devices["Desktop Chrome"],
        // Storefront tests don't use baseURL - they use STORE_URL directly
      },
    },

    // =========================================================================
    // INTEGRATION TESTS - Admin to Storefront Full Flow
    // =========================================================================
    // Tests that create campaigns in admin and verify them on storefront.
    // Requires TEST_MODE=true for admin access without Shopify login.
    // Usage: TEST_MODE=true npm run test:e2e -- --project=integration
    {
      name: "integration",
      testMatch: "**/integration-*.spec.ts",
      fullyParallel: false,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.TEST_SERVER_URL || "http://localhost:3001",
      },
    },
  ],

  // ===========================================================================
  // WEB SERVER CONFIGURATION (for CI)
  // ===========================================================================
  // In CI, we start a local server with TEST_MODE before running admin tests.
  // Your local dev server (npm run dev) is NOT affected.
  // ===========================================================================
  webServer: process.env.CI && process.env.TEST_MODE === "true"
    ? {
        command: "npm run start",
        url: "http://localhost:3001",
        reuseExistingServer: false,
        timeout: 120 * 1000,
        env: {
          TEST_MODE: "true",
          TEST_SHOP_DOMAIN: process.env.TEST_SHOP_DOMAIN || "revenue-boost-staging.myshopify.com",
          PORT: "3001",
        },
      }
    : undefined,
});
