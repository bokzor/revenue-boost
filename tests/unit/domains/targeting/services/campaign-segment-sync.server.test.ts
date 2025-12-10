/**
 * Unit Tests for Campaign Segment Sync Service
 *
 * Tests the automatic syncing of Shopify customer segment memberships
 * when campaigns are saved with segment targeting enabled.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies before importing the module
vi.mock("~/db.server", () => ({
  default: {
    segmentMembership: {
      count: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

vi.mock("~/domains/targeting/services/segment-membership.server", () => ({
  syncSegmentMembershipsForStore: vi.fn(),
  hasSegmentMembershipData: vi.fn(),
}));

import {
  triggerCampaignSegmentSync,
  hasCustomerScope,
} from "~/domains/targeting/services/campaign-segment-sync.server";
import {
  syncSegmentMembershipsForStore,
  hasSegmentMembershipData,
} from "~/domains/targeting/services/segment-membership.server";
import type { TargetRulesConfig } from "~/domains/campaigns/types/campaign";

// Helper to create mock AdminApiContext
function createMockAdmin() {
  return {
    graphql: vi.fn(),
  } as any;
}

// Helper to create target rules with segments
function createTargetRulesWithSegments(segmentIds: string[]): TargetRulesConfig {
  return {
    audienceTargeting: {
      shopifySegmentIds: segmentIds,
    },
  } as TargetRulesConfig;
}

describe("Campaign Segment Sync Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Silence console logs during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("triggerCampaignSegmentSync", () => {
    it("does nothing when targetRules is undefined", async () => {
      const admin = createMockAdmin();

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: undefined,
        admin,
      });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(syncSegmentMembershipsForStore).not.toHaveBeenCalled();
    });

    it("does nothing when targetRules is null", async () => {
      const admin = createMockAdmin();

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: null,
        admin,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(syncSegmentMembershipsForStore).not.toHaveBeenCalled();
    });

    it("does nothing when audienceTargeting is missing", async () => {
      const admin = createMockAdmin();

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: {} as TargetRulesConfig,
        admin,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(syncSegmentMembershipsForStore).not.toHaveBeenCalled();
    });

    it("does nothing when shopifySegmentIds is empty", async () => {
      const admin = createMockAdmin();

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: createTargetRulesWithSegments([]),
        admin,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(syncSegmentMembershipsForStore).not.toHaveBeenCalled();
    });

    it("skips sync when membership data already exists", async () => {
      const admin = createMockAdmin();
      vi.mocked(hasSegmentMembershipData).mockResolvedValue(true);

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: createTargetRulesWithSegments([
          "gid://shopify/Segment/123",
        ]),
        admin,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(hasSegmentMembershipData).toHaveBeenCalledWith({
        storeId: "store-123",
        segmentIds: ["gid://shopify/Segment/123"],
      });
      expect(syncSegmentMembershipsForStore).not.toHaveBeenCalled();
    });

    it("triggers sync when membership data does not exist", async () => {
      const admin = createMockAdmin();
      vi.mocked(hasSegmentMembershipData).mockResolvedValue(false);
      vi.mocked(syncSegmentMembershipsForStore).mockResolvedValue();

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: createTargetRulesWithSegments([
          "gid://shopify/Segment/123",
          "gid://shopify/Segment/456",
        ]),
        admin,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(syncSegmentMembershipsForStore).toHaveBeenCalledWith({
        storeId: "store-123",
        segmentIds: [
          "gid://shopify/Segment/123",
          "gid://shopify/Segment/456",
        ],
        admin,
      });
    });

    it("forces sync when forceSync is true even if data exists", async () => {
      const admin = createMockAdmin();
      vi.mocked(hasSegmentMembershipData).mockResolvedValue(true);
      vi.mocked(syncSegmentMembershipsForStore).mockResolvedValue();

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: createTargetRulesWithSegments([
          "gid://shopify/Segment/123",
        ]),
        admin,
        forceSync: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // hasSegmentMembershipData should not be called when forceSync is true
      expect(hasSegmentMembershipData).not.toHaveBeenCalled();
      expect(syncSegmentMembershipsForStore).toHaveBeenCalled();
    });

    it("filters out invalid segment IDs", async () => {
      const admin = createMockAdmin();
      vi.mocked(hasSegmentMembershipData).mockResolvedValue(false);
      vi.mocked(syncSegmentMembershipsForStore).mockResolvedValue();

      triggerCampaignSegmentSync({
        storeId: "store-123",
        targetRules: {
          audienceTargeting: {
            shopifySegmentIds: [
              "gid://shopify/Segment/123", // Valid
              "invalid-id", // Invalid - should be filtered
              "gid://shopify/Customer/456", // Invalid - wrong type
              "", // Invalid - empty
              "gid://shopify/Segment/789", // Valid
            ],
          },
        } as TargetRulesConfig,
        admin,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(hasSegmentMembershipData).toHaveBeenCalledWith({
        storeId: "store-123",
        segmentIds: [
          "gid://shopify/Segment/123",
          "gid://shopify/Segment/789",
        ],
      });
    });

    it("handles sync errors gracefully without throwing", async () => {
      const admin = createMockAdmin();
      vi.mocked(hasSegmentMembershipData).mockResolvedValue(false);
      vi.mocked(syncSegmentMembershipsForStore).mockRejectedValue(
        new Error("API rate limit exceeded")
      );

      // Should not throw - the function handles errors internally
      expect(() => {
        triggerCampaignSegmentSync({
          storeId: "store-123",
          targetRules: createTargetRulesWithSegments([
            "gid://shopify/Segment/123",
          ]),
          admin,
        });
      }).not.toThrow();

      // Wait for async background sync to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Error is logged via logger (not console.error), so we just verify no throw
      // The logger output is visible in test output as JSON logs
    });
  });

  describe("hasCustomerScope", () => {
    it("returns true when read_customers scope is granted", async () => {
      const mockScopes = {
        query: vi.fn().mockResolvedValue({
          granted: ["read_customers", "write_products"],
        }),
      };

      const result = await hasCustomerScope(mockScopes);

      expect(result).toBe(true);
    });

    it("returns false when read_customers scope is not granted", async () => {
      const mockScopes = {
        query: vi.fn().mockResolvedValue({
          granted: ["write_products", "read_orders"],
        }),
      };

      const result = await hasCustomerScope(mockScopes);

      expect(result).toBe(false);
    });

    it("returns false when scopes query throws an error", async () => {
      const mockScopes = {
        query: vi.fn().mockRejectedValue(new Error("Auth failed")),
      };

      const result = await hasCustomerScope(mockScopes);

      expect(result).toBe(false);
    });
  });
});

