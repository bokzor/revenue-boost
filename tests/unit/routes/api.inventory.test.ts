/**
 * Unit Tests for Inventory API
 *
 * Tests the validation schema and helper functions.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

// Recreate the schema from the route
const InventoryQuerySchema = z.object({
  variantIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
});

// Recreate the validation logic
function validateInventoryQuery(query: z.infer<typeof InventoryQuerySchema>): {
  valid: boolean;
  error?: string;
} {
  if (!query.variantIds?.length && !query.productIds?.length && !query.collectionIds?.length) {
    return {
      valid: false,
      error: "At least one of variantIds, productIds, or collectionIds is required",
    };
  }
  return { valid: true };
}

// Recreate the cache key generation
function generateCacheKey(query: z.infer<typeof InventoryQuerySchema>): string {
  return JSON.stringify({
    v: query.variantIds?.sort(),
    p: query.productIds?.sort(),
    c: query.collectionIds?.sort(),
  });
}

// Recreate the ETag generation
function generateETag(data: unknown): string {
  return `"${Buffer.from(JSON.stringify(data)).toString("base64").substring(0, 16)}"`;
}

describe("Inventory API", () => {
  describe("InventoryQuerySchema", () => {
    it("should validate query with variantIds", () => {
      const query = { variantIds: ["gid://shopify/ProductVariant/123"] };
      const result = InventoryQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate query with productIds", () => {
      const query = { productIds: ["gid://shopify/Product/456"] };
      const result = InventoryQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate query with collectionIds", () => {
      const query = { collectionIds: ["gid://shopify/Collection/789"] };
      const result = InventoryQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate empty query", () => {
      const query = {};
      const result = InventoryQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should validate query with all ID types", () => {
      const query = {
        variantIds: ["v1", "v2"],
        productIds: ["p1"],
        collectionIds: ["c1", "c2", "c3"],
      };
      const result = InventoryQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
    });
  });

  describe("validateInventoryQuery", () => {
    it("should fail when no IDs provided", () => {
      const result = validateInventoryQuery({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain("At least one");
    });

    it("should fail when all arrays are empty", () => {
      const result = validateInventoryQuery({
        variantIds: [],
        productIds: [],
        collectionIds: [],
      });
      expect(result.valid).toBe(false);
    });

    it("should pass when variantIds provided", () => {
      const result = validateInventoryQuery({ variantIds: ["v1"] });
      expect(result.valid).toBe(true);
    });

    it("should pass when productIds provided", () => {
      const result = validateInventoryQuery({ productIds: ["p1"] });
      expect(result.valid).toBe(true);
    });
  });

  describe("generateCacheKey", () => {
    it("should generate consistent cache key", () => {
      const query = { variantIds: ["v2", "v1"], productIds: ["p1"] };
      const key1 = generateCacheKey(query);
      const key2 = generateCacheKey({ variantIds: ["v1", "v2"], productIds: ["p1"] });
      expect(key1).toBe(key2);
    });

    it("should generate different keys for different queries", () => {
      const key1 = generateCacheKey({ variantIds: ["v1"] });
      const key2 = generateCacheKey({ variantIds: ["v2"] });
      expect(key1).not.toBe(key2);
    });
  });

  describe("generateETag", () => {
    it("should generate quoted ETag", () => {
      const etag = generateETag({ test: "data" });
      expect(etag.startsWith('"')).toBe(true);
      expect(etag.endsWith('"')).toBe(true);
    });

    it("should generate consistent ETag for same data", () => {
      const data = { variants: { v1: { available: 10 } } };
      const etag1 = generateETag(data);
      const etag2 = generateETag(data);
      expect(etag1).toBe(etag2);
    });
  });
});

