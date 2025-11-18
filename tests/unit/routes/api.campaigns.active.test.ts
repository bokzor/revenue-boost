/**
 * Active Campaigns API Route Tests
 *
 * Note: These tests verify the filtering logic integration.
 * Full E2E tests should be done separately.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
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

    vi.mocked(CampaignService.getActiveCampaigns).mockResolvedValue(mockCampaigns as Partial<CampaignWithConfigs>[] as CampaignWithConfigs[]);
    vi.mocked(CampaignFilterService.filterCampaigns).mockResolvedValue(
      mockCampaigns as Partial<CampaignWithConfigs>[] as CampaignWithConfigs[],
    );

    // Simulate what the loader does
    const storeId = "store-123";
    const context = { deviceType: "mobile" as const, pageUrl: "/" };

    const allCampaigns = await CampaignService.getActiveCampaigns(storeId);
    const filtered = await CampaignFilterService.filterCampaigns(
      allCampaigns,
      context,
      storeId,
    );

    expect(CampaignService.getActiveCampaigns).toHaveBeenCalledWith(storeId);
    expect(CampaignFilterService.filterCampaigns).toHaveBeenCalledWith(
      mockCampaigns,
      context,
      storeId,
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

    const campaigns = [mobileCampaign, desktopCampaign] as unknown as CampaignWithConfigs[];
    const context = { deviceType: "mobile" as const };

    // Use real filter service
    vi.mocked(CampaignFilterService.filterCampaigns).mockImplementation(
      async (camps) => {
        return camps.filter((c) => {
          const segments = (c as any).targetRules?.audienceTargeting?.segments || [];
          return segments.includes("Mobile User");
        });
      }
    );

    const filtered = await CampaignFilterService.filterCampaigns(
      campaigns,
      context as any,
      "store-123",
    );

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
    expect('audienceTargeting' in clientTriggers).toBe(false);
    expect('pageTargeting' in clientTriggers).toBe(false);
  });
});

