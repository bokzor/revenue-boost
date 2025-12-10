/**
 * Unit Tests for Service Helpers
 */

import { describe, it, expect } from "vitest";

import {
  globalOrStoreWhere,
  mapCampaignsToVariants,
  CAMPAIGN_TEMPLATE_INCLUDE,
  CAMPAIGN_EXPERIMENT_INCLUDE,
} from "~/lib/service-helpers.server";

describe("globalOrStoreWhere", () => {
  it("should create OR clause for global and store-specific resources", () => {
    const result = globalOrStoreWhere("store_123");

    expect(result.OR).toHaveLength(2);
    expect(result.OR).toContainEqual({ storeId: null });
    expect(result.OR).toContainEqual({ storeId: "store_123" });
  });

  it("should handle undefined storeId", () => {
    const result = globalOrStoreWhere(undefined);

    expect(result.OR).toHaveLength(2);
    expect(result.OR).toContainEqual({ storeId: null });
    expect(result.OR).toContainEqual({ storeId: undefined });
  });
});

describe("mapCampaignsToVariants", () => {
  it("should map campaigns to variant objects", () => {
    const campaigns = [
      { id: "c1", name: "Control", variantKey: "A", isControl: true, status: "ACTIVE" },
      { id: "c2", name: "Variant B", variantKey: "B", isControl: false, status: "ACTIVE" },
    ];
    const trafficAllocation = { A: 50, B: 50 };

    const result = mapCampaignsToVariants(campaigns, trafficAllocation);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "c1",
      variantKey: "A",
      name: "Control",
      isControl: true,
      trafficPercentage: 50,
      status: "ACTIVE",
    });
    expect(result[1]).toEqual({
      id: "c2",
      variantKey: "B",
      name: "Variant B",
      isControl: false,
      trafficPercentage: 50,
      status: "ACTIVE",
    });
  });

  it("should default traffic percentage to 0 when not in allocation", () => {
    const campaigns = [
      { id: "c1", name: "Control", variantKey: "A", isControl: true, status: "ACTIVE" },
    ];

    const result = mapCampaignsToVariants(campaigns, {});

    expect(result[0].trafficPercentage).toBe(0);
  });

  it("should handle undefined traffic allocation", () => {
    const campaigns = [
      { id: "c1", name: "Control", variantKey: "A", isControl: true, status: "ACTIVE" },
    ];

    const result = mapCampaignsToVariants(campaigns, undefined);

    expect(result[0].trafficPercentage).toBe(0);
  });

  it("should handle empty campaigns array", () => {
    const result = mapCampaignsToVariants([], { A: 100 });

    expect(result).toEqual([]);
  });
});

describe("Include Constants", () => {
  it("should have correct template include structure", () => {
    expect(CAMPAIGN_TEMPLATE_INCLUDE.template.select).toHaveProperty("id");
    expect(CAMPAIGN_TEMPLATE_INCLUDE.template.select).toHaveProperty("name");
    expect(CAMPAIGN_TEMPLATE_INCLUDE.template.select).toHaveProperty("templateType");
  });

  it("should have correct experiment include structure", () => {
    expect(CAMPAIGN_EXPERIMENT_INCLUDE.experiment.select).toHaveProperty("id");
    expect(CAMPAIGN_EXPERIMENT_INCLUDE.experiment.select).toHaveProperty("name");
    expect(CAMPAIGN_EXPERIMENT_INCLUDE.experiment.select).toHaveProperty("status");
  });
});

