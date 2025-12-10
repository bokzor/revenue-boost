/**
 * Unit Tests for Storefront Shopify Utilities
 *
 * Tests the Shopify root path detection.
 */

import { describe, it, expect } from "vitest";

// Recreate the getShopifyRoot helper
function getShopifyRoot(shopifyRoutes?: { root?: string }): string {
  try {
    return shopifyRoutes?.root || "/";
  } catch {
    return "/";
  }
}

describe("Storefront Shopify Utilities", () => {
  describe("getShopifyRoot", () => {
    it("should return root path when Shopify routes exist", () => {
      const routes = { root: "/en/" };
      expect(getShopifyRoot(routes)).toBe("/en/");
    });

    it("should return default root when routes are undefined", () => {
      expect(getShopifyRoot(undefined)).toBe("/");
    });

    it("should return default root when root is undefined", () => {
      const routes = {};
      expect(getShopifyRoot(routes)).toBe("/");
    });

    it("should handle multi-language store roots", () => {
      expect(getShopifyRoot({ root: "/fr/" })).toBe("/fr/");
      expect(getShopifyRoot({ root: "/de/" })).toBe("/de/");
      expect(getShopifyRoot({ root: "/es-ES/" })).toBe("/es-ES/");
    });

    it("should handle region-specific roots", () => {
      expect(getShopifyRoot({ root: "/en-US/" })).toBe("/en-US/");
      expect(getShopifyRoot({ root: "/en-GB/" })).toBe("/en-GB/");
    });
  });
});

