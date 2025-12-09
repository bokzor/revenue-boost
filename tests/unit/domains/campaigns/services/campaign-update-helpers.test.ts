/**
 * Unit Tests for Campaign Update Helpers
 */

import { describe, it, expect } from "vitest";

import {
  buildBasicFieldUpdates,
  buildTemplateUpdates,
  buildConfigUpdates,
  buildExperimentUpdates,
  buildScheduleUpdates,
  buildCampaignUpdateData,
} from "~/domains/campaigns/services/campaign-update-helpers";

describe("buildBasicFieldUpdates", () => {
  it("should return empty object for empty data", () => {
    const result = buildBasicFieldUpdates({});
    expect(result).toEqual({});
  });

  it("should include name when provided", () => {
    const result = buildBasicFieldUpdates({ name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("should include description when provided", () => {
    const result = buildBasicFieldUpdates({ description: "New Description" });
    expect(result.description).toBe("New Description");
  });

  it("should include goal when provided", () => {
    const result = buildBasicFieldUpdates({ goal: "INCREASE_REVENUE" });
    expect(result.goal).toBe("INCREASE_REVENUE");
  });

  it("should include status when provided", () => {
    const result = buildBasicFieldUpdates({ status: "ACTIVE" });
    expect(result.status).toBe("ACTIVE");
  });

  it("should include priority when provided", () => {
    const result = buildBasicFieldUpdates({ priority: 10 });
    expect(result.priority).toBe(10);
  });
});

describe("buildTemplateUpdates", () => {
  it("should return empty object for empty data", () => {
    const result = buildTemplateUpdates({});
    expect(result).toEqual({});
  });

  it("should connect template when templateId provided", () => {
    const result = buildTemplateUpdates({ templateId: "template-1" });
    expect(result.template).toEqual({ connect: { id: "template-1" } });
  });

  it("should disconnect template when templateId is null", () => {
    const result = buildTemplateUpdates({ templateId: null });
    expect(result.template).toEqual({ disconnect: true });
  });

  it("should include templateType when provided", () => {
    const result = buildTemplateUpdates({ templateType: "SPIN_TO_WIN" });
    expect(result.templateType).toBe("SPIN_TO_WIN");
  });
});

describe("buildConfigUpdates", () => {
  it("should return empty object for empty data", () => {
    const result = buildConfigUpdates({});
    expect(result).toEqual({});
  });

  it("should include contentConfig when provided", () => {
    const result = buildConfigUpdates({ contentConfig: { headline: "Test" } });
    expect(result.contentConfig).toBeDefined();
  });

  it("should include designConfig when provided", () => {
    const result = buildConfigUpdates({ designConfig: { primaryColor: "#000" } });
    expect(result.designConfig).toBeDefined();
  });

  it("should include targetRules when provided", () => {
    const result = buildConfigUpdates({ targetRules: { geoTargeting: { enabled: true } } });
    expect(result.targetRules).toBeDefined();
  });

  it("should include discountConfig when provided", () => {
    const result = buildConfigUpdates({ discountConfig: { enabled: true, type: "percentage" } });
    expect(result.discountConfig).toBeDefined();
  });
});

describe("buildExperimentUpdates", () => {
  it("should return empty object for empty data", () => {
    const result = buildExperimentUpdates({});
    expect(result).toEqual({});
  });

  it("should connect experiment when experimentId provided", () => {
    const result = buildExperimentUpdates({ experimentId: "exp-1" });
    expect(result.experiment).toEqual({ connect: { id: "exp-1" } });
  });

  it("should disconnect experiment when experimentId is null", () => {
    const result = buildExperimentUpdates({ experimentId: null });
    expect(result.experiment).toEqual({ disconnect: true });
  });

  it("should include variantKey when provided", () => {
    const result = buildExperimentUpdates({ variantKey: "A" });
    expect(result.variantKey).toBe("A");
  });

  it("should include isControl when provided", () => {
    const result = buildExperimentUpdates({ isControl: true });
    expect(result.isControl).toBe(true);
  });
});

describe("buildScheduleUpdates", () => {
  it("should return empty object for empty data", () => {
    const result = buildScheduleUpdates({});
    expect(result).toEqual({});
  });

  it("should include startDate when provided", () => {
    const date = new Date("2024-01-01");
    const result = buildScheduleUpdates({ startDate: date });
    expect(result.startDate).toEqual(date);
  });

  it("should include endDate when provided", () => {
    const date = new Date("2024-12-31");
    const result = buildScheduleUpdates({ endDate: date });
    expect(result.endDate).toEqual(date);
  });
});

describe("buildCampaignUpdateData", () => {
  it("should combine all update builders", () => {
    const result = buildCampaignUpdateData({
      name: "Test",
      templateType: "NEWSLETTER",
      contentConfig: { headline: "Hello" },
      variantKey: "A",
      startDate: new Date("2024-01-01"),
    });

    expect(result.name).toBe("Test");
    expect(result.templateType).toBe("NEWSLETTER");
    expect(result.contentConfig).toBeDefined();
    expect(result.variantKey).toBe("A");
    expect(result.startDate).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  it("should always include updatedAt", () => {
    const result = buildCampaignUpdateData({});
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});

