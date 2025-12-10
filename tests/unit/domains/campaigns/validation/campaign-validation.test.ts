/**
 * Unit Tests for Campaign Validation
 *
 * Tests template-type driven validation for campaign content and configuration:
 * - validateContentConfig
 * - validateCampaignCreateData
 * - validateCampaignUpdateData
 * - validateExperimentCreateData
 * - validateExperimentUpdateData
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock template registry
vi.mock("~/domains/templates/registry/template-registry", () => ({
  getContentSchemaForTemplate: vi.fn(),
}));

// Mock validation helpers
vi.mock("~/lib/validation-helpers", () => ({
  formatZodErrors: vi.fn((error) => error.errors?.map((e: any) => e.message) || ["Validation error"]),
}));

import { z } from "zod";
import {
  validateContentConfig,
  validateCampaignCreateData,
  validateCampaignUpdateData,
  validateExperimentCreateData,
  validateExperimentUpdateData,
} from "~/domains/campaigns/validation/campaign-validation";
import { getContentSchemaForTemplate } from "~/domains/templates/registry/template-registry";

// ==========================================================================
// VALIDATE CONTENT CONFIG TESTS
// ==========================================================================

describe("validateContentConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success for valid content", () => {
    const mockSchema = z.object({
      headline: z.string(),
      buttonText: z.string(),
    });
    vi.mocked(getContentSchemaForTemplate).mockReturnValue(mockSchema);

    const result = validateContentConfig("NEWSLETTER", {
      headline: "Join Us",
      buttonText: "Subscribe",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      headline: "Join Us",
      buttonText: "Subscribe",
    });
  });

  it("should return errors for invalid content", () => {
    const mockSchema = z.object({
      headline: z.string().min(1),
    });
    vi.mocked(getContentSchemaForTemplate).mockReturnValue(mockSchema);

    const result = validateContentConfig("NEWSLETTER", {
      headline: "",
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should handle schema lookup errors", () => {
    vi.mocked(getContentSchemaForTemplate).mockImplementation(() => {
      throw new Error("Unknown template type");
    });

    const result = validateContentConfig("UNKNOWN" as any, {});

    expect(result.success).toBe(false);
    expect(result.errors).toContain("Validation error: Unknown template type");
  });
});

// ==========================================================================
// VALIDATE CAMPAIGN CREATE DATA TESTS
// ==========================================================================

describe("validateCampaignCreateData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for content schema
    const mockSchema = z.object({}).passthrough();
    vi.mocked(getContentSchemaForTemplate).mockReturnValue(mockSchema);
  });

  const validCampaignData = {
    name: "Test Campaign",
    templateType: "NEWSLETTER" as const,
    goal: "NEWSLETTER_SIGNUP" as const,
    status: "DRAFT" as const,
  };

  it("should return success for valid campaign data", () => {
    const result = validateCampaignCreateData(validCampaignData);

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Test Campaign");
  });

  it("should return errors for missing required fields", () => {
    const result = validateCampaignCreateData({
      // Missing name, templateType, goal
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should validate content config when provided", () => {
    const mockSchema = z.object({
      headline: z.string().min(1),
    });
    vi.mocked(getContentSchemaForTemplate).mockReturnValue(mockSchema);

    const result = validateCampaignCreateData({
      ...validCampaignData,
      contentConfig: {
        headline: "", // Invalid - empty string
      },
    });

    expect(result.success).toBe(false);
  });
});

// ==========================================================================
// VALIDATE CAMPAIGN UPDATE DATA TESTS
// ==========================================================================

describe("validateCampaignUpdateData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockSchema = z.object({}).passthrough();
    vi.mocked(getContentSchemaForTemplate).mockReturnValue(mockSchema);
  });

  it("should return success for valid update data", () => {
    const result = validateCampaignUpdateData({
      name: "Updated Campaign",
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Updated Campaign");
  });

  it("should allow partial updates", () => {
    const result = validateCampaignUpdateData({
      status: "ACTIVE",
    });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("ACTIVE");
  });
});

// ==========================================================================
// VALIDATE EXPERIMENT CREATE DATA TESTS
// ==========================================================================

describe("validateExperimentCreateData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validExperimentData = {
    name: "Test Experiment",
    trafficAllocation: { A: 50, B: 50 },
    successMetrics: {
      primaryMetric: "conversion_rate" as const,
      minimumDetectableEffect: 5,
    },
  };

  it("should return success for valid experiment data", () => {
    const result = validateExperimentCreateData(validExperimentData);

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Test Experiment");
  });

  it("should return errors for missing required fields", () => {
    const result = validateExperimentCreateData({
      // Missing name, trafficAllocation, successMetrics
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it("should return errors for empty name", () => {
    const result = validateExperimentCreateData({
      ...validExperimentData,
      name: "",
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});

// ==========================================================================
// VALIDATE EXPERIMENT UPDATE DATA TESTS
// ==========================================================================

describe("validateExperimentUpdateData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success for valid update data", () => {
    const result = validateExperimentUpdateData({
      name: "Updated Experiment",
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Updated Experiment");
  });

  it("should allow empty update (all fields optional)", () => {
    const result = validateExperimentUpdateData({});

    expect(result.success).toBe(true);
  });

  it("should allow updating description only", () => {
    const result = validateExperimentUpdateData({
      description: "Updated description",
    });

    expect(result.success).toBe(true);
    expect(result.data?.description).toBe("Updated description");
  });
});

