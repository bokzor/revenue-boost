/**
 * Unit Tests for Campaign Types
 */

import { describe, it, expect } from "vitest";

import {
  CampaignGoalSchema,
  CampaignStatusSchema,
  TemplateTypeSchema,
  DiscountTypeSchema,
  DiscountValueTypeSchema,
  DiscountBehaviorSchema,
  DiscountStrategySchema,
  ContentDiscountTypeSchema,
  LeadCaptureConfigSchema,
  DiscountConfigSchema,
} from "~/domains/campaigns/types/campaign";

describe("Campaign Types", () => {
  describe("CampaignGoalSchema", () => {
    it("should accept valid goals", () => {
      expect(CampaignGoalSchema.parse("NEWSLETTER_SIGNUP")).toBe("NEWSLETTER_SIGNUP");
      expect(CampaignGoalSchema.parse("INCREASE_REVENUE")).toBe("INCREASE_REVENUE");
      expect(CampaignGoalSchema.parse("ENGAGEMENT")).toBe("ENGAGEMENT");
    });

    it("should reject invalid goals", () => {
      expect(() => CampaignGoalSchema.parse("INVALID")).toThrow();
    });
  });

  describe("CampaignStatusSchema", () => {
    it("should accept valid statuses", () => {
      expect(CampaignStatusSchema.parse("DRAFT")).toBe("DRAFT");
      expect(CampaignStatusSchema.parse("ACTIVE")).toBe("ACTIVE");
      expect(CampaignStatusSchema.parse("PAUSED")).toBe("PAUSED");
      expect(CampaignStatusSchema.parse("ARCHIVED")).toBe("ARCHIVED");
    });

    it("should reject invalid statuses", () => {
      expect(() => CampaignStatusSchema.parse("INVALID")).toThrow();
    });
  });

  describe("TemplateTypeSchema", () => {
    it("should accept all valid template types", () => {
      const validTypes = [
        "NEWSLETTER",
        "SPIN_TO_WIN",
        "FLASH_SALE",
        "FREE_SHIPPING",
        "EXIT_INTENT",
        "CART_ABANDONMENT",
        "PRODUCT_UPSELL",
        "SOCIAL_PROOF",
        "COUNTDOWN_TIMER",
        "SCRATCH_CARD",
        "ANNOUNCEMENT",
        "CLASSIC_UPSELL",
        "MINIMAL_SLIDE_UP",
        "PREMIUM_FULLSCREEN",
        "COUNTDOWN_URGENCY",
      ];
      validTypes.forEach((type) => {
        expect(TemplateTypeSchema.parse(type)).toBe(type);
      });
    });

    it("should reject invalid template types", () => {
      expect(() => TemplateTypeSchema.parse("INVALID")).toThrow();
    });
  });

  describe("DiscountTypeSchema", () => {
    it("should accept valid discount types", () => {
      expect(DiscountTypeSchema.parse("shared")).toBe("shared");
      expect(DiscountTypeSchema.parse("single_use")).toBe("single_use");
    });
  });

  describe("DiscountValueTypeSchema", () => {
    it("should accept valid value types", () => {
      expect(DiscountValueTypeSchema.parse("PERCENTAGE")).toBe("PERCENTAGE");
      expect(DiscountValueTypeSchema.parse("FIXED_AMOUNT")).toBe("FIXED_AMOUNT");
      expect(DiscountValueTypeSchema.parse("FREE_SHIPPING")).toBe("FREE_SHIPPING");
    });
  });

  describe("DiscountBehaviorSchema", () => {
    it("should accept valid behaviors", () => {
      expect(DiscountBehaviorSchema.parse("SHOW_CODE_AND_AUTO_APPLY")).toBe(
        "SHOW_CODE_AND_AUTO_APPLY"
      );
      expect(DiscountBehaviorSchema.parse("SHOW_CODE_ONLY")).toBe("SHOW_CODE_ONLY");
      expect(DiscountBehaviorSchema.parse("SHOW_CODE_AND_ASSIGN_TO_EMAIL")).toBe(
        "SHOW_CODE_AND_ASSIGN_TO_EMAIL"
      );
    });
  });

  describe("DiscountStrategySchema", () => {
    it("should accept valid strategies", () => {
      expect(DiscountStrategySchema.parse("simple")).toBe("simple");
      expect(DiscountStrategySchema.parse("bundle")).toBe("bundle");
      expect(DiscountStrategySchema.parse("tiered")).toBe("tiered");
      expect(DiscountStrategySchema.parse("bogo")).toBe("bogo");
      expect(DiscountStrategySchema.parse("free_gift")).toBe("free_gift");
    });
  });

  describe("ContentDiscountTypeSchema", () => {
    it("should accept valid content discount types", () => {
      expect(ContentDiscountTypeSchema.parse("percentage")).toBe("percentage");
      expect(ContentDiscountTypeSchema.parse("fixed_amount")).toBe("fixed_amount");
      expect(ContentDiscountTypeSchema.parse("free_shipping")).toBe("free_shipping");
    });
  });

  describe("LeadCaptureConfigSchema", () => {
    it("should accept valid config with defaults", () => {
      const result = LeadCaptureConfigSchema.parse({});
      expect(result.emailRequired).toBe(true);
      expect(result.emailPlaceholder).toBe("Enter your email");
      expect(result.nameFieldEnabled).toBe(false);
      expect(result.consentFieldEnabled).toBe(false);
    });

    it("should accept custom values", () => {
      const result = LeadCaptureConfigSchema.parse({
        emailRequired: false,
        nameFieldEnabled: true,
        nameFieldRequired: true,
        consentFieldEnabled: true,
        privacyPolicyUrl: "https://example.com/privacy",
      });
      expect(result.emailRequired).toBe(false);
      expect(result.nameFieldEnabled).toBe(true);
      expect(result.privacyPolicyUrl).toBe("https://example.com/privacy");
    });
  });

  describe("DiscountConfigSchema", () => {
    it("should accept valid config with defaults", () => {
      const result = DiscountConfigSchema.parse({});
      expect(result.enabled).toBe(false);
      expect(result.showInPreview).toBe(true);
      expect(result.strategy).toBe("simple");
      expect(result.behavior).toBe("SHOW_CODE_AND_AUTO_APPLY");
    });

    it("should accept full config", () => {
      const result = DiscountConfigSchema.parse({
        enabled: true,
        type: "shared",
        valueType: "PERCENTAGE",
        value: 10,
        code: "SAVE10",
        minimumAmount: 50,
      });
      expect(result.enabled).toBe(true);
      expect(result.value).toBe(10);
      expect(result.code).toBe("SAVE10");
    });
  });
});

