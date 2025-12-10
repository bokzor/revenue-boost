/**
 * Unit Tests for Marketing Events Service
 *
 * Tests Shopify marketing event integration:
 * - createMarketingEvent
 * - updateMarketingEvent
 * - deleteMarketingEvent
 * - syncEngagementMetrics
 * - UTM parameter generation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { MarketingEventsService } from "~/domains/marketing-events/services/marketing-events.server";

// ==========================================================================
// TEST HELPERS
// ==========================================================================

function createMockAdmin(responseData: any) {
  return {
    graphql: vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(responseData),
    }),
  } as any;
}

function createMockCampaign(overrides = {}) {
  return {
    id: "campaign-123",
    name: "Black Friday Sale",
    description: "Amazing deals",
    status: "ACTIVE",
    startDate: new Date("2024-11-29"),
    endDate: new Date("2024-12-01"),
    templateType: "FLASH_SALE",
    ...overrides,
  };
}

// ==========================================================================
// CREATE MARKETING EVENT TESTS
// ==========================================================================

describe("MarketingEventsService.createMarketingEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create marketing event and return UTM params", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityCreateExternal: {
          marketingActivity: { id: "gid://shopify/MarketingActivity/123" },
          userErrors: [],
        },
      },
    });

    const result = await MarketingEventsService.createMarketingEvent(
      mockAdmin,
      createMockCampaign(),
      "https://app.example.com"
    );

    expect(result).not.toBeNull();
    expect(result?.marketingEventId).toBe("gid://shopify/MarketingActivity/123");
    expect(result?.utmCampaign).toBe("black-friday-sale");
    expect(result?.utmSource).toBe("revenue-boost");
    expect(result?.utmMedium).toBe("flash-sale");
  });

  it("should return null when userErrors present", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityCreateExternal: {
          marketingActivity: null,
          userErrors: [{ field: "title", message: "Title is required" }],
        },
      },
    });

    const result = await MarketingEventsService.createMarketingEvent(
      mockAdmin,
      createMockCampaign(),
      "https://app.example.com"
    );

    expect(result).toBeNull();
  });

  it("should generate experiment-based UTM for A/B test variants", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityCreateExternal: {
          marketingActivity: { id: "gid://shopify/MarketingActivity/456" },
          userErrors: [],
        },
      },
    });

    const result = await MarketingEventsService.createMarketingEvent(
      mockAdmin,
      createMockCampaign({
        experimentName: "Holiday Test",
        variantKey: "A",
      }),
      "https://app.example.com"
    );

    expect(result?.utmCampaign).toBe("holiday-test-variant-a");
  });

  it("should fallback to campaign ID when name is empty", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityCreateExternal: {
          marketingActivity: { id: "gid://shopify/MarketingActivity/789" },
          userErrors: [],
        },
      },
    });

    const result = await MarketingEventsService.createMarketingEvent(
      mockAdmin,
      createMockCampaign({ name: "" }),
      "https://app.example.com"
    );

    expect(result?.utmCampaign).toBe("campaign-campaign-123");
  });

  it("should handle API errors gracefully", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("Network error")),
    } as any;

    const result = await MarketingEventsService.createMarketingEvent(
      mockAdmin,
      createMockCampaign(),
      "https://app.example.com"
    );

    expect(result).toBeNull();
  });
});

// ==========================================================================
// UPDATE MARKETING EVENT TESTS
// ==========================================================================

describe("MarketingEventsService.updateMarketingEvent", () => {
  it("should update marketing event successfully", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityUpdateExternal: {
          marketingActivity: { id: "gid://shopify/MarketingActivity/123" },
          userErrors: [],
        },
      },
    });

    const result = await MarketingEventsService.updateMarketingEvent(
      mockAdmin,
      "gid://shopify/MarketingActivity/123",
      { name: "Updated Sale" }
    );

    expect(result).toBe(true);
  });

  it("should return false on update errors", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityUpdateExternal: {
          userErrors: [{ field: "title", message: "Invalid title" }],
        },
      },
    });

    const result = await MarketingEventsService.updateMarketingEvent(
      mockAdmin,
      "gid://shopify/MarketingActivity/123",
      { name: "Test" }
    );

    expect(result).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("Network error")),
    } as any;

    const result = await MarketingEventsService.updateMarketingEvent(
      mockAdmin,
      "gid://shopify/MarketingActivity/123",
      { name: "Test" }
    );

    expect(result).toBe(false);
  });
});

// ==========================================================================
// DELETE MARKETING EVENT TESTS
// ==========================================================================

describe("MarketingEventsService.deleteMarketingEvent", () => {
  it("should delete marketing event successfully", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityDeleteExternal: {
          userErrors: [],
        },
      },
    });

    const result = await MarketingEventsService.deleteMarketingEvent(
      mockAdmin,
      "gid://shopify/MarketingActivity/123"
    );

    expect(result).toBe(true);
  });

  it("should return false on delete errors", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingActivityDeleteExternal: {
          userErrors: [{ message: "Cannot delete" }],
        },
      },
    });

    const result = await MarketingEventsService.deleteMarketingEvent(
      mockAdmin,
      "gid://shopify/MarketingActivity/123"
    );

    expect(result).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("Network error")),
    } as any;

    const result = await MarketingEventsService.deleteMarketingEvent(
      mockAdmin,
      "gid://shopify/MarketingActivity/123"
    );

    expect(result).toBe(false);
  });
});

// ==========================================================================
// SYNC ENGAGEMENT METRICS TESTS
// ==========================================================================

describe("MarketingEventsService.syncEngagementMetrics", () => {
  it("should sync engagement metrics successfully", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingEngagementCreate: {
          marketingEngagement: { occurredOn: "2024-11-29" },
          userErrors: [],
        },
      },
    });

    const result = await MarketingEventsService.syncEngagementMetrics(
      mockAdmin,
      "gid://shopify/MarketingActivity/123",
      { views: 1000, clicks: 150 }
    );

    expect(result).toBe(true);
  });

  it("should return false on sync errors", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        marketingEngagementCreate: {
          userErrors: [{ message: "Invalid metrics" }],
        },
      },
    });

    const result = await MarketingEventsService.syncEngagementMetrics(
      mockAdmin,
      "gid://shopify/MarketingActivity/123",
      { views: 1000, clicks: 150 }
    );

    expect(result).toBe(false);
  });

  it("should handle API errors gracefully", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("Network error")),
    } as any;

    const result = await MarketingEventsService.syncEngagementMetrics(
      mockAdmin,
      "gid://shopify/MarketingActivity/123",
      { views: 1000, clicks: 150 }
    );

    expect(result).toBe(false);
  });
});

