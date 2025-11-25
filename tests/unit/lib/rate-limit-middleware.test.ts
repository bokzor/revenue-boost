import { describe, it, expect, vi, beforeEach } from "vitest";
import { withPublicRateLimit } from "~/lib/rate-limit-middleware.server";
import { RateLimiter } from "~/lib/rate-limiter.server";

// Mock the RateLimiter
vi.mock("~/lib/rate-limiter.server", () => ({
  RateLimiter: {
    checkStore: vi.fn(),
    checkIP: vi.fn(),
  },
  RATE_LIMIT_CONFIGS: {
    PUBLIC: {
      windowMs: 60 * 1000,
      maxRequests: 60,
    },
  },
}));

describe("Rate Limit Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Allow by default
    vi.mocked(RateLimiter.checkIP).mockReturnValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
    vi.mocked(RateLimiter.checkStore).mockReturnValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
  });

  it("applies rate limiting even when preview params are present", async () => {
    const mockHandler = vi.fn().mockResolvedValue({ success: true });
    
    const request = new Request(
      "http://localhost/api/campaigns/active?shop=test.myshopify.com&previewToken=abc123"
    );
    
    const args = {
      request,
      params: {},
      context: {},
    };

    const result = await withPublicRateLimit(args, mockHandler);

    expect(mockHandler).toHaveBeenCalledWith(args);
    expect(RateLimiter.checkIP).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("ignores spoofed storeId query params and only trusts headers", async () => {
    const mockHandler = vi.fn().mockResolvedValue({ success: true });
    
    const request = new Request(
      "http://localhost/api/campaigns/active?shop=test.myshopify.com&storeId=spoofed"
    );
    
    const args = {
      request,
      params: {},
      context: {},
    };

    const result = await withPublicRateLimit(args, mockHandler);

    expect(mockHandler).toHaveBeenCalledWith(args);
    expect(RateLimiter.checkIP).toHaveBeenCalled();
    expect(RateLimiter.checkStore).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("uses store ID from trusted headers when provided", async () => {
    const mockHandler = vi.fn().mockResolvedValue({ success: true });

    const request = new Request(
      "http://localhost/api/campaigns/active?shop=test.myshopify.com",
      { headers: { "x-rb-store-id": "store_123" } }
    );

    const args = {
      request,
      params: {},
      context: {},
    };

    await withPublicRateLimit(args, mockHandler);

    expect(RateLimiter.checkStore).toHaveBeenCalledWith("store_123", expect.anything());
    expect(RateLimiter.checkIP).toHaveBeenCalled();
  });

  it("blocks requests when rate limit is exceeded", async () => {
    const mockHandler = vi.fn().mockResolvedValue({ success: true });
    
    // Mock rate limiter to deny the request
    vi.mocked(RateLimiter.checkIP).mockReturnValue({
      allowed: false,
      limit: 60,
      remaining: 0,
      resetAt: Date.now() + 60000,
    });
    
    const request = new Request(
      "http://localhost/api/campaigns/active?shop=test.myshopify.com"
    );
    
    const args = {
      request,
      params: {},
      context: {},
    };

    const result = await withPublicRateLimit(args, mockHandler);

    // Handler should NOT be called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Should return 429 response
    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(429);
    
    const body = await response.json();
    expect(body.error).toContain("Too many requests");
  });
});
