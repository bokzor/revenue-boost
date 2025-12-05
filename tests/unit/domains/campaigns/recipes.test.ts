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
      const cta = recipe?.defaults.contentConfig.cta as Record<string, unknown>;
      expect(cta?.action).toBe("add_to_cart");
      expect(cta?.applyDiscountFirst).toBe(false);
    });

    it("has discount disabled (gift is the incentive)", () => {
      expect(recipe?.defaults.discountConfig?.enabled).toBe(false);
    });
  });

  describe("Bundle Deal", () => {
    const recipe = FLASH_SALE_DESIGN_RECIPES.find(
      (r) => r.id === "bundle-deal"
    );

    it("exists in the catalog", () => {
      expect(recipe).toBeDefined();
    });

    it("has correct template type", () => {
      expect(recipe?.templateType).toBe("PRODUCT_UPSELL");
    });

    it("has discount_percentage input for bundle discount", () => {
      const discountInput = recipe?.inputs.find(
        (i) => i.key === "bundleDiscount"
      );
      expect(discountInput).toBeDefined();
      expect(discountInput?.type).toBe("discount_percentage");
    });

    it("has product_picker input with multiSelect", () => {
      const productInput = recipe?.inputs.find(
        (i) => i.key === "bundleProducts"
      );
      expect(productInput).toBeDefined();
      expect(productInput?.type).toBe("product_picker");
      expect((productInput as { multiSelect?: boolean })?.multiSelect).toBe(true);
    });

    it("has product_view trigger enabled", () => {
      const productView = recipe?.defaults.targetRules?.enhancedTriggers?.product_view;
      expect(productView?.enabled).toBe(true);
    });

    it("targets product pages", () => {
      const pageTargeting = recipe?.defaults.targetRules?.pageTargeting;
      expect(pageTargeting?.enabled).toBe(true);
      expect(pageTargeting?.customPatterns).toContain("/products/*");
    });

    it("has percentage discount configured", () => {
      expect(recipe?.defaults.discountConfig?.enabled).toBe(true);
      expect(recipe?.defaults.discountConfig?.valueType).toBe("PERCENTAGE");
      expect(recipe?.defaults.discountConfig?.value).toBe(15);
    });
  });

  describe("Exit Intent Cart Saver", () => {
    const recipe = FLASH_SALE_DESIGN_RECIPES.find(
      (r) => r.id === "exit-intent-cart-saver"
    );

    it("exists in the catalog", () => {
      expect(recipe).toBeDefined();
    });

    it("has correct template type", () => {
      expect(recipe?.templateType).toBe("CART_ABANDONMENT");
    });

    it("is in cart_recovery category", () => {
      expect(recipe?.category).toBe("cart_recovery");
    });

    it("has exit_intent trigger enabled", () => {
      const exitIntent = recipe?.defaults.targetRules?.enhancedTriggers?.exit_intent;
      expect(exitIntent?.enabled).toBe(true);
      expect(exitIntent?.sensitivity).toBe("medium");
    });

    it("has cart_value trigger enabled (any cart)", () => {
      const cartValue = recipe?.defaults.targetRules?.enhancedTriggers?.cart_value;
      expect(cartValue?.enabled).toBe(true);
      expect(cartValue?.min_value).toBe(1);
    });

    it("shows cart items by default", () => {
      expect(recipe?.defaults.contentConfig.showCartItems).toBe(true);
      expect(recipe?.defaults.contentConfig.showCartTotal).toBe(true);
    });

    it("has urgency features enabled", () => {
      expect(recipe?.defaults.contentConfig.showUrgency).toBe(true);
      expect(recipe?.defaults.contentConfig.urgencyTimer).toBe(300);
    });

    it("has percentage discount for recovery", () => {
      expect(recipe?.defaults.discountConfig?.enabled).toBe(true);
      expect(recipe?.defaults.discountConfig?.valueType).toBe("PERCENTAGE");
      expect(recipe?.defaults.discountConfig?.value).toBe(10);
    });
  });

  describe("All Use Case Recipes", () => {
    const useCaseRecipes = FLASH_SALE_DESIGN_RECIPES.filter(
      (r) => r.recipeType === "use_case"
    );

    it("includes the 3 new recipes", () => {
      const ids = useCaseRecipes.map((r) => r.id);
      expect(ids).toContain("free-gift-with-purchase");
      expect(ids).toContain("bundle-deal");
      expect(ids).toContain("exit-intent-cart-saver");
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

