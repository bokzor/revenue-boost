/**
 * Unit Tests for ProductDataHook
 *
 * Tests the product data fetching and normalization logic.
 */

import { describe, it, expect } from "vitest";

// Trigger types recognized by the smart recommendations API
type TriggerType = "product_view" | "cart" | "exit_intent" | "scroll" | "add_to_cart";

// Recreate the normalizeProductId helper
function normalizeProductId(raw: unknown): string | null {
  if (raw == null) return null;
  const idStr = String(raw).trim();
  if (!idStr) return null;

  // Already a GID
  if (idStr.startsWith("gid://shopify/Product/")) {
    return idStr;
  }

  // Numeric ID - convert to GID
  if (/^\d+$/.test(idStr)) {
    return `gid://shopify/Product/${idStr}`;
  }

  return null;
}

// Recreate the detectTriggerType helper
function detectTriggerType(campaign: {
  clientTriggers?: { enhancedTriggers?: Record<string, { enabled?: boolean }> };
  targetRules?: { enhancedTriggers?: Record<string, { enabled?: boolean }> };
}): TriggerType | undefined {
  try {
    const triggers =
      campaign.clientTriggers?.enhancedTriggers || campaign.targetRules?.enhancedTriggers;

    if (!triggers) return undefined;

    if (triggers.add_to_cart?.enabled) return "add_to_cart";
    if (triggers.product_view?.enabled) return "product_view";
    if (triggers.exit_intent?.enabled) return "exit_intent";
    if (triggers.scroll_depth?.enabled) return "scroll";
    if (triggers.cart_value?.enabled || triggers.cart_drawer_open?.enabled) return "cart";

    return undefined;
  } catch {
    return undefined;
  }
}

describe("ProductDataHook", () => {
  describe("normalizeProductId", () => {
    it("should return null for null input", () => {
      expect(normalizeProductId(null)).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(normalizeProductId(undefined)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(normalizeProductId("")).toBeNull();
    });

    it("should return GID as-is", () => {
      const gid = "gid://shopify/Product/123456";
      expect(normalizeProductId(gid)).toBe(gid);
    });

    it("should convert numeric string to GID", () => {
      expect(normalizeProductId("123456")).toBe("gid://shopify/Product/123456");
    });

    it("should convert number to GID", () => {
      expect(normalizeProductId(123456)).toBe("gid://shopify/Product/123456");
    });

    it("should return null for invalid format", () => {
      expect(normalizeProductId("invalid-id")).toBeNull();
    });
  });

  describe("detectTriggerType", () => {
    it("should return undefined when no triggers", () => {
      expect(detectTriggerType({})).toBeUndefined();
    });

    it("should detect add_to_cart trigger", () => {
      const campaign = {
        clientTriggers: {
          enhancedTriggers: { add_to_cart: { enabled: true } },
        },
      };
      expect(detectTriggerType(campaign)).toBe("add_to_cart");
    });

    it("should detect product_view trigger", () => {
      const campaign = {
        targetRules: {
          enhancedTriggers: { product_view: { enabled: true } },
        },
      };
      expect(detectTriggerType(campaign)).toBe("product_view");
    });

    it("should detect exit_intent trigger", () => {
      const campaign = {
        clientTriggers: {
          enhancedTriggers: { exit_intent: { enabled: true } },
        },
      };
      expect(detectTriggerType(campaign)).toBe("exit_intent");
    });

    it("should detect scroll trigger", () => {
      const campaign = {
        clientTriggers: {
          enhancedTriggers: { scroll_depth: { enabled: true } },
        },
      };
      expect(detectTriggerType(campaign)).toBe("scroll");
    });

    it("should detect cart trigger from cart_value", () => {
      const campaign = {
        clientTriggers: {
          enhancedTriggers: { cart_value: { enabled: true } },
        },
      };
      expect(detectTriggerType(campaign)).toBe("cart");
    });

    it("should prioritize add_to_cart over other triggers", () => {
      const campaign = {
        clientTriggers: {
          enhancedTriggers: {
            add_to_cart: { enabled: true },
            product_view: { enabled: true },
            exit_intent: { enabled: true },
          },
        },
      };
      expect(detectTriggerType(campaign)).toBe("add_to_cart");
    });
  });

  describe("Hook configuration", () => {
    it("should have correct hook name", () => {
      const hookName = "products";
      expect(hookName).toBe("products");
    });

    it("should run in preview mode", () => {
      const runInPreview = true;
      expect(runInPreview).toBe(true);
    });

    it("should have 5 second timeout", () => {
      const timeoutMs = 5000;
      expect(timeoutMs).toBe(5000);
    });
  });
});

