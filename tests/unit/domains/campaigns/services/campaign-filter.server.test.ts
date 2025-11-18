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
// Mock Prisma client for customer segments (used by audience segment filtering)
vi.mock("~/db.server", () => ({
  default: {
    customerSegment: {
      findMany: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as unknown as {
  customerSegment: {
    findMany: ReturnType<typeof vi.fn>;
  };
};


beforeEach(() => {
  // Clear mock Redis storage
  Object.keys(mockRedisStorage).forEach((key) => delete mockRedisStorage[key]);

  // Reset mock call counts
  vi.clearAllMocks();

  // Default: no segments unless test overrides
  mockPrisma.customerSegment.findMany.mockResolvedValue([]);
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
          audienceTargeting: {
            enabled: true,
            segments: ["Mobile User"],
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
          audienceTargeting: {
            enabled: true,
            segments: ["Desktop User"],
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
          audienceTargeting: {
            enabled: false,
          },
          pageTargeting: {
            enabled: true,
            pages: ["/products/*"],
          },
        },
      } as CampaignWithConfigs,
    ];

    // Default segments used by audience segment tests
    mockPrisma.customerSegment.findMany.mockResolvedValue([
      {
        id: "segment-mobile-user",
        name: "Mobile User",
        conditions: [
          { field: "deviceType", operator: "eq", value: "mobile", weight: 3 },
        ],
      },
      {
        id: "segment-desktop-user",
        name: "Desktop User",
        conditions: [
          { field: "deviceType", operator: "eq", value: "desktop", weight: 3 },
        ],
      },
    ] as any);
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
    it("should include campaigns when segment ID matches context", async () => {
      mockPrisma.customerSegment.findMany.mockResolvedValue([
        {
          id: "seg-active-shopper",
          name: "Active Shopper",
          conditions: [
            { field: "cartItemCount", operator: "gt", value: 0, weight: 4 },
            { field: "addedToCartInSession", operator: "eq", value: true, weight: 3 },
          ],
        },
      ] as any);

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
              segments: ["seg-active-shopper"],
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
        context
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-active-shopper");
    });

    it("should exclude campaigns when segment conditions do not match context", async () => {
      mockPrisma.customerSegment.findMany.mockResolvedValue([
        {
          id: "seg-active-shopper",
          name: "Active Shopper",
          conditions: [
            { field: "cartItemCount", operator: "gt", value: 0, weight: 4 },
            { field: "addedToCartInSession", operator: "eq", value: true, weight: 3 },
          ],
        },
      ] as any);

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
              segments: ["seg-active-shopper"],
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
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should support legacy segment names when DB lookup fails", async () => {
      // Force DB lookup to return no segments so we exercise legacy mapping
      mockPrisma.customerSegment.findMany.mockResolvedValue([] as any);

      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-legacy",
          name: "Legacy Segment Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              // This relies on getContextSegments returning "Active Shopper"
              segments: ["Active Shopper"],
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
        context
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-legacy");
    });

    it("should match 'New Visitor' segment using DB conditions", async () => {
      mockPrisma.customerSegment.findMany.mockResolvedValue([
        {
          id: "seg-new-visitor",
          name: "New Visitor",
          conditions: [
            { field: "isReturningVisitor", operator: "eq", value: false, weight: 3 },
            { field: "visitCount", operator: "eq", value: 1, weight: 2 },
          ],
        },
      ] as any);

      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-new-visitor",
          name: "New Visitor Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              segments: ["seg-new-visitor"],
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        visitCount: 1,
        isReturningVisitor: false,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-new-visitor");
    });

    it("should match 'Engaged Visitor' segment based on time on site and page views", async () => {
      mockPrisma.customerSegment.findMany.mockResolvedValue([
        {
          id: "seg-engaged-visitor",
          name: "Engaged Visitor",
          conditions: [
            { field: "timeOnSite", operator: "gte", value: 120, weight: 3 },
            { field: "pageViews", operator: "gte", value: 3, weight: 2 },
          ],
        },
      ] as any);

      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-engaged",
          name: "Engaged Visitor Campaign",
          storeId: "store-1",
          templateType: "NEWSLETTER",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              segments: ["seg-engaged-visitor"],
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        timeOnSite: 180,
        pageViews: 4,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-engaged");
    });

    it("should match 'Product Viewer' segment based on page type and product view count", async () => {
      mockPrisma.customerSegment.findMany.mockResolvedValue([
        {
          id: "seg-product-viewer",
          name: "Product Viewer",
          conditions: [
            { field: "currentPageType", operator: "eq", value: "product", weight: 3 },
            { field: "productViewCount", operator: "gt", value: 0, weight: 2 },
          ],
        },
      ] as any);

      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-product-viewer",
          name: "Product Viewer Campaign",
          storeId: "store-1",
          templateType: "PRODUCT_UPSELL",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              segments: ["seg-product-viewer"],
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        currentPageType: "product",
        productViewCount: 2,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-product-viewer");
    });

    it("should match 'Cart Abandoner' segment based on cart value and item count", async () => {
      mockPrisma.customerSegment.findMany.mockResolvedValue([
        {
          id: "seg-cart-abandoner",
          name: "Cart Abandoner",
          conditions: [
            { field: "cartValue", operator: "gt", value: 0, weight: 4 },
            { field: "cartItemCount", operator: "gt", value: 0, weight: 2 },
          ],
        },
      ] as any);

      const campaigns: CampaignWithConfigs[] = [
        {
          id: "campaign-cart-abandoner",
          name: "Cart Abandoner Campaign",
          storeId: "store-1",
          templateType: "FLASH_SALE",
          status: "ACTIVE",
          priority: 0,
          targetRules: {
            audienceTargeting: {
              enabled: true,
              segments: ["seg-cart-abandoner"],
            },
          },
        } as CampaignWithConfigs,
      ];

      const context: StorefrontContext = {
        cartValue: 120,
        cartItemCount: 3,
      };

      const filtered = await CampaignFilterService.filterByAudienceSegments(
        campaigns,
        context
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("campaign-cart-abandoner");
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
        context
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
        context
      );

      expect(filtered).toHaveLength(0);
    });

    it("should handle empty campaigns array", async () => {
      const context: StorefrontContext = {
        deviceType: "mobile",
        visitorId: "visitor-123",
      };

      const filtered = await CampaignFilterService.filterCampaigns([], context);

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

