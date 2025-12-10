/**
 * Unit Tests for Wizard Defaults
 *
 * Tests the default state factory functions for the campaign wizard.
 */

import { describe, it, expect } from "vitest";

import {
  getDefaultPopupDesign,
  getDefaultEnhancedTriggers,
  getDefaultAudienceTargeting,
  getDefaultPageTargeting,
  getDefaultGeoTargeting,
  getDefaultFrequencyCapping,
  getDefaultDiscountConfig,
  createDefaultCampaignData,
} from "~/shared/hooks/wizard/defaults";

describe("Wizard Defaults", () => {
  describe("getDefaultPopupDesign", () => {
    it("should return default popup design values", () => {
      const design = getDefaultPopupDesign();

      expect(design.backgroundColor).toBe("#ffffff");
      expect(design.textColor).toBe("#000000");
      expect(design.buttonColor).toBe("#007ace");
      expect(design.buttonTextColor).toBe("#ffffff");
      expect(design.position).toBe("center");
      expect(design.size).toBe("medium");
      expect(design.showCloseButton).toBe(true);
      expect(design.overlayOpacity).toBe(0.8);
    });
  });

  describe("getDefaultEnhancedTriggers", () => {
    it("should return default trigger configuration", () => {
      const triggers = getDefaultEnhancedTriggers();

      expect(triggers.page_load.enabled).toBe(true);
      expect(triggers.page_load.delay).toBe(3000);
      expect(triggers.exit_intent.enabled).toBe(false);
      expect(triggers.scroll_depth.enabled).toBe(false);
      expect(triggers.idle_timer.enabled).toBe(false);
    });
  });

  describe("getDefaultAudienceTargeting", () => {
    it("should return disabled audience targeting by default", () => {
      const targeting = getDefaultAudienceTargeting();

      expect(targeting.enabled).toBe(false);
      expect(targeting.shopifySegmentIds).toEqual([]);
      expect(targeting.sessionRules.enabled).toBe(false);
    });
  });

  describe("getDefaultPageTargeting", () => {
    it("should return disabled page targeting by default", () => {
      const targeting = getDefaultPageTargeting();

      expect(targeting.enabled).toBe(false);
      expect(targeting.pages).toEqual([]);
      expect(targeting.customPatterns).toEqual([]);
      expect(targeting.excludePages).toEqual([]);
    });
  });

  describe("getDefaultGeoTargeting", () => {
    it("should return disabled geo targeting by default", () => {
      const targeting = getDefaultGeoTargeting();

      expect(targeting.enabled).toBe(false);
      expect(targeting.mode).toBe("include");
      expect(targeting.countries).toEqual([]);
    });
  });

  describe("getDefaultFrequencyCapping", () => {
    it("should return default frequency capping without template type", () => {
      const capping = getDefaultFrequencyCapping();

      expect(capping.enabled).toBe(true);
      expect(capping.max_triggers_per_session).toBe(1);
      expect(capping.max_triggers_per_day).toBe(3);
      expect(capping.cooldown_between_triggers).toBe(86400);
    });

    it("should return template-specific defaults when type provided", () => {
      const capping = getDefaultFrequencyCapping("NEWSLETTER");
      expect(capping).toBeDefined();
      expect(capping.enabled).toBeDefined();
    });
  });

  describe("getDefaultDiscountConfig", () => {
    it("should return default discount config", () => {
      const config = getDefaultDiscountConfig();

      expect(config.enabled).toBe(false);
      expect(config.showInPreview).toBe(true);
      expect(config.type).toBe("shared");
      expect(config.valueType).toBe("PERCENTAGE");
      expect(config.value).toBe(10);
    });

    it("should merge with initial data", () => {
      const config = getDefaultDiscountConfig({
        discountConfig: { enabled: true, value: 20 },
      });

      expect(config.enabled).toBe(true);
      expect(config.value).toBe(20);
    });
  });

  describe("createDefaultCampaignData", () => {
    it("should create complete default campaign data", () => {
      const data = createDefaultCampaignData();

      expect(data.contentConfig).toEqual({});
      expect(data.designConfig).toBeDefined();
      expect(data.status).toBe("DRAFT");
      expect(data.priority).toBe(1);
      expect(data.triggerType).toBe("page_load");
      expect(data.enhancedTriggers).toBeDefined();
      expect(data.audienceTargeting).toBeDefined();
      expect(data.pageTargeting).toBeDefined();
      expect(data.geoTargeting).toBeDefined();
      expect(data.frequencyCapping).toBeDefined();
      expect(data.discountConfig).toBeDefined();
    });

    it("should merge with initial data", () => {
      const data = createDefaultCampaignData({
        status: "ACTIVE",
        priority: 5,
      });

      expect(data.status).toBe("ACTIVE");
      expect(data.priority).toBe(5);
    });
  });
});

