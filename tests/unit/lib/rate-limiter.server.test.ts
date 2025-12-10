/**
 * Unit Tests for Rate Limiter
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { RateLimiter, RATE_LIMIT_CONFIGS } from "~/lib/rate-limiter.server";

describe("RATE_LIMIT_CONFIGS", () => {
  it("should have PUBLIC config", () => {
    expect(RATE_LIMIT_CONFIGS.PUBLIC.windowMs).toBe(60000);
    expect(RATE_LIMIT_CONFIGS.PUBLIC.maxRequests).toBe(60);
  });

  it("should have AUTHENTICATED config", () => {
    expect(RATE_LIMIT_CONFIGS.AUTHENTICATED.windowMs).toBe(60000);
    expect(RATE_LIMIT_CONFIGS.AUTHENTICATED.maxRequests).toBe(120);
  });

  it("should have WRITE config with lower limits", () => {
    expect(RATE_LIMIT_CONFIGS.WRITE.maxRequests).toBe(30);
  });

  it("should have ANALYTICS config", () => {
    expect(RATE_LIMIT_CONFIGS.ANALYTICS.maxRequests).toBe(20);
  });

  it("should have WEBHOOK config", () => {
    expect(RATE_LIMIT_CONFIGS.WEBHOOK.maxRequests).toBe(100);
  });
});

describe("RateLimiter", () => {
  beforeEach(() => {
    // Reset rate limits between tests
    RateLimiter.reset("test-id");
    RateLimiter.reset("store:test-store");
    RateLimiter.reset("ip:127.0.0.1");
  });

  describe("check", () => {
    it("should allow first request", () => {
      const result = RateLimiter.check("test-id", { windowMs: 60000, maxRequests: 10 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.limit).toBe(10);
    });

    it("should decrement remaining on each request", () => {
      const config = { windowMs: 60000, maxRequests: 5 };
      
      RateLimiter.check("test-id", config);
      const result = RateLimiter.check("test-id", config);
      
      expect(result.remaining).toBe(3);
    });

    it("should block requests exceeding limit", () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      
      RateLimiter.check("test-id", config);
      RateLimiter.check("test-id", config);
      const result = RateLimiter.check("test-id", config);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should use default config if not provided", () => {
      const result = RateLimiter.check("test-id");
      expect(result.limit).toBe(RATE_LIMIT_CONFIGS.AUTHENTICATED.maxRequests);
    });
  });

  describe("checkStore", () => {
    it("should check rate limit for store", () => {
      const result = RateLimiter.checkStore("test-store");
      expect(result.allowed).toBe(true);
    });
  });

  describe("checkIP", () => {
    it("should check rate limit for IP with PUBLIC config", () => {
      const result = RateLimiter.checkIP("127.0.0.1");
      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(RATE_LIMIT_CONFIGS.PUBLIC.maxRequests);
    });
  });

  describe("reset", () => {
    it("should reset rate limit for identifier", () => {
      const config = { windowMs: 60000, maxRequests: 2 };
      
      RateLimiter.check("test-id", config);
      RateLimiter.check("test-id", config);
      RateLimiter.reset("test-id");
      
      const result = RateLimiter.check("test-id", config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });
});

