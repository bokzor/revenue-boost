/**
 * Unit Tests for Shopify Segments Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  listCustomerSegments,
  getCustomerSegmentMembersCount,
} from "~/lib/shopify/segments.server";

describe("listCustomerSegments", () => {
  const mockAdmin = {
    graphql: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list customer segments successfully", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            segments: {
              nodes: [
                {
                  id: "gid://shopify/Segment/1",
                  name: "VIP Customers",
                  query: "total_spent > 1000",
                  creationDate: "2024-01-01",
                  lastEditDate: "2024-06-01",
                },
                {
                  id: "gid://shopify/Segment/2",
                  name: "New Customers",
                  query: null,
                  creationDate: "2024-02-01",
                  lastEditDate: null,
                },
              ],
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
              },
            },
          },
        }),
    });

    const result = await listCustomerSegments(mockAdmin as any);

    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].name).toBe("VIP Customers");
    expect(result.segments[1].name).toBe("New Customers");
    expect(result.hasNextPage).toBe(false);
  });

  it("should handle pagination", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            segments: {
              nodes: [{ id: "1", name: "Segment 1" }],
              pageInfo: {
                hasNextPage: true,
                endCursor: "cursor123",
              },
            },
          },
        }),
    });

    const result = await listCustomerSegments(mockAdmin as any, { first: 10 });

    expect(result.hasNextPage).toBe(true);
    expect(result.endCursor).toBe("cursor123");
  });

  it("should throw error on GraphQL errors", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          errors: [{ message: "Access denied" }],
        }),
    });

    await expect(listCustomerSegments(mockAdmin as any)).rejects.toThrow("Access denied");
  });

  it("should return empty array when no segments", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            segments: {
              nodes: [],
              pageInfo: { hasNextPage: false },
            },
          },
        }),
    });

    const result = await listCustomerSegments(mockAdmin as any);

    expect(result.segments).toEqual([]);
  });
});

describe("getCustomerSegmentMembersCount", () => {
  const mockAdmin = {
    graphql: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return member count", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            customerSegmentMembers: {
              totalCount: 150,
            },
          },
        }),
    });

    const count = await getCustomerSegmentMembersCount(mockAdmin as any, "gid://shopify/Segment/1");

    expect(count).toBe(150);
  });

  it("should return 0 when no members", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: {
            customerSegmentMembers: {
              totalCount: 0,
            },
          },
        }),
    });

    const count = await getCustomerSegmentMembersCount(mockAdmin as any, "gid://shopify/Segment/1");

    expect(count).toBe(0);
  });

  it("should throw error on GraphQL errors", async () => {
    mockAdmin.graphql.mockResolvedValue({
      json: () =>
        Promise.resolve({
          errors: [{ message: "Segment not found" }],
        }),
    });

    await expect(
      getCustomerSegmentMembersCount(mockAdmin as any, "invalid")
    ).rejects.toThrow("Segment not found");
  });
});

