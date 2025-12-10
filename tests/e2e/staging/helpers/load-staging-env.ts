import path from "path";
import * as dotenv from "dotenv";
import fs from "fs";

/**
 * Load staging environment for E2E tests.
 *
 * Supports multiple modes (in priority order):
 * 1. CI: Use environment variables set by GitHub secrets (CI=true)
 * 2. LOCAL with E2E_ENV_FILE: Load from specified file path
 * 3. LOCAL with .env.e2e: Load from .env.e2e if it exists
 * 4. LOCAL with .env: Fall back to .env if it exists
 *
 * For CI, set these GitHub secrets:
 * - DATABASE_URL (required)
 * - SHOPIFY_API_KEY (required)
 * - SHOPIFY_API_SECRET (required)
 * - STORE_PASSWORD (optional, defaults to "a")
 * - REDIS_URL (optional)
 *
 * For local testing, either:
 * - Export variables directly: export DATABASE_URL=...
 * - Create .env.e2e file with E2E-specific config
 * - Or use your existing .env file
 */

const isCI = process.env.CI === "true";

// Try to load from env file (only if not in CI)
if (!isCI) {
  // Priority: E2E_ENV_FILE > .env.e2e > .env.staging.env (legacy) > .env
  const envFileCandidates = [
    process.env.E2E_ENV_FILE,
    path.resolve(process.cwd(), ".env.e2e"),
    path.resolve(process.cwd(), ".env.staging.env"), // Legacy support
    path.resolve(process.cwd(), ".env"),
  ].filter(Boolean) as string[];

  let loaded = false;
  for (const envFile of envFileCandidates) {
    if (fs.existsSync(envFile)) {
      const result = dotenv.config({ path: envFile, override: true });
      if (!result.error) {
        console.log(`[E2E] Loaded environment from ${path.basename(envFile)}`);
        loaded = true;
        break;
      }
    }
  }

  if (!loaded && !process.env.DATABASE_URL) {
    console.warn("[E2E] No env file found. Set DATABASE_URL or create .env.e2e");
  }
} else {
  // CI mode: Environment variables should already be set by GitHub Actions
  console.log("[E2E] Running in CI mode - using environment variables from GitHub secrets");
}

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error(
    "[E2E] DATABASE_URL is missing.\n" +
    "  - For local runs: export DATABASE_URL=... or add to .env.e2e\n" +
    "  - For CI runs: Set DATABASE_URL in GitHub secrets (staging environment)"
  );
}
