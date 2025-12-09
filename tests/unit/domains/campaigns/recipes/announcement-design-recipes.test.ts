/**
 * Unit Tests for Announcement Design Recipes
 */

import { describe, it, expect } from "vitest";

import {
  ANNOUNCEMENT_DESIGN_RECIPES,
  getAnnouncementRecipeById,
  getFeaturedAnnouncementRecipes,
  getAnnouncementRecipesByTag,
} from "~/domains/campaigns/recipes/announcement-design-recipes";

describe("ANNOUNCEMENT_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(ANNOUNCEMENT_DESIGN_RECIPES)).toBe(true);
    expect(ANNOUNCEMENT_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of ANNOUNCEMENT_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("ANNOUNCEMENT");
      expect(recipe.category).toBe("announcements");
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = ANNOUNCEMENT_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid content config on each recipe", () => {
    for (const recipe of ANNOUNCEMENT_DESIGN_RECIPES) {
      const content = recipe.defaults.contentConfig;
      expect(content.headline).toBeDefined();
    }
  });
});

describe("getAnnouncementRecipeById", () => {
  it("should return recipe when found", () => {
    const firstRecipe = ANNOUNCEMENT_DESIGN_RECIPES[0];
    const found = getAnnouncementRecipeById(firstRecipe.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(firstRecipe.id);
  });

  it("should return undefined for non-existent ID", () => {
    const found = getAnnouncementRecipeById("non-existent-id");
    expect(found).toBeUndefined();
  });
});

describe("getFeaturedAnnouncementRecipes", () => {
  it("should return only featured recipes", () => {
    const featured = getFeaturedAnnouncementRecipes();

    expect(Array.isArray(featured)).toBe(true);
    for (const recipe of featured) {
      expect(recipe.featured).toBe(true);
    }
  });
});

describe("getAnnouncementRecipesByTag", () => {
  it("should filter recipes by tag", () => {
    const saleRecipes = getAnnouncementRecipesByTag("sale");

    expect(Array.isArray(saleRecipes)).toBe(true);
    for (const recipe of saleRecipes) {
      expect(recipe.tags).toContain("sale");
    }
  });

  it("should return empty array for non-existent tag", () => {
    const recipes = getAnnouncementRecipesByTag("non_existent" as any);
    expect(recipes).toEqual([]);
  });
});

