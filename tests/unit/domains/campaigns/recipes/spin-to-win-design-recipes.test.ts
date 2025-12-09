/**
 * Unit Tests for Spin To Win Design Recipes
 */

import { describe, it, expect } from "vitest";

import { SPIN_TO_WIN_DESIGN_RECIPES } from "~/domains/campaigns/recipes/spin-to-win-design-recipes";

describe("SPIN_TO_WIN_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(SPIN_TO_WIN_DESIGN_RECIPES)).toBe(true);
    expect(SPIN_TO_WIN_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of SPIN_TO_WIN_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("SPIN_TO_WIN");
      expect(recipe.category).toBe("email_leads");
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = SPIN_TO_WIN_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config with wheel segments", () => {
    for (const recipe of SPIN_TO_WIN_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.headline).toBeDefined();
      expect(content.wheelSegments).toBeDefined();
      expect(Array.isArray(content.wheelSegments)).toBe(true);
      expect(content.wheelSegments.length).toBeGreaterThan(0);
    }
  });

  it("should have valid wheel segments with required properties", () => {
    for (const recipe of SPIN_TO_WIN_DESIGN_RECIPES) {
      for (const segment of recipe.defaults.contentConfig.wheelSegments) {
        expect(segment.label).toBeDefined();
        expect(typeof segment.probability).toBe("number");
        // Probabilities are stored as decimals (0.0 to 1.0)
        expect(segment.probability).toBeGreaterThanOrEqual(0);
        expect(segment.probability).toBeLessThanOrEqual(1);
      }
    }
  });

  it("should have wheel segment probabilities that sum to 1 (100%)", () => {
    for (const recipe of SPIN_TO_WIN_DESIGN_RECIPES) {
      const totalProbability = recipe.defaults.contentConfig.wheelSegments.reduce(
        (sum, segment) => sum + segment.probability,
        0
      );
      // Probabilities are stored as decimals (0.0 to 1.0)
      expect(totalProbability).toBeCloseTo(1, 2);
    }
  });
});

