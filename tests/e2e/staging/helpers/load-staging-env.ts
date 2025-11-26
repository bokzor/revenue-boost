import path from "path";
import * as dotenv from "dotenv";

// Force-load staging env for E2E runs so Prisma and Playwright share the same config.
const result = dotenv.config({
  path: path.resolve(process.cwd(), ".env.staging.env"),
  override: true,
});

if (result.error) {
  console.warn("[E2E] Failed to load .env.staging.env", result.error);
}

if (!process.env.DATABASE_URL) {
  throw new Error("[E2E] DATABASE_URL is missing. Add it to .env.staging.env before running staging tests.");
}
