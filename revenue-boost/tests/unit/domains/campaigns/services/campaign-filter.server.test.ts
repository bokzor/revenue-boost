/**
 * Campaign Filter Service Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CampaignFilterService } from "~/domains/campaigns/services/campaign-filter.server";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";

// Mock storage for frequency capping tests
const mockSessionStorage: Record<string, string> = {};
const mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  // Clear mocks
  Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);

  // Mock sessionStorage
  global.sessionStorage = {
    getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockSessionStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockSessionStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
    }),
    length: 0,
    key: vi.fn(() => null),
  } as Storage;

  // Mock localStorage
  global.localStorage = {
    getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      mockLocalStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockLocalStorage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
    }),
    length: 0,
    key: vi.fn(() => null),
  } as Storage;

  // Clear all frequency cap data
  FrequencyCapService.clearAll();
});

describe("CampaignFilterService", () => {
  let mockCampaigns: CampaignWithConfigs[];

  beforeEach(() => {
    // Mock campaigns for testing
    mockCampaigns = [
      {
        id: "campaign-1",
        name: "Mobile Newsletter",
        storeId: "store-1",
        templateType: "NEWSLETTER",
        status: "ACTIVE",
        priority: 10,
        targetRules: {
          audienceTargeting: {
            enabled: true,
            segments: ["Mobile User"],
          },
          enhancedTriggers: {
            page_targeting: {
              enabled: false,
            },
          },
        },
      } as CampaignWithConfigs,
      {
        id: "campaign-2",
        name: "Desktop Flash Sale",
        storeId: "store-1",
        templateType: "FLASH_SALE",
        status: "ACTIVE",
        priority: 5,
        targetRules: {
          audienceTargeting: {
            enabled: true,
            segments: ["Desktop User"],
          },
          enhancedTriggers: {
            page_targeting: {
              enabled: false,
            },
          },
        },
      } as CampaignWithConfigs,
      {
        id: "campaign-3",
        name: "Product Page Popup",
        storeId: "store-1",
        templateType: "PRODUCT_UPSELL",
        status: "ACTIVE",
        priority: 8,
        targetRules: {
          audienceTargeting: {
            enabled: false,
          },
          enhancedTriggers: {
            page_targeting: {
              enabled: true,
              pages: ["/products/*"],
            },
          },
        },
      } as CampaignWithConfigs,
    ];
  });

  describe("filterByDeviceType", () => {
    it("should filter campaigns for mobile devices", () => {
      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      const filtered = CampaignFilterService.filterByDeviceType(
        mockCampaigns,
        context
      );

      // Should include campaign-1 (Mobile User)
      // AND campaign-3 (no device targeting)
      expect(filtered).toHaveLength(2);
      expect(filtered.some(c => c.id === "campaign-1")).toBe(true);
      expect(filtered.some(c => c.id === "campaign-3")).toBe(true);
    });

    it("should filter campaigns for desktop devices", () => {
      const context: StorefrontContext = {
        deviceType: "desktop",
      };

      const filtered = CampaignFilterService.filterByDeviceType(
        mockCampaigns,
        context
      );

      // Should include campaign-2 (Desktop User)
      // AND campaign-3 (no device targeting)
      expect(filtered).toHaveLength(2);
      expect(filtered.some(c => c.id === "campaign-2")).toBe(true);
      expect(filtered.some(c => c.id === "campaign-3")).toBe(true);
    });

    it("should return all campaigns if no device targeting", () => {
      const campaignsWithoutTargeting = [
        {
          id: "campaign-no-targeting",
          targetRules: {},
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      const filtered = CampaignFilterService.filterByDeviceType(
        campaignsWithoutTargeting,
        context
      );

      expect(filtered).toHaveLength(1);
    });
  });

  describe("filterByPageTargeting", () => {
    it("should filter campaigns by exact page match", () => {
      const context: StorefrontContext = {
        pageUrl: "/products/example",
      };

      const filtered = CampaignFilterService.filterByPageTargeting(
        mockCampaigns,
        context
      );

      // Should include campaign-3 (matches /products/*)
      // AND campaigns without page targeting (campaign-1, campaign-2)
      expect(filtered).toHaveLength(3);
      expect(filtered.some(c => c.id === "campaign-3")).toBe(true);
    });

    it("should support wildcard page matching", () => {
      const context: StorefrontContext = {
        pageUrl: "/products/any-product",
      };

      const filtered = CampaignFilterService.filterByPageTargeting(
        mockCampaigns,
        context
      );

      // Should include campaign-3 (matches /products/*)
      // AND campaigns without page targeting
      expect(filtered).toHaveLength(3);
      expect(filtered.some(c => c.id === "campaign-3")).toBe(true);
    });

    it("should return all campaigns if no page targeting", () => {
      const campaignsWithoutPageTargeting = [
        {
          id: "campaign-no-page",
          targetRules: {},
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        pageUrl: "/any-page",
      };

      const filtered = CampaignFilterService.filterByPageTargeting(
        campaignsWithoutPageTargeting,
        context
      );

      expect(filtered).toHaveLength(1);
    });
  });

  describe("filterCampaigns", () => {
    it("should apply all filters", () => {
      const context: StorefrontContext = {
        deviceType: "mobile",
        pageUrl: "/",
      };

      const filtered = CampaignFilterService.filterCampaigns(
        mockCampaigns,
        context
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-1");
    });

    it("should return empty array if no campaigns match", () => {
      const context: StorefrontContext = {
        deviceType: "tablet",
        pageUrl: "/checkout",
      };

      const filtered = CampaignFilterService.filterCampaigns(
        mockCampaigns,
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should handle empty campaigns array", () => {
      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      const filtered = CampaignFilterService.filterCampaigns([], context);

      expect(filtered).toHaveLength(0);
    });
  });

  describe("filterByFrequencyCapping", () => {
    it("should allow campaigns with no frequency capping", () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Test Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {} as any,
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      const filtered = CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
    });

    it("should filter campaigns that exceed session limit", () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Test Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            enhancedTriggers: {
              frequency_capping: {
                max_triggers_per_session: 2,
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      // Record 2 views (hit the limit)
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");

      const filtered = CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should filter campaigns that exceed daily limit", () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Test Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            enhancedTriggers: {
              frequency_capping: {
                max_triggers_per_day: 3,
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      // Record 3 views (hit the limit)
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");
      FrequencyCapService.recordView("campaign-1");

      const filtered = CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should filter campaigns in cooldown period", () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Test Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            enhancedTriggers: {
              frequency_capping: {
                cooldown_between_triggers: 60, // 60 seconds
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      // Record a view
      FrequencyCapService.recordView("campaign-1");

      const filtered = CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should allow campaigns after cooldown period", () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Test Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            enhancedTriggers: {
              frequency_capping: {
                cooldown_between_triggers: 1, // 1 second
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      // Set last shown to 2 seconds ago
      const pastTimestamp = Date.now() - 2000;
      mockLocalStorage["rb_last_shown"] = JSON.stringify({
        "campaign-1": pastTimestamp,
      });

      const filtered = CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
    });

    it("should filter multiple campaigns independently", () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Campaign 1",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            enhancedTriggers: {
              frequency_capping: {
                max_triggers_per_session: 1,
              },
            },
          },
        } as CampaignWithConfigs,
        {
          id: "campaign-2",
          name: "Campaign 2",
          storeId: "store-1",
          templateType: "FLASH_SALE",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            enhancedTriggers: {
              frequency_capping: {
                max_triggers_per_session: 1,
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      // Record view for campaign-1 only
      FrequencyCapService.recordView("campaign-1");

      const filtered = CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      // Campaign-1 should be filtered out, campaign-2 should remain
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-2");
    });

    it("should integrate with filterCampaigns", () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Mobile Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              segments: ["Mobile User"],
            },
            enhancedTriggers: {
              frequency_capping: {
                max_triggers_per_session: 1,
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
      };

      // First call should pass all filters
      let filtered = CampaignFilterService.filterCampaigns(campaigns, context);
      expect(filtered).toHaveLength(1);

      // Record a view
      FrequencyCapService.recordView("campaign-1");

      // Second call should be filtered out by frequency capping
      filtered = CampaignFilterService.filterCampaigns(campaigns, context);
      expect(filtered).toHaveLength(0);
    });
  });
});

