/**
 * Unit Tests for Submission Validator Service
 *
 * Tests bot detection and submission validation:
 * - Honeypot field detection
 * - Timing validation (too fast / too slow)
 * - Impression verification
 * - Storefront request validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Redis before importing the module
vi.mock("~/lib/redis.server", () => ({
  getRedis: vi.fn(),
  REDIS_PREFIXES: {
    VISITOR: "visitor",
  },
}));

import {
  validateSubmission,
  recordImpression,
  hasImpression,
  validateStorefrontRequest,
  handleBotDetection,
} from "~/domains/security/services/submission-validator.server";
import { getRedis } from "~/lib/redis.server";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

function createMockRedis() {
  return {
    exists: vi.fn().mockResolvedValue(1),
    setex: vi.fn().mockResolvedValue("OK"),
  };
}

function createMockRequest(headers: Record<string, string> = {}): Request {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] || null,
    },
  } as unknown as Request;
}

// ==========================================================================
// VALIDATE SUBMISSION TESTS
// ==========================================================================

describe("validateSubmission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRedis).mockReturnValue(createMockRedis() as any);
  });

  describe("Honeypot Detection", () => {
    it("should reject submission when honeypot field is filled", async () => {
      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        honeypot: "bot-filled-this",
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("honeypot");
      expect(result.isBotLikely).toBe(true);
    });

    it("should accept submission when honeypot field is empty", async () => {
      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        honeypot: "",
        popupShownAt: Date.now() - 5000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
    });

    it("should accept submission when honeypot field is undefined", async () => {
      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 5000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
    });
  });

  describe("Timing Validation", () => {
    it("should reject submission that is too fast (< 1.5 seconds)", async () => {
      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 500,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("too_fast");
      expect(result.isBotLikely).toBe(true);
    });

    it("should reject submission that is too slow (> 30 minutes)", async () => {
      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 31 * 60 * 1000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("session_expired");
      expect(result.isBotLikely).toBeUndefined();
    });

    it("should accept submission with valid timing", async () => {
      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 10000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
    });

    it("should accept submission at exactly 1.5 seconds", async () => {
      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 1500,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
    });
  });

  describe("Impression Verification", () => {
    it("should accept submission when impression exists in Redis", async () => {
      const mockRedis = createMockRedis();
      mockRedis.exists.mockResolvedValue(1);
      vi.mocked(getRedis).mockReturnValue(mockRedis as any);

      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 5000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(
        "visitor:impression:visitor-123:campaign-123"
      );
    });

    it("should reject submission when no impression AND no timing", async () => {
      const mockRedis = createMockRedis();
      mockRedis.exists.mockResolvedValue(0);
      vi.mocked(getRedis).mockReturnValue(mockRedis as any);

      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("no_impression");
      expect(result.isBotLikely).toBe(true);
    });

    it("should accept submission when no impression but timing is provided", async () => {
      const mockRedis = createMockRedis();
      mockRedis.exists.mockResolvedValue(0);
      vi.mocked(getRedis).mockReturnValue(mockRedis as any);

      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 5000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
    });

    it("should handle Redis unavailability gracefully", async () => {
      vi.mocked(getRedis).mockReturnValue(null);

      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 5000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
    });

    it("should handle Redis errors gracefully", async () => {
      const mockRedis = createMockRedis();
      mockRedis.exists.mockRejectedValue(new Error("Redis connection failed"));
      vi.mocked(getRedis).mockReturnValue(mockRedis as any);

      const result = await validateSubmission({
        campaignId: "campaign-123",
        visitorId: "visitor-123",
        sessionId: "session-123",
        popupShownAt: Date.now() - 5000,
        ip: "1.2.3.4",
      });

      expect(result.valid).toBe(true);
    });
  });
});

// ==========================================================================
// RECORD IMPRESSION TESTS
// ==========================================================================

describe("recordImpression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should record impression in Redis with TTL", async () => {
    const mockRedis = createMockRedis();
    vi.mocked(getRedis).mockReturnValue(mockRedis as any);

    await recordImpression("visitor-123", "campaign-456");

    expect(mockRedis.setex).toHaveBeenCalledWith(
      "visitor:impression:visitor-123:campaign-456",
      86400,
      expect.any(String)
    );
  });

  it("should handle Redis unavailability gracefully", async () => {
    vi.mocked(getRedis).mockReturnValue(null);
    await expect(recordImpression("visitor-123", "campaign-456")).resolves.toBeUndefined();
  });

  it("should handle Redis errors gracefully", async () => {
    const mockRedis = createMockRedis();
    mockRedis.setex.mockRejectedValue(new Error("Redis write failed"));
    vi.mocked(getRedis).mockReturnValue(mockRedis as any);
    await expect(recordImpression("visitor-123", "campaign-456")).resolves.toBeUndefined();
  });
});

// ==========================================================================
// HAS IMPRESSION TESTS
// ==========================================================================

describe("hasImpression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when impression exists", async () => {
    const mockRedis = createMockRedis();
    mockRedis.exists.mockResolvedValue(1);
    vi.mocked(getRedis).mockReturnValue(mockRedis as any);

    const result = await hasImpression("visitor-123", "campaign-456");

    expect(result).toBe(true);
  });

  it("should return false when impression does not exist", async () => {
    const mockRedis = createMockRedis();
    mockRedis.exists.mockResolvedValue(0);
    vi.mocked(getRedis).mockReturnValue(mockRedis as any);

    const result = await hasImpression("visitor-123", "campaign-456");

    expect(result).toBe(false);
  });

  it("should return true when Redis is unavailable (fail-open)", async () => {
    vi.mocked(getRedis).mockReturnValue(null);
    const result = await hasImpression("visitor-123", "campaign-456");
    expect(result).toBe(true);
  });

  it("should return true on Redis error (fail-open)", async () => {
    const mockRedis = createMockRedis();
    mockRedis.exists.mockRejectedValue(new Error("Redis error"));
    vi.mocked(getRedis).mockReturnValue(mockRedis as any);

    const result = await hasImpression("visitor-123", "campaign-456");
    expect(result).toBe(true);
  });
});

// ==========================================================================
// VALIDATE STOREFRONT REQUEST TESTS
// ==========================================================================

describe("validateStorefrontRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRedis).mockReturnValue(createMockRedis() as any);
  });

  it("should extract IP from x-forwarded-for header", async () => {
    const request = createMockRequest({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });

    const result = await validateStorefrontRequest(request, {
      campaignId: "campaign-123",
      sessionId: "session-123",
      visitorId: "visitor-123",
      popupShownAt: Date.now() - 5000,
    });

    expect(result.valid).toBe(true);
  });

  it("should extract IP from x-real-ip header as fallback", async () => {
    const request = createMockRequest({
      "x-real-ip": "9.8.7.6",
    });

    const result = await validateStorefrontRequest(request, {
      campaignId: "campaign-123",
      sessionId: "session-123",
      visitorId: "visitor-123",
      popupShownAt: Date.now() - 5000,
    });

    expect(result.valid).toBe(true);
  });

  it("should use sessionId as visitorId fallback", async () => {
    const mockRedis = createMockRedis();
    vi.mocked(getRedis).mockReturnValue(mockRedis as any);

    const request = createMockRequest();

    await validateStorefrontRequest(request, {
      campaignId: "campaign-123",
      sessionId: "session-456",
      popupShownAt: Date.now() - 5000,
    });

    expect(mockRedis.exists).toHaveBeenCalledWith(
      "visitor:impression:session-456:campaign-123"
    );
  });

  it("should detect honeypot in storefront request", async () => {
    const request = createMockRequest();

    const result = await validateStorefrontRequest(request, {
      campaignId: "campaign-123",
      sessionId: "session-123",
      honeypot: "bot-value",
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("honeypot");
    expect(result.isBotLikely).toBe(true);
  });
});

// ==========================================================================
// HANDLE BOT DETECTION TESTS
// ==========================================================================

describe("handleBotDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRedis).mockReturnValue(createMockRedis() as any);
  });

  it("should return null when validation passes", async () => {
    const request = createMockRequest();

    const result = await handleBotDetection(
      request,
      {
        campaignId: "campaign-123",
        sessionId: "session-123",
        visitorId: "visitor-123",
        popupShownAt: Date.now() - 5000,
      },
      {
        fakeSuccess: { success: true, code: "FAKE10" },
      }
    );

    expect(result).toBeNull();
  });

  it("should return fake success for likely bots", async () => {
    const request = createMockRequest();

    const result = await handleBotDetection(
      request,
      {
        campaignId: "campaign-123",
        sessionId: "session-123",
        honeypot: "bot-filled",
      },
      {
        fakeSuccess: { success: true, code: "FAKE10" },
      }
    );

    expect(result).not.toBeNull();
    expect(result!.isBot).toBe(true);
    expect(result!.response).toEqual({ success: true, code: "FAKE10" });
  });

  it("should return error for session expired", async () => {
    const request = createMockRequest();

    const result = await handleBotDetection(
      request,
      {
        campaignId: "campaign-123",
        sessionId: "session-123",
        visitorId: "visitor-123",
        popupShownAt: Date.now() - 31 * 60 * 1000,
      },
      {
        fakeSuccess: { success: true, code: "FAKE10" },
        errorMessage: "Custom error",
      }
    );

    expect(result).not.toBeNull();
    expect(result!.isBot).toBe(false);
    expect(result!.response).toEqual({
      success: false,
      error: "Session expired. Please refresh the page.",
    });
  });
});
