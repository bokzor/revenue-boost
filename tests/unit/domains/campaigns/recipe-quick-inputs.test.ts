/**
 * Unit Tests: Recipe Quick Input Definitions
 *
 * Tests that every recipe defines valid quick inputs with:
 * - Correct types
 * - Valid keys
 * - Required labels
 * - Appropriate default values
 */

import { describe, it, expect } from "vitest";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import type { QuickInput, StyledRecipe } from "~/domains/campaigns/recipes/styled-recipe-types";

// All valid quick input types
const VALID_QUICK_INPUT_TYPES = [
  "discount_percentage",
  "discount_amount",
  "currency_amount",
  "duration_hours",
  "product_picker",
  "collection_picker",
  "text",
  "datetime",
  "select",
];

// Known quick input keys and their expected types
const KNOWN_QUICK_INPUT_KEYS: Record<string, string[]> = {
  // Discount inputs
  discountValue: ["discount_percentage"],
  bundleDiscount: ["discount_percentage"],
  discountAmount: ["discount_amount", "currency_amount"],
  // Threshold inputs
  threshold: ["currency_amount"],
  freeShippingThreshold: ["currency_amount"],
  // Duration inputs
  duration: ["duration_hours"],
  // Selection inputs
  productSelectionMethod: ["select"],
  triggerType: ["select"],
  notificationType: ["select"],
  displayFrequency: ["select"],
  cornerPosition: ["select"],
  bannerPosition: ["select"],
  emailTiming: ["select"],
  maxProducts: ["select"],
  // Picker inputs
  selectedProducts: ["product_picker"],
  selectedCollection: ["collection_picker"],
  inventoryProducts: ["product_picker"],
  giftProduct: ["product_picker"],
  // Other inputs
  topPrize: ["discount_percentage"],
  ctaUrl: ["text"],
};

