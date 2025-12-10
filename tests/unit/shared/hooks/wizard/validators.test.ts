/**
 * Unit Tests for Wizard Validators
 *
 * Tests the step validation functions for the campaign wizard.
 */

import { describe, it, expect } from "vitest";

import {
  validateGoalStep,
  validateContentStep,
  validateTemplateStep,
  validateAudienceStep,
  validateDesignStep,
  validateScheduleStep,
  validateReviewStep,
  validateStep,
  stepValidators,
} from "~/shared/hooks/wizard/validators";
import type { CampaignFormData } from "~/shared/hooks/useWizardState";

describe("Wizard Validators", () => {
  const createMockData = (overrides: Partial<CampaignFormData> = {}): CampaignFormData => ({
    contentConfig: {},
    designConfig: {},
    discountConfig: { enabled: false },
    status: "DRAFT",
    priority: 1,
    tags: [],
    isSaving: false,
    ...overrides,
  } as CampaignFormData);

  describe("validateGoalStep", () => {
    it("should fail when no goal selected", () => {
      const result = validateGoalStep(createMockData());

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe("goal");
    });

    it("should pass when goal is selected", () => {
      const result = validateGoalStep(createMockData({ goal: "NEWSLETTER_SIGNUP" }));

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("validateContentStep", () => {
    it("should fail when no goal selected", () => {
      const result = validateContentStep(createMockData());

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("goal");
    });

    it("should warn when no headline", () => {
      const result = validateContentStep(createMockData({
        goal: "NEWSLETTER_SIGNUP",
        contentConfig: {},
      }));

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.field.includes("title"))).toBe(true);
    });

    it("should suggest incentive for newsletter signup", () => {
      const result = validateContentStep(createMockData({
        goal: "NEWSLETTER_SIGNUP",
        contentConfig: { title: "Test" },
      }));

      expect(result.suggestions.some(s => s.field.includes("incentive"))).toBe(true);
    });
  });

  describe("validateTemplateStep", () => {
    it("should fail when no goal selected", () => {
      const result = validateTemplateStep(createMockData());

      expect(result.isValid).toBe(false);
    });

    it("should fail when no template selected", () => {
      const result = validateTemplateStep(createMockData({ goal: "NEWSLETTER_SIGNUP" }));

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("templateId");
    });

    it("should pass when template is selected", () => {
      const result = validateTemplateStep(createMockData({
        goal: "NEWSLETTER_SIGNUP",
        templateId: "template-123",
      }));

      expect(result.isValid).toBe(true);
    });
  });

  describe("validateAudienceStep", () => {
    it("should fail when no goal selected", () => {
      const result = validateAudienceStep(createMockData());

      expect(result.isValid).toBe(false);
    });

    it("should suggest audience targeting when disabled", () => {
      const result = validateAudienceStep(createMockData({
        goal: "NEWSLETTER_SIGNUP",
        audienceTargeting: { enabled: false, shopifySegmentIds: [] },
      }));

      expect(result.isValid).toBe(true);
      expect(result.suggestions.some(s => s.field.includes("audienceTargeting"))).toBe(true);
    });
  });

  describe("validateDesignStep", () => {
    it("should fail when no template selected", () => {
      const result = validateDesignStep(createMockData());

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe("templateId");
    });

    it("should pass with template and suggest customization", () => {
      const result = validateDesignStep(createMockData({
        templateId: "template-123",
        designConfig: {},
      }));

      expect(result.isValid).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("validateScheduleStep", () => {
    it("should suggest setting status to ACTIVE", () => {
      const result = validateScheduleStep(createMockData({ status: "DRAFT" }));

      expect(result.isValid).toBe(true);
      expect(result.suggestions.some(s => s.field === "status")).toBe(true);
    });

    it("should suggest setting start date", () => {
      const result = validateScheduleStep(createMockData());

      expect(result.suggestions.some(s => s.field === "startDate")).toBe(true);
    });
  });

  describe("validateReviewStep", () => {
    it("should always be valid", () => {
      const result = validateReviewStep();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateStep", () => {
    it("should call correct validator for each step", () => {
      const data = createMockData({ goal: "NEWSLETTER_SIGNUP" });

      expect(validateStep(0, data).isValid).toBe(true); // Goal step
      expect(validateStep(6, data).isValid).toBe(true); // Review step
    });

    it("should return valid for unknown step", () => {
      const result = validateStep(99, createMockData());

      expect(result.isValid).toBe(true);
    });
  });

  describe("stepValidators", () => {
    it("should have validators for steps 0-6", () => {
      expect(stepValidators[0]).toBe(validateGoalStep);
      expect(stepValidators[1]).toBe(validateContentStep);
      expect(stepValidators[2]).toBe(validateTemplateStep);
      expect(stepValidators[3]).toBe(validateAudienceStep);
      expect(stepValidators[4]).toBe(validateDesignStep);
      expect(stepValidators[5]).toBe(validateScheduleStep);
      expect(stepValidators[6]).toBe(validateReviewStep);
    });
  });
});
