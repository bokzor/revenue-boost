/**
 * Unit Tests for Popup API Helper
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createSecureRequest,
  securePost,
} from "~/domains/storefront/popups-new/utils/popup-api";

describe("createSecureRequest", () => {
  beforeEach(() => {
    // Reset window globals
    if (typeof window !== "undefined") {
      (window as any).__RB_SESSION_ID = undefined;
      (window as any).__RB_VISITOR_ID = undefined;
      (window as any).__RB_POPUP_SHOWN_AT = undefined;
    }
  });

  it("should include campaignId in request", () => {
    const request = createSecureRequest("campaign-123");
    expect(request.campaignId).toBe("campaign-123");
  });

  it("should include additional data in request", () => {
    const request = createSecureRequest("campaign-123", { email: "test@example.com" });
    expect(request.campaignId).toBe("campaign-123");
    expect(request.email).toBe("test@example.com");
  });

  it("should include security context from window globals", () => {
    if (typeof window !== "undefined") {
      (window as any).__RB_SESSION_ID = "session-abc";
      (window as any).__RB_VISITOR_ID = "visitor-xyz";
      (window as any).__RB_POPUP_SHOWN_AT = 1234567890;
    }

    const request = createSecureRequest("campaign-123");
    expect(request.sessionId).toBeDefined();
    expect(request.visitorId).toBeDefined();
  });

  it("should handle missing window globals gracefully", () => {
    const request = createSecureRequest("campaign-123");
    expect(request.sessionId).toBeDefined();
    expect(request.visitorId).toBeDefined();
  });
});

describe("securePost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: true }),
    });
  });

  it("should make POST request with correct headers", async () => {
    await securePost("/api/test", "campaign-123");

    expect(fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
  });

  it("should include campaignId in request body", async () => {
    await securePost("/api/test", "campaign-123");

    expect(fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        body: expect.stringContaining("campaign-123"),
      })
    );
  });

  it("should include additional data in request body", async () => {
    await securePost("/api/test", "campaign-123", { email: "test@example.com" });

    expect(fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        body: expect.stringContaining("test@example.com"),
      })
    );
  });

  it("should return parsed JSON response", async () => {
    const result = await securePost("/api/test", "campaign-123");
    expect(result).toEqual({ success: true });
  });
});

