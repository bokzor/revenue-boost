/**
 * Unit Tests for Shopify Product Tags Service
 */

import { describe, it, expect, vi } from "vitest";

import { listProductTags } from "~/lib/shopify/product-tags.server";

describe("listProductTags", () => {
  it("should return tags from GraphQL response", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              productTags: {
                edges: [
                  { cursor: "c1", node: "sale" },
                  { cursor: "c2", node: "new-arrival" },
                  { cursor: "c3", node: "featured" },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: "c3",
                },
              },
            },
          }),
      }),
    };

    const result = await listProductTags(mockAdmin as any);

    expect(result.tags).toEqual(["sale", "new-arrival", "featured"]);
    expect(result.hasNextPage).toBe(false);
    expect(result.endCursor).toBe("c3");
  });

  it("should handle pagination", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              productTags: {
                edges: [{ cursor: "c1", node: "tag1" }],
                pageInfo: {
                  hasNextPage: true,
                  endCursor: "c1",
                },
              },
            },
          }),
      }),
    };

    const result = await listProductTags(mockAdmin as any, { first: 1 });

    expect(result.hasNextPage).toBe(true);
    expect(result.endCursor).toBe("c1");
  });

  it("should throw on GraphQL errors", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            errors: [{ message: "Access denied" }],
          }),
      }),
    };

    await expect(listProductTags(mockAdmin as any)).rejects.toThrow("Access denied");
  });

  it("should handle empty response", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              productTags: {
                edges: [],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
              },
            },
          }),
      }),
    };

    const result = await listProductTags(mockAdmin as any);

    expect(result.tags).toEqual([]);
    expect(result.hasNextPage).toBe(false);
  });

  it("should filter out empty tags", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {
              productTags: {
                edges: [
                  { cursor: "c1", node: "valid-tag" },
                  { cursor: "c2", node: "" },
                  { cursor: "c3", node: null },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: null,
                },
              },
            },
          }),
      }),
    };

    const result = await listProductTags(mockAdmin as any);

    expect(result.tags).toEqual(["valid-tag"]);
  });
});

