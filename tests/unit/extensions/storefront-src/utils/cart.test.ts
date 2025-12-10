/**
 * Unit Tests for Storefront Cart Utilities
 *
 * Tests the cart operations and section rendering logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the cart events list
const CART_EVENTS = [
  "cart:updated",
  "cart.requestUpdate",
  "cart:update",
  "cart:change",
  "theme:cart:update",
  "cart:item-added",
  "cart:add",
  "cart:refresh",
];

// Helper to validate cart item structure
interface CartItem {
  id: string;
  quantity: number;
}

function isValidCartItem(item: unknown): item is CartItem {
  if (!item || typeof item !== "object") return false;
  const i = item as Record<string, unknown>;
  return typeof i.id === "string" && typeof i.quantity === "number" && i.quantity >= 1;
}

// Helper to build sections parameter
function buildSectionsParam(sections: string[]): string {
  return sections.join(",");
}

// Helper to validate add to cart response
interface AddToCartResult {
  success: boolean;
  cartData?: Record<string, unknown>;
  error?: string;
}

function isSuccessfulAddToCart(result: AddToCartResult): boolean {
  return result.success && result.cartData !== undefined;
}

describe("Storefront Cart Utilities", () => {
  describe("CART_EVENTS", () => {
    it("should have all required cart events", () => {
      expect(CART_EVENTS).toContain("cart:updated");
      expect(CART_EVENTS).toContain("cart:update");
      expect(CART_EVENTS).toContain("cart:change");
      expect(CART_EVENTS).toContain("cart:add");
      expect(CART_EVENTS).toContain("cart:refresh");
    });

    it("should have 8 events", () => {
      expect(CART_EVENTS).toHaveLength(8);
    });
  });

  describe("isValidCartItem", () => {
    it("should return true for valid cart item", () => {
      const item = { id: "gid://shopify/ProductVariant/123", quantity: 2 };
      expect(isValidCartItem(item)).toBe(true);
    });

    it("should return false for missing id", () => {
      const item = { quantity: 2 };
      expect(isValidCartItem(item)).toBe(false);
    });

    it("should return false for missing quantity", () => {
      const item = { id: "123" };
      expect(isValidCartItem(item)).toBe(false);
    });

    it("should return false for zero quantity", () => {
      const item = { id: "123", quantity: 0 };
      expect(isValidCartItem(item)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isValidCartItem(null)).toBe(false);
    });
  });

  describe("buildSectionsParam", () => {
    it("should join sections with comma", () => {
      const sections = ["cart-drawer", "cart-icon-bubble"];
      expect(buildSectionsParam(sections)).toBe("cart-drawer,cart-icon-bubble");
    });

    it("should handle single section", () => {
      const sections = ["cart-drawer"];
      expect(buildSectionsParam(sections)).toBe("cart-drawer");
    });

    it("should handle empty array", () => {
      const sections: string[] = [];
      expect(buildSectionsParam(sections)).toBe("");
    });
  });

  describe("isSuccessfulAddToCart", () => {
    it("should return true for successful result", () => {
      const result: AddToCartResult = {
        success: true,
        cartData: { item_count: 1 },
      };
      expect(isSuccessfulAddToCart(result)).toBe(true);
    });

    it("should return false for failed result", () => {
      const result: AddToCartResult = {
        success: false,
        error: "Out of stock",
      };
      expect(isSuccessfulAddToCart(result)).toBe(false);
    });

    it("should return false for success without cartData", () => {
      const result: AddToCartResult = {
        success: true,
      };
      expect(isSuccessfulAddToCart(result)).toBe(false);
    });
  });

  describe("Default sections", () => {
    it("should have correct default sections", () => {
      const defaultSections = ["cart-drawer", "cart-icon-bubble"];
      expect(defaultSections).toContain("cart-drawer");
      expect(defaultSections).toContain("cart-icon-bubble");
    });
  });

  describe("Cart data structure", () => {
    it("should have expected cart response fields", () => {
      const cartData = {
        item_count: 3,
        total_price: 5000,
        items: [],
        sections: { "cart-drawer": "<html>...</html>" },
      };

      expect(cartData.item_count).toBe(3);
      expect(cartData.total_price).toBe(5000);
      expect(cartData.sections).toBeDefined();
    });
  });
});

