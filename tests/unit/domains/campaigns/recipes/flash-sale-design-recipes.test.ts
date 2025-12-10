/**
 * Unit Tests for Flash Sale Design Recipes
 */

import { describe, it, expect } from "vitest";

import {
  FLASH_SALE_DESIGN_RECIPES,
  USE_CASE_RECIPES,
  SEASONAL_RECIPES,
} from "~/domains/campaigns/recipes/flash-sale-design-recipes";

describe("FLASH_SALE_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(FLASH_SALE_DESIGN_RECIPES)).toBe(true);
    expect(FLASH_SALE_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of FLASH_SALE_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("FLASH_SALE");
      expect(recipe.category).toBe("sales_promos");
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = FLASH_SALE_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config on each recipe", () => {
    for (const recipe of FLASH_SALE_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.headline).toBeDefined();
      // buttonText may be optional for some flash sale recipes
    }
  });
});

describe("USE_CASE_RECIPES", () => {
  it("should have use case recipes defined", () => {
    expect(Array.isArray(USE_CASE_RECIPES)).toBe(true);
    expect(USE_CASE_RECIPES.length).toBeGreaterThan(0);
  });

  it("should all be flash sale template type", () => {
    for (const recipe of USE_CASE_RECIPES) {
      expect(recipe.templateType).toBe("FLASH_SALE");
    }
  });
});

describe("SEASONAL_RECIPES", () => {
  it("should have seasonal recipes defined", () => {
    expect(Array.isArray(SEASONAL_RECIPES)).toBe(true);
    expect(SEASONAL_RECIPES.length).toBeGreaterThan(0);
  });

  it("should all be flash sale template type", () => {
    for (const recipe of SEASONAL_RECIPES) {
      expect(recipe.templateType).toBe("FLASH_SALE");
    }
  });

  it("should have seasonal tag on each recipe", () => {
    for (const recipe of SEASONAL_RECIPES) {
      expect(recipe.seasonal).toBe(true);
    }
  });
});

describe("Combined recipes", () => {
  it("should combine use case and seasonal recipes", () => {
    expect(FLASH_SALE_DESIGN_RECIPES.length).toBe(
      USE_CASE_RECIPES.length + SEASONAL_RECIPES.length
    );
  });
});

