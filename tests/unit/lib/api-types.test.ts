/**
 * Unit Tests for API Types
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createApiResponse } from "~/lib/api-types";
import type { ApiResponse, ApiListResponse, ApiCampaignData } from "~/lib/api-types";

describe("createApiResponse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should create success response", () => {
    const response = createApiResponse(true, { id: "123" });

    expect(response.success).toBe(true);
    expect(response.data).toEqual({ id: "123" });
    expect(response.error).toBeUndefined();
    expect(response.timestamp).toBe("2024-01-15T12:00:00.000Z");
  });

  it("should create error response", () => {
    const response = createApiResponse(false, undefined, "Something went wrong");

    expect(response.success).toBe(false);
    expect(response.data).toBeUndefined();
    expect(response.error).toBe("Something went wrong");
  });

  it("should include errors array", () => {
    const response = createApiResponse(false, undefined, "Validation failed", [
      "Field is required",
      "Invalid format",
    ]);

    expect(response.errors).toEqual(["Field is required", "Invalid format"]);
  });

  it("should include timestamp", () => {
    const response = createApiResponse(true);

    expect(response.timestamp).toBeDefined();
    expect(typeof response.timestamp).toBe("string");
  });
});

describe("ApiResponse type", () => {
  it("should support generic data type", () => {
    const response: ApiResponse<{ name: string }> = {
      success: true,
      data: { name: "Test" },
      timestamp: new Date().toISOString(),
    };

    expect(response.data?.name).toBe("Test");
  });

  it("should support optional error fields", () => {
    const response: ApiResponse = {
      success: false,
      error: "Error message",
      errorCode: "VALIDATION_ERROR",
      errorDetails: { field: "name" },
      timestamp: new Date().toISOString(),
    };

    expect(response.errorCode).toBe("VALIDATION_ERROR");
    expect(response.errorDetails).toEqual({ field: "name" });
  });
});

describe("ApiListResponse type", () => {
  it("should support metadata", () => {
    const response: ApiListResponse<{ id: string }> = {
      success: true,
      data: [{ id: "1" }, { id: "2" }],
      metadata: {
        total: 100,
        page: 1,
        limit: 10,
        hasMore: true,
      },
      timestamp: new Date().toISOString(),
    };

    expect(response.metadata?.total).toBe(100);
    expect(response.metadata?.hasMore).toBe(true);
  });
});

describe("ApiCampaignData type", () => {
  it("should support campaign data structure", () => {
    const campaign: ApiCampaignData = {
      id: "campaign-123",
      name: "Test Campaign",
      templateType: "NEWSLETTER",
      priority: 10,
      contentConfig: { headline: "Welcome!" },
      designConfig: { backgroundColor: "#FFFFFF" },
      targetRules: { pages: ["all"] },
      discountConfig: { enabled: true },
    };

    expect(campaign.id).toBe("campaign-123");
    expect(campaign.templateType).toBe("NEWSLETTER");
  });

  it("should support optional fields", () => {
    const campaign: ApiCampaignData = {
      id: "campaign-123",
      name: "Test Campaign",
      templateType: "NEWSLETTER",
      priority: 10,
      contentConfig: {},
      designConfig: {},
      targetRules: {},
      discountConfig: {},
      experimentId: "exp-123",
      variantKey: "A",
      isActive: true,
      designTokensCSS: "--rb-background: #fff;",
    };

    expect(campaign.experimentId).toBe("exp-123");
    expect(campaign.designTokensCSS).toBeDefined();
  });
});

