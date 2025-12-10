/**
 * Unit Tests for Analytics Templates API
 *
 * Tests the response structure and helper functions.
 */

import { describe, it, expect } from "vitest";

// Recreate the template performance structure
interface TemplatePerformance {
  templateType: string;
  campaignCount: number;
  totalImpressions: number;
  totalLeads: number;
  totalRevenue: number;
  avgConversionRate: number;
}

// Recreate the response structure
interface TemplatePerformanceResponse {
  success: boolean;
  data: {
    templatePerformance: TemplatePerformance[];
  };
  timeRange: string;
}

// Helper to calculate average conversion rate
function calculateAvgConversionRate(templates: TemplatePerformance[]): number {
  if (templates.length === 0) return 0;
  const totalRate = templates.reduce((sum, t) => sum + t.avgConversionRate, 0);
  return totalRate / templates.length;
}

// Helper to sort by metric
function sortByMetric(
  templates: TemplatePerformance[],
  metric: keyof TemplatePerformance
): TemplatePerformance[] {
  return [...templates].sort((a, b) => {
    const aVal = a[metric];
    const bVal = b[metric];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return bVal - aVal;
    }
    return 0;
  });
}

describe("Analytics Templates API", () => {
  describe("TemplatePerformance structure", () => {
    it("should have valid template performance structure", () => {
      const performance: TemplatePerformance = {
        templateType: "NEWSLETTER",
        campaignCount: 5,
        totalImpressions: 10000,
        totalLeads: 500,
        totalRevenue: 25000,
        avgConversionRate: 5.0,
      };

      expect(performance.templateType).toBe("NEWSLETTER");
      expect(performance.campaignCount).toBe(5);
      expect(performance.totalImpressions).toBe(10000);
    });
  });

  describe("Response structure", () => {
    it("should have valid success response", () => {
      const response: TemplatePerformanceResponse = {
        success: true,
        data: {
          templatePerformance: [
            {
              templateType: "NEWSLETTER",
              campaignCount: 3,
              totalImpressions: 5000,
              totalLeads: 250,
              totalRevenue: 12500,
              avgConversionRate: 5.0,
            },
            {
              templateType: "SPIN_TO_WIN",
              campaignCount: 2,
              totalImpressions: 3000,
              totalLeads: 180,
              totalRevenue: 9000,
              avgConversionRate: 6.0,
            },
          ],
        },
        timeRange: "30d",
      };

      expect(response.success).toBe(true);
      expect(response.data.templatePerformance).toHaveLength(2);
      expect(response.timeRange).toBe("30d");
    });

    it("should handle empty template performance", () => {
      const response: TemplatePerformanceResponse = {
        success: true,
        data: { templatePerformance: [] },
        timeRange: "7d",
      };

      expect(response.data.templatePerformance).toHaveLength(0);
    });
  });

  describe("calculateAvgConversionRate", () => {
    it("should calculate average conversion rate", () => {
      const templates: TemplatePerformance[] = [
        { templateType: "A", campaignCount: 1, totalImpressions: 100, totalLeads: 10, totalRevenue: 500, avgConversionRate: 10 },
        { templateType: "B", campaignCount: 1, totalImpressions: 100, totalLeads: 5, totalRevenue: 250, avgConversionRate: 5 },
      ];

      expect(calculateAvgConversionRate(templates)).toBe(7.5);
    });

    it("should return 0 for empty array", () => {
      expect(calculateAvgConversionRate([])).toBe(0);
    });
  });

  describe("sortByMetric", () => {
    it("should sort by revenue descending", () => {
      const templates: TemplatePerformance[] = [
        { templateType: "A", campaignCount: 1, totalImpressions: 100, totalLeads: 10, totalRevenue: 500, avgConversionRate: 10 },
        { templateType: "B", campaignCount: 1, totalImpressions: 100, totalLeads: 5, totalRevenue: 1000, avgConversionRate: 5 },
      ];

      const sorted = sortByMetric(templates, "totalRevenue");
      expect(sorted[0].templateType).toBe("B");
      expect(sorted[1].templateType).toBe("A");
    });

    it("should sort by leads descending", () => {
      const templates: TemplatePerformance[] = [
        { templateType: "A", campaignCount: 1, totalImpressions: 100, totalLeads: 50, totalRevenue: 500, avgConversionRate: 10 },
        { templateType: "B", campaignCount: 1, totalImpressions: 100, totalLeads: 25, totalRevenue: 1000, avgConversionRate: 5 },
      ];

      const sorted = sortByMetric(templates, "totalLeads");
      expect(sorted[0].templateType).toBe("A");
    });
  });
});

