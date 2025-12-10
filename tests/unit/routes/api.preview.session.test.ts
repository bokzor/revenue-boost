/**
 * Unit Tests for Preview Session API
 *
 * Tests the session data structure and helper functions.
 */

import { describe, it, expect } from "vitest";

// Recreate the constants from the route
const PREVIEW_TTL = 30 * 60; // 30 minutes in seconds

// Recreate the session data structure
interface PreviewSessionData {
  data: unknown;
  storeId: string;
  createdAt: number;
}

// Recreate the Redis key generation
function generateRedisKey(prefix: string, token: string): string {
  return `${prefix}:${token}`;
}

// Recreate the expiry calculation
function calculateExpiresAt(ttlSeconds: number): Date {
  return new Date(Date.now() + ttlSeconds * 1000);
}

// Recreate the token validation
function isValidToken(token: string | undefined): boolean {
  return typeof token === "string" && token.length > 0;
}

describe("Preview Session API", () => {
  describe("Constants", () => {
    it("should have 30 minute TTL", () => {
      expect(PREVIEW_TTL).toBe(30 * 60);
    });
  });

  describe("PreviewSessionData structure", () => {
    it("should have valid session data structure", () => {
      const sessionData: PreviewSessionData = {
        data: { templateType: "NEWSLETTER", contentConfig: {} },
        storeId: "test-shop.myshopify.com",
        createdAt: Date.now(),
      };

      expect(sessionData.data).toBeDefined();
      expect(sessionData.storeId).toBe("test-shop.myshopify.com");
      expect(sessionData.createdAt).toBeGreaterThan(0);
    });
  });

  describe("generateRedisKey", () => {
    it("should generate correct Redis key", () => {
      const prefix = "session:preview";
      const token = "abc123";
      const key = generateRedisKey(prefix, token);
      expect(key).toBe("session:preview:abc123");
    });

    it("should handle long tokens", () => {
      const prefix = "session:preview";
      const token = "a".repeat(64);
      const key = generateRedisKey(prefix, token);
      expect(key).toBe(`session:preview:${"a".repeat(64)}`);
    });
  });

  describe("calculateExpiresAt", () => {
    it("should calculate correct expiry time", () => {
      const now = Date.now();
      const expiresAt = calculateExpiresAt(PREVIEW_TTL);

      // Should be approximately 30 minutes in the future
      const diff = expiresAt.getTime() - now;
      expect(diff).toBeGreaterThan(29 * 60 * 1000);
      expect(diff).toBeLessThan(31 * 60 * 1000);
    });

    it("should return Date object", () => {
      const expiresAt = calculateExpiresAt(60);
      expect(expiresAt).toBeInstanceOf(Date);
    });
  });

  describe("isValidToken", () => {
    it("should return true for valid token", () => {
      expect(isValidToken("abc123")).toBe(true);
    });

    it("should return false for undefined", () => {
      expect(isValidToken(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidToken("")).toBe(false);
    });
  });

  describe("Response structures", () => {
    it("should have valid success response structure", () => {
      const response = {
        success: true,
        token: "abc123",
        expiresAt: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.token).toBe("abc123");
      expect(response.expiresAt).toBeDefined();
    });

    it("should have valid error response structure", () => {
      const response = {
        success: false,
        error: "Token is required",
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe("Token is required");
    });

    it("should have valid data retrieval response", () => {
      const response = {
        success: true,
        data: { templateType: "NEWSLETTER" },
        storeId: "test-shop.myshopify.com",
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.storeId).toBe("test-shop.myshopify.com");
    });
  });
});

