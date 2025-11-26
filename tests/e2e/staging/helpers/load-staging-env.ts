import path from "path";
import * as dotenv from "dotenv";
import fs from "fs";

/**
 * Load staging environment for E2E tests.
 *
 * Supports two modes:
 * 1. LOCAL: Load from .env.staging.env file
 * 2. CI: Use environment variables set by GitHub secrets
 *
 * The CI mode is detected by the presence of the CI environment variable.
 */

const isCI = process.env.CI === "true";
const envFilePath = path.resolve(process.cwd(), ".env.staging.env");

if (!isCI && fs.existsSync(envFilePath)) {
  // Local mode: Load from file
  const result = dotenv.config({
    path: envFilePath,
    override: true,
  });

  if (result.error) {
    console.warn("[E2E] Failed to load .env.staging.env", result.error);
  } else {
    console.log("[E2E] Loaded environment from .env.staging.env");
  }
} else if (isCI) {
  // CI mode: Environment variables should already be set by GitHub Actions
  console.log("[E2E] Running in CI mode - using environment variables from GitHub secrets");
} else {
  console.warn("[E2E] No .env.staging.env file found and not running in CI");
}

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "[E2E] DATABASE_URL is missing.\n" +
    "  - For local runs: Add it to .env.staging.env\n" +
    "  - For CI runs: Set STAGING_DATABASE_URL in GitHub secrets"
  );
}
