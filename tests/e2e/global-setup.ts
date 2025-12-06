import { runPreflightChecks } from "./staging/helpers/preflight-check";

/**
 * Playwright Global Setup
 * 
 * Runs before all E2E tests to verify the staging environment is correctly configured.
 * 
 * This catches common issues early:
 * - Wrong app installed on staging store (production vs staging)
 * - Database connection issues
 * - App Proxy misconfiguration
 * - Backend unreachable
 * 
 * To skip pre-flight checks (e.g., for debugging), set SKIP_PREFLIGHT=true
 */
async function globalSetup() {
  // Allow skipping preflight checks for debugging
  if (process.env.SKIP_PREFLIGHT === "true") {
    console.log("\n⚠️  Skipping pre-flight checks (SKIP_PREFLIGHT=true)\n");
    return;
  }

  const result = await runPreflightChecks();

  if (!result.success) {
    // In CI, fail fast. Locally, warn but continue (for debugging)
    if (process.env.CI === "true") {
      throw new Error(
        "E2E Pre-flight checks failed. Fix the issues above before running tests.\n" +
        "Common fixes:\n" +
        "  1. Ensure the STAGING app is installed on revenue-boost-staging.myshopify.com\n" +
        "  2. Check DATABASE_URL points to the staging database\n" +
        "  3. Verify Cloud Run staging deployment is running"
      );
    } else {
      console.warn(
        "\n⚠️  Pre-flight checks failed but continuing (local mode).\n" +
        "   Tests may fail. Set CI=true to enforce strict checks.\n"
      );
    }
  }
}

export default globalSetup;

