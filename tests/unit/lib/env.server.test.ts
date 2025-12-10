/**
 * Unit Tests for Environment Variable Validation
 *
 * Tests the environment validation utilities.
 * Note: Due to module caching, we test the schema validation logic
 * rather than the cached getEnv/validateEnv functions.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the schema for testing (matches env.server.ts)
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SHOPIFY_API_KEY: z.string().min(1, "SHOPIFY_API_KEY is required"),
  SHOPIFY_API_SECRET: z.string().min(1, "SHOPIFY_API_SECRET is required"),
  SHOPIFY_APP_URL: z.string().url().optional().or(z.literal("")),
  SCOPES: z.string().min(1, "SCOPES is required"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid database connection string"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  REDIS_URL: z.string().url().optional(),
  INTERNAL_API_SECRET: z.string().min(32, "INTERNAL_API_SECRET must be at least 32 characters"),
  SHOP_CUSTOM_DOMAIN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  APP_VERSION: z.string().optional(),
  BILLING_BYPASS: z.string().optional().transform((val) => val === "true"),
  RATE_LIMIT_BYPASS: z.string().optional().transform((val) => val === "true"),
  ENABLE_RECOMMENDATION_ANALYTICS: z.string().optional().transform((val) => val === "true"),
});

describe("Environment Validation Schema", () => {
  const validEnv = {
    NODE_ENV: "test",
    SHOPIFY_API_KEY: "test-api-key",
    SHOPIFY_API_SECRET: "test-api-secret",
    SCOPES: "read_products,write_products",
    DATABASE_URL: "postgresql://localhost:5432/test",
    SESSION_SECRET: "a".repeat(32),
    INTERNAL_API_SECRET: "b".repeat(32),
  };

  describe("required fields", () => {
    it("should validate with all required env vars", () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
    });

    it("should fail when SHOPIFY_API_KEY is missing", () => {
      const { SHOPIFY_API_KEY, ...env } = validEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("should fail when SHOPIFY_API_SECRET is missing", () => {
      const { SHOPIFY_API_SECRET, ...env } = validEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("should fail when SCOPES is missing", () => {
      const { SCOPES, ...env } = validEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });

    it("should fail when DATABASE_URL is missing", () => {
      const { DATABASE_URL, ...env } = validEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(false);
    });
  });

  describe("SESSION_SECRET validation", () => {
    it("should fail when SESSION_SECRET is too short", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        SESSION_SECRET: "too-short",
      });
      expect(result.success).toBe(false);
    });

    it("should pass with 32+ character SESSION_SECRET", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        SESSION_SECRET: "x".repeat(32),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("NODE_ENV validation", () => {
    it("should accept development", () => {
      const result = envSchema.safeParse({ ...validEnv, NODE_ENV: "development" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.NODE_ENV).toBe("development");
    });

    it("should accept production", () => {
      const result = envSchema.safeParse({ ...validEnv, NODE_ENV: "production" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.NODE_ENV).toBe("production");
    });

    it("should accept test", () => {
      const result = envSchema.safeParse({ ...validEnv, NODE_ENV: "test" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.NODE_ENV).toBe("test");
    });

    it("should default to development when not provided", () => {
      const { NODE_ENV, ...env } = validEnv;
      const result = envSchema.safeParse(env);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.NODE_ENV).toBe("development");
    });
  });

  describe("boolean transforms", () => {
    it("should transform BILLING_BYPASS to true", () => {
      const result = envSchema.safeParse({ ...validEnv, BILLING_BYPASS: "true" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.BILLING_BYPASS).toBe(true);
    });

    it("should transform BILLING_BYPASS to false for other values", () => {
      const result = envSchema.safeParse({ ...validEnv, BILLING_BYPASS: "false" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.BILLING_BYPASS).toBe(false);
    });

    it("should transform RATE_LIMIT_BYPASS to true", () => {
      const result = envSchema.safeParse({ ...validEnv, RATE_LIMIT_BYPASS: "true" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.RATE_LIMIT_BYPASS).toBe(true);
    });
  });

  describe("optional fields", () => {
    it("should accept valid REDIS_URL", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        REDIS_URL: "redis://localhost:6379",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid SENTRY_DSN", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        SENTRY_DSN: "https://key@sentry.io/123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept empty SHOPIFY_APP_URL", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        SHOPIFY_APP_URL: "",
      });
      expect(result.success).toBe(true);
    });
  });
});

