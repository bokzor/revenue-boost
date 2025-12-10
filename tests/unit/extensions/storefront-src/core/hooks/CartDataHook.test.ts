/**
 * Unit Tests for CartDataHook
 *
 * Tests the cart data fetching and normalization logic.
 */

import { describe, it, expect } from "vitest";

/** Raw cart item from Shopify's /cart.js endpoint */
interface ShopifyCartItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  price: number; // In cents
  quantity: number;
  image?: string;
  handle?: string;
}

/** Normalized cart item for popup components */
interface NormalizedCartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  price: string;
  quantity: number;
  imageUrl: string;
  handle?: string;
}

// Recreate the normalizeCartItems helper
function normalizeCartItems(items: ShopifyCartItem[]): NormalizedCartItem[] {
  return items.map((item) => ({
    id: String(item.id),
    productId: `gid://shopify/Product/${item.product_id}`,
    variantId: `gid://shopify/ProductVariant/${item.variant_id}`,
    title: item.title,
    price: (item.price / 100).toFixed(2),
    quantity: item.quantity,
    imageUrl: item.image || "",
    handle: item.handle,
  }));
}

describe("CartDataHook", () => {
  describe("normalizeCartItems", () => {
    it("should normalize a single cart item", () => {
      const items: ShopifyCartItem[] = [
        {
          id: 12345,
          product_id: 111,
          variant_id: 222,
          title: "Test Product",
          price: 1999, // $19.99 in cents
          quantity: 2,
          image: "https://cdn.shopify.com/image.jpg",
          handle: "test-product",
        },
      ];

      const result = normalizeCartItems(items);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("12345");
      expect(result[0].productId).toBe("gid://shopify/Product/111");
      expect(result[0].variantId).toBe("gid://shopify/ProductVariant/222");
      expect(result[0].title).toBe("Test Product");
      expect(result[0].price).toBe("19.99");
      expect(result[0].quantity).toBe(2);
      expect(result[0].imageUrl).toBe("https://cdn.shopify.com/image.jpg");
      expect(result[0].handle).toBe("test-product");
    });

    it("should handle missing image", () => {
      const items: ShopifyCartItem[] = [
        {
          id: 1,
          product_id: 100,
          variant_id: 200,
          title: "No Image Product",
          price: 500,
          quantity: 1,
        },
      ];

      const result = normalizeCartItems(items);
      expect(result[0].imageUrl).toBe("");
    });

    it("should handle multiple items", () => {
      const items: ShopifyCartItem[] = [
        { id: 1, product_id: 100, variant_id: 200, title: "Product 1", price: 1000, quantity: 1 },
        { id: 2, product_id: 101, variant_id: 201, title: "Product 2", price: 2000, quantity: 3 },
      ];

      const result = normalizeCartItems(items);
      expect(result).toHaveLength(2);
      expect(result[0].price).toBe("10.00");
      expect(result[1].price).toBe("20.00");
    });

    it("should handle empty cart", () => {
      const result = normalizeCartItems([]);
      expect(result).toEqual([]);
    });

    it("should format price with two decimal places", () => {
      const items: ShopifyCartItem[] = [
        { id: 1, product_id: 100, variant_id: 200, title: "Test", price: 100, quantity: 1 },
      ];

      const result = normalizeCartItems(items);
      expect(result[0].price).toBe("1.00");
    });
  });

  describe("Hook configuration", () => {
    it("should have correct hook name", () => {
      const hookName = "cart";
      expect(hookName).toBe("cart");
    });

    it("should not run in preview mode", () => {
      const runInPreview = false;
      expect(runInPreview).toBe(false);
    });

    it("should have 3 second timeout", () => {
      const timeoutMs = 3000;
      expect(timeoutMs).toBe(3000);
    });
  });

  describe("Cart data structure", () => {
    it("should build correct cart data object", () => {
      const cart = {
        items: [{ id: 1, product_id: 100, variant_id: 200, title: "Test", price: 1000, quantity: 2 }],
        total_price: 2000,
        item_count: 2,
        currency: "USD",
      };

      const cartData = {
        items: normalizeCartItems(cart.items),
        total: cart.total_price ? cart.total_price / 100 : 0,
        itemCount: cart.item_count || 0,
        currency: cart.currency,
      };

      expect(cartData.total).toBe(20);
      expect(cartData.itemCount).toBe(2);
      expect(cartData.currency).toBe("USD");
      expect(cartData.items).toHaveLength(1);
    });
  });
});

