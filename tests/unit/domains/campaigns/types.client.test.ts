/**
 * Unit Tests for Campaign Types Client Exports
 *
 * Verifies that client-safe exports are available from the client types module.
 */

import { describe, it, expect } from "vitest";

import {
  // Schemas
  CampaignGoalSchema,
  CampaignStatusSchema,
  TemplateTypeSchema,
  DesignConfigSchema,
  DiscountConfigSchema,
  // Validation
  validateContentConfig,
  validateCampaignCreateData,
  // Utilities
  parseJsonField,
  parseContentConfig,
  parseDesignConfig,
} from "~/domains/campaigns/types.client";

describe("Campaign Types Client Exports", () => {
  it("should export CampaignGoalSchema", () => {
    expect(CampaignGoalSchema).toBeDefined();
    expect(CampaignGoalSchema.parse("NEWSLETTER_SIGNUP")).toBe("NEWSLETTER_SIGNUP");
  });

  it("should export CampaignStatusSchema", () => {
    expect(CampaignStatusSchema).toBeDefined();
    expect(CampaignStatusSchema.parse("DRAFT")).toBe("DRAFT");
  });

  it("should export TemplateTypeSchema", () => {
    expect(TemplateTypeSchema).toBeDefined();
    expect(TemplateTypeSchema.parse("SPIN_TO_WIN")).toBe("SPIN_TO_WIN");
  });

  it("should export DesignConfigSchema", () => {
    expect(DesignConfigSchema).toBeDefined();
  });

  it("should export DiscountConfigSchema", () => {
    expect(DiscountConfigSchema).toBeDefined();
  });

  it("should export validation functions", () => {
    expect(validateContentConfig).toBeDefined();
    expect(validateCampaignCreateData).toBeDefined();
  });

  it("should export utility functions", () => {
    expect(parseJsonField).toBeDefined();
    expect(parseContentConfig).toBeDefined();
    expect(parseDesignConfig).toBeDefined();
  });
});

