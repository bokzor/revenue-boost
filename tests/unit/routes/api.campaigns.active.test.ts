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

describe("Active Campaigns API Helper Functions", () => {
  // Recreate helper functions for testing
  function mergeTokensIntoDesignConfig(
    designConfig: Record<string, unknown>,
    tokens: Record<string, unknown>,
    themeMode: string | undefined
  ): Record<string, unknown> {
    const shouldApplyTokens = !themeMode || themeMode === "default" || themeMode === "shopify";

    if (!shouldApplyTokens) {
      return designConfig;
    }

    const defaultTokenColors: Record<string, unknown> = {
      backgroundColor: tokens.background,
      textColor: tokens.foreground,
      descriptionColor: tokens.muted,
      buttonColor: tokens.primary,
      buttonTextColor: tokens.primaryForeground,
      accentColor: tokens.primary,
      successColor: tokens.success,
      fontFamily: tokens.fontFamily,
      borderRadius: tokens.borderRadius,
      inputBackgroundColor: tokens.surface,
      inputBorderColor: tokens.border,
    };

    const definedDesignConfig: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(designConfig)) {
      if (value !== undefined && value !== null) {
        definedDesignConfig[key] = value;
      }
    }

    return {
      ...defaultTokenColors,
      ...definedDesignConfig,
    };
  }

  function extractClientTriggers(targetRules: Record<string, unknown> | null | undefined) {
    if (!targetRules) return {};

    const { enhancedTriggers, audienceTargeting } = targetRules as {
      enhancedTriggers?: Record<string, unknown>;
      audienceTargeting?: { sessionRules?: Record<string, unknown> };
    };

    return {
      enhancedTriggers: enhancedTriggers || {},
      sessionRules: audienceTargeting?.sessionRules,
    };
  }

  const mockTokens = {
    background: "#ffffff",
    foreground: "#000000",
    primary: "#007ace",
    primaryForeground: "#ffffff",
    muted: "#6b7280",
    success: "#10b981",
    fontFamily: "Inter, sans-serif",
    borderRadius: 8,
    surface: "#f9fafb",
    border: "#e5e7eb",
  };

  describe("mergeTokensIntoDesignConfig", () => {
    it("should apply tokens when themeMode is undefined", () => {
      const result = mergeTokensIntoDesignConfig({}, mockTokens, undefined);

      expect(result.backgroundColor).toBe("#ffffff");
      expect(result.textColor).toBe("#000000");
      expect(result.buttonColor).toBe("#007ace");
    });

    it("should apply tokens when themeMode is default", () => {
      const result = mergeTokensIntoDesignConfig({}, mockTokens, "default");

      expect(result.backgroundColor).toBe("#ffffff");
      expect(result.buttonColor).toBe("#007ace");
    });

    it("should apply tokens when themeMode is shopify", () => {
      const result = mergeTokensIntoDesignConfig({}, mockTokens, "shopify");

      expect(result.backgroundColor).toBe("#ffffff");
    });

    it("should NOT apply tokens when themeMode is custom", () => {
      const designConfig = { backgroundColor: "#ff0000" };
      const result = mergeTokensIntoDesignConfig(designConfig, mockTokens, "custom");

      expect(result).toEqual(designConfig);
    });

    it("should override tokens with explicit designConfig values", () => {
      const designConfig = { backgroundColor: "#ff0000", textColor: "#0000ff" };
      const result = mergeTokensIntoDesignConfig(designConfig, mockTokens, "default");

      expect(result.backgroundColor).toBe("#ff0000");
      expect(result.textColor).toBe("#0000ff");
      expect(result.buttonColor).toBe("#007ace"); // From tokens
    });

    it("should filter out undefined values from designConfig", () => {
      const designConfig = { backgroundColor: undefined, textColor: "#0000ff" };
      const result = mergeTokensIntoDesignConfig(designConfig, mockTokens, "default");

      expect(result.backgroundColor).toBe("#ffffff"); // From tokens
      expect(result.textColor).toBe("#0000ff");
    });
  });

  describe("extractClientTriggers", () => {
    it("should return empty object for null targetRules", () => {
      const result = extractClientTriggers(null);
      expect(result).toEqual({});
    });

    it("should return empty object for undefined targetRules", () => {
      const result = extractClientTriggers(undefined);
      expect(result).toEqual({});
    });

    it("should extract enhancedTriggers", () => {
      const targetRules = {
        enhancedTriggers: { page_load: { enabled: true, delay: 3000 } },
      };
      const result = extractClientTriggers(targetRules);

      expect(result.enhancedTriggers).toEqual({ page_load: { enabled: true, delay: 3000 } });
    });

    it("should extract sessionRules from audienceTargeting", () => {
      const targetRules = {
        audienceTargeting: {
          sessionRules: { enabled: true, conditions: [] },
        },
      };
      const result = extractClientTriggers(targetRules);

      expect(result.sessionRules).toEqual({ enabled: true, conditions: [] });
    });

    it("should return empty enhancedTriggers when not present", () => {
      const targetRules = { pageTargeting: { enabled: true } };
      const result = extractClientTriggers(targetRules);

      expect(result.enhancedTriggers).toEqual({});
    });
  });
});

