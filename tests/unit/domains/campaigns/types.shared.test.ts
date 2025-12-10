/**
 * Unit Tests for Campaign Types Shared Exports
 *
 * Verifies that all expected exports are available from the shared types module.
 */

import { describe, it, expect } from "vitest";

import {
  // Schemas
  CampaignGoalSchema,
  CampaignStatusSchema,
  TemplateTypeSchema,
  NewsletterContentSchema,
  SpinToWinContentSchema,
  FlashSaleContentSchema,
  CartAbandonmentContentSchema,
  ProductUpsellContentSchema,
  SocialProofContentSchema,
  DesignConfigSchema,
  EnhancedTriggersConfigSchema,
  AudienceTargetingConfigSchema,
  PageTargetingConfigSchema,
  TargetRulesConfigSchema,
  DiscountConfigSchema,
  BaseCampaignSchema,
  CampaignWithConfigsSchema,
  CampaignCreateDataSchema,
  CampaignUpdateDataSchema,
  // Experiment schemas
  ExperimentStatusSchema,
  TrafficAllocationSchema,
  StatisticalConfigSchema,
  SuccessMetricsSchema,
  BaseExperimentSchema,
  ExperimentWithVariantsSchema,
  ExperimentCreateDataSchema,
  ExperimentUpdateDataSchema,
  // Validation
  validateContentConfig,
  validateCampaignCreateData,
  validateCampaignUpdateData,
  validateExperimentCreateData,
  validateExperimentUpdateData,
  // Utilities
  parseJsonField,
  stringifyJsonField,
  parseContentConfig,
  parseDesignConfig,
  parseTargetRules,
  parseDiscountConfig,
  parseTrafficAllocation,
  parseStatisticalConfig,
  parseSuccessMetrics,
  parseCampaignFields,
  parseExperimentFields,
} from "~/domains/campaigns/types.shared";

describe("Campaign Types Shared Exports", () => {
  describe("Campaign Schemas", () => {
    it("should export CampaignGoalSchema", () => {
      expect(CampaignGoalSchema).toBeDefined();
      expect(CampaignGoalSchema.parse("NEWSLETTER_SIGNUP")).toBe("NEWSLETTER_SIGNUP");
    });

    it("should export CampaignStatusSchema", () => {
      expect(CampaignStatusSchema).toBeDefined();
      expect(CampaignStatusSchema.parse("ACTIVE")).toBe("ACTIVE");
    });

    it("should export TemplateTypeSchema", () => {
      expect(TemplateTypeSchema).toBeDefined();
      expect(TemplateTypeSchema.parse("NEWSLETTER")).toBe("NEWSLETTER");
    });

    it("should export content schemas", () => {
      expect(NewsletterContentSchema).toBeDefined();
      expect(SpinToWinContentSchema).toBeDefined();
      expect(FlashSaleContentSchema).toBeDefined();
      expect(CartAbandonmentContentSchema).toBeDefined();
      expect(ProductUpsellContentSchema).toBeDefined();
      expect(SocialProofContentSchema).toBeDefined();
    });

    it("should export DesignConfigSchema", () => {
      expect(DesignConfigSchema).toBeDefined();
    });

    it("should export targeting schemas", () => {
      expect(EnhancedTriggersConfigSchema).toBeDefined();
      expect(AudienceTargetingConfigSchema).toBeDefined();
      expect(PageTargetingConfigSchema).toBeDefined();
      expect(TargetRulesConfigSchema).toBeDefined();
    });

    it("should export DiscountConfigSchema", () => {
      expect(DiscountConfigSchema).toBeDefined();
    });

    it("should export campaign data schemas", () => {
      expect(BaseCampaignSchema).toBeDefined();
      expect(CampaignWithConfigsSchema).toBeDefined();
      expect(CampaignCreateDataSchema).toBeDefined();
      expect(CampaignUpdateDataSchema).toBeDefined();
    });
  });

  describe("Experiment Schemas", () => {
    it("should export experiment schemas", () => {
      expect(ExperimentStatusSchema).toBeDefined();
      expect(TrafficAllocationSchema).toBeDefined();
      expect(StatisticalConfigSchema).toBeDefined();
      expect(SuccessMetricsSchema).toBeDefined();
      expect(BaseExperimentSchema).toBeDefined();
      expect(ExperimentWithVariantsSchema).toBeDefined();
      expect(ExperimentCreateDataSchema).toBeDefined();
      expect(ExperimentUpdateDataSchema).toBeDefined();
    });
  });

  describe("Validation Functions", () => {
    it("should export validation functions", () => {
      expect(validateContentConfig).toBeDefined();
      expect(validateCampaignCreateData).toBeDefined();
      expect(validateCampaignUpdateData).toBeDefined();
      expect(validateExperimentCreateData).toBeDefined();
      expect(validateExperimentUpdateData).toBeDefined();
    });
  });

  describe("Utility Functions", () => {
    it("should export JSON parsing utilities", () => {
      expect(parseJsonField).toBeDefined();
      expect(stringifyJsonField).toBeDefined();
    });

    it("should export campaign field parsers", () => {
      expect(parseContentConfig).toBeDefined();
      expect(parseDesignConfig).toBeDefined();
      expect(parseTargetRules).toBeDefined();
      expect(parseDiscountConfig).toBeDefined();
    });

    it("should export experiment field parsers", () => {
      expect(parseTrafficAllocation).toBeDefined();
      expect(parseStatisticalConfig).toBeDefined();
      expect(parseSuccessMetrics).toBeDefined();
    });

    it("should export entity parsers", () => {
      expect(parseCampaignFields).toBeDefined();
      expect(parseExperimentFields).toBeDefined();
    });
  });
});

