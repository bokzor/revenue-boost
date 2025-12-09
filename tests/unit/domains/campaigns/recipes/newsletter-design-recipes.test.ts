/**
 * Unit Tests for Newsletter Design Recipes
 */

import { describe, it, expect } from "vitest";

import {
  NEWSLETTER_DESIGN_RECIPES,
  getNewsletterRecipeById,
  getFeaturedNewsletterRecipes,
  getNewsletterRecipesByTag,
  getNewsletterRecipesByIndustry,
} from "~/domains/campaigns/recipes/newsletter-design-recipes";

describe("NEWSLETTER_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(NEWSLETTER_DESIGN_RECIPES)).toBe(true);
    expect(NEWSLETTER_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of NEWSLETTER_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("NEWSLETTER");
      expect(recipe.category).toBe("email_leads");
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = NEWSLETTER_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config on each recipe", () => {
    for (const recipe of NEWSLETTER_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.headline).toBeDefined();
      expect(content.buttonText).toBeDefined();
    }
  });
});

describe("getNewsletterRecipeById", () => {
  it("should return recipe when found", () => {
    const firstRecipe = NEWSLETTER_DESIGN_RECIPES[0];
    const found = getNewsletterRecipeById(firstRecipe.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(firstRecipe.id);
  });

  it("should return undefined for non-existent ID", () => {
    const found = getNewsletterRecipeById("non-existent-id");
    expect(found).toBeUndefined();
  });
});

describe("getFeaturedNewsletterRecipes", () => {
  it("should return only featured recipes", () => {
    const featured = getFeaturedNewsletterRecipes();

    expect(Array.isArray(featured)).toBe(true);
    for (const recipe of featured) {
      expect(recipe.featured).toBe(true);
    }
  });
});

describe("getNewsletterRecipesByTag", () => {
  it("should filter recipes by tag", () => {
    const minimalRecipes = getNewsletterRecipesByTag("minimal");

    expect(Array.isArray(minimalRecipes)).toBe(true);
    for (const recipe of minimalRecipes) {
      expect(recipe.tags).toContain("minimal");
    }
  });

  it("should return empty array for non-existent tag", () => {
    const recipes = getNewsletterRecipesByTag("non_existent" as any);
    expect(recipes).toEqual([]);
  });
});

describe("getNewsletterRecipesByIndustry", () => {
  it("should filter recipes by industry tag", () => {
    const fashionRecipes = getNewsletterRecipesByIndustry("fashion");

    expect(Array.isArray(fashionRecipes)).toBe(true);
    for (const recipe of fashionRecipes) {
      expect(recipe.tags).toContain("fashion");
    }
  });

  it("should return empty array for non-industry tag", () => {
    const recipes = getNewsletterRecipesByIndustry("minimal");
    expect(recipes).toEqual([]);
  });

  it("should return empty array for invalid industry", () => {
    const recipes = getNewsletterRecipesByIndustry("invalid" as any);
    expect(recipes).toEqual([]);
  });
});

