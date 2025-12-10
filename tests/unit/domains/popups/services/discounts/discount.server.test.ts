/**
 * Unit Tests for Popups Discount Service (Compatibility Layer)
 *
 * This tests the re-exports from the commerce discount service.
 */

import { describe, it, expect } from "vitest";

import {
  parseDiscountConfig,
  requiresEmailRestriction,
  shouldAutoApply,
} from "~/domains/popups/services/discounts/discount.server";

describe("Popups Discount Service (Compatibility Layer)", () => {
  describe("parseDiscountConfig", () => {
    it("should parse valid discount config", () => {
      const config = parseDiscountConfig({
        enabled: true,
        strategy: "simple",
        type: "shared",
        valueType: "PERCENTAGE",
        value: 10,
      });

      expect(config.enabled).toBe(true);
      expect(config.value).toBe(10);
    });

    it("should return defaults for empty config", () => {
      const config = parseDiscountConfig({});

      expect(config.enabled).toBe(false);
    });
  });

  describe("requiresEmailRestriction", () => {
    it("should return true for SHOW_CODE_AND_ASSIGN_TO_EMAIL behavior", () => {
      expect(requiresEmailRestriction("SHOW_CODE_AND_ASSIGN_TO_EMAIL")).toBe(true);
    });

    it("should return false for SHOW_CODE_ONLY behavior", () => {
      expect(requiresEmailRestriction("SHOW_CODE_ONLY")).toBe(false);
    });

    it("should return false for undefined behavior", () => {
      expect(requiresEmailRestriction(undefined)).toBe(false);
    });
  });

  describe("shouldAutoApply", () => {
    it("should return true for SHOW_CODE_AND_AUTO_APPLY behavior", () => {
      expect(shouldAutoApply("SHOW_CODE_AND_AUTO_APPLY")).toBe(true);
    });

    it("should return false for SHOW_CODE_ONLY behavior", () => {
      expect(shouldAutoApply("SHOW_CODE_ONLY")).toBe(false);
    });

    it("should return false for undefined behavior", () => {
      expect(shouldAutoApply(undefined)).toBe(false);
    });
  });
});

