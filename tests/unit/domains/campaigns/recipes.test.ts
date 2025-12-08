/**
 * Unit Tests: Recipe Definitions
 *
 * Tests for recipe structure and configuration validity.
 */

import { describe, it, expect } from "vitest";
import { FLASH_SALE_DESIGN_RECIPES } from "~/domains/campaigns/recipes/flash-sale-design-recipes";

describe("Flash Sale Design Recipes", () => {
  describe("Free Gift with Purchase", () => {
    const recipe = FLASH_SALE_DESIGN_RECIPES.find(
      (r) => r.id === "free-gift-with-purchase"
    );

    it("exists in the catalog", () => {
      expect(recipe).toBeDefined();
    });

    it("has correct template type", () => {
      expect(recipe?.templateType).toBe("FLASH_SALE");
    });

    it("has currency_amount input for threshold", () => {
      const thresholdInput = recipe?.inputs.find((i) => i.key === "threshold");
      expect(thresholdInput).toBeDefined();
      expect(thresholdInput?.type).toBe("currency_amount");
    });

    it("has product_picker input for gift product", () => {
      const productInput = recipe?.inputs.find((i) => i.key === "giftProduct");
      expect(productInput).toBeDefined();
      expect(productInput?.type).toBe("product_picker");
    });

    it("has cart_value trigger enabled", () => {
      const cartValue = recipe?.defaults.targetRules?.enhancedTriggers?.cart_value;
      expect(cartValue?.enabled).toBe(true);
      expect(cartValue?.min_value).toBe(50);
    });

    it("has CTA configured for add_to_cart", () => {
      const contentConfig = recipe?.defaults.contentConfig as Record<string, unknown>;
      const cta = contentConfig?.cta as Record<string, unknown>;
      expect(cta?.action).toBe("add_to_cart");
      // CTA adds free gift to cart
      expect(cta?.quantity).toBe(1);
    });

    it("has discount enabled for free gift", () => {
      // Free gift uses discount system with 100% off the gift product
      expect(recipe?.defaults.discountConfig?.enabled).toBe(true);
      expect(recipe?.defaults.discountConfig?.freeGift).toBeDefined();
    });
  });

  // NOTE: Bundle Deal and Exit Intent Cart Saver recipes were planned but not implemented.
  // Tests for those recipes have been removed. If you implement these recipes in the future,
  // add corresponding tests here.

  describe("All Use Case Recipes", () => {
    const useCaseRecipes = FLASH_SALE_DESIGN_RECIPES.filter(
      (r) => r.recipeType === "use_case"
    );

    it("includes the free-gift-with-purchase recipe", () => {
      const ids = useCaseRecipes.map((r) => r.id);
      expect(ids).toContain("free-gift-with-purchase");
    });

    it("all have required fields", () => {
      for (const recipe of useCaseRecipes) {
        expect(recipe.id).toBeTruthy();
        expect(recipe.name).toBeTruthy();
        expect(recipe.tagline).toBeTruthy();
        expect(recipe.templateType).toBeTruthy();
        expect(recipe.component).toBeTruthy();
        expect(recipe.defaults.contentConfig).toBeDefined();
      }
    });
  });
});

