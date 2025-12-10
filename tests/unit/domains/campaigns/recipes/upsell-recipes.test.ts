/**
 * Unit Tests for Upsell Recipes
 */

import { describe, it, expect } from "vitest";

import {
  UPSELL_RECIPES,
  UPSELL_EDITABLE_FIELDS,
} from "~/domains/campaigns/recipes/upsell-recipes";

describe("UPSELL_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(UPSELL_RECIPES)).toBe(true);
    expect(UPSELL_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of UPSELL_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBeDefined();
      expect(recipe.category).toBeDefined();
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = UPSELL_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config on each recipe", () => {
    for (const recipe of UPSELL_RECIPES) {
      const content = recipe.defaults.contentConfig;
      // Content config should exist
      expect(content).toBeDefined();
    }
  });

  it("should have discount config on each recipe", () => {
    for (const recipe of UPSELL_RECIPES) {
      const discount = recipe.defaults.discountConfig;
      expect(discount).toBeDefined();
      expect(discount?.enabled).toBe(true);
    }
  });

  it("should have upsell-related template types", () => {
    const validTemplateTypes = [
      "PRODUCT_UPSELL",
      "CLASSIC_UPSELL",
      "MINIMAL_SLIDE_UP",
      "PREMIUM_FULLSCREEN",
      "COUNTDOWN_URGENCY",
    ];
    for (const recipe of UPSELL_RECIPES) {
      expect(validTemplateTypes).toContain(recipe.templateType);
    }
  });
});

describe("UPSELL_EDITABLE_FIELDS", () => {
  it("should have editable fields defined", () => {
    expect(Array.isArray(UPSELL_EDITABLE_FIELDS)).toBe(true);
    expect(UPSELL_EDITABLE_FIELDS.length).toBeGreaterThan(0);
  });

  it("should have required properties on each field", () => {
    for (const field of UPSELL_EDITABLE_FIELDS) {
      expect(field.key).toBeDefined();
      expect(field.type).toBeDefined();
      expect(field.label).toBeDefined();
    }
  });

  it("should include headline field", () => {
    const headlineField = UPSELL_EDITABLE_FIELDS.find((f) => f.key === "headline");
    expect(headlineField).toBeDefined();
    expect(headlineField?.type).toBe("text");
  });
});

