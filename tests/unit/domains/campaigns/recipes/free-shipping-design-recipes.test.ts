/**
 * Unit Tests for Free Shipping Design Recipes
 */

import { describe, it, expect } from "vitest";

import { FREE_SHIPPING_DESIGN_RECIPES } from "~/domains/campaigns/recipes/free-shipping-design-recipes";

describe("FREE_SHIPPING_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(FREE_SHIPPING_DESIGN_RECIPES)).toBe(true);
    expect(FREE_SHIPPING_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of FREE_SHIPPING_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("FREE_SHIPPING");
      expect(recipe.category).toBe("cart_recovery");
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = FREE_SHIPPING_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config with threshold", () => {
    for (const recipe of FREE_SHIPPING_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.threshold).toBeDefined();
      expect(typeof content.threshold).toBe("number");
      expect(content.threshold).toBeGreaterThan(0);
    }
  });

  it("should have progress and unlocked messages", () => {
    for (const recipe of FREE_SHIPPING_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.progressMessage).toBeDefined();
      expect(content.unlockedMessage).toBeDefined();
    }
  });
});

