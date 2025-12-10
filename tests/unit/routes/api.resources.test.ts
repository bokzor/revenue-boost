/**
 * Unit Tests for Resources API
 *
 * Tests the resource transformation and validation logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the types from the route
interface ResourceDetails {
  id: string;
  title: string;
  handle: string;
  images?: Array<{ url: string; altText?: string }>;
  variants?: Array<{ id: string; title: string; price: string }>;
}

// Recreate the validation logic
function validateType(type: string): boolean {
  return type === "product" || type === "collection";
}

function parseIds(idsParam: string | null): string[] {
  if (!idsParam) return [];
  return idsParam.split(",").filter(Boolean);
}

// Recreate the transformation logic for products
function transformProductNode(node: Record<string, unknown>): ResourceDetails {
  type ImageEdge = { node: { url: string; altText?: string } };
  type VariantEdge = { node: { id: string; title: string; price: string } };

  const imagesEdges = node.images as { edges?: ImageEdge[] } | undefined;
  const images = imagesEdges?.edges?.map((edge) => ({
    url: edge.node.url,
    altText: edge.node.altText,
  }));

  const variantsEdges = node.variants as { edges?: VariantEdge[] } | undefined;
  const variants = variantsEdges?.edges?.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    price: edge.node.price,
  }));

  return {
    id: node.id as string,
    title: (node.title as string) || "Untitled",
    handle: (node.handle as string) || "",
    images,
    variants,
  };
}

// Recreate the transformation logic for collections
function transformCollectionNode(node: Record<string, unknown>): ResourceDetails {
  const nodeImage = node.image as { url?: string; altText?: string } | undefined;
  const images = nodeImage ? [{ url: nodeImage.url || "", altText: nodeImage.altText }] : undefined;

  return {
    id: node.id as string,
    title: (node.title as string) || "Untitled",
    handle: (node.handle as string) || "",
    images,
  };
}

describe("Resources API", () => {
  describe("validateType", () => {
    it("should accept product type", () => {
      expect(validateType("product")).toBe(true);
    });

    it("should accept collection type", () => {
      expect(validateType("collection")).toBe(true);
    });

    it("should reject invalid type", () => {
      expect(validateType("variant")).toBe(false);
      expect(validateType("")).toBe(false);
      expect(validateType("PRODUCT")).toBe(false);
    });
  });

  describe("parseIds", () => {
    it("should parse comma-separated IDs", () => {
      const result = parseIds("gid://shopify/Product/1,gid://shopify/Product/2");
      expect(result).toEqual(["gid://shopify/Product/1", "gid://shopify/Product/2"]);
    });

    it("should return empty array for null", () => {
      expect(parseIds(null)).toEqual([]);
    });

    it("should filter empty strings", () => {
      const result = parseIds("gid1,,gid2,");
      expect(result).toEqual(["gid1", "gid2"]);
    });
  });

  describe("transformProductNode", () => {
    it("should transform product with images and variants", () => {
      const node = {
        id: "gid://shopify/Product/123",
        title: "Test Product",
        handle: "test-product",
        images: {
          edges: [{ node: { url: "https://cdn.shopify.com/image.jpg", altText: "Product image" } }],
        },
        variants: {
          edges: [{ node: { id: "gid://shopify/ProductVariant/456", title: "Default", price: "19.99" } }],
        },
      };

      const result = transformProductNode(node);

      expect(result.id).toBe("gid://shopify/Product/123");
      expect(result.title).toBe("Test Product");
      expect(result.images).toHaveLength(1);
      expect(result.variants).toHaveLength(1);
    });

    it("should handle missing title", () => {
      const node = { id: "gid://shopify/Product/123", handle: "test" };
      const result = transformProductNode(node);
      expect(result.title).toBe("Untitled");
    });
  });

  describe("transformCollectionNode", () => {
    it("should transform collection with image", () => {
      const node = {
        id: "gid://shopify/Collection/789",
        title: "Summer Collection",
        handle: "summer",
        image: { url: "https://cdn.shopify.com/collection.jpg", altText: "Collection" },
      };

      const result = transformCollectionNode(node);

      expect(result.id).toBe("gid://shopify/Collection/789");
      expect(result.images).toHaveLength(1);
      expect(result.variants).toBeUndefined();
    });

    it("should handle missing image", () => {
      const node = { id: "gid://shopify/Collection/789", title: "No Image", handle: "no-image" };
      const result = transformCollectionNode(node);
      expect(result.images).toBeUndefined();
    });
  });
});

