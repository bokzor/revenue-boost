/**
 * Quick Config Transformer
 *
 * Extracts the core logic for applying quick configuration context data
 * to campaign form state. This keeps the preview and saved data in sync
 * with quick inputs (discount sliders, selection method, product/collection pickers, etc.)
 */

import type { StyledRecipe, RecipeContext } from "../recipes/styled-recipe-types";
import type { ContentConfig, DesignConfig, DiscountConfig } from "../types/campaign";
import type { TargetingConfig } from "../components/unified/FormSections";
import { DEFAULT_DISCOUNT_CONFIG } from "../components/unified/defaults";

export interface QuickConfigApplyResult {
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  targetingConfig: TargetingConfig;
  discountConfig: DiscountConfig;
  changed: {
    content: boolean;
    design: boolean;
    targeting: boolean;
    discount: boolean;
  };
}

/**
 * Extract product/collection IDs from quick config picker values.
 * Handles various formats: string[], {id: string}[], {ids: string[]}
 */
export function extractIds(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (typeof value[0] === "string") {
      return (value as string[]).filter(Boolean);
    }
    return (value as Array<{ id?: string }>).map((item) => item.id).filter(Boolean) as string[];
  }

  if (typeof value === "object" && value !== null && "ids" in value) {
    const ids = (value as { ids?: string[] }).ids || [];
    return ids.filter(Boolean);
  }

  return [];
}

/**
 * Compare two values for equality (handles arrays and simple objects)
 */
export function valuesAreEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => item === b[idx]);
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return a === b;
}

export interface ApplyQuickConfigParams {
  recipe?: StyledRecipe;
  contextData: RecipeContext;
  contentConfig: Partial<ContentConfig>;
  designConfig: Partial<DesignConfig>;
  targetingConfig: TargetingConfig;
  discountConfig: DiscountConfig;
}

