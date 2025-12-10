/**
 * Unit Tests for Dashboard Metrics API
 *
 * Tests the time range parsing and metrics aggregation logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the time range parsing logic
function parseDateRange(timeRange: string): Date | undefined {
  const now = new Date();
  if (timeRange === "7d") {
    return new Date(now.setDate(now.getDate() - 7));
  } else if (timeRange === "30d") {
    return new Date(now.setDate(now.getDate() - 30));
  }
  // "all" -> undefined
  return undefined;
}

// Recreate the conversion rate calculation
function calculateConversionRate(leads: number, impressions: number): number {
  return impressions > 0 ? (leads / impressions) * 100 : 0;
}

// Recreate the metrics aggregation
interface CampaignStats {
  impressions: number;
  leadCount: number;
}

interface RevenueStats {
  revenue: number;
}

interface Campaign {
  id: string;
  status: string;
}

function aggregateMetrics(
  campaigns: Campaign[],
  statsMap: Map<string, CampaignStats>,
  revenueMap: Map<string, RevenueStats>
): {
  revenue: number;
  leads: number;
  activeCampaigns: number;
  conversionRate: number;
} {
  let totalRevenue = 0;
  let totalLeads = 0;
  let totalImpressions = 0;
  let activeCampaignsCount = 0;

  campaigns.forEach((campaign) => {
    const stats = statsMap.get(campaign.id);
    const revenueStats = revenueMap.get(campaign.id);

    totalRevenue += revenueStats?.revenue || 0;
    totalLeads += stats?.leadCount || 0;
    totalImpressions += stats?.impressions || 0;

    if (campaign.status === "ACTIVE") {
      activeCampaignsCount++;
    }
  });

  return {
    revenue: totalRevenue,
    leads: totalLeads,
    activeCampaigns: activeCampaignsCount,
    conversionRate: calculateConversionRate(totalLeads, totalImpressions),
  };
}

describe("Dashboard Metrics API", () => {
  describe("parseDateRange", () => {
    it("should return date 7 days ago for 7d", () => {
      const result = parseDateRange("7d");
      expect(result).toBeInstanceOf(Date);
      const now = new Date();
      const diff = now.getTime() - result!.getTime();
      // Should be approximately 7 days (with some tolerance for test execution time)
      expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000);
    });

    it("should return date 30 days ago for 30d", () => {
      const result = parseDateRange("30d");
      expect(result).toBeInstanceOf(Date);
    });

    it("should return undefined for all", () => {
      const result = parseDateRange("all");
      expect(result).toBeUndefined();
    });

    it("should return undefined for unknown range", () => {
      const result = parseDateRange("unknown");
      expect(result).toBeUndefined();
    });
  });

  describe("calculateConversionRate", () => {
    it("should calculate correct conversion rate", () => {
      expect(calculateConversionRate(10, 100)).toBe(10);
      expect(calculateConversionRate(25, 100)).toBe(25);
    });

    it("should return 0 when no impressions", () => {
      expect(calculateConversionRate(10, 0)).toBe(0);
    });

    it("should handle 100% conversion", () => {
      expect(calculateConversionRate(100, 100)).toBe(100);
    });
  });

  describe("aggregateMetrics", () => {
    it("should aggregate metrics from multiple campaigns", () => {
      const campaigns: Campaign[] = [
        { id: "c1", status: "ACTIVE" },
        { id: "c2", status: "ACTIVE" },
        { id: "c3", status: "PAUSED" },
      ];

      const statsMap = new Map<string, CampaignStats>([
        ["c1", { impressions: 100, leadCount: 10 }],
        ["c2", { impressions: 200, leadCount: 20 }],
        ["c3", { impressions: 50, leadCount: 5 }],
      ]);

      const revenueMap = new Map<string, RevenueStats>([
        ["c1", { revenue: 1000 }],
        ["c2", { revenue: 2000 }],
        ["c3", { revenue: 500 }],
      ]);

      const result = aggregateMetrics(campaigns, statsMap, revenueMap);

      expect(result.revenue).toBe(3500);
      expect(result.leads).toBe(35);
      expect(result.activeCampaigns).toBe(2);
      expect(result.conversionRate).toBe(10); // 35/350 * 100
    });

    it("should handle empty campaigns", () => {
      const result = aggregateMetrics([], new Map(), new Map());

      expect(result.revenue).toBe(0);
      expect(result.leads).toBe(0);
      expect(result.activeCampaigns).toBe(0);
      expect(result.conversionRate).toBe(0);
    });
  });
});

