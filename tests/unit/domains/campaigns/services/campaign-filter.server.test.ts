/**
 * Campaign Filter Service Tests (Redis-Based)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CampaignFilterService } from "~/domains/campaigns/services/campaign-filter.server";
import { FrequencyCapService } from "~/domains/targeting/services/frequency-cap.server";
import type { StorefrontContext } from "~/domains/campaigns/types/storefront-context";
import type { CampaignWithConfigs } from "~/domains/campaigns/types/campaign";
import prisma from "~/db.server";

// Mock Redis storage - shared across all tests
const mockRedisStorage: Record<string, string> = {};

// Mock Redis module BEFORE importing anything else
vi.mock('~/lib/redis.server', () => {
  // Use a getter to access the outer mockRedisStorage
  const getStorage = () => mockRedisStorage;

  return {
    redis: {
      get: vi.fn(async (key: string) => {
        const storage = getStorage();
        return storage[key] || null;
      }),
      set: vi.fn(async (key: string, value: string) => {
        const storage = getStorage();
        storage[key] = value;
        return 'OK';
      }),
      setex: vi.fn(async (key: string, ttl: number, value: string) => {
        const storage = getStorage();
        storage[key] = value;
        return 'OK';
      }),
      incr: vi.fn(async (key: string) => {
        const storage = getStorage();
        const current = parseInt(storage[key] || '0');
        const newValue = current + 1;
        storage[key] = newValue.toString();
        return newValue;
      }),
      expire: vi.fn(async () => 1),
      del: vi.fn(async (...keys: string[]) => {
        const storage = getStorage();
        keys.forEach(key => delete storage[key]);
        return keys.length;
      }),
      keys: vi.fn(async (pattern: string) => {
        const storage = getStorage();
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return Object.keys(storage).filter(key => regex.test(key));
      }),
      pipeline: vi.fn(() => {
        const storage = getStorage();
        const pipe: Record<string, unknown> = {};
        pipe.incr = vi.fn((key: string) => {
          const current = parseInt(storage[key] || '0');
          storage[key] = (current + 1).toString();
          return pipe;
        });
        pipe.expire = vi.fn(() => pipe);
        pipe.exec = vi.fn(async () => [[null, 1], [null, 1]]);
        return pipe;
      }),
    },
    REDIS_PREFIXES: {
      FREQUENCY_CAP: 'freq_cap',
      GLOBAL_FREQUENCY: 'global_freq_cap',
      COOLDOWN: 'cooldown',
    },
    REDIS_TTL: {
      SESSION: 3600,
      HOUR: 3600,
      DAY: 86400,
      WEEK: 604800,
      MONTH: 2592000,
    },
  };
});
beforeEach(() => {
  // Clear mock Redis storage
  Object.keys(mockRedisStorage).forEach((key) => delete mockRedisStorage[key]);

  // Reset mock call counts
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
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
          enhancedTriggers: {
            device_targeting: {
              enabled: true,
              device_types: ["mobile"],
            },
          },
          pageTargeting: {
            enabled: false,
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
          enhancedTriggers: {
            device_targeting: {
              enabled: true,
              device_types: ["desktop"],
            },
          },
          pageTargeting: {
            enabled: false,
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
          // No device targeting for this campaign
          pageTargeting: {
            enabled: true,
            pages: ["/products/*"],
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

  describe("filterByAudienceSegments", () => {
    it("should include campaigns when session rules match context", async () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-active-shopper",
          name: "Active Shopper Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              sessionRules: {
                enabled: true,
                logicOperator: "AND",
                conditions: [
                  { field: "cartItemCount", operator: "gt", value: 0 },
                  { field: "addedToCartInSession", operator: "eq", value: true },
                ],
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        cartItemCount: 2,
        addedToCartInSession: true,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context,
        "store-1",
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-active-shopper");
    });

    it("should exclude campaigns when session rules do not match context", async () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-active-shopper",
          name: "Active Shopper Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              sessionRules: {
                enabled: true,
                logicOperator: "AND",
                conditions: [
                  { field: "cartItemCount", operator: "gt", value: 0 },
                  { field: "addedToCartInSession", operator: "eq", value: true },
                ],
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        cartItemCount: 0,
        addedToCartInSession: false,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context,
        "store-1",
      );

      expect(filtered).toHaveLength(0);
    });

    it("should include campaign when audience targeting is disabled", async () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-no-audience",
          name: "No Audience Targeting",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: false,
              sessionRules: {
                enabled: true,
                logicOperator: "AND",
                conditions: [{ field: "cartItemCount", operator: "gt", value: 0 }],
              },
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        cartItemCount: 0,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context,
        "store-1",
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-no-audience");
    });

    it("should include campaign when no session rules are configured", async () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-no-session-rules",
          name: "No Session Rules",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              // sessionRules: undefined
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        cartItemCount: 0,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context,
        "store-1",
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-no-session-rules");
    });

  });


  describe("filterCampaigns", () => {
    it("should apply all filters", async () => {
      const context: StorefrontContext = {
        deviceType: "mobile",
        pageUrl: "/",
        visitorId: "visitor-123",
      };

      const filtered = await CampaignFilterService.filterCampaigns(
        mockCampaigns,
        context,
        "store-1",
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-1");
    });

    it("should return empty array if no campaigns match", async () => {
      const context: StorefrontContext = {
        deviceType: "tablet",
        pageUrl: "/checkout",
        visitorId: "visitor-123",
      };

      const filtered = await CampaignFilterService.filterCampaigns(
        mockCampaigns,
        context,
        "store-1",
      );

      expect(filtered).toHaveLength(0);
    });

    it("should handle empty campaigns array", async () => {
      const context: StorefrontContext = {
        deviceType: "mobile",
        visitorId: "visitor-123",
      };

      const filtered = await CampaignFilterService.filterCampaigns([], context, "store-1");

      expect(filtered).toHaveLength(0);
    });
  });

  describe("filterByFrequencyCapping", () => {
    it("should allow campaigns with no frequency capping", async () => {
      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-1",
          name: "Test Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {},
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        deviceType: "mobile",
        visitorId: "visitor-123",
      };

      const filtered = await CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
    });

    it("should filter campaigns that exceed session limit", async () => {
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
        visitorId: "visitor-123",
      };

      // Record 2 views (hit the limit)
      await FrequencyCapService.recordDisplay("campaign-1", context, { max_triggers_per_session: 2 });
      await FrequencyCapService.recordDisplay("campaign-1", context, { max_triggers_per_session: 2 });

      const filtered = await CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should filter campaigns that exceed daily limit", async () => {
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
        visitorId: "visitor-123",
      };

      // Record 3 views (hit the limit)
      await FrequencyCapService.recordDisplay("campaign-1", context, { max_triggers_per_day: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", context, { max_triggers_per_day: 3 });
      await FrequencyCapService.recordDisplay("campaign-1", context, { max_triggers_per_day: 3 });

      const filtered = await CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should filter campaigns in cooldown period", async () => {
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
        visitorId: "visitor-123",
      };

      // Record a view
      await FrequencyCapService.recordDisplay("campaign-1", context, { cooldown_between_triggers: 60 });

      const filtered = await CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should allow campaigns after cooldown period", async () => {
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
        visitorId: "visitor-123",
      };

      // Set cooldown to 2 seconds ago (expired)
      const pastTimestamp = Date.now() - 2000;
      mockRedisStorage["cooldown:visitor-123:campaign-1"] = pastTimestamp.toString();

      const filtered = await CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
    });

    it("should filter multiple campaigns independently", async () => {
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
        visitorId: "visitor-123",
      };

      // Record view for campaign-1 only
      await FrequencyCapService.recordDisplay("campaign-1", context, { max_triggers_per_session: 1 });

      const filtered = await CampaignFilterService.filterByFrequencyCapping(
        campaigns,
        context
      );

      // Campaign-1 should be filtered out, campaign-2 should remain
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-2");
    });

    it("should integrate with filterCampaigns", async () => {
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
        visitorId: "visitor-123",
      };

      // First call should pass all filters
      let filtered = await CampaignFilterService.filterCampaigns(campaigns, context);
      expect(filtered).toHaveLength(1);

      // Record a view
      await FrequencyCapService.recordDisplay("campaign-1", context, { max_triggers_per_session: 1 });

      // Second call should be filtered out by frequency capping
      filtered = await CampaignFilterService.filterCampaigns(campaigns, context);
      expect(filtered).toHaveLength(0);
    });
  });
});

