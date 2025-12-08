/**
 * Unit Tests: CTA (Call-to-Action) System
 *
 * Tests for:
 * - CTA schema validation
 * - CTA action options
 * - URL building helpers
 */

import { describe, it, expect } from "vitest";
import {
  CTAConfigSchema,
  CTA_ACTION_OPTIONS,
  getCTAActionOption,
  buildCTADestinationUrl,
  DEFAULT_CTA_CONFIGS,
  type CTAConfig,
} from "~/domains/campaigns/types/cta";

describe("CTA Schema Validation", () => {
  it("validates a minimal CTA config", () => {
    const config = {
      label: "Shop Now",
      action: "navigate_collection",
    };

    const result = CTAConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.label).toBe("Shop Now");
      expect(result.data.action).toBe("navigate_collection");
    }
  });

  it("validates a full CTA config with all fields", () => {
    const config: CTAConfig = {
      label: "Get My BOGO Deal",
      action: "add_to_cart_checkout",
      variant: "primary",
      productId: "gid://shopify/Product/123",
      productHandle: "test-product",
      variantId: "gid://shopify/ProductVariant/456",
      quantity: 2,
      applyDiscountFirst: true,
      openInNewTab: false,
    };

    const result = CTAConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variantId).toBe("gid://shopify/ProductVariant/456");
      expect(result.data.quantity).toBe(2);
    }
  });

  it("rejects empty label", () => {
    const config = {
      label: "",
      action: "navigate_collection",
    };

    const result = CTAConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("rejects invalid action", () => {
    const config = {
      label: "Shop Now",
      action: "invalid_action",
    };

    const result = CTAConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it("applies default values", () => {
    const config = {
      label: "Click Me",
      action: "navigate_url",
    };

    const result = CTAConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
      // applyDiscountFirst is now optional (deprecated in favor of successBehavior)
      expect(result.data.applyDiscountFirst).toBeUndefined();
      expect(result.data.openInNewTab).toBe(false);
    }
  });
});

describe("CTA Action Options", () => {
  it("has all expected action types", () => {
    const actionValues = CTA_ACTION_OPTIONS.map((opt) => opt.value);
    expect(actionValues).toContain("navigate_url");
    expect(actionValues).toContain("navigate_product");
    expect(actionValues).toContain("navigate_collection");
    expect(actionValues).toContain("add_to_cart");
    expect(actionValues).toContain("add_to_cart_checkout");
  });

  it("getCTAActionOption returns correct option", () => {
    const option = getCTAActionOption("add_to_cart_checkout");
    expect(option).toBeDefined();
    expect(option?.label).toBe("Add to Cart + Checkout");
    expect(option?.requiresVariant).toBe(true);
  });

  it("getCTAActionOption returns undefined for invalid action", () => {
    const option = getCTAActionOption("invalid" as any);
    expect(option).toBeUndefined();
  });

  it("navigate_collection requires collection", () => {
    const option = getCTAActionOption("navigate_collection");
    expect(option?.requiresCollection).toBe(true);
    expect(option?.requiresProduct).toBeFalsy();
    expect(option?.requiresVariant).toBeFalsy();
  });

  it("add_to_cart requires variant", () => {
    const option = getCTAActionOption("add_to_cart");
    expect(option?.requiresVariant).toBe(true);
    expect(option?.requiresCollection).toBeFalsy();
  });
});

describe("buildCTADestinationUrl", () => {
  // Helper to create a valid CTAConfig from partial input
  const makeConfig = (partial: Partial<CTAConfig>): CTAConfig => ({
    label: "Default",
    action: "navigate_collection",
    variant: "primary",
    openInNewTab: false,
    quantity: 1,
    applyDiscountFirst: true,
    ...partial,
  });

  it("builds collection URL", () => {
    const config = makeConfig({
      label: "Shop",
      action: "navigate_collection",
      collectionHandle: "summer-sale",
    });

    const url = buildCTADestinationUrl(config);
    expect(url).toBe("/collections/summer-sale");
  });

  it("builds product URL", () => {
    const config = makeConfig({
      label: "View",
      action: "navigate_product",
      productHandle: "awesome-shirt",
    });

    const url = buildCTADestinationUrl(config);
    expect(url).toBe("/products/awesome-shirt");
  });

  it("builds custom URL", () => {
    const config = makeConfig({
      label: "Go",
      action: "navigate_url",
      url: "https://example.com/promo",
    });

    const url = buildCTADestinationUrl(config);
    expect(url).toBe("https://example.com/promo");
  });

  it("returns null for add_to_cart (no navigation)", () => {
    const config = makeConfig({
      label: "Add",
      action: "add_to_cart",
      variantId: "gid://shopify/ProductVariant/123",
    });

    const url = buildCTADestinationUrl(config);
    expect(url).toBeNull();
  });

  it("returns checkout URL for add_to_cart_checkout", () => {
    const config = makeConfig({
      label: "Buy Now",
      action: "add_to_cart_checkout",
      variantId: "gid://shopify/ProductVariant/123",
    });

    const url = buildCTADestinationUrl(config);
    expect(url).toBe("/checkout");
  });

  it("returns null when handle is missing (admin schema)", () => {
    // Note: The admin schema returns null when handle is missing
    // The storefront useCTAHandler falls back to "all" for safety
    const config = makeConfig({
      label: "Shop",
      action: "navigate_collection",
      // Missing collectionHandle
    });

    const url = buildCTADestinationUrl(config);
    expect(url).toBeNull();
  });
});

