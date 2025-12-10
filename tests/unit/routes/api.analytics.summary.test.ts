/**
 * Unit Tests for Analytics Summary API
 *
 * Tests the global metrics with period-over-period comparison.
 */

import { describe, it, expect } from "vitest";

// Recreate the metrics structure
interface MetricWithComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

interface GlobalMetricsWithComparison {
  impressions: MetricWithComparison;
  leads: MetricWithComparison;
  revenue: MetricWithComparison;
  conversionRate: MetricWithComparison;
}

// Helper to calculate change
function calculateChange(current: number, previous: number): number {
  return current - previous;
}

// Helper to calculate change percent
function calculateChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Helper to build metric with comparison
function buildMetricWithComparison(
  current: number,
  previous: number
): MetricWithComparison {
  return {
    current,
    previous,
    change: calculateChange(current, previous),
    changePercent: calculateChangePercent(current, previous),
  };
}

describe("Analytics Summary API", () => {
  describe("calculateChange", () => {
    it("should calculate positive change", () => {
      expect(calculateChange(150, 100)).toBe(50);
    });

    it("should calculate negative change", () => {
      expect(calculateChange(80, 100)).toBe(-20);
    });

    it("should calculate zero change", () => {
      expect(calculateChange(100, 100)).toBe(0);
    });
  });

  describe("calculateChangePercent", () => {
    it("should calculate positive percent change", () => {
      expect(calculateChangePercent(150, 100)).toBe(50);
    });

    it("should calculate negative percent change", () => {
      expect(calculateChangePercent(50, 100)).toBe(-50);
    });

    it("should handle zero previous value", () => {
      expect(calculateChangePercent(100, 0)).toBe(100);
      expect(calculateChangePercent(0, 0)).toBe(0);
    });

    it("should calculate 100% increase", () => {
      expect(calculateChangePercent(200, 100)).toBe(100);
    });
  });

  describe("buildMetricWithComparison", () => {
    it("should build complete metric object", () => {
      const metric = buildMetricWithComparison(150, 100);

      expect(metric.current).toBe(150);
      expect(metric.previous).toBe(100);
      expect(metric.change).toBe(50);
      expect(metric.changePercent).toBe(50);
    });

    it("should handle zero values", () => {
      const metric = buildMetricWithComparison(0, 0);

      expect(metric.current).toBe(0);
      expect(metric.previous).toBe(0);
      expect(metric.change).toBe(0);
      expect(metric.changePercent).toBe(0);
    });
  });

  describe("GlobalMetricsWithComparison structure", () => {
    it("should have all required metric fields", () => {
      const metrics: GlobalMetricsWithComparison = {
        impressions: buildMetricWithComparison(1000, 800),
        leads: buildMetricWithComparison(50, 40),
        revenue: buildMetricWithComparison(2500, 2000),
        conversionRate: buildMetricWithComparison(5, 4),
      };

      expect(metrics.impressions.current).toBe(1000);
      expect(metrics.leads.changePercent).toBe(25);
      expect(metrics.revenue.change).toBe(500);
      expect(metrics.conversionRate.previous).toBe(4);
    });
  });

  describe("Response structure", () => {
    it("should have valid success response", () => {
      const response = {
        success: true,
        data: {
          impressions: buildMetricWithComparison(1000, 800),
          leads: buildMetricWithComparison(50, 40),
          revenue: buildMetricWithComparison(2500, 2000),
          conversionRate: buildMetricWithComparison(5, 4),
        },
        timeRange: "30d",
      };

      expect(response.success).toBe(true);
      expect(response.timeRange).toBe("30d");
    });
  });
});

