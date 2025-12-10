/**
 * Unit Tests for A/B Testing Types
 */

import { describe, it, expect } from "vitest";

import type {
  ExperimentType,
  SuccessMetric,
  ExperimentMetrics,
  ExperimentResults,
} from "~/domains/analytics/ab-testing.types";

describe("ExperimentType", () => {
  it("should support expected experiment types", () => {
    const types: ExperimentType[] = ["A/B", "A/B/C", "A/B/C/D", "MULTIVARIATE"];

    expect(types).toHaveLength(4);
    expect(types).toContain("A/B");
    expect(types).toContain("MULTIVARIATE");
  });
});

describe("SuccessMetric", () => {
  it("should support expected success metrics", () => {
    const metrics: SuccessMetric[] = [
      "conversion_rate",
      "revenue_per_visitor",
      "email_signups",
      "click_through_rate",
      "engagement_rate",
      "bounce_rate",
      "time_on_page",
    ];

    expect(metrics).toHaveLength(7);
    expect(metrics).toContain("conversion_rate");
    expect(metrics).toContain("revenue_per_visitor");
  });
});

describe("ExperimentMetrics", () => {
  it("should support experiment metrics structure", () => {
    const metrics: ExperimentMetrics = {
      variant: "A",
      impressions: 1000,
      conversions: 50,
      conversionRate: 5.0,
      revenue: 2500,
      revenuePerVisitor: 2.5,
      confidence: 95.5,
      isWinner: true,
    };

    expect(metrics.variant).toBe("A");
    expect(metrics.conversionRate).toBe(5.0);
    expect(metrics.isWinner).toBe(true);
  });
});

describe("ExperimentResults", () => {
  it("should support experiment results structure", () => {
    const results: ExperimentResults = {
      experimentId: "exp-123",
      status: "RUNNING",
      startDate: new Date("2024-01-01"),
      metrics: [
        {
          variant: "A",
          impressions: 1000,
          conversions: 50,
          conversionRate: 5.0,
          revenue: 2500,
          revenuePerVisitor: 2.5,
          confidence: 95.5,
          isWinner: false,
        },
        {
          variant: "B",
          impressions: 1000,
          conversions: 75,
          conversionRate: 7.5,
          revenue: 3750,
          revenuePerVisitor: 3.75,
          confidence: 98.0,
          isWinner: true,
        },
      ],
      statisticalSignificance: 95.0,
    };

    expect(results.experimentId).toBe("exp-123");
    expect(results.status).toBe("RUNNING");
    expect(results.metrics).toHaveLength(2);
    expect(results.statisticalSignificance).toBe(95.0);
  });

  it("should support optional fields", () => {
    const results: ExperimentResults = {
      experimentId: "exp-123",
      status: "COMPLETED",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-01-15"),
      metrics: [],
      winnerId: "variant-b",
      winnerDeclaredAt: new Date("2024-01-15"),
      statisticalSignificance: 99.0,
    };

    expect(results.endDate).toBeDefined();
    expect(results.winnerId).toBe("variant-b");
    expect(results.winnerDeclaredAt).toBeDefined();
  });
});

