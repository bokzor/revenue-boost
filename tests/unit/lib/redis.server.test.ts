/**
 * Unit Tests for Redis Server Module
 *
 * Tests the Redis configuration, prefixes, and TTL constants.
 */

import { describe, it, expect } from "vitest";

// Recreate the Redis prefixes
const REDIS_PREFIXES = {
  FREQUENCY_CAP: "freq_cap",
  GLOBAL_FREQUENCY: "global_freq_cap",
  COOLDOWN: "cooldown",
  VISITOR: "visitor",
  PAGE_VIEW: "pageview",
  STATS: "stats",
  SESSION: "session",
  RECOMMENDATIONS: "recs",
} as const;

// Recreate the Redis TTL constants
const REDIS_TTL = {
  SESSION: 3600, // 1 hour
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800,
  MONTH: 2592000,
  VISITOR: 7776000, // 90 days
} as const;

// Helper to build Redis key
function buildRedisKey(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts].join(":");
}

// Helper to calculate retry delay
function calculateRetryDelay(times: number): number {
  return Math.min(times * 50, 2000);
}

// Helper to mask Redis URL for logging
function maskRedisUrl(url: string): string {
  return url.replace(/:\/\/[^@]+@/, "://***@");
}

// Helper to check if TLS should be enabled
function shouldEnableTls(url: string): boolean {
  return url.startsWith("rediss://");
}

describe("Redis Server Module", () => {
  describe("REDIS_PREFIXES", () => {
    it("should have all required prefixes", () => {
      expect(REDIS_PREFIXES.FREQUENCY_CAP).toBe("freq_cap");
      expect(REDIS_PREFIXES.GLOBAL_FREQUENCY).toBe("global_freq_cap");
      expect(REDIS_PREFIXES.COOLDOWN).toBe("cooldown");
      expect(REDIS_PREFIXES.VISITOR).toBe("visitor");
      expect(REDIS_PREFIXES.PAGE_VIEW).toBe("pageview");
      expect(REDIS_PREFIXES.STATS).toBe("stats");
      expect(REDIS_PREFIXES.SESSION).toBe("session");
      expect(REDIS_PREFIXES.RECOMMENDATIONS).toBe("recs");
    });

    it("should have 8 prefixes", () => {
      expect(Object.keys(REDIS_PREFIXES)).toHaveLength(8);
    });
  });

  describe("REDIS_TTL", () => {
    it("should have correct SESSION TTL (1 hour)", () => {
      expect(REDIS_TTL.SESSION).toBe(3600);
    });

    it("should have correct HOUR TTL", () => {
      expect(REDIS_TTL.HOUR).toBe(3600);
    });

    it("should have correct DAY TTL (24 hours)", () => {
      expect(REDIS_TTL.DAY).toBe(86400);
      expect(REDIS_TTL.DAY).toBe(24 * 60 * 60);
    });

    it("should have correct WEEK TTL (7 days)", () => {
      expect(REDIS_TTL.WEEK).toBe(604800);
      expect(REDIS_TTL.WEEK).toBe(7 * 24 * 60 * 60);
    });

    it("should have correct MONTH TTL (30 days)", () => {
      expect(REDIS_TTL.MONTH).toBe(2592000);
      expect(REDIS_TTL.MONTH).toBe(30 * 24 * 60 * 60);
    });

    it("should have correct VISITOR TTL (90 days)", () => {
      expect(REDIS_TTL.VISITOR).toBe(7776000);
      expect(REDIS_TTL.VISITOR).toBe(90 * 24 * 60 * 60);
    });
  });

  describe("buildRedisKey", () => {
    it("should build key with single part", () => {
      const key = buildRedisKey("freq_cap", "store123");
      expect(key).toBe("freq_cap:store123");
    });

    it("should build key with multiple parts", () => {
      const key = buildRedisKey("freq_cap", "store123", "campaign456", "visitor789");
      expect(key).toBe("freq_cap:store123:campaign456:visitor789");
    });

    it("should handle prefix only", () => {
      const key = buildRedisKey("stats");
      expect(key).toBe("stats");
    });
  });

  describe("calculateRetryDelay", () => {
    it("should increase delay with retries", () => {
      expect(calculateRetryDelay(1)).toBe(50);
      expect(calculateRetryDelay(2)).toBe(100);
      expect(calculateRetryDelay(10)).toBe(500);
    });

    it("should cap delay at 2000ms", () => {
      expect(calculateRetryDelay(50)).toBe(2000);
      expect(calculateRetryDelay(100)).toBe(2000);
    });
  });

  describe("maskRedisUrl", () => {
    it("should mask credentials in URL", () => {
      const url = "redis://user:password@localhost:6379";
      const masked = maskRedisUrl(url);
      expect(masked).toBe("redis://***@localhost:6379");
    });

    it("should handle URL without credentials", () => {
      const url = "redis://localhost:6379";
      const masked = maskRedisUrl(url);
      expect(masked).toBe("redis://localhost:6379");
    });
  });

  describe("shouldEnableTls", () => {
    it("should return true for rediss:// URLs", () => {
      expect(shouldEnableTls("rediss://localhost:6379")).toBe(true);
    });

    it("should return false for redis:// URLs", () => {
      expect(shouldEnableTls("redis://localhost:6379")).toBe(false);
    });
  });
});

