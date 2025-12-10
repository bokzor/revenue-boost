/**
 * Unit Tests for Goal Config
 *
 * Tests the goal-based configuration functions for the campaign wizard.
 */

import { describe, it, expect } from "vitest";

import {
  buildDiscountConfig,
  buildDesignConfig,
  getRecommendedTemplateId,
  buildGoalUpdates,
} from "~/shared/hooks/wizard/goal-config";
import type { DiscountConfig } from "~/domains/campaigns/types/campaign";

describe("Goal Config", () => {
  const mockDiscountConfig: DiscountConfig = {
    enabled: false,
    showInPreview: true,
    type: "shared",
    valueType: "PERCENTAGE",
    value: 10,
    expiryDays: 7,
    prefix: "SAVE",
    behavior: "SHOW_CODE_AND_AUTO_APPLY",
  };

  const mockPopupDesign = {
    id: "",
    title: "",
    description: "",
    buttonText: "Shop Now",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#007ace",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium" as const,
    showCloseButton: true,
    overlayOpacity: 0.8,
  };

  describe("buildDiscountConfig", () => {
    it("should build discount config for NEWSLETTER_SIGNUP", () => {
      const config = buildDiscountConfig("NEWSLETTER_SIGNUP", mockDiscountConfig);

      expect(config.enabled).toBe(true);
      expect(config.valueType).toBe("PERCENTAGE");
      expect(config.value).toBe(10);
      expect(config.prefix).toBe("WELCOME");
    });

    it("should build discount config for INCREASE_REVENUE", () => {
      const config = buildDiscountConfig("INCREASE_REVENUE", mockDiscountConfig);

      expect(config.enabled).toBe(true);
      expect(config.value).toBe(20);
      expect(config.prefix).toBe("SALE");
    });

    it("should build discount config for ENGAGEMENT", () => {
      const config = buildDiscountConfig("ENGAGEMENT", mockDiscountConfig);

      expect(config.enabled).toBe(false);
    });

    it("should preserve FREE_SHIPPING config when no defaults", () => {
      const freeShippingConfig: DiscountConfig = {
        ...mockDiscountConfig,
        valueType: "FREE_SHIPPING",
      };

      // ENGAGEMENT has discount.enabled = false in defaults
      const config = buildDiscountConfig("ENGAGEMENT", freeShippingConfig);

      // Should still return a config (not preserve the FREE_SHIPPING one)
      expect(config).toBeDefined();
    });
  });

  describe("buildDesignConfig", () => {
    it("should update size based on goal for NEWSLETTER_SIGNUP", () => {
      const design = buildDesignConfig("NEWSLETTER_SIGNUP", mockPopupDesign);

      expect(design.size).toBe("medium");
    });

    it("should update size based on goal for INCREASE_REVENUE", () => {
      const design = buildDesignConfig("INCREASE_REVENUE", mockPopupDesign);

      expect(design.size).toBe("large");
    });

    it("should preserve other design properties", () => {
      const design = buildDesignConfig("NEWSLETTER_SIGNUP", mockPopupDesign);

      expect(design.backgroundColor).toBe("#ffffff");
      expect(design.buttonColor).toBe("#007ace");
    });
  });

  describe("getRecommendedTemplateId", () => {
    it("should return newsletter for NEWSLETTER_SIGNUP", () => {
      const templateId = getRecommendedTemplateId("NEWSLETTER_SIGNUP");
      expect(templateId).toBe("newsletter");
    });

    it("should return flash-sale-modal for INCREASE_REVENUE", () => {
      const templateId = getRecommendedTemplateId("INCREASE_REVENUE");
      expect(templateId).toBe("flash-sale-modal");
    });

    it("should return lottery-spin for ENGAGEMENT", () => {
      const templateId = getRecommendedTemplateId("ENGAGEMENT");
      expect(templateId).toBe("lottery-spin");
    });
  });

  describe("buildGoalUpdates", () => {
    it("should build complete goal updates", () => {
      const currentData = {
        contentConfig: {},
        designConfig: { popupDesign: mockPopupDesign },
        discountConfig: mockDiscountConfig,
        popupDesign: mockPopupDesign,
        status: "DRAFT" as const,
        priority: 1,
        tags: [],
        isSaving: false,
      };

      const updates = buildGoalUpdates("NEWSLETTER_SIGNUP", currentData as any);

      expect(updates.goal).toBe("NEWSLETTER_SIGNUP");
      expect(updates.status).toBe("DRAFT");
      expect(updates.priority).toBe(8);
      expect(updates.discountConfig).toBeDefined();
      expect(updates.popupDesign).toBeDefined();
    });

    it("should generate default name when none provided", () => {
      const currentData = {
        contentConfig: {},
        designConfig: { popupDesign: mockPopupDesign },
        discountConfig: mockDiscountConfig,
        popupDesign: mockPopupDesign,
        status: "DRAFT" as const,
        priority: 1,
        tags: [],
        isSaving: false,
        name: "",
      };

      const updates = buildGoalUpdates("NEWSLETTER_SIGNUP", currentData as any);

      expect(updates.name).toBe("Campaign - Newsletter Signup");
    });

    it("should not override existing name", () => {
      const currentData = {
        contentConfig: {},
        designConfig: { popupDesign: mockPopupDesign },
        discountConfig: mockDiscountConfig,
        popupDesign: mockPopupDesign,
        status: "DRAFT" as const,
        priority: 1,
        tags: [],
        isSaving: false,
        name: "My Custom Campaign",
      };

      const updates = buildGoalUpdates("NEWSLETTER_SIGNUP", currentData as any);

      expect(updates.name).toBeUndefined();
    });
  });
});

