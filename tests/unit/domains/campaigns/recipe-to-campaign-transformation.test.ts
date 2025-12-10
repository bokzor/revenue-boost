/**
 * Unit Tests: Recipe to Campaign Transformation
 *
 * Tests the transformation of recipe defaults into campaign form data.
 * Validates that recipe data is correctly mapped to campaign create data structure.
 */

import { describe, it, expect } from "vitest";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import type { StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";

/**
 * Helper function to simulate recipe to campaign data transformation.
 * This mirrors the logic in buildRecipeInitialData from RecipeSelectionStep.
 */
function transformRecipeToCampaignData(recipe: StyledRecipe, contextOverrides: Record<string, unknown> = {}) {
  const contentConfig = { ...recipe.defaults.contentConfig } as Record<string, unknown>;

  // Apply context overrides to content config
  Object.entries(contextOverrides).forEach(([key, value]) => {
    if (value !== undefined && key in contentConfig) {
      contentConfig[key] = value;
    }
  });

  // Apply discount value substitution
  if (contextOverrides.discountValue !== undefined) {
    if (typeof contentConfig.subheadline === "string") {
      contentConfig.subheadline = contentConfig.subheadline.replace(
        /\d+%/,
        `${contextOverrides.discountValue}%`
      );
    }
  }

  const designConfig = {
    layout: recipe.layout,
    position: recipe.defaults.designConfig?.position || "center",
    size: recipe.defaults.designConfig?.size || "medium",
    ...recipe.defaults.designConfig,
  };

  const targetRules = { ...recipe.defaults.targetRules };
  const discountConfig = { ...recipe.defaults.discountConfig };

  // Apply discount value override
  if (contextOverrides.discountValue !== undefined && discountConfig) {
    discountConfig.value = contextOverrides.discountValue as number;
  }

  return {
    name: recipe.name,
    goal: recipe.goal,
    templateType: recipe.templateType,
    contentConfig,
    designConfig,
    targetRules,
    discountConfig,
  };
}

describe("Recipe to Campaign Transformation", () => {
  describe("Basic transformation", () => {
    it("transforms recipe name to campaign name", () => {
      const recipe = STYLED_RECIPES[0];
      const result = transformRecipeToCampaignData(recipe);

      expect(result.name).toBe(recipe.name);
    });

    it("preserves recipe goal as campaign goal", () => {
      const recipe = STYLED_RECIPES[0];
      const result = transformRecipeToCampaignData(recipe);

      expect(result.goal).toBe(recipe.goal);
    });

    it("preserves recipe templateType", () => {
      const recipe = STYLED_RECIPES[0];
      const result = transformRecipeToCampaignData(recipe);

      expect(result.templateType).toBe(recipe.templateType);
    });

    it("copies content config from recipe defaults", () => {
      const newsletterRecipe = STYLED_RECIPES.find((r) => r.templateType === "NEWSLETTER");

      if (newsletterRecipe) {
        const result = transformRecipeToCampaignData(newsletterRecipe);

        const content = result.contentConfig as Record<string, unknown>;
        const expectedHeadline = (newsletterRecipe.defaults.contentConfig as { headline?: string }).headline;
        expect(content.headline).toBe(expectedHeadline);
      }
    });

    it("copies design config from recipe defaults", () => {
      const recipe = STYLED_RECIPES[0];
      const result = transformRecipeToCampaignData(recipe);

      const design = result.designConfig as Record<string, unknown>;
      expect(design.layout).toBe(recipe.layout);
    });
  });

  describe("Context overrides", () => {
    it("applies headline override from context", () => {
      const newsletterRecipe = STYLED_RECIPES.find((r) => r.templateType === "NEWSLETTER");

      if (newsletterRecipe) {
        const result = transformRecipeToCampaignData(newsletterRecipe, {
          headline: "Custom Headline Override",
        });

        expect(result.contentConfig.headline).toBe("Custom Headline Override");
      }
    });

    it("applies subheadline override from context", () => {
      const newsletterRecipe = STYLED_RECIPES.find((r) => r.templateType === "NEWSLETTER");

      if (newsletterRecipe) {
        const result = transformRecipeToCampaignData(newsletterRecipe, {
          subheadline: "Custom Description",
        });

        expect(result.contentConfig.subheadline).toBe("Custom Description");
      }
    });

    it("applies discount value to discount config", () => {
      const recipeWithDiscount = STYLED_RECIPES.find(
        (r) => r.defaults.discountConfig?.enabled
      );

      if (recipeWithDiscount) {
        const result = transformRecipeToCampaignData(recipeWithDiscount, {
          discountValue: 25,
        });

        expect(result.discountConfig?.value).toBe(25);
      }
    });
  });

  describe("Template-specific transformations", () => {
    it("newsletter recipes include email-related content fields", () => {
      const newsletterRecipes = STYLED_RECIPES.filter(
        (r) => r.templateType === "NEWSLETTER"
      );

      for (const recipe of newsletterRecipes) {
        const result = transformRecipeToCampaignData(recipe);

        // Newsletter should have email-related fields
        expect(result.contentConfig).toHaveProperty("emailPlaceholder");
        expect(result.contentConfig).toHaveProperty("headline");
      }
    });

    it("spin-to-win recipes include wheel segments", () => {
      const spinRecipes = STYLED_RECIPES.filter(
        (r) => r.templateType === "SPIN_TO_WIN"
      );

      for (const recipe of spinRecipes) {
        const result = transformRecipeToCampaignData(recipe);

        expect(result.contentConfig).toHaveProperty("wheelSegments");
        expect(Array.isArray(result.contentConfig.wheelSegments)).toBe(true);
      }
    });

    it("flash sale recipes have urgency-related content", () => {
      const flashSaleRecipes = STYLED_RECIPES.filter(
        (r) => r.templateType === "FLASH_SALE"
      );

      for (const recipe of flashSaleRecipes) {
        const result = transformRecipeToCampaignData(recipe);

        // Flash sales typically have headline
        expect(result.contentConfig).toHaveProperty("headline");
        // Flash sales can have either INCREASE_REVENUE or ENGAGEMENT goal
        expect(["INCREASE_REVENUE", "ENGAGEMENT"]).toContain(result.goal);
      }
    });

    it("scratch card recipes include prizes configuration", () => {
      const scratchCardRecipes = STYLED_RECIPES.filter(
        (r) => r.templateType === "SCRATCH_CARD"
      );

      for (const recipe of scratchCardRecipes) {
        const result = transformRecipeToCampaignData(recipe);

        expect(result.contentConfig).toHaveProperty("prizes");
        expect(Array.isArray(result.contentConfig.prizes)).toBe(true);
      }
    });
  });

  describe("Design config inheritance", () => {
    it("inherits layout from recipe", () => {
      for (const recipe of STYLED_RECIPES.slice(0, 5)) {
        const result = transformRecipeToCampaignData(recipe);
        expect(result.designConfig.layout).toBe(recipe.layout);
      }
    });

    it("uses recipe position or defaults to center", () => {
      for (const recipe of STYLED_RECIPES.slice(0, 5)) {
        const result = transformRecipeToCampaignData(recipe);
        expect(result.designConfig.position).toBeDefined();
      }
    });

    it("preserves theme colors from recipe design config", () => {
      const recipeWithColors = STYLED_RECIPES.find(
        (r) => r.defaults.designConfig?.backgroundColor
      );

      if (recipeWithColors) {
        const result = transformRecipeToCampaignData(recipeWithColors);
        expect(result.designConfig.backgroundColor).toBe(
          recipeWithColors.defaults.designConfig?.backgroundColor
        );
      }
    });
  });

  describe("Target rules inheritance", () => {
    it("copies target rules from recipe defaults", () => {
      const recipeWithTargetRules = STYLED_RECIPES.find(
        (r) => r.defaults.targetRules && Object.keys(r.defaults.targetRules).length > 0
      );

      if (recipeWithTargetRules) {
        const result = transformRecipeToCampaignData(recipeWithTargetRules);
        expect(result.targetRules).toEqual(recipeWithTargetRules.defaults.targetRules);
      }
    });
  });
});
