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

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    campaign: {
      findUnique: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
    },
  },
}));

import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { getStoreIdFromShop } from "~/lib/auth-helpers.server";
import { getOrCreateVisitorId } from "~/lib/visitor-id.server";
import { storefrontCors } from "~/lib/cors.server";
import prisma from "~/db.server";

const recordDisplayMock =
  FrequencyCapService.recordDisplay as unknown as ReturnType<typeof vi.fn>;
const recordEventMock =
  PopupEventService.recordEvent as unknown as ReturnType<typeof vi.fn>;
const getStoreIdFromShopMock =
  getStoreIdFromShop as unknown as ReturnType<typeof vi.fn>;
const getOrCreateVisitorIdMock =
  getOrCreateVisitorId as unknown as ReturnType<typeof vi.fn>;
const storefrontCorsMock = storefrontCors as unknown as ReturnType<typeof vi.fn>;
const prismaCampaignFindUniqueMock = prisma.campaign.findUnique as unknown as ReturnType<typeof vi.fn>;
const prismaStoreFindUniqueMock = prisma.store.findUnique as unknown as ReturnType<typeof vi.fn>;

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

    // Mock campaign with frequency capping rules
    const mockFrequencyRules = {
      max_triggers_per_session: 1,
      max_triggers_per_day: 3,
      cooldown_between_triggers: 3600,
    };

    prismaCampaignFindUniqueMock.mockResolvedValue({
      targetRules: {
        enhancedTriggers: {
          frequency_capping: mockFrequencyRules,
        },
      },
      templateType: "SPIN_TO_WIN",
    });

    prismaStoreFindUniqueMock.mockResolvedValue({
      settings: { frequencyCapping: { enabled: true } },
    });

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

    // Verify campaign was fetched to get frequency capping rules
    expect(prismaCampaignFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "camp_1" },
      select: { targetRules: true, templateType: true },
    });

    // FrequencyCapService should be called WITH the frequency capping rules from the campaign
    expect(recordDisplayMock).toHaveBeenCalledWith(
      "camp_1",
      expect.objectContaining({
        visitorId: "visitor-abc",
        sessionId: "sess_1",
        pageUrl: "/collections/frontpage",
        deviceType: "mobile",
      }),
      mockFrequencyRules, // rules parameter - MUST be passed!
      expect.objectContaining({ frequencyCapping: { enabled: true } }), // storeSettings
      "SPIN_TO_WIN", // templateType
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

  it("handles campaign without frequency capping rules", async () => {
    getStoreIdFromShopMock.mockResolvedValue("store-123");
    getOrCreateVisitorIdMock.mockResolvedValue("visitor-abc");

    // Mock campaign WITHOUT frequency capping rules
    prismaCampaignFindUniqueMock.mockResolvedValue({
      targetRules: {
        enhancedTriggers: {
          page_load: { enabled: true },
          // No frequency_capping
        },
      },
      templateType: "NEWSLETTER",
    });

    prismaStoreFindUniqueMock.mockResolvedValue({ settings: null });

    const request = new Request(
      "https://example.com/api/analytics/frequency?shop=test.myshopify.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: "camp_2",
          sessionId: "sess_1",
        }),
      },
    );

    const response = await frequencyAction({
      request,
    } as unknown as ActionFunctionArgs);

    const payload = (response as any).data as any;
    expect(payload.success).toBe(true);

    // Should still be called, but with undefined rules
    expect(recordDisplayMock).toHaveBeenCalledWith(
      "camp_2",
      expect.any(Object),
      undefined, // No frequency_capping in campaign
      null, // Store settings is null
      "NEWSLETTER",
    );
  });

  it("handles campaign not found in database", async () => {
    getStoreIdFromShopMock.mockResolvedValue("store-123");
    getOrCreateVisitorIdMock.mockResolvedValue("visitor-abc");

    // Campaign not found
    prismaCampaignFindUniqueMock.mockResolvedValue(null);
    prismaStoreFindUniqueMock.mockResolvedValue({ settings: null });

    const request = new Request(
      "https://example.com/api/analytics/frequency?shop=test.myshopify.com",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: "non_existent_camp",
          sessionId: "sess_1",
        }),
      },
    );

    const response = await frequencyAction({
      request,
    } as unknown as ActionFunctionArgs);

    const payload = (response as any).data as any;
    expect(payload.success).toBe(true);

    // Should still work, but with undefined rules and templateType
    expect(recordDisplayMock).toHaveBeenCalledWith(
      "non_existent_camp",
      expect.any(Object),
      undefined, // No rules since campaign not found
      null, // Store settings is null
      undefined, // No templateType since campaign not found
    );
  });
});

