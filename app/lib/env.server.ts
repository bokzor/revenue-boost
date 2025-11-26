/**
 * Environment Variable Validation
 *
 * Validates required environment variables at startup
 * Fails fast with clear error messages if configuration is invalid
 */

import { z } from "zod";

/**
 * Environment variable schema
 * Defines all required and optional environment variables
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Shopify Configuration (Required)
  SHOPIFY_API_KEY: z.string().min(1, "SHOPIFY_API_KEY is required"),
  SHOPIFY_API_SECRET: z.string().min(1, "SHOPIFY_API_SECRET is required"),
  SHOPIFY_APP_URL: z
    .string()
    .url("SHOPIFY_APP_URL must be a valid URL")
    .optional()
    .or(z.literal("")),
  SCOPES: z.string().min(1, "SCOPES is required (comma-separated list)"),

  // Database Configuration (Required)
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid database connection string"),

  // Session Configuration (Required)
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters for security"),

  // Redis Configuration (Required for production, optional for development)
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis connection string").optional(),

  // Internal API Secret (Required)
  INTERNAL_API_SECRET: z
    .string()
    .min(32, "INTERNAL_API_SECRET must be at least 32 characters for security"),

  // Optional Configuration
  SHOP_CUSTOM_DOMAIN: z.string().optional(),

  // Monitoring Configuration (Optional, recommended for production)
  SENTRY_DSN: z.string().url("SENTRY_DSN must be a valid Sentry DSN URL").optional(),
  APP_VERSION: z.string().optional(), // For release tracking

  // Billing Configuration
  // Set to "true" to bypass Shopify Billing API (for staging with Custom distribution)
  BILLING_BYPASS: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

/**
 * Validated environment variables type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Cached validated environment
 */
let validatedEnv: Env | null = null;

/**
 * Validate environment variables
 *
 * @throws {Error} If validation fails with detailed error messages
 * @returns Validated environment object
 */
export function validateEnv(): Env {
  // Return cached result if already validated
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => {
        const path = err.path.join(".");
        return `  ❌ ${path}: ${err.message}`;
      });

      const errorMessage = [
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "❌ ENVIRONMENT VARIABLE VALIDATION FAILED",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "The following environment variables are missing or invalid:",
        "",
        ...errorMessages,
        "",
        "Please check your .env file and ensure all required variables are set.",
        "",
        "Required variables:",
        "  - SHOPIFY_API_KEY",
        "  - SHOPIFY_API_SECRET",
        "  - SCOPES",
        "  - DATABASE_URL",
        "  - SESSION_SECRET (min 32 characters)",
        "  - INTERNAL_API_SECRET (min 32 characters)",
        "",
        "Optional variables:",
        "  - SHOPIFY_APP_URL (required for production)",
        "  - REDIS_URL (recommended for production)",
        "  - SHOP_CUSTOM_DOMAIN",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
      ].join("\n");

      throw new Error(errorMessage);
    }

    throw error;
  }
}

/**
 * Get validated environment variables
 * Safe to use after validateEnv() has been called
 */
export function getEnv(): Env {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === "development";
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === "test";
}

/**
 * Check if billing bypass is enabled
 * Use this for staging apps with Custom distribution that can't use Shopify Billing API
 */
export function isBillingBypassed(): boolean {
  return getEnv().BILLING_BYPASS === true;
}

/**
 * Validate production-specific requirements
 * Call this in production builds to ensure all production variables are set
 */
export function validateProductionEnv(): void {
  const env = getEnv();

  if (env.NODE_ENV === "production") {
    const errors: string[] = [];

    if (!env.SHOPIFY_APP_URL) {
      errors.push("SHOPIFY_APP_URL is required in production");
    }

    if (!env.REDIS_URL) {
      errors.push("REDIS_URL is required in production for session storage");
    }

    if (errors.length > 0) {
      throw new Error(
        `Production environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`
      );
    }
  }
}
