/**
 * Unit Tests for CTA Types
 */

import { describe, it, expect } from "vitest";

import {
  CTAActionSchema,
  CTAConfigSchema,
  SecondaryCTAConfigSchema,
  SuccessBehaviorSchema,
  CTA_ACTION_OPTIONS,
  getCTAActionOption,
  validateCTAConfig,
  buildCTADestinationUrl,
  DEFAULT_CTA_CONFIGS,
} from "~/domains/campaigns/types/cta";

describe("CTAActionSchema", () => {
  it("should validate valid action types", () => {
    expect(CTAActionSchema.parse("navigate_url")).toBe("navigate_url");
    expect(CTAActionSchema.parse("navigate_product")).toBe("navigate_product");
    expect(CTAActionSchema.parse("navigate_collection")).toBe("navigate_collection");
    expect(CTAActionSchema.parse("add_to_cart")).toBe("add_to_cart");
    expect(CTAActionSchema.parse("add_to_cart_checkout")).toBe("add_to_cart_checkout");
  });

  it("should reject invalid action types", () => {
    expect(() => CTAActionSchema.parse("invalid")).toThrow();
  });
});

describe("CTAConfigSchema", () => {
  it("should validate minimal config", () => {
    const config = {
      label: "Shop Now",
      action: "navigate_url",
      url: "https://example.com",
    };
    const result = CTAConfigSchema.parse(config);
    expect(result.label).toBe("Shop Now");
    expect(result.action).toBe("navigate_url");
  });

  it("should apply defaults", () => {
    const config = {
      label: "Shop Now",
      action: "navigate_url",
    };
    const result = CTAConfigSchema.parse(config);
    expect(result.variant).toBe("primary");
    expect(result.openInNewTab).toBe(false);
    expect(result.quantity).toBe(1);
  });

  it("should reject empty label", () => {
    const config = {
      label: "",
      action: "navigate_url",
    };
    expect(() => CTAConfigSchema.parse(config)).toThrow();
  });
});

describe("SuccessBehaviorSchema", () => {
  it("should validate success behavior", () => {
    const behavior = {
      showDiscountCode: true,
      autoCloseDelay: 5,
    };
    const result = SuccessBehaviorSchema.parse(behavior);
    expect(result.showDiscountCode).toBe(true);
    expect(result.autoCloseDelay).toBe(5);
  });

  it("should validate with secondary action", () => {
    const behavior = {
      secondaryAction: {
        label: "Continue Shopping",
        url: "/collections/all",
      },
    };
    const result = SuccessBehaviorSchema.parse(behavior);
    expect(result.secondaryAction?.label).toBe("Continue Shopping");
  });
});

describe("CTA_ACTION_OPTIONS", () => {
  it("should have all action types", () => {
    const actionValues = CTA_ACTION_OPTIONS.map((opt) => opt.value);
    expect(actionValues).toContain("navigate_url");
    expect(actionValues).toContain("navigate_product");
    expect(actionValues).toContain("navigate_collection");
    expect(actionValues).toContain("add_to_cart");
    expect(actionValues).toContain("add_to_cart_checkout");
  });

  it("should have labels and descriptions", () => {
    for (const option of CTA_ACTION_OPTIONS) {
      expect(option.label).toBeDefined();
      expect(option.description).toBeDefined();
    }
  });
});

describe("getCTAActionOption", () => {
  it("should return option for valid action", () => {
    const option = getCTAActionOption("navigate_url");
    expect(option).toBeDefined();
    expect(option?.value).toBe("navigate_url");
  });

  it("should return undefined for invalid action", () => {
    const option = getCTAActionOption("invalid" as any);
    expect(option).toBeUndefined();
  });
});

describe("validateCTAConfig", () => {
  it("should return no errors for valid config", () => {
    const config = {
      label: "Shop Now",
      action: "navigate_url" as const,
      url: "https://example.com",
      variant: "primary" as const,
      openInNewTab: false,
      quantity: 1,
    };
    const errors = validateCTAConfig(config);
    expect(errors).toEqual([]);
  });

  it("should return error for missing URL", () => {
    const config = {
      label: "Shop Now",
      action: "navigate_url" as const,
      variant: "primary" as const,
      openInNewTab: false,
      quantity: 1,
    };
    const errors = validateCTAConfig(config);
    expect(errors).toContain("URL is required for this action");
  });
});

describe("buildCTADestinationUrl", () => {
  it("should return URL for navigate_url action", () => {
    const config = {
      label: "Shop",
      action: "navigate_url" as const,
      url: "https://example.com",
      variant: "primary" as const,
      openInNewTab: false,
      quantity: 1,
    };
    expect(buildCTADestinationUrl(config)).toBe("https://example.com");
  });

  it("should return product URL for navigate_product action", () => {
    const config = {
      label: "View",
      action: "navigate_product" as const,
      productHandle: "test-product",
      variant: "primary" as const,
      openInNewTab: false,
      quantity: 1,
    };
    expect(buildCTADestinationUrl(config)).toBe("/products/test-product");
  });
});