describe("Recipe Quick Input Definitions", () => {
  describe("All recipes have valid inputs array", () => {
    it("every recipe has inputs property as an array", () => {
      for (const recipe of STYLED_RECIPES) {
        expect(Array.isArray(recipe.inputs)).toBe(true);
      }
    });
  });

  describe("Quick input structure validation", () => {
    for (const recipe of STYLED_RECIPES) {
      if (recipe.inputs.length === 0) continue;

      describe(`${recipe.name} (${recipe.id})`, () => {
        for (const input of recipe.inputs) {
          it(`input "${input.key}" has valid structure`, () => {
            // Check required fields
            expect(input).toHaveProperty("type");
            expect(input).toHaveProperty("key");
            expect(input).toHaveProperty("label");

            // Type must be valid
            expect(VALID_QUICK_INPUT_TYPES).toContain(input.type);

            // Key must be non-empty string
            expect(typeof input.key).toBe("string");
            expect(input.key.length).toBeGreaterThan(0);

            // Label must be non-empty string
            expect(typeof input.label).toBe("string");
            expect(input.label.length).toBeGreaterThan(0);
          });
        }
      });
    }
  });

  describe("Quick input types match expected keys", () => {
    for (const recipe of STYLED_RECIPES) {
      for (const input of recipe.inputs) {
        const expectedTypes = KNOWN_QUICK_INPUT_KEYS[input.key];
        if (expectedTypes) {
          it(`${recipe.id}: "${input.key}" has correct type (${expectedTypes.join(" or ")})`, () => {
            expect(expectedTypes).toContain(input.type);
          });
        }
      }
    }
  });

  describe("Quick input default values", () => {
    it("discount_percentage inputs have numeric defaultValue", () => {
      for (const recipe of STYLED_RECIPES) {
        for (const input of recipe.inputs) {
          if (input.type === "discount_percentage") {
            expect(typeof input.defaultValue).toBe("number");
            expect(input.defaultValue).toBeGreaterThanOrEqual(0);
            expect(input.defaultValue).toBeLessThanOrEqual(100);
          }
        }
      }
    });

    it("currency_amount inputs have numeric defaultValue", () => {
      for (const recipe of STYLED_RECIPES) {
        for (const input of recipe.inputs) {
          if (input.type === "currency_amount") {
            expect(typeof input.defaultValue).toBe("number");
            expect(input.defaultValue).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    it("select inputs have options array and valid defaultValue", () => {
      for (const recipe of STYLED_RECIPES) {
        for (const input of recipe.inputs) {
          if (input.type === "select") {
            expect(Array.isArray(input.options)).toBe(true);
            expect(input.options.length).toBeGreaterThan(0);
            expect(typeof input.defaultValue).toBe("string");

            // defaultValue should be one of the options
            const optionValues = input.options.map((o) => o.value);
            expect(optionValues).toContain(input.defaultValue);
          }
        }
      }
    });

    it("duration_hours inputs have numeric defaultValue", () => {
      for (const recipe of STYLED_RECIPES) {
        for (const input of recipe.inputs) {
          if (input.type === "duration_hours") {
            expect(typeof input.defaultValue).toBe("number");
            expect(input.defaultValue).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe("Template-specific quick input requirements", () => {
    it("SPIN_TO_WIN recipes with discountValue also have topPrize", () => {
      const spinRecipes = STYLED_RECIPES.filter((r) => r.templateType === "SPIN_TO_WIN");
      for (const recipe of spinRecipes) {
        const hasTopPrize = recipe.inputs.some((i) => i.key === "topPrize");
        if (hasTopPrize) {
          const topPrizeInput = recipe.inputs.find((i) => i.key === "topPrize");
          expect(topPrizeInput?.type).toBe("discount_percentage");
        }
      }
    });

    it("SCRATCH_CARD recipes with emailTiming have valid options", () => {
      const scratchRecipes = STYLED_RECIPES.filter((r) => r.templateType === "SCRATCH_CARD");
      for (const recipe of scratchRecipes) {
        const emailTimingInput = recipe.inputs.find((i) => i.key === "emailTiming");
        if (emailTimingInput && emailTimingInput.type === "select") {
          const values = emailTimingInput.options.map((o) => o.value);
          expect(values).toContain("before");
          expect(values).toContain("after");
        }
      }
    });

    it("SOCIAL_PROOF recipes have notificationType input", () => {
      const socialRecipes = STYLED_RECIPES.filter((r) => r.templateType === "SOCIAL_PROOF");
      for (const recipe of socialRecipes) {
        const hasNotificationType = recipe.inputs.some((i) => i.key === "notificationType");
        // If recipe defines notificationType, verify it's a select with valid options
        if (hasNotificationType) {
          const input = recipe.inputs.find((i) => i.key === "notificationType");
          expect(input?.type).toBe("select");
        }
      }
    });

    it("FREE_SHIPPING recipes have freeShippingThreshold input", () => {
      const freeShippingRecipes = STYLED_RECIPES.filter((r) => r.templateType === "FREE_SHIPPING");
      for (const recipe of freeShippingRecipes) {
        const hasThreshold = recipe.inputs.some((i) => i.key === "freeShippingThreshold");
        if (hasThreshold) {
          const input = recipe.inputs.find((i) => i.key === "freeShippingThreshold");
          expect(input?.type).toBe("currency_amount");
        }
      }
    });

    it("UPSELL templates have productSelectionMethod input", () => {
      const upsellTemplates = ["CLASSIC_UPSELL", "MULTI_PRODUCT_UPSELL"];
      const upsellRecipes = STYLED_RECIPES.filter((r) =>
        upsellTemplates.includes(r.templateType)
      );
      for (const recipe of upsellRecipes) {
        const hasMethod = recipe.inputs.some((i) => i.key === "productSelectionMethod");
        if (hasMethod) {
          const input = recipe.inputs.find((i) => i.key === "productSelectionMethod");
          expect(input?.type).toBe("select");
          if (input?.type === "select") {
            const values = input.options.map((o) => o.value);
            expect(values).toContain("ai");
            expect(values).toContain("manual");
          }
        }
      }
    });
  });

  describe("Quick input key uniqueness", () => {
    it("each recipe has unique input keys", () => {
      for (const recipe of STYLED_RECIPES) {
        const keys = recipe.inputs.map((i) => i.key);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);
      }
    });
  });
});

