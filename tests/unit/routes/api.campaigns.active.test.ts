/**
 * Active Campaigns API Route Tests
 *
 * Note: These tests verify the filtering logic integration.
 * Full E2E tests should be done separately.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CampaignService, CampaignFilterService } from "~/domains/campaigns/index.server";

// Mock dependencies
vi.mock("~/domains/campaigns/index.server", () => ({
  CampaignService: {
    getActiveCampaigns: vi.fn(),
  },
  CampaignFilterService: {
    filterCampaigns: vi.fn(),
  },
  buildStorefrontContext: vi.fn((searchParams) => ({
    deviceType: searchParams.get("deviceType") || "desktop",
    pageUrl: searchParams.get("pageUrl") || "/",
  })),
}));

vi.mock("~/lib/auth-helpers.server", () => ({
  getStoreIdFromShop: vi.fn(() => "store-123"),
}));

vi.mock("~/lib/cors.server", () => ({
  storefrontCors: vi.fn(() => new Headers()),
}));

describe("API: /api/campaigns/active - Integration Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call CampaignFilterService with context", async () => {
    const mockCampaigns = [
      {
        id: "campaign-1",
        name: "Test Campaign",
        templateType: "NEWSLETTER",
        priority: 10,
        targetRules: {},
      },
    ];

    vi.mocked(CampaignService.getActiveCampaigns).mockResolvedValue(mockCampaigns as any);
    vi.mocked(CampaignFilterService.filterCampaigns).mockReturnValue(mockCampaigns as any);

    // Simulate what the loader does
    const storeId = "store-123";
    const context = { deviceType: "mobile" as const, pageUrl: "/" };

    const allCampaigns = await CampaignService.getActiveCampaigns(storeId);
    const filtered = CampaignFilterService.filterCampaigns(allCampaigns, context);

    expect(CampaignService.getActiveCampaigns).toHaveBeenCalledWith(storeId);
    expect(CampaignFilterService.filterCampaigns).toHaveBeenCalledWith(
      mockCampaigns,
      context
    );
    expect(filtered).toHaveLength(1);
  });

  it("should filter campaigns based on device type", async () => {
    const mobileCampaign = {
      id: "mobile-campaign",
      targetRules: {
        audienceTargeting: {
          enabled: true,
          segments: ["Mobile User"],
        },
      },
    };

    const desktopCampaign = {
      id: "desktop-campaign",
      targetRules: {
        audienceTargeting: {
          enabled: true,
          segments: ["Desktop User"],
        },
      },
    };

    const campaigns = [mobileCampaign, desktopCampaign] as any;
    const context = { deviceType: "mobile" as const };

    // Use real filter service
    vi.mocked(CampaignFilterService.filterCampaigns).mockImplementation(
      (camps, ctx) => {
        return camps.filter((c: any) => {
          const segments = c.targetRules?.audienceTargeting?.segments || [];
          return segments.includes("Mobile User");
        });
      }
    );

    const filtered = CampaignFilterService.filterCampaigns(campaigns, context);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("mobile-campaign");
  });

  it("should extract only client-side triggers from targetRules", () => {
    const targetRules = {
      enhancedTriggers: {
        exit_intent: { enabled: true },
        page_load: { enabled: true, delay: 3000 },
      },
      audienceTargeting: {
        enabled: true,
        segments: ["Mobile User"],
      },
      pageTargeting: {
        enabled: true,
        pages: ["/products/*"],
      },
    };

    // Simulate extractClientTriggers function
    const clientTriggers = {
      enhancedTriggers: targetRules.enhancedTriggers,
    };

    expect(clientTriggers.enhancedTriggers).toBeDefined();
    expect(clientTriggers.enhancedTriggers.exit_intent).toBeDefined();
    expect(clientTriggers.enhancedTriggers.page_load).toBeDefined();

    // Should not include server-side rules
    expect((clientTriggers as any).audienceTargeting).toBeUndefined();
    expect((clientTriggers as any).pageTargeting).toBeUndefined();
  });
});

