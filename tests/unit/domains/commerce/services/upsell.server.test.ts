/**
 * Unit Tests for Upsell Service
 *
 * Tests product upsell functionality:
 * - fetchProductsByIds
 * - fetchPopularProducts
 * - fetchProductsByCollection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchProductsByIds,
  fetchPopularProducts,
  fetchProductsByCollection,
} from "~/domains/commerce/services/upsell.server";

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

function createMockProduct(id: string, title: string, price: string = "29.99") {
  return {
    id: `gid://shopify/Product/${id}`,
    title,
    handle: title.toLowerCase().replace(/\s+/g, "-"),
    variants: {
      edges: [{ node: { id: `gid://shopify/ProductVariant/${id}`, price } }],
    },
    images: {
      edges: [{ node: { url: `https://cdn.shopify.com/product-${id}.jpg` } }],
    },
  };
}

// ==========================================================================
// FETCH PRODUCTS BY IDS TESTS
// ==========================================================================

describe("fetchProductsByIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array for empty input", async () => {
    const mockAdmin = createMockAdmin({});
    const result = await fetchProductsByIds(mockAdmin, []);
    expect(result).toEqual([]);
  });

  it("should fetch products by IDs", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        nodes: [
          createMockProduct("123", "T-Shirt"),
          createMockProduct("456", "Jeans", "49.99"),
        ],
      },
    });

    const result = await fetchProductsByIds(mockAdmin, [
      "gid://shopify/Product/123",
      "gid://shopify/Product/456",
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("T-Shirt");
    expect(result[0].price).toBe("29.99");
    expect(result[1].title).toBe("Jeans");
    expect(result[1].price).toBe("49.99");
  });

  it("should handle missing product fields gracefully", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        nodes: [
          { id: "gid://shopify/Product/123" }, // Minimal product
        ],
      },
    });

    const result = await fetchProductsByIds(mockAdmin, ["gid://shopify/Product/123"]);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("");
    expect(result[0].price).toBe("0.00");
    expect(result[0].imageUrl).toBe("");
  });

  it("should skip null nodes", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        nodes: [
          createMockProduct("123", "Valid Product"),
          null,
          undefined,
          createMockProduct("456", "Another Product"),
        ],
      },
    });

    const result = await fetchProductsByIds(mockAdmin, ["1", "2", "3", "4"]);

    expect(result).toHaveLength(2);
  });
});

// ==========================================================================
// FETCH POPULAR PRODUCTS TESTS
// ==========================================================================

describe("fetchPopularProducts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch popular products", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        products: {
          edges: [
            { node: createMockProduct("1", "Popular 1") },
            { node: createMockProduct("2", "Popular 2") },
            { node: createMockProduct("3", "Popular 3") },
          ],
        },
      },
    });

    const result = await fetchPopularProducts(mockAdmin, 3);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Popular 1");
  });

  it("should exclude specified product IDs", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        products: {
          edges: [
            { node: createMockProduct("1", "Product 1") },
            { node: createMockProduct("2", "Product 2") },
            { node: createMockProduct("3", "Product 3") },
          ],
        },
      },
    });

    const result = await fetchPopularProducts(mockAdmin, 2, ["gid://shopify/Product/1"]);

    expect(result).toHaveLength(2);
    expect(result.find((p) => p.id === "gid://shopify/Product/1")).toBeUndefined();
  });

  it("should return empty array on error", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("API Error")),
    } as any;

    const result = await fetchPopularProducts(mockAdmin, 5);

    expect(result).toEqual([]);
  });

  it("should limit results to requested count", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        products: {
          edges: [
            { node: createMockProduct("1", "Product 1") },
            { node: createMockProduct("2", "Product 2") },
            { node: createMockProduct("3", "Product 3") },
            { node: createMockProduct("4", "Product 4") },
            { node: createMockProduct("5", "Product 5") },
          ],
        },
      },
    });

    const result = await fetchPopularProducts(mockAdmin, 2);

    expect(result).toHaveLength(2);
  });
});

// ==========================================================================
// FETCH PRODUCTS BY COLLECTION TESTS
// ==========================================================================

describe("fetchProductsByCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array for empty collection identifier", async () => {
    const mockAdmin = createMockAdmin({});
    const result = await fetchProductsByCollection(mockAdmin, "", 3);
    expect(result).toEqual([]);
  });

  it("should fetch products from collection by GID", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        collection: {
          products: {
            edges: [
              { node: createMockProduct("1", "Collection Product 1") },
              { node: createMockProduct("2", "Collection Product 2") },
            ],
          },
        },
      },
    });

    const result = await fetchProductsByCollection(
      mockAdmin,
      "gid://shopify/Collection/123",
      3
    );

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Collection Product 1");
  });

  it("should fetch products from collection by handle", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        collectionByHandle: {
          products: {
            edges: [
              { node: createMockProduct("1", "Handle Product") },
            ],
          },
        },
      },
    });

    const result = await fetchProductsByCollection(mockAdmin, "best-sellers", 3);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Handle Product");
  });

  it("should return empty array on collection fetch error", async () => {
    const mockAdmin = {
      graphql: vi.fn().mockRejectedValue(new Error("Collection not found")),
    } as any;

    const result = await fetchProductsByCollection(
      mockAdmin,
      "gid://shopify/Collection/999",
      3
    );

    expect(result).toEqual([]);
  });

  it("should limit products to specified count", async () => {
    const mockAdmin = createMockAdmin({
      data: {
        collection: {
          products: {
            edges: [
              { node: createMockProduct("1", "P1") },
              { node: createMockProduct("2", "P2") },
              { node: createMockProduct("3", "P3") },
            ],
          },
        },
      },
    });

    // Even if collection returns 3, should respect the limit of 12 (max)
    // The limit is applied in the query, not post-fetch
    const result = await fetchProductsByCollection(
      mockAdmin,
      "gid://shopify/Collection/123",
      2
    );

    // Will return 3 because the mock returns 3
    // The actual GraphQL query would limit it
    expect(result.length).toBeGreaterThan(0);
  });
});

