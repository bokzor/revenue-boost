/**
 * Unit Tests for Demo Configs
 *
 * Tests the marketing demo configurations for all template types.
 */

import { describe, it, expect } from "vitest";

import {
  DEMO_CONFIGS,
  getDemoConfig,
  getAllDemoConfigs,
  TEMPLATE_MARKETING_INFO,
} from "~/shared/preview/demo-configs";

describe("Demo Configs", () => {
  describe("DEMO_CONFIGS", () => {
    it("should have configs for all 15 template types", () => {
      const templateTypes = [
        "NEWSLETTER", "SPIN_TO_WIN", "SCRATCH_CARD", "FLASH_SALE",
        "COUNTDOWN_TIMER", "FREE_SHIPPING", "CART_ABANDONMENT",
        "PRODUCT_UPSELL", "SOCIAL_PROOF", "ANNOUNCEMENT", "EXIT_INTENT",
        "CLASSIC_UPSELL", "MINIMAL_SLIDE_UP", "PREMIUM_FULLSCREEN", "COUNTDOWN_URGENCY",
      ];

      templateTypes.forEach((type) => {
        expect(DEMO_CONFIGS[type as keyof typeof DEMO_CONFIGS]).toBeDefined();
      });
    });

    it("should have content and design for each config", () => {
      Object.values(DEMO_CONFIGS).forEach((config) => {
        expect(config.content).toBeDefined();
        expect(config.design).toBeDefined();
      });
    });

    it("should have previewMode enabled for all configs", () => {
      Object.values(DEMO_CONFIGS).forEach((config) => {
        expect(config.design.previewMode).toBe(true);
      });
    });

    it("should have showBranding disabled for marketing", () => {
      Object.values(DEMO_CONFIGS).forEach((config) => {
        expect(config.design.showBranding).toBe(false);
      });
    });

    it("NEWSLETTER config should have email-related content", () => {
      const config = DEMO_CONFIGS.NEWSLETTER;
      expect(config.content.headline).toBeDefined();
      expect(config.content.emailPlaceholder).toBeDefined();
      expect(config.content.submitButtonText).toBeDefined();
    });

    it("SPIN_TO_WIN config should have wheel segments", () => {
      const config = DEMO_CONFIGS.SPIN_TO_WIN;
      expect(config.content.wheelSegments).toBeDefined();
      expect(Array.isArray(config.content.wheelSegments)).toBe(true);
      expect((config.content.wheelSegments as unknown[]).length).toBeGreaterThan(0);
    });

    it("FREE_SHIPPING config should have threshold", () => {
      const config = DEMO_CONFIGS.FREE_SHIPPING;
      expect(config.content.threshold).toBeDefined();
      expect(typeof config.content.threshold).toBe("number");
    });
  });

  describe("getDemoConfig", () => {
    it("should return config for valid template type", () => {
      const config = getDemoConfig("NEWSLETTER");
      expect(config).toBe(DEMO_CONFIGS.NEWSLETTER);
    });

    it("should return NEWSLETTER config for unknown type", () => {
      // @ts-expect-error - Testing invalid input
      const config = getDemoConfig("UNKNOWN_TYPE");
      expect(config).toBe(DEMO_CONFIGS.NEWSLETTER);
    });
  });

  describe("getAllDemoConfigs", () => {
    it("should return array of all configs with templateType", () => {
      const configs = getAllDemoConfigs();

      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBe(Object.keys(DEMO_CONFIGS).length);

      configs.forEach((config) => {
        expect(config.templateType).toBeDefined();
        expect(config.content).toBeDefined();
        expect(config.design).toBeDefined();
      });
    });
  });

  describe("TEMPLATE_MARKETING_INFO", () => {
    it("should have info for all template types", () => {
      const templateTypes = Object.keys(DEMO_CONFIGS);

      templateTypes.forEach((type) => {
        expect(TEMPLATE_MARKETING_INFO[type as keyof typeof TEMPLATE_MARKETING_INFO]).toBeDefined();
      });
    });

    it("should have title, description, and category for each", () => {
      Object.values(TEMPLATE_MARKETING_INFO).forEach((info) => {
        expect(info.title).toBeDefined();
        expect(typeof info.title).toBe("string");
        expect(info.description).toBeDefined();
        expect(typeof info.description).toBe("string");
        expect(info.category).toBeDefined();
        expect(typeof info.category).toBe("string");
      });
    });

    it("should have meaningful categories", () => {
      const validCategories = [
        "Lead Generation", "Gamification", "Sales & Urgency",
        "Conversion", "Trust & Social", "Communication",
      ];

      Object.values(TEMPLATE_MARKETING_INFO).forEach((info) => {
        expect(validCategories).toContain(info.category);
      });
    });
  });
});

