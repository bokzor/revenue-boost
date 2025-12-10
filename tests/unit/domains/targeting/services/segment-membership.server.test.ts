/**
 * Unit Tests for Segment Membership Service
 *
 * Tests Shopify customer segment membership:
 * - syncSegmentMembershipsForSegment
 * - hasSegmentMembershipData
 * - isCustomerInAnyShopifySegment
 * - getCustomerShopifySegments
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("~/db.server", () => ({
  default: {
    segmentMembership: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import {
  syncSegmentMembershipsForSegment,
  hasSegmentMembershipData,
  isCustomerInAnyShopifySegment,
  getCustomerShopifySegments,
} from "~/domains/targeting/services/segment-membership.server";
import prisma from "~/db.server";

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

// ==========================================================================
// SYNC SEGMENT MEMBERSHIPS TESTS
// ==========================================================================

describe("syncSegmentMembershipsForSegment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sync segment memberships from Shopify", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        customerSegmentMembers: {
          edges: [
            { node: { id: "gid://shopify/Customer/123" } },
            { node: { id: "gid://shopify/Customer/456" } },
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });

    vi.mocked(prisma.segmentMembership.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.segmentMembership.createMany).mockResolvedValue({ count: 2 });

    await syncSegmentMembershipsForSegment({
      storeId: "store-123",
      shopifySegmentId: "gid://shopify/Segment/789",
      admin: mockAdmin,
    });

    expect(prisma.segmentMembership.deleteMany).toHaveBeenCalled();
    expect(prisma.segmentMembership.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ shopifyCustomerId: BigInt(123) }),
        expect.objectContaining({ shopifyCustomerId: BigInt(456) }),
      ]),
      skipDuplicates: true,
    });
  });

  it("should handle pagination", async () => {
    const mockAdmin = {
      graphql: vi
        .fn()
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            data: {
              customerSegmentMembers: {
                edges: [{ node: { id: "gid://shopify/Customer/1" } }],
                pageInfo: { hasNextPage: true, endCursor: "cursor1" },
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          json: vi.fn().mockResolvedValue({
            data: {
              customerSegmentMembers: {
                edges: [{ node: { id: "gid://shopify/Customer/2" } }],
                pageInfo: { hasNextPage: false, endCursor: null },
              },
            },
          }),
        }),
    } as any;

    vi.mocked(prisma.segmentMembership.deleteMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.segmentMembership.createMany).mockResolvedValue({ count: 1 });

    await syncSegmentMembershipsForSegment({
      storeId: "store-123",
      shopifySegmentId: "gid://shopify/Segment/789",
      admin: mockAdmin,
    });

    expect(mockAdmin.graphql).toHaveBeenCalledTimes(2);
    expect(prisma.segmentMembership.createMany).toHaveBeenCalledTimes(2);
  });

  it("should throw on GraphQL errors", async () => {
    const mockAdmin = createMockAdmin({
      errors: [{ message: "Segment not found" }],
    });

    vi.mocked(prisma.segmentMembership.deleteMany).mockResolvedValue({ count: 0 });

    await expect(
      syncSegmentMembershipsForSegment({
        storeId: "store-123",
        shopifySegmentId: "gid://shopify/Segment/invalid",
        admin: mockAdmin,
      })
    ).rejects.toThrow("Segment not found");
  });
});

// ==========================================================================
// HAS SEGMENT MEMBERSHIP DATA TESTS
// ==========================================================================

describe("hasSegmentMembershipData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when memberships exist", async () => {
    vi.mocked(prisma.segmentMembership.count).mockResolvedValue(5);

    const result = await hasSegmentMembershipData({
      storeId: "store-123",
      segmentIds: ["seg-1", "seg-2"],
    });

    expect(result).toBe(true);
  });

  it("should return false when no memberships exist", async () => {
    vi.mocked(prisma.segmentMembership.count).mockResolvedValue(0);

    const result = await hasSegmentMembershipData({
      storeId: "store-123",
      segmentIds: ["seg-1"],
    });

    expect(result).toBe(false);
  });

  it("should return false for empty segment IDs", async () => {
    const result = await hasSegmentMembershipData({
      storeId: "store-123",
      segmentIds: [],
    });

    expect(result).toBe(false);
    expect(prisma.segmentMembership.count).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// IS CUSTOMER IN ANY SHOPIFY SEGMENT TESTS
// ==========================================================================

describe("isCustomerInAnyShopifySegment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return true when customer is in segment", async () => {
    vi.mocked(prisma.segmentMembership.count).mockResolvedValue(1);

    const result = await isCustomerInAnyShopifySegment({
      storeId: "store-123",
      shopifyCustomerId: BigInt(12345),
      segmentIds: ["seg-1", "seg-2"],
    });

    expect(result).toBe(true);
  });

  it("should return false when customer is not in any segment", async () => {
    vi.mocked(prisma.segmentMembership.count).mockResolvedValue(0);

    const result = await isCustomerInAnyShopifySegment({
      storeId: "store-123",
      shopifyCustomerId: BigInt(12345),
      segmentIds: ["seg-1"],
    });

    expect(result).toBe(false);
  });

  it("should return true for empty segment IDs (no targeting)", async () => {
    const result = await isCustomerInAnyShopifySegment({
      storeId: "store-123",
      shopifyCustomerId: BigInt(12345),
      segmentIds: [],
    });

    expect(result).toBe(true);
    expect(prisma.segmentMembership.count).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// GET CUSTOMER SHOPIFY SEGMENTS TESTS
// ==========================================================================

describe("getCustomerShopifySegments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return segment IDs for customer", async () => {
    vi.mocked(prisma.segmentMembership.findMany).mockResolvedValue([
      { shopifySegmentId: "seg-1" },
      { shopifySegmentId: "seg-2" },
    ] as any);

    const result = await getCustomerShopifySegments({
      storeId: "store-123",
      shopifyCustomerId: BigInt(12345),
    });

    expect(result).toEqual(["seg-1", "seg-2"]);
  });

  it("should return empty array when customer has no segments", async () => {
    vi.mocked(prisma.segmentMembership.findMany).mockResolvedValue([]);

    const result = await getCustomerShopifySegments({
      storeId: "store-123",
      shopifyCustomerId: BigInt(12345),
    });

    expect(result).toEqual([]);
  });
});

