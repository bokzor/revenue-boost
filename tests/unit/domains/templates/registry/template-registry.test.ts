/**
 * Unit Tests for Template Registry
 */

import { describe, it, expect } from "vitest";

import {
  TEMPLATE_REGISTRY,
  getTemplateMetadata,
  getContentSchemaForTemplate,
  getTemplateLabel,
  getAllTemplateTypes,
  getTemplatesByCategory,
  getTemplateOptions,
  templateRequiresDiscount,
  templateRequiresProduct,
  getDefaultButtonText,
} from "~/domains/templates/registry/template-registry";

describe("TEMPLATE_REGISTRY", () => {
  it("should contain all expected template types", () => {
    const expectedTypes = [
      "NEWSLETTER",
      "SPIN_TO_WIN",
      "FLASH_SALE",
      "FREE_SHIPPING",
      "EXIT_INTENT",
      "CART_ABANDONMENT",
      "PRODUCT_UPSELL",
      "SOCIAL_PROOF",
      "COUNTDOWN_TIMER",
      "SCRATCH_CARD",
      "ANNOUNCEMENT",
    ];

    for (const type of expectedTypes) {
      expect(TEMPLATE_REGISTRY).toHaveProperty(type);
    }
  });

  it("should have required metadata for each template", () => {
    for (const [type, metadata] of Object.entries(TEMPLATE_REGISTRY)) {
      expect(metadata.type).toBe(type);
      expect(metadata.label).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.category).toBeDefined();
      expect(metadata.contentSchema).toBeDefined();
    }
  });
});

describe("getTemplateMetadata", () => {
  it("should return metadata for valid template type", () => {
    const metadata = getTemplateMetadata("NEWSLETTER");

    expect(metadata.type).toBe("NEWSLETTER");
    expect(metadata.label).toBe("Newsletter");
    expect(metadata.category).toBe("Lead Generation");
  });

  it("should return metadata for gamification templates", () => {
    const spinMetadata = getTemplateMetadata("SPIN_TO_WIN");
    const scratchMetadata = getTemplateMetadata("SCRATCH_CARD");

    expect(spinMetadata.category).toBe("Gamification");
    expect(scratchMetadata.category).toBe("Gamification");
  });
});

describe("getContentSchemaForTemplate", () => {
  it("should return content schema for template type", () => {
    const schema = getContentSchemaForTemplate("NEWSLETTER");

    expect(schema).toBeDefined();
    expect(typeof schema.parse).toBe("function");
  });

  it("should return base schema for undefined template type", () => {
    const schema = getContentSchemaForTemplate(undefined);

    expect(schema).toBeDefined();
  });
});

describe("getTemplateLabel", () => {
  it("should return human-readable label", () => {
    expect(getTemplateLabel("NEWSLETTER")).toBe("Newsletter");
    expect(getTemplateLabel("SPIN_TO_WIN")).toBe("Spin to Win");
    expect(getTemplateLabel("CART_ABANDONMENT")).toBe("Cart Abandonment");
  });
});

describe("getAllTemplateTypes", () => {
  it("should return array of all template types", () => {
    const types = getAllTemplateTypes();

    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(10);
    expect(types).toContain("NEWSLETTER");
    expect(types).toContain("SPIN_TO_WIN");
  });
});

describe("getTemplatesByCategory", () => {
  it("should return templates in Lead Generation category", () => {
    const templates = getTemplatesByCategory("Lead Generation");

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((t) => t.type === "NEWSLETTER")).toBe(true);
  });

  it("should return templates in Gamification category", () => {
    const templates = getTemplatesByCategory("Gamification");

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some((t) => t.type === "SPIN_TO_WIN")).toBe(true);
  });

  it("should return empty array for unknown category", () => {
    const templates = getTemplatesByCategory("Unknown Category");

    expect(templates).toEqual([]);
  });
});

describe("getTemplateOptions", () => {
  it("should return options for dropdown", () => {
    const options = getTemplateOptions();

    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty("label");
    expect(options[0]).toHaveProperty("value");
  });
});

describe("templateRequiresDiscount", () => {
  it("should return true for discount-requiring templates", () => {
    expect(templateRequiresDiscount("SPIN_TO_WIN")).toBe(true);
    expect(templateRequiresDiscount("FLASH_SALE")).toBe(true);
    expect(templateRequiresDiscount("SCRATCH_CARD")).toBe(true);
  });

  it("should return false for non-discount templates", () => {
    expect(templateRequiresDiscount("NEWSLETTER")).toBe(false);
    expect(templateRequiresDiscount("ANNOUNCEMENT")).toBe(false);
  });
});

describe("templateRequiresProduct", () => {
  it("should return true for product-requiring templates", () => {
    expect(templateRequiresProduct("PRODUCT_UPSELL")).toBe(true);
  });

  it("should return false for non-product templates", () => {
    expect(templateRequiresProduct("NEWSLETTER")).toBe(false);
    expect(templateRequiresProduct("FLASH_SALE")).toBe(false);
  });
});

describe("getDefaultButtonText", () => {
  it("should return appropriate button text for each template", () => {
    expect(getDefaultButtonText("NEWSLETTER")).toBe("Subscribe");
    expect(getDefaultButtonText("SPIN_TO_WIN")).toBe("Spin Now");
    expect(getDefaultButtonText("FLASH_SALE")).toBe("Shop Now");
    expect(getDefaultButtonText("CART_ABANDONMENT")).toBe("Return to Cart");
    expect(getDefaultButtonText("PRODUCT_UPSELL")).toBe("Add to Cart");
  });
});

