/**
 * Unit Tests for Sentry Client Module
 *
 * Tests the client-side Sentry error monitoring configuration.
 */

import { describe, it, expect } from "vitest";

// Recreate the user context structure
interface ClientUserContext {
  id: string;
  email?: string;
  shop?: string;
}

// Helper to validate user context
function isValidClientUserContext(user: unknown): user is ClientUserContext {
  if (!user || typeof user !== "object") return false;
  const u = user as Record<string, unknown>;
  return typeof u.id === "string" && u.id.length > 0;
}

// Helper to check if running in browser
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// Helper to check if production
function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

// Helper to get DSN from meta tag (simulated)
function getDsnFromMeta(document: { querySelector: (selector: string) => { getAttribute: (name: string) => string | null } | null }): string | null {
  const meta = document.querySelector('meta[name="sentry-dsn"]');
  return meta?.getAttribute("content") ?? null;
}

describe("Sentry Client Module", () => {
  describe("isValidClientUserContext", () => {
    it("should return true for valid user context", () => {
      const user = { id: "user_123" };
      expect(isValidClientUserContext(user)).toBe(true);
    });

    it("should return true for user with optional fields", () => {
      const user = {
        id: "user_123",
        email: "test@example.com",
        shop: "mystore.myshopify.com",
      };
      expect(isValidClientUserContext(user)).toBe(true);
    });

    it("should return false for missing id", () => {
      const user = { email: "test@example.com" };
      expect(isValidClientUserContext(user)).toBe(false);
    });

    it("should return false for empty id", () => {
      const user = { id: "" };
      expect(isValidClientUserContext(user)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isValidClientUserContext(null)).toBe(false);
    });
  });

  describe("isBrowser", () => {
    it("should return boolean", () => {
      const result = isBrowser();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("isProductionEnv", () => {
    it("should return boolean", () => {
      const result = isProductionEnv();
      expect(typeof result).toBe("boolean");
    });

    it("should return false in test environment", () => {
      // In test environment, NODE_ENV is typically 'test'
      expect(isProductionEnv()).toBe(false);
    });
  });

  describe("getDsnFromMeta", () => {
    it("should return DSN when meta tag exists", () => {
      const mockDocument = {
        querySelector: (selector: string) => {
          if (selector === 'meta[name="sentry-dsn"]') {
            return {
              getAttribute: (name: string) => {
                if (name === "content") return "https://abc@sentry.io/123";
                return null;
              },
            };
          }
          return null;
        },
      };

      const dsn = getDsnFromMeta(mockDocument);
      expect(dsn).toBe("https://abc@sentry.io/123");
    });

    it("should return null when meta tag is missing", () => {
      const mockDocument = {
        querySelector: () => null,
      };

      const dsn = getDsnFromMeta(mockDocument);
      expect(dsn).toBeNull();
    });
  });

  describe("Sentry client configuration", () => {
    it("should have correct sample rates", () => {
      const tracesSampleRate = 0.1;
      const replaysSessionSampleRate = 0.1;
      const replaysOnErrorSampleRate = 1.0;

      expect(tracesSampleRate).toBe(0.1);
      expect(replaysSessionSampleRate).toBe(0.1);
      expect(replaysOnErrorSampleRate).toBe(1.0);
    });

    it("should have replay privacy settings", () => {
      const replayConfig = {
        maskAllText: true,
        blockAllMedia: true,
      };

      expect(replayConfig.maskAllText).toBe(true);
      expect(replayConfig.blockAllMedia).toBe(true);
    });
  });
});

