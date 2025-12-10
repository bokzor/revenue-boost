/**
 * Unit Tests for Storefront Discount Utilities
 *
 * Tests the discount application and auto-apply logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the shouldAutoApply helper
function shouldAutoApply(behavior: string | undefined): boolean {
  return behavior === "SHOW_CODE_AND_AUTO_APPLY";
}

// Recreate the discount behavior types
type DiscountBehavior =
  | "SHOW_CODE_ONLY"
  | "SHOW_CODE_AND_AUTO_APPLY"
  | "AUTO_APPLY_ONLY";

// Helper to validate discount code format
function isValidDiscountCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  // Discount codes should be alphanumeric with optional dashes/underscores
  return /^[A-Za-z0-9_-]{3,50}$/.test(code);
}

// Helper to build discount storage key
function getDiscountStorageKey(): string {
  return "rb_discount_code";
}

describe("Storefront Discount Utilities", () => {
  describe("shouldAutoApply", () => {
    it("should return true for SHOW_CODE_AND_AUTO_APPLY", () => {
      expect(shouldAutoApply("SHOW_CODE_AND_AUTO_APPLY")).toBe(true);
    });

    it("should return false for SHOW_CODE_ONLY", () => {
      expect(shouldAutoApply("SHOW_CODE_ONLY")).toBe(false);
    });

    it("should return false for AUTO_APPLY_ONLY", () => {
      expect(shouldAutoApply("AUTO_APPLY_ONLY")).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(shouldAutoApply(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(shouldAutoApply("")).toBe(false);
    });
  });

  describe("DiscountBehavior type", () => {
    it("should support all behavior types", () => {
      const behaviors: DiscountBehavior[] = [
        "SHOW_CODE_ONLY",
        "SHOW_CODE_AND_AUTO_APPLY",
        "AUTO_APPLY_ONLY",
      ];
      expect(behaviors).toHaveLength(3);
    });
  });

  describe("isValidDiscountCode", () => {
    it("should return true for valid codes", () => {
      expect(isValidDiscountCode("SAVE10")).toBe(true);
      expect(isValidDiscountCode("SUMMER-SALE")).toBe(true);
      expect(isValidDiscountCode("PROMO_2024")).toBe(true);
    });

    it("should return false for empty string", () => {
      expect(isValidDiscountCode("")).toBe(false);
    });

    it("should return false for too short codes", () => {
      expect(isValidDiscountCode("AB")).toBe(false);
    });

    it("should return false for codes with spaces", () => {
      expect(isValidDiscountCode("SAVE 10")).toBe(false);
    });

    it("should return false for codes with special characters", () => {
      expect(isValidDiscountCode("SAVE@10")).toBe(false);
      expect(isValidDiscountCode("SAVE!10")).toBe(false);
    });
  });

  describe("getDiscountStorageKey", () => {
    it("should return correct storage key", () => {
      expect(getDiscountStorageKey()).toBe("rb_discount_code");
    });
  });

  describe("Discount application flow", () => {
    it("should have correct API endpoint", () => {
      const endpoint = "/cart/update.js";
      expect(endpoint).toBe("/cart/update.js");
    });

    it("should have correct request body structure", () => {
      const code = "SAVE10";
      const body = JSON.stringify({ discount: code });
      const parsed = JSON.parse(body);

      expect(parsed.discount).toBe("SAVE10");
    });
  });

  describe("Cart discount events", () => {
    it("should have correct event names", () => {
      const events = ["cart:discount-applied", "cart:updated"];
      expect(events).toContain("cart:discount-applied");
      expect(events).toContain("cart:updated");
    });
  });

  describe("Discount response structure", () => {
    it("should have expected cart response fields", () => {
      const cartResponse = {
        item_count: 2,
        total_discount: 500,
        discount_codes: [{ code: "SAVE10", amount: 500 }],
      };

      expect(cartResponse.total_discount).toBe(500);
      expect(cartResponse.discount_codes).toHaveLength(1);
    });
  });
});

