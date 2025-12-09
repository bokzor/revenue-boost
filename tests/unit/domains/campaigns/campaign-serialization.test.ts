/**
 * Tests for Campaign Serialization
 *
 * Tests that form data is correctly serialized when saving a campaign.
 * This covers:
 * 1. Validation of campaign create data
 * 2. JSON field preparation for database storage
 * 3. Full flow from recipe defaults to validated campaign data
 */

import { describe, it, expect } from "vitest";
import {
  validateCampaignCreateData,
  validateContentConfig,
} from "~/domains/campaigns/validation/campaign-validation";
import {
  prepareJsonField,
  prepareEntityJsonFields,
} from "~/domains/campaigns/utils/json-helpers";
import { STYLED_RECIPES } from "~/domains/campaigns/recipes/styled-recipe-catalog";
import type { CampaignCreateData } from "~/domains/campaigns/types/campaign";

describe("Campaign Serialization", () => {
  describe("prepareJsonField", () => {
    it("handles null values", () => {
      const result = prepareJsonField(null);
      // Prisma.JsonNull is a special Prisma type for null JSON values
      expect(result).toBeDefined();
    });

    it("handles undefined values", () => {
      const result = prepareJsonField(undefined);
      expect(result).toEqual({});
    });

    it("handles primitive values", () => {
      expect(prepareJsonField("test")).toBe("test");
      expect(prepareJsonField(123)).toBe(123);
      expect(prepareJsonField(true)).toBe(true);
    });

    it("handles arrays", () => {
      const result = prepareJsonField(["a", "b", "c"]);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("handles nested objects", () => {
      const input = {
        headline: "Test",
        nested: {
          value: 10,
          items: ["a", "b"],
        },
      };
      const result = prepareJsonField(input);
      expect(result).toEqual(input);
    });
  });

  describe("prepareEntityJsonFields", () => {
    it("prepares multiple JSON fields for database storage", () => {
      const entity = {
        name: "Test Campaign",
        contentConfig: { headline: "Hello" },
        designConfig: { position: "center" },
        targetRules: { enhancedTriggers: {} },
        discountConfig: { enabled: false },
      };

      const result = prepareEntityJsonFields(entity, [
        { key: "contentConfig", defaultValue: {} },
        { key: "designConfig", defaultValue: {} },
        { key: "targetRules", defaultValue: {} },
        { key: "discountConfig", defaultValue: {} },
      ]);

      expect(result.contentConfig).toEqual({ headline: "Hello" });
      expect(result.designConfig).toEqual({ position: "center" });
      expect(result.targetRules).toEqual({ enhancedTriggers: {} });
      expect(result.discountConfig).toEqual({ enabled: false });
    });
  });

  describe("validateCampaignCreateData", () => {
    it("validates a minimal valid campaign", () => {
      const data: CampaignCreateData = {
        name: "Test Campaign",
        goal: "NEWSLETTER_SIGNUP",
        templateType: "NEWSLETTER",
        contentConfig: {
          headline: "Join our newsletter",
          subheadline: "Get 10% off",
          emailPlaceholder: "Enter your email",
          submitButtonText: "Subscribe",
          successMessage: "Thanks for subscribing!",
        },
        designConfig: {},
        targetRules: {},
        discountConfig: {
          enabled: false,
          showInPreview: true,
          strategy: "simple",
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
        },
      };

      const result = validateCampaignCreateData(data);
      expect(result.success).toBe(true);
    });

    it("fails validation for missing required fields", () => {
      const data = {
        name: "",
        goal: "NEWSLETTER_SIGNUP",
        templateType: "NEWSLETTER",
      } as CampaignCreateData;

      const result = validateCampaignCreateData(data);
      expect(result.success).toBe(false);
    });

    it("validates spin-to-win campaign with wheel segments", () => {
      const data: CampaignCreateData = {
        name: "Spin to Win",
        goal: "NEWSLETTER_SIGNUP",
        templateType: "SPIN_TO_WIN",
        contentConfig: {
          headline: "Spin to Win!",
          subheadline: "Try your luck",
          spinButtonText: "Spin Now!",
          buttonText: "Claim Prize",
          emailPlaceholder: "Enter email",
          wheelSegments: [
            { id: "1", label: "10% OFF", probability: 0.5, color: "#FF0000" },
            { id: "2", label: "5% OFF", probability: 0.5, color: "#00FF00" },
          ],
        },
        designConfig: {},
        targetRules: {},
        discountConfig: {
          enabled: true,
          showInPreview: true,
          strategy: "simple",
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
          valueType: "PERCENTAGE",
          value: 10,
        },
      };

      const result = validateCampaignCreateData(data);
      expect(result.success).toBe(true);
    });
  });

  describe("validateContentConfig", () => {
    it("validates newsletter content config", () => {
      const content = {
        headline: "Join our newsletter",
        subheadline: "Get 10% off",
        emailPlaceholder: "Enter your email",
        submitButtonText: "Subscribe",
        successMessage: "Thanks!",
      };

      const result = validateContentConfig("NEWSLETTER", content);
      expect(result.success).toBe(true);
    });

    it("validates flash sale content config", () => {
      const content = {
        headline: "Flash Sale!",
        subheadline: "Limited time offer",
        urgencyMessage: "Ends soon!",
        ctaButtonText: "Shop Now",
        ctaUrl: "/collections/sale",
      };

      const result = validateContentConfig("FLASH_SALE", content);
      expect(result.success).toBe(true);
    });

    it("validates social proof content config", () => {
      const content = {
        headline: "Recent Activity",
        successMessage: "Thanks for visiting!",
        enablePurchaseNotifications: true,
        enableVisitorNotifications: false,
        enableReviewNotifications: false,
        cornerPosition: "bottom-left",
        displayDuration: 5,
        rotationInterval: 10,
      };

      const result = validateContentConfig("SOCIAL_PROOF", content);
      expect(result.success).toBe(true);
    });
  });

  describe("Recipe to Campaign Serialization", () => {
    it("serializes newsletter recipe defaults to valid campaign data", () => {
      const newsletterRecipe = STYLED_RECIPES.find(
        (r) => r.templateType === "NEWSLETTER" && r.id.includes("newsletter")
      );

      if (!newsletterRecipe) {
        console.warn("No newsletter recipe found, skipping test");
        return;
      }

      const campaignData: CampaignCreateData = {
        name: `Campaign from ${newsletterRecipe.name}`,
        goal: "NEWSLETTER_SIGNUP",
        templateType: newsletterRecipe.templateType,
        contentConfig: newsletterRecipe.defaults.contentConfig,
        designConfig: newsletterRecipe.defaults.designConfig || {},
        targetRules: {},
        discountConfig: {
          enabled: false,
          showInPreview: true,
          strategy: "simple",
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
          ...newsletterRecipe.defaults.discountConfig,
        },
      };

      const result = validateCampaignCreateData(campaignData);
      if (!result.success) {
        console.log("Validation errors:", result.errors);
      }
      expect(result.success).toBe(true);
    });

    it("serializes spin-to-win recipe defaults to valid campaign data", () => {
      const spinRecipe = STYLED_RECIPES.find((r) => r.templateType === "SPIN_TO_WIN");

      if (!spinRecipe) {
        console.warn("No spin-to-win recipe found, skipping test");
        return;
      }

      const campaignData: CampaignCreateData = {
        name: `Campaign from ${spinRecipe.name}`,
        goal: "NEWSLETTER_SIGNUP",
        templateType: spinRecipe.templateType,
        contentConfig: spinRecipe.defaults.contentConfig,
        designConfig: spinRecipe.defaults.designConfig || {},
        targetRules: {},
        discountConfig: {
          enabled: true,
          showInPreview: true,
          strategy: "simple",
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
          valueType: "PERCENTAGE",
          value: 10,
          ...spinRecipe.defaults.discountConfig,
        },
      };

      const result = validateCampaignCreateData(campaignData);
      if (!result.success) {
        console.log("Validation errors for spin-to-win:", result.errors);
      }
      expect(result.success).toBe(true);
    });

    it("serializes scratch card recipe defaults to valid campaign data", () => {
      const scratchRecipe = STYLED_RECIPES.find((r) => r.templateType === "SCRATCH_CARD");

      if (!scratchRecipe) {
        console.warn("No scratch card recipe found, skipping test");
        return;
      }

      const campaignData: CampaignCreateData = {
        name: `Campaign from ${scratchRecipe.name}`,
        goal: "NEWSLETTER_SIGNUP",
        templateType: scratchRecipe.templateType,
        contentConfig: scratchRecipe.defaults.contentConfig,
        designConfig: scratchRecipe.defaults.designConfig || {},
        targetRules: {},
        discountConfig: {
          enabled: true,
          showInPreview: true,
          strategy: "simple",
          behavior: "SHOW_CODE_AND_AUTO_APPLY",
          valueType: "PERCENTAGE",
          value: 10,
          ...scratchRecipe.defaults.discountConfig,
        },
      };

      const result = validateCampaignCreateData(campaignData);
      if (!result.success) {
        console.log("Validation errors for scratch card:", result.errors);
      }
      expect(result.success).toBe(true);
    });
  });

  describe("Form Data Serialization", () => {
    it("preserves all content fields through serialization", () => {
      const originalContent = {
        headline: "Test Headline",
        subheadline: "Test Subheadline",
        emailPlaceholder: "Enter email",
        submitButtonText: "Submit",
        successMessage: "Success!",
        customField: "Custom Value",
      };

      const prepared = prepareJsonField(originalContent);
      expect(prepared).toEqual(originalContent);
    });

    it("preserves nested discount config through serialization", () => {
      const discountConfig = {
        enabled: true,
        showInPreview: true,
        strategy: "simple",
        valueType: "PERCENTAGE",
        value: 15,
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
        applicability: {
          scope: "all",
        },
      };

      const prepared = prepareJsonField(discountConfig);
      expect(prepared).toEqual(discountConfig);
    });

    it("preserves wheel segments through serialization", () => {
      const wheelSegments = [
        {
          id: "1",
          label: "20% OFF",
          probability: 0.1,
          color: "#FF0000",
          discountConfig: { value: 20, valueType: "PERCENTAGE" },
        },
        {
          id: "2",
          label: "10% OFF",
          probability: 0.3,
          color: "#00FF00",
          discountConfig: { value: 10, valueType: "PERCENTAGE" },
        },
        {
          id: "3",
          label: "Try Again",
          probability: 0.6,
          color: "#0000FF",
        },
      ];

      const prepared = prepareJsonField(wheelSegments);
      expect(prepared).toEqual(wheelSegments);
    });

    it("preserves targeting config through serialization", () => {
      const targetRules = {
        audienceTargeting: {
          enabled: true,
          shopifySegmentIds: ["segment1", "segment2"],
        },
        geoTargeting: {
          enabled: true,
          mode: "include",
          countries: ["US", "CA"],
        },
        enhancedTriggers: {
          exit_intent: { enabled: true, sensitivity: "medium" },
          page_load: { enabled: true, delay: 5000 },
        },
        pageTargeting: {
          mode: "include",
          patterns: ["/products/*"],
        },
      };

      const prepared = prepareJsonField(targetRules);
      expect(prepared).toEqual(targetRules);
    });
  });
});

