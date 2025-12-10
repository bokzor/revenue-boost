/**
 * Unit Tests for Rate Limit Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  RATE_LIMITS,
  checkRateLimit,
  logRateLimitEvent,
  createEmailCampaignKey,
  createIpKey,
  createSessionKey,
  cleanupOldRateLimitLogs,
} from "~/domains/security/services/rate-limit.server";

// Mock dependencies
vi.mock("~/db.server", () => ({
  default: {
    rateLimitLog: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
    },
  },
}));

vi.mock("~/lib/redis.server", () => ({
  getRedis: vi.fn().mockReturnValue(null),
}));

describe("RATE_LIMITS", () => {
  it("should have DISCOUNT_GENERATION config", () => {
    expect(RATE_LIMITS.DISCOUNT_GENERATION).toBeDefined();
    expect(RATE_LIMITS.DISCOUNT_GENERATION.maxRequests).toBe(5);
    expect(RATE_LIMITS.DISCOUNT_GENERATION.windowSeconds).toBe(3600);
  });

  it("should have LEAD_SUBMISSION config", () => {
    expect(RATE_LIMITS.LEAD_SUBMISSION).toBeDefined();
    expect(RATE_LIMITS.LEAD_SUBMISSION.maxRequests).toBe(10);
    expect(RATE_LIMITS.LEAD_SUBMISSION.windowSeconds).toBe(3600);
  });

  it("should have EMAIL_PER_CAMPAIGN config", () => {
    expect(RATE_LIMITS.EMAIL_PER_CAMPAIGN).toBeDefined();
    expect(RATE_LIMITS.EMAIL_PER_CAMPAIGN.maxRequests).toBe(1);
    expect(RATE_LIMITS.EMAIL_PER_CAMPAIGN.windowSeconds).toBe(86400);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow request when under limit", async () => {
    const result = await checkRateLimit(
      "test-key",
      "test-action",
      { maxRequests: 10, windowSeconds: 3600 }
    );

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(10);
    expect(result.resetAt).toBeInstanceOf(Date);
  });

  it("should return resetAt in the future", async () => {
    const result = await checkRateLimit(
      "test-key",
      "test-action",
      { maxRequests: 10, windowSeconds: 3600 }
    );

    expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("createEmailCampaignKey", () => {
  it("should create composite key from email and campaign", () => {
    const key = createEmailCampaignKey("test@example.com", "campaign-123");
    expect(key).toBe("email:test@example.com:campaign:campaign-123");
  });
});

describe("createIpKey", () => {
  it("should create IP key without action", () => {
    const key = createIpKey("192.168.1.1");
    expect(key).toBe("ip:192.168.1.1");
  });

  it("should create IP key with action", () => {
    const key = createIpKey("192.168.1.1", "submit");
    expect(key).toBe("ip:192.168.1.1:submit");
  });
});

describe("createSessionKey", () => {
  it("should create session key without action", () => {
    const key = createSessionKey("session-abc");
    expect(key).toBe("session:session-abc");
  });

  it("should create session key with action", () => {
    const key = createSessionKey("session-abc", "view");
    expect(key).toBe("session:session-abc:view");
  });
});

describe("cleanupOldRateLimitLogs", () => {
  it("should delete old logs and return count", async () => {
    const count = await cleanupOldRateLimitLogs(7);
    expect(count).toBe(5);
  });

  it("should use default retention days", async () => {
    const count = await cleanupOldRateLimitLogs();
    expect(count).toBe(5);
  });
});

describe("logRateLimitEvent", () => {
  it("should log event without throwing", async () => {
    await expect(
      logRateLimitEvent("test-key", "test-action", true, { extra: "data" })
    ).resolves.not.toThrow();
  });

  it("should log event without metadata", async () => {
    await expect(
      logRateLimitEvent("test-key", "test-action", false)
    ).resolves.not.toThrow();
  });
});

