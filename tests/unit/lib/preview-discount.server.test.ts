/**
 * Unit Tests for Preview Discount Server
 *
 * Tests the preview discount code generation utilities.
 */

import { describe, it, expect } from "vitest";

import {
  generatePreviewDiscountCode,
  isPreviewCampaign,
} from "~/lib/preview-discount.server";

describe("Preview Discount Server", () => {
  describe("generatePreviewDiscountCode", () => {
    it("should return undefined when discount is disabled", () => {
      const result = generatePreviewDiscountCode({ enabled: false });
      expect(result).toBeUndefined();
    });

    it("should generate percentage code with value", () => {
      const result = generatePreviewDiscountCode({
        enabled: true,
        valueType: "PERCENTAGE",
        value: 15,
      });
      expect(result).toBe("PREVIEW-15OFF");
    });

    it("should generate percentage code with custom prefix", () => {
      const result = generatePreviewDiscountCode({
        enabled: true,
        valueType: "PERCENTAGE",
        value: 20,
        prefix: "SUMMER",
      });
      expect(result).toBe("SUMMER-20OFF");
    });

    it("should generate fixed amount code", () => {
      const result = generatePreviewDiscountCode({
        enabled: true,
        valueType: "FIXED_AMOUNT",
        value: 10,
      });
      expect(result).toBe("PREVIEW-$10");
    });

    it("should generate free shipping code", () => {
      const result = generatePreviewDiscountCode({
        enabled: true,
        valueType: "FREE_SHIPPING",
      });
      expect(result).toBe("PREVIEW-FREESHIP");
    });

    it("should handle legacy percentage type", () => {
      const result = generatePreviewDiscountCode({
        type: "percentage",
        percentage: 25,
      });
      expect(result).toBe("PREVIEW-25OFF");
    });

    it("should handle legacy fixed_amount type", () => {
      const result = generatePreviewDiscountCode({
        type: "fixed_amount",
        value: 15,
      });
      expect(result).toBe("PREVIEW-$15");
    });

    it("should handle legacy free_shipping type", () => {
      const result = generatePreviewDiscountCode({
        type: "free_shipping",
      });
      expect(result).toBe("PREVIEW-FREESHIP");
    });

    it("should default to 10% for percentage without value", () => {
      const result = generatePreviewDiscountCode({
        valueType: "PERCENTAGE",
      });
      expect(result).toBe("PREVIEW-10OFF");
    });

    it("should default to $10 for fixed amount without value", () => {
      const result = generatePreviewDiscountCode({
        valueType: "FIXED_AMOUNT",
      });
      expect(result).toBe("PREVIEW-$10");
    });

    it("should generate code with value when no type specified", () => {
      const result = generatePreviewDiscountCode({
        value: 30,
      });
      expect(result).toBe("PREVIEW-30OFF");
    });

    it("should generate fallback code when no config", () => {
      const result = generatePreviewDiscountCode({});
      expect(result).toBe("PREVIEW-SAVE");
    });

    it("should generate fallback code for null config", () => {
      const result = generatePreviewDiscountCode(null);
      expect(result).toBe("PREVIEW-SAVE");
    });

    it("should generate fallback code for undefined config", () => {
      const result = generatePreviewDiscountCode(undefined);
      expect(result).toBe("PREVIEW-SAVE");
    });

    it("should round decimal values", () => {
      const result = generatePreviewDiscountCode({
        valueType: "PERCENTAGE",
        value: 15.7,
      });
      expect(result).toBe("PREVIEW-16OFF");
    });
  });

  describe("isPreviewCampaign", () => {
    it("should return true for preview campaign IDs", () => {
      expect(isPreviewCampaign("preview-123")).toBe(true);
      expect(isPreviewCampaign("preview-abc-def")).toBe(true);
      expect(isPreviewCampaign("preview-")).toBe(true);
    });

    it("should return false for regular campaign IDs", () => {
      expect(isPreviewCampaign("campaign-123")).toBe(false);
      expect(isPreviewCampaign("123-preview")).toBe(false);
      expect(isPreviewCampaign("abc")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isPreviewCampaign(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isPreviewCampaign(undefined)).toBe(false);
    });
  });
});

