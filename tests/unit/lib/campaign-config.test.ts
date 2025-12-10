/**
 * Unit Tests for Campaign Configuration
 */

import { describe, it, expect } from "vitest";

import { deriveInitialConfig } from "~/lib/campaign-config";

describe("deriveInitialConfig", () => {
  it("should return empty object for empty wizard state", () => {
    const result = deriveInitialConfig({});
    expect(result).toEqual({});
  });

  it("should map headline to title", () => {
    const result = deriveInitialConfig({
      contentConfig: {
        headline: "Welcome!",
      },
    });

    expect(result.title).toBe("Welcome!");
    expect(result.headline).toBe("Welcome!");
  });

  it("should map subheadline to description", () => {
    const result = deriveInitialConfig({
      contentConfig: {
        subheadline: "Get 10% off",
      },
    });

    expect(result.description).toBe("Get 10% off");
  });

  it("should map ctaText to buttonText", () => {
    const result = deriveInitialConfig({
      contentConfig: {
        ctaText: "Shop Now",
      },
    });

    expect(result.buttonText).toBe("Shop Now");
  });

  it("should map ctaLabel to buttonText if ctaText is not present", () => {
    const result = deriveInitialConfig({
      contentConfig: {
        ctaLabel: "Subscribe",
      },
    });

    expect(result.buttonText).toBe("Subscribe");
  });

  it("should map discount configuration", () => {
    const result = deriveInitialConfig({
      discountConfig: {
        enabled: true,
        prefix: "SAVE",
        value: 20,
        valueType: "PERCENTAGE",
      },
    });

    expect(result.discountEnabled).toBe(true);
    expect(result.discountCode).toBe("SAVE20");
    expect(result.discountValue).toBe(20);
    expect(result.discountType).toBe("percentage");
    expect(result.discountPercentage).toBe(20);
  });

  it("should include popup design from designConfig", () => {
    const result = deriveInitialConfig({
      designConfig: {
        popupDesign: {
          backgroundColor: "#FFFFFF",
          textColor: "#000000",
        },
      },
    });

    expect(result.backgroundColor).toBe("#FFFFFF");
    expect(result.textColor).toBe("#000000");
  });

  it("should handle disabled discount", () => {
    const result = deriveInitialConfig({
      discountConfig: {
        enabled: false,
      },
    });

    expect(result.discountEnabled).toBe(false);
  });

  it("should not include discountCode if prefix or value is missing", () => {
    const result = deriveInitialConfig({
      discountConfig: {
        enabled: true,
        prefix: "SAVE",
        // value is missing
      },
    });

    expect(result.discountCode).toBeUndefined();
  });
});

