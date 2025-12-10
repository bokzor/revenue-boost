/**
 * Unit Tests: Recipe Service
 *
 * Tests for the recipe service that provides lazy-loaded access to recipes.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAllRecipes,
  getRecipeById,
  getRecipesByLayout,
  getRecipesByCategory,
  getBackgroundsForLayout,
} from "~/domains/campaigns/recipes/recipe-service.server";

describe("Recipe Service", () => {
  describe("getAllRecipes", () => {
    it("returns all recipes", async () => {
      const recipes = await getAllRecipes();
      expect(Array.isArray(recipes)).toBe(true);
      expect(recipes.length).toBeGreaterThan(0);
    });

    it("returns recipes with expected structure", async () => {
      const recipes = await getAllRecipes();
      const recipe = recipes[0];

      expect(recipe).toHaveProperty("id");
      expect(recipe).toHaveProperty("name");
      expect(recipe).toHaveProperty("templateType");
      expect(recipe).toHaveProperty("defaults");
      expect(recipe).toHaveProperty("category");
      expect(recipe).toHaveProperty("goal");
    });

    it("caches recipes on subsequent calls", async () => {
      const recipes1 = await getAllRecipes();
      const recipes2 = await getAllRecipes();

      // Both should return the same array (cached)
      expect(recipes1).toBe(recipes2);
    });
  });

  describe("getRecipeById", () => {
    it("returns recipe when ID exists", async () => {
      const allRecipes = await getAllRecipes();
      const firstRecipe = allRecipes[0];

      const found = await getRecipeById(firstRecipe.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(firstRecipe.id);
      expect(found?.name).toBe(firstRecipe.name);
    });

    it("returns undefined for non-existent ID", async () => {
      const found = await getRecipeById("non-existent-id-12345");
      expect(found).toBeUndefined();
    });

    it("returns complete recipe object", async () => {
      const allRecipes = await getAllRecipes();
      const newsletterRecipe = allRecipes.find((r) => r.templateType === "NEWSLETTER");

      if (newsletterRecipe) {
        const found = await getRecipeById(newsletterRecipe.id);
        expect(found?.defaults.contentConfig).toBeDefined();
        expect(found?.category).toBe("email_leads");
        expect(found?.goal).toBe("NEWSLETTER_SIGNUP");
      }
    });
  });

  describe("getRecipesByLayout", () => {
    it("returns recipes filtered by layout", async () => {
      const splitRecipes = await getRecipesByLayout("split-left");

      for (const recipe of splitRecipes) {
        expect(recipe.layout).toBe("split-left");
      }
    });

    it("returns empty array for layout with no recipes", async () => {
      const noRecipes = await getRecipesByLayout("non-existent-layout" as unknown as string);
      expect(noRecipes).toEqual([]);
    });

    it("finds centered layout recipes", async () => {
      const centeredRecipes = await getRecipesByLayout("centered");
      expect(centeredRecipes.length).toBeGreaterThanOrEqual(0);

      for (const recipe of centeredRecipes) {
        expect(recipe.layout).toBe("centered");
      }
    });
  });

  describe("getRecipesByCategory", () => {
    it("returns recipes for email_leads category", async () => {
      const recipes = await getRecipesByCategory("email_leads");
      expect(recipes.length).toBeGreaterThan(0);

      for (const recipe of recipes) {
        expect(recipe.category).toBe("email_leads");
      }
    });

    it("returns recipes for sales_promos category", async () => {
      const recipes = await getRecipesByCategory("sales_promos");

      for (const recipe of recipes) {
        expect(recipe.category).toBe("sales_promos");
      }
    });

    it("returns recipes for cart_recovery category", async () => {
      const recipes = await getRecipesByCategory("cart_recovery");

      for (const recipe of recipes) {
        expect(recipe.category).toBe("cart_recovery");
      }
    });
  });

  describe("getBackgroundsForLayout", () => {
    it("returns backgrounds for split-left layout", async () => {
      const backgrounds = await getBackgroundsForLayout("split-left");
      expect(Array.isArray(backgrounds)).toBe(true);
    });

    it("returns backgrounds for centered layout", async () => {
      const backgrounds = await getBackgroundsForLayout("centered");
      expect(Array.isArray(backgrounds)).toBe(true);
    });

    it("backgrounds have required properties", async () => {
      const backgrounds = await getBackgroundsForLayout("split-left");

      for (const bg of backgrounds) {
        expect(bg).toHaveProperty("id");
        expect(bg).toHaveProperty("name");
      }
    });
  });
});

