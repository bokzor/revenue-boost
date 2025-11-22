import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ActionFunctionArgs } from "react-router";

// Mock dependencies before importing the route module
vi.mock("~/domains/targeting/services/frequency-cap.server", () => ({
  FrequencyCapService: {
    recordDisplay: vi.fn(),
  },
}));

vi.mock("~/domains/analytics/popup-events.server", () => ({
  PopupEventService: {
    recordEvent: vi.fn(),
  },
}));

vi.mock("~/lib/auth-helpers.server", () => ({
  getStoreIdFromShop: vi.fn(),
}));

vi.mock("~/lib/visitor-id.server", () => ({
  getOrCreateVisitorId: vi.fn(),
}));

vi.mock("~/lib/cors.server", () => ({
  storefrontCors: vi.fn(() => ({
    "Access-Control-Allow-Origin": "*",
  })),
}));

import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import { getOrCreateVisitorId } from "~/lib/visitor-id.server";
import { storefrontCors } from "~/lib/cors.server";

const recordDisplayMock =
  FrequencyCapService.recordDisplay as unknown as ReturnType<typeof vi.fn>;
const recordEventMock =
  PopupEventService.recordEvent as unknown as ReturnType<typeof vi.fn>;
const getStoreIdFromShopMock =
  getStoreIdFromShop as unknown as ReturnType<typeof vi.fn>;
const getOrCreateVisitorIdMock =
  getOrCreateVisitorId as unknown as ReturnType<typeof vi.fn>;
const storefrontCorsMock = storefrontCors as unknown as ReturnType<typeof vi.fn>;

import { action as frequencyAction } from "~/routes/api.analytics.frequency";

describe("api.analytics.frequency action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 when shop param is missing", async () => {
    const request = new Request("https://example.com/api/analytics/frequency", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: "camp_1",
      }),
    });

    const response = await frequencyAction({
      request,
    } as unknown as ActionFunctionArgs);

    const payload = (response as any).data as any;

    expect(payload.success).toBe(false);
    expect(payload.error).toBe("Missing shop parameter");

    expect(recordDisplayMock).not.toHaveBeenCalled();
    expect(recordEventMock).not.toHaveBeenCalled();
  });

  it("records frequency cap and popup VIEW event on success", async () => {
    getStoreIdFromShopMock.mockResolvedValue("store-123");
    getOrCreateVisitorIdMock.mockResolvedValue("visitor-abc");

    const request = new Request(
      "https://example.com/api/analytics/frequency?shop=test.myshopify.com",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
          Referer: "https://shop.example.com/collections/frontpage",
        },
        body: JSON.stringify({
          campaignId: "camp_1",
          // No trackingKey provided so it should default to campaignId
          experimentId: "exp_1",
          sessionId: "sess_1",
          pageUrl: "/collections/frontpage",
          referrer: "https://google.com",
        }),
      },
    );

    const response = await frequencyAction({
      request,
    } as unknown as ActionFunctionArgs);

    const payload = (response as any).data as any;

    expect(payload.success).toBe(true);
    expect(storefrontCorsMock).toHaveBeenCalled();

    // FrequencyCapService should be called with trackingKey derived from campaignId
    expect(recordDisplayMock).toHaveBeenCalledWith(
      "camp_1",
      expect.objectContaining({
        visitorId: "visitor-abc",
        sessionId: "sess_1",
        pageUrl: "/collections/frontpage",
        deviceType: "mobile",
      }),
      undefined, // rules parameter
      undefined, // storeSettings parameter (no store settings in mock)
    );

    // PopupEventService should record a VIEW event with correct metadata
    expect(recordEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: "store-123",
        campaignId: "camp_1",
        experimentId: "exp_1",
        sessionId: "sess_1",
        visitorId: "visitor-abc",
        eventType: "VIEW",
        pageUrl: "/collections/frontpage",
        referrer: "https://google.com",
        userAgent: expect.stringContaining("iPhone"),
        ipAddress: null,
        deviceType: "mobile",
        metadata: expect.objectContaining({
          trackingKey: "camp_1",
          source: "frequency_endpoint",
        }),
      }),
    );
  });
});

