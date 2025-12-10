/**
 * Unit Tests for Social Proof Design Recipes
 */

import { describe, it, expect } from "vitest";

import {
  SOCIAL_PROOF_DESIGN_RECIPES,
  getSocialProofRecipeById,
  getFeaturedSocialProofRecipes,
  getSocialProofRecipesByTag,
} from "~/domains/campaigns/recipes/social-proof-design-recipes";

describe("SOCIAL_PROOF_DESIGN_RECIPES", () => {
  it("should have recipes defined", () => {
    expect(Array.isArray(SOCIAL_PROOF_DESIGN_RECIPES)).toBe(true);
    expect(SOCIAL_PROOF_DESIGN_RECIPES.length).toBeGreaterThan(0);
  });

  it("should have required properties on each recipe", () => {
    for (const recipe of SOCIAL_PROOF_DESIGN_RECIPES) {
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBeDefined();
      expect(recipe.templateType).toBe("SOCIAL_PROOF");
      expect(recipe.category).toBeDefined();
      expect(recipe.layout).toBeDefined();
      expect(recipe.defaults).toBeDefined();
      expect(recipe.defaults.contentConfig).toBeDefined();
    }
  });

  it("should have unique IDs", () => {
    const ids = SOCIAL_PROOF_DESIGN_RECIPES.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("getSocialProofRecipeById", () => {
  it("should return recipe when found", () => {
    const firstRecipe = SOCIAL_PROOF_DESIGN_RECIPES[0];
    const found = getSocialProofRecipeById(firstRecipe.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(firstRecipe.id);
  });

  it("should return undefined for non-existent ID", () => {
    const found = getSocialProofRecipeById("non-existent-id");
    expect(found).toBeUndefined();
  });
});

describe("getFeaturedSocialProofRecipes", () => {
  it("should return only featured recipes", () => {
    const featured = getFeaturedSocialProofRecipes();

    expect(Array.isArray(featured)).toBe(true);
    for (const recipe of featured) {
      expect(recipe.featured).toBe(true);
    }
  });
});

describe("getSocialProofRecipesByTag", () => {
  it("should filter recipes by tag", () => {
    const minimalRecipes = getSocialProofRecipesByTag("minimal");

    expect(Array.isArray(minimalRecipes)).toBe(true);
    for (const recipe of minimalRecipes) {
      expect(recipe.tags).toContain("minimal");
    }
  });

  it("should return empty array for non-existent tag", () => {
    const recipes = getSocialProofRecipesByTag("non_existent" as any);
    expect(recipes).toEqual([]);
  });
});

