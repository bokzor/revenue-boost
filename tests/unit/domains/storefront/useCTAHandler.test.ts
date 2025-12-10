/**
 * Unit Tests: CTA Helper Functions
 *
 * Tests for CTA utility functions (not the hook itself, which requires full React setup)
 */

import { describe, it, expect } from "vitest";

// Test the helper functions directly (extracted logic)
describe("CTA Label Logic", () => {
  // Helper function that mirrors the hook's getCtaLabel logic
  function getCtaLabel(options: {
    cta?: { label: string; action: string };
    buttonText?: string;
    hasExpired?: boolean;
    isSoldOut?: boolean;
    isClaimingDiscount?: boolean;
    hasClaimedDiscount?: boolean;
  }): string {
    const { cta, buttonText, hasExpired, isSoldOut, isClaimingDiscount, hasClaimedDiscount } = options;
    const baseLabel = cta?.label || buttonText || "Shop Now";

    if (hasExpired || isSoldOut) return "Offer unavailable";
    if (isClaimingDiscount) return "Applying...";
    if (hasClaimedDiscount && cta?.action && cta.action !== "add_to_cart") return "Shop Now";
    return baseLabel;
  }

  it("returns custom label from cta config", () => {
    const label = getCtaLabel({
      cta: { label: "Get My Deal", action: "navigate_collection" },
    });
    expect(label).toBe("Get My Deal");
  });

  it("falls back to buttonText when no cta", () => {
    const label = getCtaLabel({
      buttonText: "Legacy Button",
    });
    expect(label).toBe("Legacy Button");
  });

  it("defaults to 'Shop Now' when no label provided", () => {
    const label = getCtaLabel({});
    expect(label).toBe("Shop Now");
  });

  it("returns 'Offer unavailable' when expired", () => {
    const label = getCtaLabel({
      cta: { label: "Shop Now", action: "navigate_collection" },
      hasExpired: true,
    });
    expect(label).toBe("Offer unavailable");
  });

  it("returns 'Offer unavailable' when sold out", () => {
    const label = getCtaLabel({
      cta: { label: "Shop Now", action: "navigate_collection" },
      isSoldOut: true,
    });
    expect(label).toBe("Offer unavailable");
  });

  it("returns 'Applying...' when claiming discount", () => {
    const label = getCtaLabel({
      cta: { label: "Claim Discount", action: "navigate_collection" },
      isClaimingDiscount: true,
    });
    expect(label).toBe("Applying...");
  });

  it("returns 'Shop Now' after discount claimed for navigation actions", () => {
    const label = getCtaLabel({
      cta: { label: "Get Discount", action: "navigate_collection" },
      hasClaimedDiscount: true,
    });
    expect(label).toBe("Shop Now");
  });

  it("keeps original label after discount claimed for add_to_cart", () => {
    const label = getCtaLabel({
      cta: { label: "Add to Cart", action: "add_to_cart" },
      hasClaimedDiscount: true,
    });
    expect(label).toBe("Add to Cart");
  });
});

describe("Secondary CTA Label Logic", () => {
  function getSecondaryCtaLabel(options: {
    secondaryCta?: { label: string; action: string };
    dismissLabel?: string;
  }): string {
    return options.secondaryCta?.label || options.dismissLabel || "No thanks";
  }

  it("returns label from secondaryCta config", () => {
    const label = getSecondaryCtaLabel({
      secondaryCta: { label: "Maybe later", action: "dismiss" },
    });
    expect(label).toBe("Maybe later");
  });

  it("falls back to dismissLabel", () => {
    const label = getSecondaryCtaLabel({
      dismissLabel: "Not now",
    });
    expect(label).toBe("Not now");
  });

  it("defaults to 'No thanks'", () => {
    const label = getSecondaryCtaLabel({});
    expect(label).toBe("No thanks");
  });
});

describe("CTA Destination URL Logic", () => {
  // Helper function that mirrors buildDestinationUrl
  function buildDestinationUrl(cta: {
    action: string;
    url?: string;
    productHandle?: string;
    collectionHandle?: string;
  }): string | null {
    switch (cta.action) {
      case "navigate_url":
        return cta.url || null;
      case "navigate_product":
        return `/products/${cta.productHandle || "all"}`;
      case "navigate_collection":
        return `/collections/${cta.collectionHandle || "all"}`;
      case "add_to_cart_checkout":
        return "/checkout";
      case "add_to_cart":
        return null;
      default:
        return null;
    }
  }

  it("builds collection URL with handle", () => {
    const url = buildDestinationUrl({
      action: "navigate_collection",
      collectionHandle: "summer-sale",
    });
    expect(url).toBe("/collections/summer-sale");
  });

  it("falls back to /collections/all when no handle", () => {
    const url = buildDestinationUrl({
      action: "navigate_collection",
    });
    expect(url).toBe("/collections/all");
  });

  it("builds product URL with handle", () => {
    const url = buildDestinationUrl({
      action: "navigate_product",
      productHandle: "awesome-shirt",
    });
    expect(url).toBe("/products/awesome-shirt");
  });

  it("returns custom URL for navigate_url", () => {
    const url = buildDestinationUrl({
      action: "navigate_url",
      url: "https://example.com/promo",
    });
    expect(url).toBe("https://example.com/promo");
  });

  it("returns /checkout for add_to_cart_checkout", () => {
    const url = buildDestinationUrl({
      action: "add_to_cart_checkout",
    });
    expect(url).toBe("/checkout");
  });

  it("returns null for add_to_cart (no navigation)", () => {
    const url = buildDestinationUrl({
      action: "add_to_cart",
    });
    expect(url).toBeNull();
  });
});