/**
 * Apply quick configuration context data to campaign state.
 *
 * Maps quick input keys to their corresponding form fields:
 * - discountValue → discountConfig.value, updates subheadline text
 * - bundleDiscount → contentConfig.bundleDiscount, discountConfig.value
 * - productSelectionMethod → contentConfig.productSelectionMethod, clears related fields
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
export function applyQuickConfigToState({
  recipe,
  contextData,
  contentConfig,
  designConfig,
  targetingConfig,
  discountConfig,
}: ApplyQuickConfigParams): QuickConfigApplyResult {
  const contentDefaults = (recipe?.defaults.contentConfig || {}) as Record<string, unknown>;
  const recipeDiscountDefaults = (recipe?.defaults.discountConfig || {}) as Partial<DiscountConfig>;

  const nextContent: Partial<ContentConfig> = { ...contentConfig };
  const nextDesign: Partial<DesignConfig> = { ...designConfig };
  const nextTargeting: TargetingConfig = {
    audienceTargeting:
      targetingConfig?.audienceTargeting || { enabled: false, shopifySegmentIds: [] },
    geoTargeting:
      targetingConfig?.geoTargeting || { enabled: false, mode: "include", countries: [] },
    enhancedTriggers: targetingConfig?.enhancedTriggers || {},
    pageTargeting: targetingConfig?.pageTargeting,
  };
  let nextDiscount: DiscountConfig = { ...DEFAULT_DISCOUNT_CONFIG, ...discountConfig };

  let contentChanged = false;
  let designChanged = false;
  let targetingChanged = false;
  let discountChanged = false;

  const contentHasKey = (key: string) =>
    key in nextContent || key in contentDefaults || key in (recipe?.defaults.contentConfig || {});

  const setContentField = (key: string, value: unknown) => {
    if (!contentHasKey(key)) return;
    if (!valuesAreEqual((nextContent as Record<string, unknown>)[key], value)) {
      (nextContent as Record<string, unknown>)[key] = value as never;
      contentChanged = true;
    }
  };

  const ensureDiscountEnabled = () => {
    discountChanged = true;
    nextDiscount = {
      ...nextDiscount,
      enabled: true,
      strategy: nextDiscount.strategy || recipeDiscountDefaults.strategy || "simple",
      type: nextDiscount.type || recipeDiscountDefaults.type || "shared",
      valueType: nextDiscount.valueType || recipeDiscountDefaults.valueType || "PERCENTAGE",
      behavior:
        nextDiscount.behavior ||
        recipeDiscountDefaults.behavior ||
        ("SHOW_CODE_AND_AUTO_APPLY" as const),
      showInPreview: nextDiscount.showInPreview ?? true,
    };
  };

  const setDiscountValue = (value: number | undefined) => {
    if (value === undefined || Number.isNaN(value)) return;
    ensureDiscountEnabled();
    if (nextDiscount.value !== value) {
      nextDiscount = { ...nextDiscount, value };
    }
  };

  const updateTriggersFromType = (triggerType: string) => {
    const triggers = {
      ...(nextTargeting.enhancedTriggers as Record<string, unknown>),
    };

    const disableAll = () => {
      ["page_load", "exit_intent", "scroll_depth"].forEach((key) => {
        triggers[key] = { ...(triggers[key] as Record<string, unknown>), enabled: false };
      });
    };

    disableAll();

    if (triggerType === "page_load") {
      // Use existing delay or default to 5000ms (5 seconds)
      const currentDelay =
        (triggers.page_load as Record<string, unknown> | undefined)?.delay || 5000;
      triggers.page_load = { enabled: true, delay: currentDelay };
    } else if (triggerType === "exit_intent") {
      triggers.exit_intent = { enabled: true, sensitivity: "medium" };
    } else if (triggerType === "scroll_depth") {
      triggers.scroll_depth = { enabled: true, threshold: 50 };
    }

    nextTargeting.enhancedTriggers = triggers as TargetingConfig["enhancedTriggers"];
    targetingChanged = true;
  };

  const setCartValueTrigger = (minValue: number) => {
    const triggers = {
      ...(nextTargeting.enhancedTriggers as Record<string, unknown>),
    };
    triggers.cart_value = {
      ...(triggers.cart_value as Record<string, unknown>),
      enabled: true,
      min_value: minValue,
    };
    nextTargeting.enhancedTriggers = triggers as TargetingConfig["enhancedTriggers"];
    targetingChanged = true;
  };

  // Apply each recipe input
  recipe?.inputs.forEach((input) => {
    const value = contextData[input.key];
    if (value === undefined) return;

    switch (input.key) {
      case "discountValue": {
        const numericValue = typeof value === "string" ? parseFloat(value) : (value as number);
        setDiscountValue(numericValue);
        const contentRecord = nextContent as Record<string, unknown>;
        if (typeof contentRecord.subheadline === "string") {
          contentRecord.subheadline = contentRecord.subheadline.replace(/\d+%/, `${numericValue}%`);
          contentChanged = true;
        }
        break;
      }
      case "bundleDiscount": {
        const numericValue = typeof value === "string" ? parseFloat(value) : (value as number);
        setContentField("bundleDiscount", numericValue);
        setDiscountValue(numericValue);
        break;
      }
      case "productSelectionMethod": {
        const method = value as string;
        setContentField("productSelectionMethod", method);
        if (method === "ai") {
          setContentField("selectedProducts", undefined);
          setContentField("selectedCollection", undefined);
        } else if (method === "collection") {
          setContentField("selectedProducts", undefined);
        }
        break;
      }
      case "triggerType":
        updateTriggersFromType(value as string);
        break;
      case "threshold": {
        const thresholdValue =
          typeof value === "string" ? parseFloat(value) : (value as number | undefined);
        if (thresholdValue !== undefined && !Number.isNaN(thresholdValue)) {
          setCartValueTrigger(thresholdValue);
          const contentRecord = nextContent as Record<string, unknown>;
          if (typeof contentRecord.subheadline === "string") {
            contentRecord.subheadline = contentRecord.subheadline.replace(
              /\$\d+\+?/,
              `$${thresholdValue}+`
            );
            contentChanged = true;
          }
          if (nextDiscount.minimumAmount !== thresholdValue) {
            nextDiscount = { ...nextDiscount, minimumAmount: thresholdValue };
            discountChanged = true;
          }
        }
        break;
      }
      case "bannerPosition": {
        const position = value as string;
        if (nextDesign.position !== position) {
          nextDesign.position = position as DesignConfig["position"];
          designChanged = true;
        }
        break;
      }
      case "freeShippingThreshold": {
        const thresholdValue =
          typeof value === "string" ? parseFloat(value) : (value as number | undefined);
        if (thresholdValue !== undefined && !Number.isNaN(thresholdValue)) {
          const contentRecord = nextContent as Record<string, unknown>;
          if (typeof contentRecord.subheadline === "string") {
            contentRecord.subheadline = contentRecord.subheadline.replace(
              /\$\d+/,
              `$${thresholdValue}`
            );
            contentChanged = true;
          }
          if (typeof contentRecord.headline === "string") {
            contentRecord.headline = contentRecord.headline.replace(/\$\d+/, `$${thresholdValue}`);
            contentChanged = true;
          }
          setContentField("threshold", thresholdValue);
        }
        break;
      }
      case "topPrize": {
        const numericValue = typeof value === "string" ? parseFloat(value) : (value as number);
        if (Array.isArray((nextContent as Record<string, unknown>).wheelSegments)) {
          const segments = [
            ...((nextContent as Record<string, unknown>).wheelSegments as Array<
              Record<string, unknown>
            >),
          ];
          if (segments[0]) {
            segments[0] = {
              ...segments[0],
              label: `${numericValue}% OFF`,
              discountConfig: {
                ...(segments[0].discountConfig as Record<string, unknown>),
                value: numericValue,
              },
            };
            (nextContent as Record<string, unknown>).wheelSegments = segments;
            contentChanged = true;
          }
        }
        if (Array.isArray((nextContent as Record<string, unknown>).prizes)) {
          const prizes = [
            ...((nextContent as Record<string, unknown>).prizes as Array<Record<string, unknown>>),
          ];
          if (prizes[0]) {
            prizes[0] = {
              ...prizes[0],
              label: `${numericValue}% OFF`,
              discountConfig: {
                ...(prizes[0].discountConfig as Record<string, unknown>),
                value: numericValue,
              },
            };
            (nextContent as Record<string, unknown>).prizes = prizes;
            contentChanged = true;
          }
        }
        break;
      }
      case "emailTiming": {
        const timing = value as string;
        setContentField("emailBeforeScratching", timing === "before");
        break;
      }
      case "notificationType": {
        // Only apply notificationType on initial load
        const currentPurchase = (nextContent as Record<string, unknown>).enablePurchaseNotifications;
        const currentVisitor = (nextContent as Record<string, unknown>).enableVisitorNotifications;
        const currentReview = (nextContent as Record<string, unknown>).enableReviewNotifications;

        const isInitialSetup = currentPurchase === undefined &&
                               currentVisitor === undefined &&
                               currentReview === undefined;

        if (isInitialSetup) {
          const notificationType = value as string;
          setContentField(
            "enablePurchaseNotifications",
            notificationType === "purchases" || notificationType === "all"
          );
          setContentField(
            "enableVisitorNotifications",
            notificationType === "visitors" || notificationType === "all"
          );
          setContentField(
            "enableReviewNotifications",
            notificationType === "reviews" || notificationType === "all"
          );
        }
        break;
      }
      case "displayFrequency": {
        const frequencyValue = parseInt(value as string, 10);
        if (!Number.isNaN(frequencyValue)) {
          setContentField("rotationInterval", frequencyValue);
        }
        break;
      }
      case "durationHours": {
        const hours = typeof value === "string" ? parseFloat(value) : (value as number);
        if (!Number.isNaN(hours)) {
          if (
            "countdownDuration" in nextContent ||
            "countdownDuration" in (recipe?.defaults.contentConfig || {})
          ) {
            setContentField("countdownDuration", Math.round(hours * 3600));
          }
          if ((nextContent as Record<string, unknown>).timer) {
            const timer = {
              ...(nextContent as Record<string, unknown>).timer as Record<string, unknown>,
              durationSeconds: Math.round(hours * 3600),
            };
            setContentField("timer", timer);
          }
        }
        break;
      }
      default: {
        // Generic mapping: if the content config has this key, set it
        setContentField(input.key, value);
      }
    }
  });

  // Apply selected products/collections from quick pickers (outside recipe.inputs)
  // These fields are set directly on nextContent (bypassing contentHasKey check)
  // because they may not be in recipe defaults but are valid content fields
  const selectedProducts = contextData.selectedProducts;
  const selectedCollections = contextData.selectedCollection;

  const productIds = extractIds(selectedProducts);
  if (productIds.length > 0) {
    if (!valuesAreEqual((nextContent as Record<string, unknown>).selectedProducts, productIds)) {
      (nextContent as Record<string, unknown>).selectedProducts = productIds;
      contentChanged = true;
    }
    if (!contextData.productSelectionMethod) {
      setContentField("productSelectionMethod", "manual");
    }
  }

  const collectionIds = extractIds(selectedCollections);
  if (collectionIds.length > 0) {
    if (!valuesAreEqual((nextContent as Record<string, unknown>).selectedCollection, collectionIds[0])) {
      (nextContent as Record<string, unknown>).selectedCollection = collectionIds[0];
      contentChanged = true;
    }
    if (!contextData.productSelectionMethod) {
      setContentField("productSelectionMethod", "collection");
    }
  }

  return {
    contentConfig: nextContent,
    designConfig: nextDesign,
    targetingConfig: nextTargeting,
    discountConfig: nextDiscount,
    changed: {
      content: contentChanged,
      design: designChanged,
      targeting: targetingChanged,
      discount: discountChanged,
    },
  };
}

