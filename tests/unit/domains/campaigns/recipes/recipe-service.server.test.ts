/**
 * Unit Tests for Recipe Service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  getAllRecipes,
  getRecipeById,
  getRecipesByLayout,
  getRecipesByCategory,
  getFeaturedRecipes,
  clearRecipeCache,
} from "~/domains/campaigns/recipes/recipe-service.server";

describe("Recipe Service", () => {
  beforeEach(() => {
    clearRecipeCache();
  });

  describe("getAllRecipes", () => {
    it("should return all recipes", async () => {
      const recipes = await getAllRecipes();

      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBeGreaterThan(0);
    });

    it("should cache recipes on subsequent calls", async () => {
      const recipes1 = await getAllRecipes();
      const recipes2 = await getAllRecipes();

      expect(recipes1).toBe(recipes2); // Same reference (cached)
    });
  });

  describe("getRecipeById", () => {
    it("should return recipe when found", async () => {
      const recipes = await getAllRecipes();
      const firstRecipe = recipes[0];

      const found = await getRecipeById(firstRecipe.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(firstRecipe.id);
    });

    it("should return undefined for non-existent recipe", async () => {
      const found = await getRecipeById("non-existent-recipe-id");

      expect(found).toBeUndefined();
    });
  });

  describe("getRecipesByLayout", () => {
    it("should filter recipes by layout", async () => {
      const recipes = await getRecipesByLayout("split-left");

      expect(Array.isArray(recipes)).toBe(true);
      for (const recipe of recipes) {
        expect(recipe.layout).toBe("split-left");
      }
    });

    it("should return empty array for non-existent layout", async () => {
      const recipes = await getRecipesByLayout("non-existent-layout");

      expect(recipes).toEqual([]);
    });
  });

  describe("getRecipesByCategory", () => {
    it("should filter recipes by category", async () => {
      const recipes = await getRecipesByCategory("email_leads");

      expect(Array.isArray(recipes)).toBe(true);
      for (const recipe of recipes) {
        expect(recipe.category).toBe("email_leads");
      }
    });

    it("should return empty array for non-existent category", async () => {
      const recipes = await getRecipesByCategory("non-existent-category");

      expect(recipes).toEqual([]);
    });
  });

  describe("getFeaturedRecipes", () => {
    it("should return only featured recipes", async () => {
      const recipes = await getFeaturedRecipes();

      expect(Array.isArray(recipes)).toBe(true);
      for (const recipe of recipes) {
        expect(recipe.featured).toBe(true);
      }
    });
  });

  describe("clearRecipeCache", () => {
    it("should clear the cache", async () => {
      // Load recipes to populate cache
      const recipes1 = await getAllRecipes();

      // Clear cache
      clearRecipeCache();

      // Load again - should be a fresh load
      const recipes2 = await getAllRecipes();

      // Both should have same content but may be different references
      expect(recipes1.length).toBe(recipes2.length);
    });
  });
});

