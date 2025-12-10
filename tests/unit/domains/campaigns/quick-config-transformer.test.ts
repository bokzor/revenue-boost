/**
 * Tests for applyQuickConfigToState function
 *
 * This function maps quick input values to their corresponding form fields:
 * - discountValue → discountConfig.value, updates subheadline text
 * - bundleDiscount → contentConfig.bundleDiscount, discountConfig.value
 * - productSelectionMethod → contentConfig.productSelectionMethod
 * - triggerType → targetingConfig.enhancedTriggers
 * - threshold → cart_value trigger, subheadline text, discountConfig.minimumAmount
 * - bannerPosition → designConfig.position
 * - freeShippingThreshold → contentConfig.threshold, headline/subheadline text
 * - topPrize → wheelSegments[0] or prizes[0] discount value
 * - emailTiming → contentConfig.emailBeforeScratching
 * - notificationType → enablePurchaseNotifications/enableVisitorNotifications/enableReviewNotifications
 * - displayFrequency → contentConfig.rotationInterval
 * - durationHours → contentConfig.countdownDuration or timer.durationSeconds
 */

import { describe, it, expect } from "vitest";
import {
  applyQuickConfigToState,
  extractIds,
  valuesAreEqual,
  type ApplyQuickConfigParams,
  type QuickConfigApplyResult,
} from "~/domains/campaigns/utils/quick-config-transformer";
import type { StyledRecipe, QuickInput } from "~/domains/campaigns/recipes/styled-recipe-types";
import { DEFAULT_DISCOUNT_CONFIG } from "~/domains/campaigns/components/unified/defaults";

// Type alias for accessing content config properties in tests
type ContentRecord = Record<string, unknown>;

// Helper to get content config as a record for property access
function getContent(result: QuickConfigApplyResult): ContentRecord {
  return result.contentConfig as ContentRecord;
}

// Helper to create a minimal recipe with specific inputs
// Uses 'as unknown as StyledRecipe' to bypass strict type checking for test mocks
function createMockRecipe(
  inputs: Partial<QuickInput>[],
  contentDefaults: Record<string, unknown> = {},
  discountDefaults: Record<string, unknown> = {}
): StyledRecipe {
  // Add required defaults to inputs based on type
  const normalizedInputs = inputs.map((input) => {
    if (input.type === "discount_percentage" || input.type === "discount_amount" || input.type === "currency_amount" || input.type === "duration_hours") {
      return { defaultValue: 10, ...input };
    }
    if (input.type === "select") {
      return { defaultValue: "", options: [], ...input };
    }
    return input;
  }) as QuickInput[];

  return {
    id: "test-recipe",
    name: "Test Recipe",
    tagline: "Test tagline",
    description: "Test recipe for unit tests",
    icon: "🧪",
    category: "newsletter",
    goal: "NEWSLETTER_SIGNUP",
    templateType: "NEWSLETTER",
    component: "NewsletterCentered",
    layout: "centered",
    tags: [],
    inputs: normalizedInputs,
    editableFields: [],
    defaults: {
      contentConfig: contentDefaults,
      designConfig: {},
      discountConfig: discountDefaults,
    },
  } as unknown as StyledRecipe;
}

// Helper to create default params
// Uses loose typing for contentConfig to allow partial mock objects in tests
function createDefaultParams(
  overrides: Partial<Omit<ApplyQuickConfigParams, "contentConfig">> & {
    contentConfig?: Record<string, unknown>;
  } = {}
): ApplyQuickConfigParams {
  return {
    recipe: undefined,
    contextData: {},
    contentConfig: {},
    designConfig: {},
    targetingConfig: {
      audienceTargeting: { enabled: false, shopifySegmentIds: [] },
      geoTargeting: { enabled: false, mode: "include", countries: [] },
      enhancedTriggers: {},
    },
    discountConfig: { ...DEFAULT_DISCOUNT_CONFIG },
    ...overrides,
  } as ApplyQuickConfigParams;
}

