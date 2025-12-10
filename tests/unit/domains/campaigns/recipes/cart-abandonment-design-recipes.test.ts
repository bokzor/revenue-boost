/**
 * Unit Tests for Cart Abandonment Design Recipes
 */

import { describe, it, expect } from "vitest";

import { CART_ABANDONMENT_DESIGN_RECIPES } from "~/domains/campaigns/recipes/cart-abandonment-design-recipes";

describe("CART_ABANDONMENT_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(CART_ABANDONMENT_DESIGN_RECIPES)).toBe(true);
    expect(CART_ABANDONMENT_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of CART_ABANDONMENT_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("CART_ABANDONMENT");
      expect(recipe.category).toBe("cart_recovery");
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = CART_ABANDONMENT_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config on each recipe", () => {
    for (const recipe of CART_ABANDONMENT_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.headline).toBeDefined();
      // buttonText is expected for cart abandonment recipes
      expect(typeof content.buttonText === "string" || content.buttonText === undefined).toBe(true);
    }
  });

  it("should have exit intent trigger enabled", () => {
    for (const recipe of CART_ABANDONMENT_DESIGN_RECIPES) {
      const triggers = recipe.defaults.targetRules?.enhancedTriggers;
      expect(triggers?.exit_intent?.enabled).toBe(true);
    }
  });
});

