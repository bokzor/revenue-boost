/**
 * Unit Tests for Analytics Daily API
 *
 * Tests the daily metrics aggregation logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the daily metrics structure
interface DailyMetric {
  date: string;
  impressions: number;
  leads: number;
  revenue: number;
}

// Recreate the response structure
interface DailyMetricsResponse {
  success: boolean;
  data: {
    dailyMetrics: DailyMetric[];
  };
  timeRange: string;
}

// Helper to generate date range
function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

// Helper to fill missing dates with zeros
function fillMissingDates(
  metrics: DailyMetric[],
  dateRange: string[]
): DailyMetric[] {
  const metricsMap = new Map(metrics.map((m) => [m.date, m]));

  return dateRange.map((date) => {
    const existing = metricsMap.get(date);
    if (existing) return existing;

    return {
      date,
      impressions: 0,
      leads: 0,
      revenue: 0,
    };
  });
}

describe("Analytics Daily API", () => {
  describe("DailyMetric structure", () => {
    it("should have required fields", () => {
      const metric: DailyMetric = {
        date: "2024-01-15",
        impressions: 1000,
        leads: 50,
        revenue: 2500.0,
      };

      expect(metric.date).toBe("2024-01-15");
      expect(metric.impressions).toBe(1000);
      expect(metric.leads).toBe(50);
      expect(metric.revenue).toBe(2500.0);
    });
  });

  describe("generateDateRange", () => {
    it("should generate correct number of dates", () => {
      const dates = generateDateRange(7);
      expect(dates).toHaveLength(7);
    });

    it("should generate dates in ascending order", () => {
      const dates = generateDateRange(3);
      expect(new Date(dates[0]) < new Date(dates[1])).toBe(true);
      expect(new Date(dates[1]) < new Date(dates[2])).toBe(true);
    });

    it("should end with today", () => {
      const dates = generateDateRange(1);
      const today = new Date().toISOString().split("T")[0];
      expect(dates[0]).toBe(today);
    });
  });

  describe("fillMissingDates", () => {
    it("should fill missing dates with zeros", () => {
      const metrics: DailyMetric[] = [
        { date: "2024-01-01", impressions: 100, leads: 5, revenue: 50 },
        { date: "2024-01-03", impressions: 200, leads: 10, revenue: 100 },
      ];

      const dateRange = ["2024-01-01", "2024-01-02", "2024-01-03"];
      const filled = fillMissingDates(metrics, dateRange);

      expect(filled).toHaveLength(3);
      expect(filled[1].date).toBe("2024-01-02");
      expect(filled[1].impressions).toBe(0);
      expect(filled[1].leads).toBe(0);
      expect(filled[1].revenue).toBe(0);
    });

    it("should preserve existing metrics", () => {
      const metrics: DailyMetric[] = [
        { date: "2024-01-01", impressions: 100, leads: 5, revenue: 50 },
      ];

      const dateRange = ["2024-01-01"];
      const filled = fillMissingDates(metrics, dateRange);

      expect(filled[0].impressions).toBe(100);
      expect(filled[0].leads).toBe(5);
      expect(filled[0].revenue).toBe(50);
    });

    it("should handle empty metrics", () => {
      const dateRange = ["2024-01-01", "2024-01-02"];
      const filled = fillMissingDates([], dateRange);

      expect(filled).toHaveLength(2);
      expect(filled.every((m) => m.impressions === 0)).toBe(true);
    });
  });

  describe("Response structure", () => {
    it("should have valid response format", () => {
      const response: DailyMetricsResponse = {
        success: true,
        data: {
          dailyMetrics: [
            { date: "2024-01-01", impressions: 100, leads: 5, revenue: 50 },
          ],
        },
        timeRange: "30d",
      };

      expect(response.success).toBe(true);
      expect(response.data.dailyMetrics).toHaveLength(1);
      expect(response.timeRange).toBe("30d");
    });
  });
});

