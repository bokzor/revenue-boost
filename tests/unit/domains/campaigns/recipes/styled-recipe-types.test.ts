/**
 * Unit Tests for Styled Recipe Types
 */

import { describe, it, expect } from "vitest";

import {
  RECIPE_CATEGORIES,
  RECIPE_TAG_LABELS,
  INSPIRATION_RECIPE_IDS,
  USE_CASE_RECIPE_IDS,
  SEASONAL_RECIPE_IDS,
  getThemeModeForRecipeType,
  getPresetIdForRecipe,
} from "~/domains/campaigns/recipes/styled-recipe-types";

describe("RECIPE_CATEGORIES", () => {
  it("should have 4 categories", () => {
    expect(Object.keys(RECIPE_CATEGORIES)).toHaveLength(4);
  });

  it("should have email_leads category", () => {
    expect(RECIPE_CATEGORIES.email_leads).toBeDefined();
    expect(RECIPE_CATEGORIES.email_leads.label).toBe("Email & Leads");
    expect(RECIPE_CATEGORIES.email_leads.defaultGoal).toBe("NEWSLETTER_SIGNUP");
  });

  it("should have sales_promos category", () => {
    expect(RECIPE_CATEGORIES.sales_promos).toBeDefined();
    expect(RECIPE_CATEGORIES.sales_promos.defaultGoal).toBe("INCREASE_REVENUE");
  });

  it("should have cart_recovery category", () => {
    expect(RECIPE_CATEGORIES.cart_recovery).toBeDefined();
    expect(RECIPE_CATEGORIES.cart_recovery.defaultGoal).toBe("INCREASE_REVENUE");
  });

  it("should have announcements category", () => {
    expect(RECIPE_CATEGORIES.announcements).toBeDefined();
    expect(RECIPE_CATEGORIES.announcements.defaultGoal).toBe("ENGAGEMENT");
  });
});

describe("RECIPE_TAG_LABELS", () => {
  it("should have labels for industry tags", () => {
    expect(RECIPE_TAG_LABELS.fashion).toBe("Fashion");
    expect(RECIPE_TAG_LABELS.beauty).toBe("Beauty");
    expect(RECIPE_TAG_LABELS.tech).toBe("Tech & SaaS");
  });

  it("should have labels for style tags", () => {
    expect(RECIPE_TAG_LABELS.minimal).toBe("Minimal");
    expect(RECIPE_TAG_LABELS.bold).toBe("Bold");
    expect(RECIPE_TAG_LABELS.elegant).toBe("Elegant");
  });

  it("should have labels for seasonal tags", () => {
    expect(RECIPE_TAG_LABELS["black-friday"]).toBe("Black Friday");
    expect(RECIPE_TAG_LABELS.holiday).toBe("Holiday");
  });
});

describe("Recipe ID Constants", () => {
  it("should have inspiration recipe IDs", () => {
    expect(INSPIRATION_RECIPE_IDS.length).toBeGreaterThan(0);
    expect(INSPIRATION_RECIPE_IDS).toContain("newsletter-elegant-luxe");
  });

  it("should have use case recipe IDs", () => {
    expect(USE_CASE_RECIPE_IDS.length).toBeGreaterThan(0);
    expect(USE_CASE_RECIPE_IDS).toContain("newsletter-minimal-tech");
  });

  it("should have seasonal recipe IDs", () => {
    expect(SEASONAL_RECIPE_IDS.length).toBeGreaterThan(0);
    expect(SEASONAL_RECIPE_IDS).toContain("black-friday-sale");
    expect(SEASONAL_RECIPE_IDS).toContain("holiday-sale");
  });
});

describe("getThemeModeForRecipeType", () => {
  it("should return preset for seasonal recipes", () => {
    expect(getThemeModeForRecipeType("seasonal")).toBe("preset");
  });

  it("should return preset for inspiration recipes", () => {
    expect(getThemeModeForRecipeType("inspiration")).toBe("preset");
  });

  it("should return default for use_case recipes", () => {
    expect(getThemeModeForRecipeType("use_case")).toBe("default");
  });

  it("should return default for undefined", () => {
    expect(getThemeModeForRecipeType(undefined)).toBe("default");
  });
});

describe("getPresetIdForRecipe", () => {
  it("should return preset ID for inspiration recipes", () => {
    expect(getPresetIdForRecipe("newsletter-elegant-luxe")).toBe("newsletter-elegant-luxe");
  });

  it("should return preset ID for seasonal recipes", () => {
    expect(getPresetIdForRecipe("black-friday-sale")).toBe("black-friday-sale");
  });

  it("should return undefined for use case recipes", () => {
    expect(getPresetIdForRecipe("newsletter-minimal-tech")).toBeUndefined();
  });

  it("should return undefined for unknown recipes", () => {
    expect(getPresetIdForRecipe("unknown-recipe")).toBeUndefined();
  });
});