describe("extractIds", () => {
  it("returns empty array for null/undefined", () => {
    expect(extractIds(null)).toEqual([]);
    expect(extractIds(undefined)).toEqual([]);
  });

  it("handles string array", () => {
    expect(extractIds(["id1", "id2", "id3"])).toEqual(["id1", "id2", "id3"]);
  });

  it("handles object array with id property", () => {
    expect(extractIds([{ id: "id1" }, { id: "id2" }])).toEqual(["id1", "id2"]);
  });

  it("handles object with ids property", () => {
    expect(extractIds({ ids: ["id1", "id2"] })).toEqual(["id1", "id2"]);
  });

  it("filters out empty/falsy values", () => {
    expect(extractIds(["id1", "", "id2", null])).toEqual(["id1", "id2"]);
  });
});

describe("valuesAreEqual", () => {
  it("compares primitives", () => {
    expect(valuesAreEqual(1, 1)).toBe(true);
    expect(valuesAreEqual(1, 2)).toBe(false);
    expect(valuesAreEqual("a", "a")).toBe(true);
    expect(valuesAreEqual("a", "b")).toBe(false);
  });

  it("compares arrays", () => {
    expect(valuesAreEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(valuesAreEqual([1, 2, 3], [1, 2])).toBe(false);
    expect(valuesAreEqual([1, 2, 3], [1, 2, 4])).toBe(false);
  });

  it("compares objects via JSON", () => {
    expect(valuesAreEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(valuesAreEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});

describe("applyQuickConfigToState", () => {
  describe("discountValue input", () => {
    it("sets discountConfig.value from numeric discountValue", () => {
      const recipe = createMockRecipe(
        [{ type: "discount_percentage", key: "discountValue", label: "Discount" }],
        { subheadline: "Get 10% off your order" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { discountValue: 25 },
        contentConfig: { subheadline: "Get 10% off your order" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.discountConfig.value).toBe(25);
      expect(result.changed.discount).toBe(true);
    });

    it("updates subheadline text with new percentage", () => {
      const recipe = createMockRecipe(
        [{ type: "discount_percentage", key: "discountValue", label: "Discount" }],
        { subheadline: "Get 10% off your order" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { discountValue: 25 },
        contentConfig: { subheadline: "Get 10% off your order" },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).subheadline).toBe("Get 25% off your order");
      expect(result.changed.content).toBe(true);
    });

    it("handles string discountValue", () => {
      const recipe = createMockRecipe(
        [{ type: "discount_percentage", key: "discountValue", label: "Discount" }],
        { subheadline: "Get 10% off" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { discountValue: "30" as unknown as number }, // Test string handling
        contentConfig: { subheadline: "Get 10% off" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.discountConfig.value).toBe(30);
    });
  });

  describe("bundleDiscount input", () => {
    it("sets contentConfig.bundleDiscount and discountConfig.value", () => {
      const recipe = createMockRecipe(
        [{ type: "discount_percentage", key: "bundleDiscount", label: "Bundle Discount" }],
        { bundleDiscount: 10 }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { bundleDiscount: 20 },
        contentConfig: { bundleDiscount: 10 },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).bundleDiscount).toBe(20);
      expect(result.discountConfig.value).toBe(20);
      expect(result.changed.content).toBe(true);
      expect(result.changed.discount).toBe(true);
    });
  });

  describe("productSelectionMethod input", () => {
    it("sets productSelectionMethod to manual", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "productSelectionMethod", label: "Selection Method" }],
        { productSelectionMethod: "ai" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { productSelectionMethod: "manual" },
        contentConfig: { productSelectionMethod: "ai" },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).productSelectionMethod).toBe("manual");
    });

    it("clears selectedProducts and selectedCollection when set to ai", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "productSelectionMethod", label: "Selection Method" }],
        { productSelectionMethod: "manual", selectedProducts: [], selectedCollection: "" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { productSelectionMethod: "ai" },
        contentConfig: {
          productSelectionMethod: "manual",
          selectedProducts: ["prod1"],
          selectedCollection: "col1",
        },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).productSelectionMethod).toBe("ai");
      expect(getContent(result).selectedProducts).toBeUndefined();
      expect(getContent(result).selectedCollection).toBeUndefined();
    });
  });

  describe("triggerType input", () => {
    it("sets exit_intent trigger", () => {
      const recipe = createMockRecipe([
        { type: "select", key: "triggerType", label: "Trigger" },
      ]);
      const params = createDefaultParams({
        recipe,
        contextData: { triggerType: "exit_intent" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.targetingConfig.enhancedTriggers.exit_intent).toEqual({
        enabled: true,
        sensitivity: "medium",
      });
      expect(result.changed.targeting).toBe(true);
    });

    it("sets page_load trigger with default 5000ms delay", () => {
      const recipe = createMockRecipe([
        { type: "select", key: "triggerType", label: "Trigger" },
      ]);
      const params = createDefaultParams({
        recipe,
        contextData: { triggerType: "page_load" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.targetingConfig.enhancedTriggers.page_load).toEqual({
        enabled: true,
        delay: 5000,
      });
    });

    it("sets scroll_depth trigger with default 50%", () => {
      const recipe = createMockRecipe([
        { type: "select", key: "triggerType", label: "Trigger" },
      ]);
      const params = createDefaultParams({
        recipe,
        contextData: { triggerType: "scroll_depth" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.targetingConfig.enhancedTriggers.scroll_depth).toEqual({
        enabled: true,
        threshold: 50,
      });
    });

    it("sets page_load trigger", () => {
      const recipe = createMockRecipe([
        { type: "select", key: "triggerType", label: "Trigger" },
      ]);
      const params = createDefaultParams({
        recipe,
        contextData: { triggerType: "page_load" },
      });

      const result = applyQuickConfigToState(params);

      // page_load trigger includes delay (default 5000ms)
      expect(result.targetingConfig.enhancedTriggers.page_load).toMatchObject({
        enabled: true,
      });
    });
  });

  describe("threshold input", () => {
    it("sets cart_value trigger with threshold", () => {
      const recipe = createMockRecipe(
        [{ type: "currency_amount", key: "threshold", label: "Cart Threshold" }],
        { subheadline: "Spend $50+ to unlock" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { threshold: 100 },
        contentConfig: { subheadline: "Spend $50+ to unlock" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.targetingConfig.enhancedTriggers.cart_value).toEqual({
        enabled: true,
        min_value: 100,
      });
      expect(result.changed.targeting).toBe(true);
    });

    it("updates subheadline with new threshold value", () => {
      const recipe = createMockRecipe(
        [{ type: "currency_amount", key: "threshold", label: "Cart Threshold" }],
        { subheadline: "Spend $50+ to unlock" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { threshold: 100 },
        contentConfig: { subheadline: "Spend $50+ to unlock" },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).subheadline).toBe("Spend $100+ to unlock");
    });

    it("sets discountConfig.minimumAmount", () => {
      const recipe = createMockRecipe(
        [{ type: "currency_amount", key: "threshold", label: "Cart Threshold" }],
        { subheadline: "Spend $50+ to unlock" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { threshold: 75 },
        contentConfig: { subheadline: "Spend $50+ to unlock" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.discountConfig.minimumAmount).toBe(75);
      expect(result.changed.discount).toBe(true);
    });
  });

  describe("bannerPosition input", () => {
    it("sets designConfig.position", () => {
      const recipe = createMockRecipe([
        { type: "select", key: "bannerPosition", label: "Position" },
      ]);
      const params = createDefaultParams({
        recipe,
        contextData: { bannerPosition: "top" },
        designConfig: { position: "bottom" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.designConfig.position).toBe("top");
      expect(result.changed.design).toBe(true);
    });
  });

  describe("freeShippingThreshold input", () => {
    it("updates headline and subheadline with threshold value", () => {
      const recipe = createMockRecipe(
        [{ type: "currency_amount", key: "freeShippingThreshold", label: "Threshold" }],
        { headline: "Free shipping on $50+", subheadline: "Spend $50 for free shipping", threshold: 50 }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { freeShippingThreshold: 75 },
        contentConfig: {
          headline: "Free shipping on $50+",
          subheadline: "Spend $50 for free shipping",
          threshold: 50,
        },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).headline).toBe("Free shipping on $75+");
      expect(getContent(result).subheadline).toBe("Spend $75 for free shipping");
      expect(getContent(result).threshold).toBe(75);
    });
  });

  describe("topPrize input", () => {
    it("updates first wheelSegment with new prize value", () => {
      const recipe = createMockRecipe(
        [{ type: "discount_percentage", key: "topPrize", label: "Top Prize" }],
        {
          wheelSegments: [
            { id: "1", label: "10% OFF", probability: 0.1, discountConfig: { value: 10 } },
            { id: "2", label: "5% OFF", probability: 0.9, discountConfig: { value: 5 } },
          ],
        }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { topPrize: 50 },
        contentConfig: {
          wheelSegments: [
            { id: "1", label: "10% OFF", probability: 0.1, discountConfig: { value: 10 } },
            { id: "2", label: "5% OFF", probability: 0.9, discountConfig: { value: 5 } },
          ],
        },
      });

      const result = applyQuickConfigToState(params);
      const segments = (result.contentConfig as Record<string, unknown>).wheelSegments as Array<Record<string, unknown>>;

      expect(segments[0].label).toBe("50% OFF");
      expect((segments[0].discountConfig as Record<string, unknown>).value).toBe(50);
      expect(result.changed.content).toBe(true);
    });

    it("updates first prize in scratch card prizes array", () => {
      const recipe = createMockRecipe(
        [{ type: "discount_percentage", key: "topPrize", label: "Top Prize" }],
        {
          prizes: [
            { id: "1", label: "20% OFF", probability: 0.1, discountConfig: { value: 20 } },
            { id: "2", label: "10% OFF", probability: 0.9, discountConfig: { value: 10 } },
          ],
        }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { topPrize: 40 },
        contentConfig: {
          prizes: [
            { id: "1", label: "20% OFF", probability: 0.1, discountConfig: { value: 20 } },
            { id: "2", label: "10% OFF", probability: 0.9, discountConfig: { value: 10 } },
          ],
        },
      });

      const result = applyQuickConfigToState(params);
      const prizes = (result.contentConfig as Record<string, unknown>).prizes as Array<Record<string, unknown>>;

      expect(prizes[0].label).toBe("40% OFF");
      expect((prizes[0].discountConfig as Record<string, unknown>).value).toBe(40);
    });
  });

  describe("emailTiming input", () => {
    it("sets emailBeforeScratching to true when timing is before", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "emailTiming", label: "Email Timing" }],
        { emailBeforeScratching: false }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { emailTiming: "before" },
        contentConfig: { emailBeforeScratching: false },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).emailBeforeScratching).toBe(true);
    });

    it("sets emailBeforeScratching to false when timing is after", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "emailTiming", label: "Email Timing" }],
        { emailBeforeScratching: true }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { emailTiming: "after" },
        contentConfig: { emailBeforeScratching: true },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).emailBeforeScratching).toBe(false);
    });
  });

  describe("notificationType input", () => {
    it("enables purchase notifications when type is purchases", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "notificationType", label: "Notification Type" }],
        {
          enablePurchaseNotifications: false,
          enableVisitorNotifications: false,
          enableReviewNotifications: false,
        }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { notificationType: "purchases" },
        contentConfig: {},
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).enablePurchaseNotifications).toBe(true);
      expect(getContent(result).enableVisitorNotifications).toBe(false);
      expect(getContent(result).enableReviewNotifications).toBe(false);
    });

    it("enables all notifications when type is all", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "notificationType", label: "Notification Type" }],
        {
          enablePurchaseNotifications: false,
          enableVisitorNotifications: false,
          enableReviewNotifications: false,
        }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { notificationType: "all" },
        contentConfig: {},
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).enablePurchaseNotifications).toBe(true);
      expect(getContent(result).enableVisitorNotifications).toBe(true);
      expect(getContent(result).enableReviewNotifications).toBe(true);
    });

    it("does not override existing notification settings", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "notificationType", label: "Notification Type" }],
        {
          enablePurchaseNotifications: false,
          enableVisitorNotifications: false,
          enableReviewNotifications: false,
        }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { notificationType: "all" },
        contentConfig: {
          enablePurchaseNotifications: true,
          enableVisitorNotifications: false,
          enableReviewNotifications: false,
        },
      });

      const result = applyQuickConfigToState(params);

      // Should not change because enablePurchaseNotifications is already defined
      expect(getContent(result).enablePurchaseNotifications).toBe(true);
      expect(getContent(result).enableVisitorNotifications).toBe(false);
      expect(getContent(result).enableReviewNotifications).toBe(false);
    });
  });

  describe("displayFrequency input", () => {
    it("sets rotationInterval from displayFrequency", () => {
      const recipe = createMockRecipe(
        [{ type: "select", key: "displayFrequency", label: "Display Frequency" }],
        { rotationInterval: 5 }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { displayFrequency: "10" },
        contentConfig: { rotationInterval: 5 },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).rotationInterval).toBe(10);
    });
  });

  describe("durationHours input", () => {
    it("sets countdownDuration in seconds from hours", () => {
      const recipe = createMockRecipe(
        [{ type: "duration_hours", key: "durationHours", label: "Duration" }],
        { countdownDuration: 3600 }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { durationHours: 2 },
        contentConfig: { countdownDuration: 3600 },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).countdownDuration).toBe(7200); // 2 hours = 7200 seconds
    });

    it("updates timer.durationSeconds when timer exists", () => {
      const recipe = createMockRecipe(
        [{ type: "duration_hours", key: "durationHours", label: "Duration" }],
        { timer: { enabled: true, durationSeconds: 3600 } }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { durationHours: 4 },
        contentConfig: { timer: { enabled: true, durationSeconds: 3600 } },
      });

      const result = applyQuickConfigToState(params);
      const timer = (result.contentConfig as Record<string, unknown>).timer as Record<string, unknown>;

      expect(timer.durationSeconds).toBe(14400); // 4 hours = 14400 seconds
    });
  });

  describe("selectedProducts context", () => {
    it("sets selectedProducts from context and defaults productSelectionMethod to manual", () => {
      const recipe = createMockRecipe([], { productSelectionMethod: "ai" });
      const params = createDefaultParams({
        recipe,
        contextData: { selectedProducts: ["prod1", "prod2"] },
        contentConfig: { productSelectionMethod: "ai" },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).selectedProducts).toEqual([
        "prod1",
        "prod2",
      ]);
      expect(getContent(result).productSelectionMethod).toBe("manual");
    });

    it("handles object array with id property", () => {
      const recipe = createMockRecipe([], { productSelectionMethod: "ai" });
      const params = createDefaultParams({
        recipe,
        contextData: { selectedProducts: [{ id: "prod1" }, { id: "prod2" }] },
        contentConfig: { productSelectionMethod: "ai" },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).selectedProducts).toEqual([
        "prod1",
        "prod2",
      ]);
    });
  });

  describe("selectedCollection context", () => {
    it("sets selectedCollection from context and defaults productSelectionMethod to collection", () => {
      const recipe = createMockRecipe([], { productSelectionMethod: "ai" });
      const params = createDefaultParams({
        recipe,
        contextData: { selectedCollection: ["col1"] },
        contentConfig: { productSelectionMethod: "ai" },
      });

      const result = applyQuickConfigToState(params);

      expect(getContent(result).selectedCollection).toBe("col1");
      expect(getContent(result).productSelectionMethod).toBe("collection");
    });
  });

  describe("changed flags", () => {
    it("returns all false when no changes made", () => {
      const params = createDefaultParams({});

      const result = applyQuickConfigToState(params);

      expect(result.changed.content).toBe(false);
      expect(result.changed.design).toBe(false);
      expect(result.changed.targeting).toBe(false);
      expect(result.changed.discount).toBe(false);
    });

    it("returns correct flags for mixed changes", () => {
      const recipe = createMockRecipe(
        [
          { type: "discount_percentage", key: "discountValue", label: "Discount" },
          { type: "select", key: "bannerPosition", label: "Position" },
        ],
        { subheadline: "Get 10% off" }
      );
      const params = createDefaultParams({
        recipe,
        contextData: { discountValue: 20, bannerPosition: "top" },
        contentConfig: { subheadline: "Get 10% off" },
        designConfig: { position: "bottom" },
      });

      const result = applyQuickConfigToState(params);

      expect(result.changed.content).toBe(true);
      expect(result.changed.design).toBe(true);
      expect(result.changed.targeting).toBe(false);
      expect(result.changed.discount).toBe(true);
    });
  });
});

