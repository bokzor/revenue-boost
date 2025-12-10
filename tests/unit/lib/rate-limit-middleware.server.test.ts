/**
 * Unit Tests for Rate Limit Middleware
 *
 * Tests the rate limiting middleware for routes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the rate limiter
vi.mock("~/lib/rate-limiter.server", () => ({
  RateLimiter: {
    checkIP: vi.fn(),
    checkStore: vi.fn(),
  },
  RATE_LIMIT_CONFIGS: {
    PUBLIC: { maxRequests: 100, windowMs: 60000 },
    AUTHENTICATED: { maxRequests: 200, windowMs: 60000 },
    WRITE: { maxRequests: 50, windowMs: 60000 },
    ANALYTICS: { maxRequests: 500, windowMs: 60000 },
    WEBHOOK: { maxRequests: 1000, windowMs: 60000 },
  },
}));

import {
  withRateLimit,
  withPublicRateLimit,
  withAuthRateLimit,
  withWriteRateLimit,
  withAnalyticsRateLimit,
  withWebhookRateLimit,
} from "~/lib/rate-limit-middleware.server";
import { RateLimiter, RATE_LIMIT_CONFIGS } from "~/lib/rate-limiter.server";

describe("Rate Limit Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockArgs = (headers: Record<string, string> = {}) => ({
    request: new Request("http://localhost/api/test", {
      headers: new Headers(headers),
    }),
    params: {},
    context: {},
  });

  describe("withRateLimit", () => {
    it("should allow request when under limit", async () => {
      vi.mocked(RateLimiter.checkIP).mockReturnValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: Date.now() + 60000,
      });

      const handler = vi.fn().mockResolvedValue(new Response("OK"));
      const args = createMockArgs();

      const result = await withRateLimit(args, RATE_LIMIT_CONFIGS.PUBLIC, handler);

      expect(handler).toHaveBeenCalledWith(args);
      expect(result).toBeInstanceOf(Response);
    });

    it("should return 429 when IP limit exceeded", async () => {
      vi.mocked(RateLimiter.checkIP).mockReturnValue({
        allowed: false,
        remaining: 0,
        limit: 100,
        resetAt: Date.now() + 30000,
      });

      const handler = vi.fn();
      const args = createMockArgs();

      const result = await withRateLimit(args, RATE_LIMIT_CONFIGS.PUBLIC, handler);

      expect(handler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(429);

      const body = await (result as Response).json();
      expect(body.success).toBe(false);
      expect(body.error).toContain("Too many requests");
    });

    it("should check store rate limit when store ID header present", async () => {
      vi.mocked(RateLimiter.checkStore).mockReturnValue({
        allowed: true,
        remaining: 199,
        limit: 200,
        resetAt: Date.now() + 60000,
      });
      vi.mocked(RateLimiter.checkIP).mockReturnValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: Date.now() + 60000,
      });

      const handler = vi.fn().mockResolvedValue(new Response("OK"));
      const args = createMockArgs({ "x-rb-store-id": "store-123" });

      await withRateLimit(args, RATE_LIMIT_CONFIGS.AUTHENTICATED, handler);

      expect(RateLimiter.checkStore).toHaveBeenCalledWith("store-123", RATE_LIMIT_CONFIGS.AUTHENTICATED);
    });

    it("should return 429 when store limit exceeded", async () => {
      vi.mocked(RateLimiter.checkStore).mockReturnValue({
        allowed: false,
        remaining: 0,
        limit: 200,
        resetAt: Date.now() + 30000,
      });

      const handler = vi.fn();
      const args = createMockArgs({ "x-rb-store-id": "store-123" });

      const result = await withRateLimit(args, RATE_LIMIT_CONFIGS.AUTHENTICATED, handler);

      expect(handler).not.toHaveBeenCalled();
      expect((result as Response).status).toBe(429);
    });

    it("should extract IP from x-forwarded-for header", async () => {
      vi.mocked(RateLimiter.checkIP).mockReturnValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: Date.now() + 60000,
      });

      const handler = vi.fn().mockResolvedValue(new Response("OK"));
      const args = createMockArgs({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });

      await withRateLimit(args, RATE_LIMIT_CONFIGS.PUBLIC, handler);

      expect(RateLimiter.checkIP).toHaveBeenCalledWith("1.2.3.4", expect.anything());
    });
  });

  describe("Convenience wrappers", () => {
    beforeEach(() => {
      vi.mocked(RateLimiter.checkIP).mockReturnValue({
        allowed: true,
        remaining: 99,
        limit: 100,
        resetAt: Date.now() + 60000,
      });
    });

    it("withPublicRateLimit uses PUBLIC config", async () => {
      const handler = vi.fn().mockResolvedValue(new Response("OK"));
      await withPublicRateLimit(createMockArgs(), handler);
      expect(RateLimiter.checkIP).toHaveBeenCalledWith(expect.anything(), RATE_LIMIT_CONFIGS.PUBLIC);
    });

    it("withAuthRateLimit uses AUTHENTICATED config", async () => {
      const handler = vi.fn().mockResolvedValue(new Response("OK"));
      await withAuthRateLimit(createMockArgs(), handler);
      expect(RateLimiter.checkIP).toHaveBeenCalledWith(expect.anything(), RATE_LIMIT_CONFIGS.AUTHENTICATED);
    });

    it("withWriteRateLimit uses WRITE config", async () => {
      const handler = vi.fn().mockResolvedValue(new Response("OK"));
      await withWriteRateLimit(createMockArgs(), handler);
      expect(RateLimiter.checkIP).toHaveBeenCalledWith(expect.anything(), RATE_LIMIT_CONFIGS.WRITE);
    });
  });
});

