/**
 * Unit Tests for Styled Recipe Catalog
 */

import { describe, it, expect } from "vitest";

import {
  STYLED_RECIPES,
  getStyledRecipeById,
  getStyledRecipesByCategory,
  getStyledRecipesByTag,
  getFeaturedStyledRecipes,
  getSeasonalStyledRecipes,
  getRecipeCountByCategory,
  getStyledRecipesWithBuild,
  getAllRecipeTags,
} from "~/domains/campaigns/recipes/styled-recipe-catalog";

describe("STYLED_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(STYLED_RECIPES)).toBe(true);
    expect(STYLED_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of STYLED_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBeDefined();
      expect(recipe.category).toBeDefined();
      expect(recipe.layout).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = STYLED_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("getStyledRecipeById", () => {
  it("should return recipe when found", () => {
    const firstRecipe = STYLED_RECIPES[0];
    const found = getStyledRecipeById(firstRecipe.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(firstRecipe.id);
  });

  it("should return undefined for non-existent ID", () => {
    const found = getStyledRecipeById("non-existent-id");
    expect(found).toBeUndefined();
  });
});

describe("getStyledRecipesByCategory", () => {
  it("should filter recipes by category", () => {
    const emailLeadsRecipes = getStyledRecipesByCategory("email_leads");

    expect(Array.isArray(emailLeadsRecipes)).toBe(true);
    for (const recipe of emailLeadsRecipes) {
      expect(recipe.category).toBe("email_leads");
    }
  });

  it("should return empty array for non-existent category", () => {
    const recipes = getStyledRecipesByCategory("non_existent" as any);
    expect(recipes).toEqual([]);
  });
});

describe("getStyledRecipesByTag", () => {
  it("should filter recipes by tag", () => {
    const minimalRecipes = getStyledRecipesByTag("minimal");

    expect(Array.isArray(minimalRecipes)).toBe(true);
    for (const recipe of minimalRecipes) {
      expect(recipe.tags).toContain("minimal");
    }
  });
});

describe("getFeaturedStyledRecipes", () => {
  it("should return only featured recipes", () => {
    const featured = getFeaturedStyledRecipes();

    expect(Array.isArray(featured)).toBe(true);
    for (const recipe of featured) {
      expect(recipe.featured).toBe(true);
    }
  });
});

describe("getSeasonalStyledRecipes", () => {
  it("should return only seasonal recipes", () => {
    const seasonal = getSeasonalStyledRecipes();

    expect(Array.isArray(seasonal)).toBe(true);
    for (const recipe of seasonal) {
      expect(recipe.seasonal).toBe(true);
    }
  });
});

describe("getRecipeCountByCategory", () => {
  it("should return counts for all categories", () => {
    const counts = getRecipeCountByCategory();

    expect(counts).toHaveProperty("email_leads");
    expect(counts).toHaveProperty("sales_promos");
    expect(counts).toHaveProperty("cart_recovery");
    expect(counts).toHaveProperty("announcements");
    expect(typeof counts.email_leads).toBe("number");
  });
});

describe("getStyledRecipesWithBuild", () => {
  it("should return recipes with build functions", () => {
    const recipesWithBuild = getStyledRecipesWithBuild();

    expect(recipesWithBuild.length).toBe(STYLED_RECIPES.length);
    for (const recipe of recipesWithBuild) {
      expect(typeof recipe.build).toBe("function");
    }
  });

  it("should build recipe with context", () => {
    const recipesWithBuild = getStyledRecipesWithBuild();
    const firstRecipe = recipesWithBuild[0];
    const output = firstRecipe.build({ headline: "Custom Headline" });

    expect(output).toBeDefined();
    expect(output.contentConfig).toBeDefined();
    expect(output.designConfig).toBeDefined();
  });
});

describe("getAllRecipeTags", () => {
  it("should return unique tags", () => {
    const tags = getAllRecipeTags();

    expect(Array.isArray(tags)).toBe(true);
    const uniqueTags = new Set(tags);
    expect(uniqueTags.size).toBe(tags.length);
  });
});

