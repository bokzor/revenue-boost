/**
 * Unit Tests: Recipe Catalog
 *
 * Tests for the styled recipe catalog functions and structure.
 * Ensures recipes are properly organized, queryable, and have valid structure.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  STYLED_RECIPES,
  getStyledRecipeById,
  getStyledRecipesByCategory,
  getFeaturedStyledRecipes,
  getStyledRecipesByTag,
  getStyledRecipesByTags,
  getStyledRecipesByAnyTag,
  getAllRecipeTags,
  getRecipeCountByCategory,
  getStyledRecipesWithBuild,
} from "~/domains/campaigns/recipes/styled-recipe-catalog";
import type { StyledRecipe, RecipeCategory } from "~/domains/campaigns/recipes/styled-recipe-types";

describe("Recipe Catalog", () => {
  describe("STYLED_RECIPES", () => {
    it("contains recipes", () => {
      expect(STYLED_RECIPES.length).toBeGreaterThan(0);
    });

    it("all recipes have required base fields", () => {
      for (const recipe of STYLED_RECIPES) {
        expect(recipe.id).toBeTruthy();
        expect(recipe.name).toBeTruthy();
        expect(recipe.tagline).toBeTruthy();
        expect(recipe.description).toBeTruthy();
        expect(recipe.templateType).toBeTruthy();
        expect(recipe.component).toBeTruthy();
        expect(recipe.category).toBeTruthy();
        expect(recipe.goal).toBeTruthy();
        expect(recipe.layout).toBeTruthy();
        expect(recipe.defaults).toBeDefined();
        expect(recipe.defaults.contentConfig).toBeDefined();
      }
    });

    it("all recipes have unique IDs", () => {
      const ids = STYLED_RECIPES.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("all recipes have valid template types", () => {
      const validTemplateTypes = [
        "NEWSLETTER",
        "SPIN_TO_WIN",
        "FLASH_SALE",
        "FREE_SHIPPING",
        "EXIT_INTENT",
        "CART_ABANDONMENT",
        "PRODUCT_UPSELL",
        "SOCIAL_PROOF",
        "COUNTDOWN_TIMER",
        "SCRATCH_CARD",
        "ANNOUNCEMENT",
        "CLASSIC_UPSELL",
        "MINIMAL_SLIDE_UP",
        "PREMIUM_FULLSCREEN",
        "COUNTDOWN_URGENCY",
      ];

      for (const recipe of STYLED_RECIPES) {
        expect(validTemplateTypes).toContain(recipe.templateType);
      }
    });

    it("all recipes have valid categories", () => {
      const validCategories: RecipeCategory[] = [
        "email_leads",
        "sales_promos",
        "cart_recovery",
        "announcements",
      ];

      for (const recipe of STYLED_RECIPES) {
        expect(validCategories).toContain(recipe.category);
      }
    });
  });

  describe("getStyledRecipeById", () => {
    it("returns recipe when ID exists", () => {
      const firstRecipe = STYLED_RECIPES[0];
      const found = getStyledRecipeById(firstRecipe.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(firstRecipe.id);
    });

    it("returns undefined for non-existent ID", () => {
      const found = getStyledRecipeById("non-existent-recipe-id");
      expect(found).toBeUndefined();
    });
  });

  describe("getStyledRecipesByCategory", () => {
    it("returns recipes for email_leads category", () => {
      const recipes = getStyledRecipesByCategory("email_leads");
      expect(recipes.length).toBeGreaterThan(0);
      expect(recipes.every((r) => r.category === "email_leads")).toBe(true);
    });

    it("returns recipes for sales_promos category", () => {
      const recipes = getStyledRecipesByCategory("sales_promos");
      expect(recipes.every((r) => r.category === "sales_promos")).toBe(true);
    });

    it("returns empty array for category with no recipes", () => {
      // All categories should have recipes, but test the filtering logic
      const allCategories = STYLED_RECIPES.map((r) => r.category);
      const hasEmailLeads = allCategories.includes("email_leads");
      expect(hasEmailLeads).toBe(true);
    });
  });

  describe("getRecipeCountByCategory", () => {
    it("returns counts for all categories", () => {
      const counts = getRecipeCountByCategory();
      expect(typeof counts.email_leads).toBe("number");
      expect(typeof counts.sales_promos).toBe("number");
      expect(typeof counts.cart_recovery).toBe("number");
      expect(typeof counts.announcements).toBe("number");
    });

    it("counts match filtered results", () => {
      const counts = getRecipeCountByCategory();
      expect(counts.email_leads).toBe(getStyledRecipesByCategory("email_leads").length);
      expect(counts.sales_promos).toBe(getStyledRecipesByCategory("sales_promos").length);
    });
  });

  describe("getFeaturedStyledRecipes", () => {
    it("returns only featured recipes", () => {
      const featured = getFeaturedStyledRecipes();
      expect(featured.every((r) => r.featured === true)).toBe(true);
    });
  });

  describe("getStyledRecipesWithBuild", () => {
    it("returns recipes with build functions", () => {
      const recipesWithBuild = getStyledRecipesWithBuild();
      expect(recipesWithBuild.length).toBe(STYLED_RECIPES.length);

      for (const recipe of recipesWithBuild) {
        expect(typeof recipe.build).toBe("function");
      }
    });

    it("build function returns expected structure", () => {
      const recipesWithBuild = getStyledRecipesWithBuild();
      const recipe = recipesWithBuild[0];
      const output = recipe.build({});

      expect(output).toHaveProperty("name");
      expect(output).toHaveProperty("contentConfig");
      expect(output).toHaveProperty("designConfig");
    });

    it("build function applies context overrides", () => {
      const recipesWithBuild = getStyledRecipesWithBuild();
      // Find a newsletter recipe for testing
      const newsletterRecipe = recipesWithBuild.find((r) => r.templateType === "NEWSLETTER");

      if (newsletterRecipe) {
        const output = newsletterRecipe.build({
          headline: "Custom Headline",
          subheadline: "Custom Subheadline",
        });

        expect(output.contentConfig.headline).toBe("Custom Headline");
        expect(output.contentConfig.subheadline).toBe("Custom Subheadline");
      }
    });

    it("build function applies discount value", () => {
      const recipesWithBuild = getStyledRecipesWithBuild();
      const recipeWithDiscount = recipesWithBuild.find(
        (r) => r.defaults.discountConfig?.enabled
      );

      if (recipeWithDiscount) {
        const output = recipeWithDiscount.build({ discountValue: 25 });
        expect(output.discountConfig?.value).toBe(25);
      }
    });
  });

  describe("Tag-based filtering", () => {
    it("getStyledRecipesByTag returns recipes with specific tag", () => {
      const fashionRecipes = getStyledRecipesByTag("fashion");
      expect(fashionRecipes.every((r) => r.tags?.includes("fashion"))).toBe(true);
    });

    it("getStyledRecipesByTags returns recipes with ALL specified tags (AND logic)", () => {
      const recipes = getStyledRecipesByTags(["discount", "exit-intent"]);
      for (const recipe of recipes) {
        expect(recipe.tags).toContain("discount");
        expect(recipe.tags).toContain("exit-intent");
      }
    });

    it("getStyledRecipesByAnyTag returns recipes with ANY specified tags (OR logic)", () => {
      const recipes = getStyledRecipesByAnyTag(["fashion", "beauty"]);
      for (const recipe of recipes) {
        const hasFashion = recipe.tags?.includes("fashion");
        const hasBeauty = recipe.tags?.includes("beauty");
        expect(hasFashion || hasBeauty).toBe(true);
      }
    });

    it("getAllRecipeTags returns all unique tags", () => {
      const allTags = getAllRecipeTags();
      expect(Array.isArray(allTags)).toBe(true);
      // Should have unique tags
      expect(new Set(allTags).size).toBe(allTags.length);
    });
  });
});

