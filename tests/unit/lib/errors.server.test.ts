/**
 * Unit Tests for Error Classes
 */

import { describe, it, expect } from "vitest";

import {
  ServiceError,
  CampaignServiceError,
  TemplateServiceError,
  ExperimentServiceError,
} from "~/lib/errors.server";

describe("ServiceError", () => {
  it("should create error with code and message", () => {
    const error = new ServiceError("TEST_ERROR", "Test error message");

    expect(error.code).toBe("TEST_ERROR");
    expect(error.message).toBe("Test error message");
    expect(error.name).toBe("ServiceError");
  });

  it("should include details when provided", () => {
    const details = { field: "email", reason: "invalid" };
    const error = new ServiceError("VALIDATION_ERROR", "Validation failed", details);

    expect(error.details).toEqual(details);
  });

  it("should allow custom name", () => {
    const error = new ServiceError("TEST", "Test", undefined, "CustomError");

    expect(error.name).toBe("CustomError");
  });

  it("should be an instance of Error", () => {
    const error = new ServiceError("TEST", "Test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ServiceError);
  });
});

describe("CampaignServiceError", () => {
  it("should create campaign-specific error", () => {
    const error = new CampaignServiceError("CAMPAIGN_NOT_FOUND", "Campaign not found");

    expect(error.code).toBe("CAMPAIGN_NOT_FOUND");
    expect(error.message).toBe("Campaign not found");
    expect(error.name).toBe("CampaignServiceError");
  });

  it("should extend ServiceError", () => {
    const error = new CampaignServiceError("TEST", "Test");

    expect(error).toBeInstanceOf(ServiceError);
    expect(error).toBeInstanceOf(CampaignServiceError);
  });

  it("should include details", () => {
    const error = new CampaignServiceError("ERROR", "Error", { campaignId: "123" });

    expect(error.details).toEqual({ campaignId: "123" });
  });
});

describe("TemplateServiceError", () => {
  it("should create template-specific error", () => {
    const error = new TemplateServiceError("TEMPLATE_NOT_FOUND", "Template not found");

    expect(error.code).toBe("TEMPLATE_NOT_FOUND");
    expect(error.name).toBe("TemplateServiceError");
  });

  it("should extend ServiceError", () => {
    const error = new TemplateServiceError("TEST", "Test");

    expect(error).toBeInstanceOf(ServiceError);
  });
});

describe("ExperimentServiceError", () => {
  it("should create experiment-specific error", () => {
    const error = new ExperimentServiceError("EXPERIMENT_FAILED", "Experiment failed");

    expect(error.code).toBe("EXPERIMENT_FAILED");
    expect(error.name).toBe("ExperimentServiceError");
  });

  it("should extend ServiceError", () => {
    const error = new ExperimentServiceError("TEST", "Test");

    expect(error).toBeInstanceOf(ServiceError);
  });
});

