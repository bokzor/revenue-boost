/**
 * Tests for Preview Discount Code Generator
 *
 * Tests the generatePreviewDiscountCode() function that creates
 * realistic fake discount codes for preview mode testing.
 */

import { describe, it, expect } from "vitest";
import {
  generatePreviewDiscountCode,
  isPreviewCampaign,
  type PreviewDiscountConfig,
} from "~/lib/preview-discount.server";

describe("generatePreviewDiscountCode", () => {
  describe("Percentage Discounts", () => {
    it("generates code for percentage discount with valueType", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 15,
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-15OFF");
    });

    it("generates code for percentage discount with legacy type field", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        type: "percentage",
        percentage: 20,
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-20OFF");
    });

    it("rounds percentage values", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 15.7,
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-16OFF");
    });

    it("uses custom prefix for percentage discount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 25,
        prefix: "FLASH",
      };
      expect(generatePreviewDiscountCode(config)).toBe("FLASH-25OFF");
    });
  });

  describe("Fixed Amount Discounts", () => {
    it("generates code for fixed amount discount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FIXED_AMOUNT",
        value: 10,
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-$10");
    });

    it("generates code for legacy fixed_amount type", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        type: "fixed_amount",
        value: 50,
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-$50");
    });

    it("rounds fixed amount values", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FIXED_AMOUNT",
        value: 19.99,
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-$20");
    });

    it("uses custom prefix for fixed amount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FIXED_AMOUNT",
        value: 25,
        prefix: "SAVE",
      };
      expect(generatePreviewDiscountCode(config)).toBe("SAVE-$25");
    });
  });

  describe("Free Shipping Discounts", () => {
    it("generates code for free shipping discount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FREE_SHIPPING",
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-FREESHIP");
    });

    it("generates code for legacy free_shipping type", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        type: "free_shipping",
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-FREESHIP");
    });

    it("uses custom prefix for free shipping", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FREE_SHIPPING",
        prefix: "SHIP",
      };
      expect(generatePreviewDiscountCode(config)).toBe("SHIP-FREESHIP");
    });
  });

  describe("Edge Cases", () => {
    it("returns undefined when discount is explicitly disabled", () => {
      const config: PreviewDiscountConfig = {
        enabled: false,
        valueType: "PERCENTAGE",
        value: 10,
      };
      expect(generatePreviewDiscountCode(config)).toBeUndefined();
    });

    it("returns generic code when no config provided", () => {
      expect(generatePreviewDiscountCode(null)).toBe("PREVIEW-SAVE");
      expect(generatePreviewDiscountCode(undefined)).toBe("PREVIEW-SAVE");
    });

    it("returns generic code when config is empty object", () => {
      expect(generatePreviewDiscountCode({})).toBe("PREVIEW-SAVE");
    });

    it("handles value without type by assuming percentage", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        value: 30,
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-30OFF");
    });

    it("defaults to 10% when percentage type but no value", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-10OFF");
    });

    it("defaults to $10 when fixed amount type but no value", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FIXED_AMOUNT",
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-$10");
    });
  });
});

describe("isPreviewCampaign", () => {
  it("returns true for preview campaign IDs", () => {
    expect(isPreviewCampaign("preview-abc123")).toBe(true);
    expect(isPreviewCampaign("preview-abc123def456ghi789")).toBe(true);
  });

  it("returns false for regular campaign IDs", () => {
    expect(isPreviewCampaign("cuid123abc")).toBe(false);
    expect(isPreviewCampaign("campaign-123")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isPreviewCampaign(null)).toBe(false);
    expect(isPreviewCampaign(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isPreviewCampaign("")).toBe(false);
  });
});

describe("Template-Specific Preview Codes", () => {
  describe("Newsletter Popup", () => {
    it("generates code for typical newsletter discount config", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 10,
        prefix: "WELCOME",
      };
      expect(generatePreviewDiscountCode(config)).toBe("WELCOME-10OFF");
    });

    it("generates code for newsletter with fixed amount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FIXED_AMOUNT",
        value: 5,
        prefix: "SIGNUP",
      };
      expect(generatePreviewDiscountCode(config)).toBe("SIGNUP-$5");
    });
  });

  describe("Flash Sale Popup", () => {
    it("generates code for flash sale with high percentage", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 30,
        prefix: "FLASH30",
      };
      expect(generatePreviewDiscountCode(config)).toBe("FLASH30-30OFF");
    });

    it("generates code for flash sale with fixed discount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FIXED_AMOUNT",
        value: 50,
        prefix: "FLASH",
      };
      expect(generatePreviewDiscountCode(config)).toBe("FLASH-$50");
    });
  });

  describe("Spin-to-Win Popup", () => {
    it("generates code for spin-to-win 10% segment", () => {
      const segmentConfig: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 10,
      };
      expect(generatePreviewDiscountCode(segmentConfig)).toBe("PREVIEW-10OFF");
    });

    it("generates code for spin-to-win 15% segment", () => {
      const segmentConfig: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 15,
      };
      expect(generatePreviewDiscountCode(segmentConfig)).toBe("PREVIEW-15OFF");
    });

    it("generates code for spin-to-win 20% segment", () => {
      const segmentConfig: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 20,
      };
      expect(generatePreviewDiscountCode(segmentConfig)).toBe("PREVIEW-20OFF");
    });

    it("generates code for spin-to-win free shipping segment", () => {
      const segmentConfig: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FREE_SHIPPING",
      };
      expect(generatePreviewDiscountCode(segmentConfig)).toBe("PREVIEW-FREESHIP");
    });

    it('returns undefined for "Try Again" segment (no discount)', () => {
      const segmentConfig: PreviewDiscountConfig = {
        enabled: false,
      };
      expect(generatePreviewDiscountCode(segmentConfig)).toBeUndefined();
    });
  });

  describe("Scratch Card Popup", () => {
    it("generates code for scratch card prize", () => {
      const prizeConfig: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 15,
      };
      expect(generatePreviewDiscountCode(prizeConfig)).toBe("PREVIEW-15OFF");
    });

    it("generates code for scratch card with custom prefix", () => {
      const prizeConfig: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 20,
        prefix: "SCRATCH",
      };
      expect(generatePreviewDiscountCode(prizeConfig)).toBe("SCRATCH-20OFF");
    });
  });

  describe("Free Shipping Bar/Popup", () => {
    it("generates code for free shipping threshold popup", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FREE_SHIPPING",
        prefix: "FREESHIP",
      };
      expect(generatePreviewDiscountCode(config)).toBe("FREESHIP-FREESHIP");
    });

    it("generates code with default prefix", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FREE_SHIPPING",
      };
      expect(generatePreviewDiscountCode(config)).toBe("PREVIEW-FREESHIP");
    });
  });

  describe("Cart Abandonment Popup", () => {
    it("generates code for cart abandonment discount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 10,
        prefix: "COMEBACK",
      };
      expect(generatePreviewDiscountCode(config)).toBe("COMEBACK-10OFF");
    });

    it("generates code for cart abandonment with free shipping", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "FREE_SHIPPING",
        prefix: "CART",
      };
      expect(generatePreviewDiscountCode(config)).toBe("CART-FREESHIP");
    });
  });

  describe("Product Upsell Popup", () => {
    it("generates code for bundle discount", () => {
      const config: PreviewDiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 15,
        prefix: "BUNDLE",
      };
      expect(generatePreviewDiscountCode(config)).toBe("BUNDLE-15OFF");
    });
  });
});
