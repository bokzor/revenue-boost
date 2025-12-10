/**
 * Unit Tests for Dashboard Campaigns API
 *
 * Tests the campaign row transformation logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the types from the route
interface CampaignDashboardRow {
  id: string;
  name: string;
  status: string;
  templateType: string;
  goal: string;
  views: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  lastUpdated: string;
  experimentId?: string | null;
  variantKey?: string | null;
  isControl?: boolean;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  templateType: string;
  goal: string;
  updatedAt: Date;
  experimentId?: string | null;
  variantKey?: string | null;
  isControl?: boolean;
}

interface CampaignStats {
  impressions: number;
  leadCount: number;
  conversionRate: number;
}

interface RevenueStats {
  revenue: number;
}

// Recreate the transformation logic
function transformCampaignToRow(
  campaign: Campaign,
  stats: CampaignStats | undefined,
  revenueStats: RevenueStats | undefined
): CampaignDashboardRow {
  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    templateType: campaign.templateType,
    goal: campaign.goal,
    views: stats?.impressions || 0,
    conversions: stats?.leadCount || 0,
    conversionRate: stats?.conversionRate || 0,
    revenue: revenueStats?.revenue || 0,
    lastUpdated: new Date(campaign.updatedAt).toLocaleDateString(),
    experimentId: campaign.experimentId,
    variantKey: campaign.variantKey,
    isControl: campaign.isControl,
  };
}

// Recreate the experiment ID extraction
function extractExperimentIds(campaigns: Campaign[]): string[] {
  return Array.from(
    new Set(campaigns.map((c) => c.experimentId).filter((id): id is string => Boolean(id)))
  );
}

describe("Dashboard Campaigns API", () => {
  describe("transformCampaignToRow", () => {
    it("should transform campaign with stats", () => {
      const campaign: Campaign = {
        id: "c1",
        name: "Summer Sale",
        status: "ACTIVE",
        templateType: "FLASH_SALE",
        goal: "INCREASE_REVENUE",
        updatedAt: new Date("2024-01-15"),
        experimentId: "exp1",
        variantKey: "A",
        isControl: true,
      };

      const stats: CampaignStats = {
        impressions: 1000,
        leadCount: 50,
        conversionRate: 5,
      };

      const revenueStats: RevenueStats = { revenue: 5000 };

      const result = transformCampaignToRow(campaign, stats, revenueStats);

      expect(result.id).toBe("c1");
      expect(result.name).toBe("Summer Sale");
      expect(result.views).toBe(1000);
      expect(result.conversions).toBe(50);
      expect(result.revenue).toBe(5000);
      expect(result.experimentId).toBe("exp1");
      expect(result.isControl).toBe(true);
    });

    it("should handle missing stats", () => {
      const campaign: Campaign = {
        id: "c2",
        name: "Newsletter",
        status: "DRAFT",
        templateType: "NEWSLETTER",
        goal: "NEWSLETTER_SIGNUP",
        updatedAt: new Date(),
      };

      const result = transformCampaignToRow(campaign, undefined, undefined);

      expect(result.views).toBe(0);
      expect(result.conversions).toBe(0);
      expect(result.revenue).toBe(0);
      expect(result.experimentId).toBeUndefined();
    });
  });

  describe("extractExperimentIds", () => {
    it("should extract unique experiment IDs", () => {
      const campaigns: Campaign[] = [
        { id: "c1", name: "A", status: "ACTIVE", templateType: "T", goal: "G", updatedAt: new Date(), experimentId: "exp1" },
        { id: "c2", name: "B", status: "ACTIVE", templateType: "T", goal: "G", updatedAt: new Date(), experimentId: "exp1" },
        { id: "c3", name: "C", status: "ACTIVE", templateType: "T", goal: "G", updatedAt: new Date(), experimentId: "exp2" },
      ];

      const result = extractExperimentIds(campaigns);

      expect(result).toHaveLength(2);
      expect(result).toContain("exp1");
      expect(result).toContain("exp2");
    });

    it("should filter out null/undefined experiment IDs", () => {
      const campaigns: Campaign[] = [
        { id: "c1", name: "A", status: "ACTIVE", templateType: "T", goal: "G", updatedAt: new Date(), experimentId: null },
        { id: "c2", name: "B", status: "ACTIVE", templateType: "T", goal: "G", updatedAt: new Date() },
        { id: "c3", name: "C", status: "ACTIVE", templateType: "T", goal: "G", updatedAt: new Date(), experimentId: "exp1" },
      ];

      const result = extractExperimentIds(campaigns);

      expect(result).toHaveLength(1);
      expect(result).toContain("exp1");
    });

    it("should return empty array when no experiments", () => {
      const campaigns: Campaign[] = [
        { id: "c1", name: "A", status: "ACTIVE", templateType: "T", goal: "G", updatedAt: new Date() },
      ];

      const result = extractExperimentIds(campaigns);

      expect(result).toHaveLength(0);
    });
  });
});

