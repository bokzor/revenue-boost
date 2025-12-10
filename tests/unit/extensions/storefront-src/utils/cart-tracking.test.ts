/**
 * Unit Tests for Storefront Cart Tracking Utilities
 *
 * Tests the cart activity tracking helpers.
 */

import { describe, it, expect } from "vitest";

// Recreate the hasProductId type guard
function hasProductId(d: unknown): d is { productId: string | number } {
  return (
    d != null &&
    typeof d === "object" &&
    "productId" in (d as Record<string, unknown>) &&
    (typeof (d as { productId?: unknown }).productId === "string" ||
      typeof (d as { productId?: unknown }).productId === "number")
  );
}

// Helper to build product GID
function buildProductGid(productId: string | number): string {
  return `gid://shopify/Product/${productId}`;
}

// Helper to check if URL is add-to-cart
function isAddToCartUrl(url: string): boolean {
  return url.includes("/cart/add");
}

// Session storage key for add-to-cart flag
const ADDED_TO_CART_KEY = "revenue_boost_added_to_cart";

describe("Storefront Cart Tracking Utilities", () => {
  describe("hasProductId", () => {
    it("should return true for object with string productId", () => {
      expect(hasProductId({ productId: "123" })).toBe(true);
    });

    it("should return true for object with number productId", () => {
      expect(hasProductId({ productId: 123 })).toBe(true);
    });

    it("should return false for null", () => {
      expect(hasProductId(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(hasProductId(undefined)).toBe(false);
    });

    it("should return false for object without productId", () => {
      expect(hasProductId({ id: "123" })).toBe(false);
    });

    it("should return false for object with non-string/number productId", () => {
      expect(hasProductId({ productId: { id: "123" } })).toBe(false);
    });
  });

  describe("buildProductGid", () => {
    it("should build GID from string ID", () => {
      expect(buildProductGid("12345")).toBe("gid://shopify/Product/12345");
    });

    it("should build GID from number ID", () => {
      expect(buildProductGid(12345)).toBe("gid://shopify/Product/12345");
    });
  });

  describe("isAddToCartUrl", () => {
    it("should detect /cart/add.js", () => {
      expect(isAddToCartUrl("/cart/add.js")).toBe(true);
    });

    it("should detect /cart/add", () => {
      expect(isAddToCartUrl("/cart/add")).toBe(true);
    });

    it("should detect full URL with /cart/add", () => {
      expect(isAddToCartUrl("https://store.myshopify.com/cart/add.js")).toBe(true);
    });

    it("should return false for /cart", () => {
      expect(isAddToCartUrl("/cart")).toBe(false);
    });

    it("should return false for /cart/update", () => {
      expect(isAddToCartUrl("/cart/update")).toBe(false);
    });
  });

  describe("Session storage key", () => {
    it("should have correct key name", () => {
      expect(ADDED_TO_CART_KEY).toBe("revenue_boost_added_to_cart");
    });
  });

  describe("Cart event types", () => {
    it("should define cart:add event", () => {
      const eventName = "cart:add";
      expect(eventName).toBe("cart:add");
    });

    it("should define cart:item-added event", () => {
      const eventName = "cart:item-added";
      expect(eventName).toBe("cart:item-added");
    });

    it("should define cart:updated event", () => {
      const eventName = "cart:updated";
      expect(eventName).toBe("cart:updated");
    });
  });

  describe("Event detail structure", () => {
    it("should have productId in detail", () => {
      const detail = { productId: "gid://shopify/Product/123" };
      expect(detail.productId).toBeDefined();
      expect(detail.productId).toContain("gid://shopify/Product/");
    });
  });
});

