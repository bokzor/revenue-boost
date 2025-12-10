/**
 * Unit Tests for Scratch Card Design Recipes
 */

import { describe, it, expect } from "vitest";

import { SCRATCH_CARD_DESIGN_RECIPES } from "~/domains/campaigns/recipes/scratch-card-design-recipes";

describe("SCRATCH_CARD_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(SCRATCH_CARD_DESIGN_RECIPES)).toBe(true);
    expect(SCRATCH_CARD_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of SCRATCH_CARD_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("SCRATCH_CARD");
      expect(recipe.category).toBe("email_leads");
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = SCRATCH_CARD_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config on each recipe", () => {
    for (const recipe of SCRATCH_CARD_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.headline).toBeDefined();
      expect(content.scratchInstruction).toBeDefined();
    }
  });

  it("should have discount config on most recipes", () => {
    // Most scratch card recipes should have discount config
    const recipesWithDiscount = SCRATCH_CARD_DESIGN_RECIPES.filter(
      (r) => r.defaults.discountConfig?.enabled
    );
    expect(recipesWithDiscount.length).toBeGreaterThan(0);
  });
});

