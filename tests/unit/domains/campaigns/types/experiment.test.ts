/**
 * Unit Tests for Experiment Types
 */

import { describe, it, expect } from "vitest";

import {
  ExperimentStatusSchema,
  TrafficAllocationSchema,
  StatisticalConfigSchema,
  SuccessMetricsSchema,
  BaseExperimentSchema,
  ExperimentCreateDataSchema,
  ExperimentUpdateDataSchema,
} from "~/domains/campaigns/types/experiment";

describe("Experiment Types", () => {
  describe("ExperimentStatusSchema", () => {
    it("should accept valid statuses", () => {
      expect(ExperimentStatusSchema.parse("DRAFT")).toBe("DRAFT");
      expect(ExperimentStatusSchema.parse("RUNNING")).toBe("RUNNING");
      expect(ExperimentStatusSchema.parse("PAUSED")).toBe("PAUSED");
      expect(ExperimentStatusSchema.parse("COMPLETED")).toBe("COMPLETED");
      expect(ExperimentStatusSchema.parse("ARCHIVED")).toBe("ARCHIVED");
    });

    it("should reject invalid statuses", () => {
      expect(() => ExperimentStatusSchema.parse("INVALID")).toThrow();
      expect(() => ExperimentStatusSchema.parse("")).toThrow();
    });
  });

  describe("TrafficAllocationSchema", () => {
    it("should accept valid 50/50 split", () => {
      const result = TrafficAllocationSchema.parse({ A: 50, B: 50 });
      expect(result.A).toBe(50);
      expect(result.B).toBe(50);
    });

    it("should accept valid 3-way split", () => {
      const result = TrafficAllocationSchema.parse({ A: 33, B: 33, C: 34 });
      expect(result.A + result.B + (result.C || 0)).toBe(100);
    });

    it("should accept valid 4-way split", () => {
      const result = TrafficAllocationSchema.parse({ A: 25, B: 25, C: 25, D: 25 });
      expect(result.A + result.B + (result.C || 0) + (result.D || 0)).toBe(100);
    });

    it("should reject allocation not summing to 100", () => {
      expect(() => TrafficAllocationSchema.parse({ A: 50, B: 40 })).toThrow();
      expect(() => TrafficAllocationSchema.parse({ A: 60, B: 60 })).toThrow();
    });

    it("should reject negative values", () => {
      expect(() => TrafficAllocationSchema.parse({ A: -10, B: 110 })).toThrow();
    });

    it("should reject values over 100", () => {
      expect(() => TrafficAllocationSchema.parse({ A: 150, B: -50 })).toThrow();
    });
  });

  describe("StatisticalConfigSchema", () => {
    it("should accept valid config with defaults", () => {
      const result = StatisticalConfigSchema.parse({});
      expect(result.confidenceLevel).toBe(0.95);
      expect(result.minimumSampleSize).toBe(1000);
      expect(result.minimumDetectableEffect).toBe(0.05);
      expect(result.maxDurationDays).toBe(30);
    });

    it("should accept custom values", () => {
      const result = StatisticalConfigSchema.parse({
        confidenceLevel: 0.99,
        minimumSampleSize: 5000,
        minimumDetectableEffect: 0.1,
        maxDurationDays: 60,
      });
      expect(result.confidenceLevel).toBe(0.99);
      expect(result.minimumSampleSize).toBe(5000);
    });

    it("should reject confidence level out of range", () => {
      expect(() => StatisticalConfigSchema.parse({ confidenceLevel: 0.5 })).toThrow();
      expect(() => StatisticalConfigSchema.parse({ confidenceLevel: 1.5 })).toThrow();
    });

    it("should reject sample size below minimum", () => {
      expect(() => StatisticalConfigSchema.parse({ minimumSampleSize: 50 })).toThrow();
    });
  });

  describe("SuccessMetricsSchema", () => {
    it("should accept valid primary metric", () => {
      const result = SuccessMetricsSchema.parse({ primaryMetric: "conversion_rate" });
      expect(result.primaryMetric).toBe("conversion_rate");
    });

    it("should accept all valid primary metrics", () => {
      const metrics = [
        "conversion_rate",
        "revenue_per_visitor",
        "email_signups",
        "click_through_rate",
        "engagement_rate",
      ];
      metrics.forEach((metric) => {
        const result = SuccessMetricsSchema.parse({ primaryMetric: metric });
        expect(result.primaryMetric).toBe(metric);
      });
    });

    it("should accept secondary metrics", () => {
      const result = SuccessMetricsSchema.parse({
        primaryMetric: "conversion_rate",
        secondaryMetrics: ["bounce_rate", "time_on_page"],
      });
      expect(result.secondaryMetrics).toHaveLength(2);
    });

    it("should reject invalid primary metric", () => {
      expect(() => SuccessMetricsSchema.parse({ primaryMetric: "invalid" })).toThrow();
    });
  });

  describe("ExperimentCreateDataSchema", () => {
    it("should accept valid create data", () => {
      const result = ExperimentCreateDataSchema.parse({
        name: "Test Experiment",
        trafficAllocation: { A: 50, B: 50 },
        successMetrics: { primaryMetric: "conversion_rate" },
      });
      expect(result.name).toBe("Test Experiment");
    });

    it("should reject empty name", () => {
      expect(() =>
        ExperimentCreateDataSchema.parse({
          name: "",
          trafficAllocation: { A: 50, B: 50 },
          successMetrics: { primaryMetric: "conversion_rate" },
        })
      ).toThrow();
    });
  });

  describe("ExperimentUpdateDataSchema", () => {
    it("should accept partial update data", () => {
      const result = ExperimentUpdateDataSchema.parse({ name: "Updated Name" });
      expect(result.name).toBe("Updated Name");
    });

    it("should accept empty update", () => {
      const result = ExperimentUpdateDataSchema.parse({});
      expect(result).toEqual({});
    });
  });
});

