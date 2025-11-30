import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "~/db.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";

vi.mock("~/db.server", () => {
  return {
    default: {
      lead: {
        groupBy: vi.fn(),
      },
      $queryRaw: vi.fn(),
      campaign: {
        findMany: vi.fn(),
      },
      campaignConversion: {
        groupBy: vi.fn(),
      },
    },
  };
});

vi.mock("~/domains/analytics/popup-events.server", () => {
  return {
    PopupEventService: {
      getImpressionCountsByCampaign: vi.fn(),
      getClickCountsByCampaign: vi.fn(),
    },
  };
});

const mockPrisma = prisma as unknown as {
  lead: {
    groupBy: ReturnType<typeof vi.fn>;
  };
  $queryRaw: ReturnType<typeof vi.fn>;
  campaign: {
    findMany: ReturnType<typeof vi.fn>;
  };
  campaignConversion: {
    groupBy: ReturnType<typeof vi.fn>;
  };
};

const mockGetImpressions =
  PopupEventService.getImpressionCountsByCampaign as unknown as ReturnType<
    typeof vi.fn
  >;

const mockGetClicks =
  PopupEventService.getClickCountsByCampaign as unknown as ReturnType<
    typeof vi.fn
  >;

describe("CampaignAnalyticsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes conversion rate in getCampaignStats using impressions", async () => {
    (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
      { campaignId: "camp-1", _count: { id: 10 } },
      { campaignId: "camp-2", _count: { id: 5 } },
    ]);

    const lastLead1 = new Date("2025-01-01T00:00:00.000Z");
    const lastLead2 = new Date("2025-01-02T00:00:00.000Z");

    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([
      { campaignId: "camp-1", lastLeadAt: lastLead1 },
      { campaignId: "camp-2", lastLeadAt: lastLead2 },
    ]);

    (mockGetImpressions as any).mockResolvedValueOnce(
      new Map<string, number>([
        ["camp-1", 100],
        ["camp-2", 0],
      ]),
    );

    const stats = await CampaignAnalyticsService.getCampaignStats([
      "camp-1",
      "camp-2",
    ]);

    const camp1 = stats.get("camp-1");
    const camp2 = stats.get("camp-2");

    expect(camp1).toBeDefined();
    expect(camp1!.leadCount).toBe(10);
    expect(camp1!.lastLeadAt).toEqual(lastLead1);
    expect(camp1!.conversionRate).toBeCloseTo(10); // 10 leads / 100 impressions

    expect(camp2).toBeDefined();
    expect(camp2!.leadCount).toBe(5);
    expect(camp2!.lastLeadAt).toEqual(lastLead2);
    expect(camp2!.conversionRate).toBe(0); // no impressions
  });

  it("computes conversion rate in getCampaignsWithStats", async () => {
    (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([
      {
        id: "camp-1",
        name: "Campaign 1",
        status: "ACTIVE",
        _count: { leads: 10 },
      },
      {
        id: "camp-2",
        name: "Campaign 2",
        status: "ACTIVE",
        _count: { leads: 0 },
      },
    ]);

    const lastLeadTimes = new Map<string, Date>();
    const lastLead1 = new Date("2025-01-01T00:00:00.000Z");
    lastLeadTimes.set("camp-1", lastLead1);

    const lastLeadSpy = vi
      .spyOn(CampaignAnalyticsService, "getLastLeadTimes")
      .mockResolvedValueOnce(lastLeadTimes);

    (mockGetImpressions as any).mockResolvedValueOnce(
      new Map<string, number>([
        ["camp-1", 50],
        ["camp-2", 0],
      ]),
    );

    const result = await CampaignAnalyticsService.getCampaignsWithStats(
      "store-1",
    );

    expect(result).toHaveLength(2);

    const camp1 = result.find((c) => c.id === "camp-1")!;
    const camp2 = result.find((c) => c.id === "camp-2")!;

    expect(camp1.leadCount).toBe(10);
    expect(camp1.lastLeadAt).toEqual(lastLead1);
    expect(camp1.conversionRate).toBeCloseTo(20); // 10 leads / 50 impressions

    expect(camp2.leadCount).toBe(0);
    expect(camp2.conversionRate).toBe(0);

    expect(lastLeadSpy).toHaveBeenCalledWith(["camp-1", "camp-2"]);
    expect(mockGetImpressions).toHaveBeenCalledWith(["camp-1", "camp-2"]);
  });

  it("aggregates gross revenue by campaign", async () => {
    (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
      {
        campaignId: "camp-1",
        _sum: { totalPrice: 100, discountAmount: 10 },
        _count: { id: 2 },
      },
    ]);

    const result = await CampaignAnalyticsService.getRevenueByCampaignIds([
      "camp-1",
      "camp-2",
    ]);

    expect(result.get("camp-1")).toBe(100);
    expect(result.has("camp-2")).toBe(false);
    expect(mockPrisma.campaignConversion.groupBy).toHaveBeenCalledTimes(1);
  });

  it("aggregates revenue breakdown by campaign", async () => {
    (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
      {
        campaignId: "camp-1",
        _sum: { totalPrice: 200, discountAmount: 40 },
        _count: { id: 4 },
      },
    ]);

    const result =
      await CampaignAnalyticsService.getRevenueBreakdownByCampaignIds([
        "camp-1",
        "camp-2",
      ]);

    const camp1 = result.get("camp-1");
    expect(camp1).toBeDefined();
    expect(camp1!.revenue).toBe(200);
    expect(camp1!.discount).toBe(40);
    expect(camp1!.orderCount).toBe(4);
    expect(camp1!.aov).toBe(50);
    expect(result.has("camp-2")).toBe(false);
    expect(mockPrisma.campaignConversion.groupBy).toHaveBeenCalledTimes(1);
  });

  // ==========================================================================
  // Global Analytics Methods Tests
  // ==========================================================================

  describe("getGlobalMetrics", () => {
    it("returns zero metrics when store has no campaigns", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([]);

      const result = await CampaignAnalyticsService.getGlobalMetrics("store-1");

      expect(result).toEqual({
        totalRevenue: 0,
        totalLeads: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalOrders: 0,
        avgConversionRate: 0,
        avgOrderValue: 0,
      });
    });

    it("aggregates metrics across all campaigns", async () => {
      // Mock campaigns
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([
        { id: "camp-1" },
        { id: "camp-2" },
      ]);

      // Mock lead counts
      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 50 } },
        { campaignId: "camp-2", _count: { id: 30 } },
      ]);

      // Mock impressions
      (mockGetImpressions as any).mockResolvedValueOnce(
        new Map([
          ["camp-1", 1000],
          ["camp-2", 500],
        ])
      );

      // Mock clicks
      (mockGetClicks as any).mockResolvedValueOnce(
        new Map([
          ["camp-1", 200],
          ["camp-2", 100],
        ])
      );

      // Mock revenue
      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
        {
          campaignId: "camp-1",
          _sum: { totalPrice: 5000, discountAmount: 500 },
          _count: { id: 10 },
        },
        {
          campaignId: "camp-2",
          _sum: { totalPrice: 3000, discountAmount: 300 },
          _count: { id: 5 },
        },
      ]);

      const result = await CampaignAnalyticsService.getGlobalMetrics("store-1");

      expect(result.totalLeads).toBe(80); // 50 + 30
      expect(result.totalImpressions).toBe(1500); // 1000 + 500
      expect(result.totalClicks).toBe(300); // 200 + 100
      expect(result.totalRevenue).toBe(8000); // 5000 + 3000
      expect(result.totalOrders).toBe(15); // 10 + 5
      expect(result.avgConversionRate).toBeCloseTo(5.33); // 80/1500 * 100
      expect(result.avgOrderValue).toBeCloseTo(533.33); // 8000/15
    });
  });

  describe("getGlobalMetricsWithComparison", () => {
    it("calculates percentage changes between periods", async () => {
      const currentRange = { from: new Date("2025-01-15"), to: new Date("2025-01-30") };
      const previousRange = { from: new Date("2025-01-01"), to: new Date("2025-01-14") };

      // Mock for current period
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([{ id: "camp-1" }]);
      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 100 } },
      ]);
      (mockGetImpressions as any).mockResolvedValueOnce(new Map([["camp-1", 1000]]));
      (mockGetClicks as any).mockResolvedValueOnce(new Map([["camp-1", 200]]));
      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _sum: { totalPrice: 10000 }, _count: { id: 20 } },
      ]);

      // Mock for previous period
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([{ id: "camp-1" }]);
      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 50 } },
      ]);
      (mockGetImpressions as any).mockResolvedValueOnce(new Map([["camp-1", 500]]));
      (mockGetClicks as any).mockResolvedValueOnce(new Map([["camp-1", 100]]));
      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _sum: { totalPrice: 5000 }, _count: { id: 10 } },
      ]);

      const result = await CampaignAnalyticsService.getGlobalMetricsWithComparison(
        "store-1",
        currentRange,
        previousRange
      );

      expect(result.current.totalLeads).toBe(100);
      expect(result.previous.totalLeads).toBe(50);
      expect(result.changes.leads).toBe(100); // 100% increase
      expect(result.changes.revenue).toBe(100); // 100% increase (10000 vs 5000)
    });

    it("handles zero in previous period gracefully", async () => {
      const currentRange = { from: new Date("2025-01-15"), to: new Date("2025-01-30") };
      const previousRange = { from: new Date("2025-01-01"), to: new Date("2025-01-14") };

      // Current period has data
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([{ id: "camp-1" }]);
      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 50 } },
      ]);
      (mockGetImpressions as any).mockResolvedValueOnce(new Map([["camp-1", 500]]));
      (mockGetClicks as any).mockResolvedValueOnce(new Map([["camp-1", 100]]));
      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([]);

      // Previous period has no campaigns
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([]);

      const result = await CampaignAnalyticsService.getGlobalMetricsWithComparison(
        "store-1",
        currentRange,
        previousRange
      );

      expect(result.previous.totalLeads).toBe(0);
      expect(result.changes.leads).toBe(100); // From 0 to 50 = 100% (capped)
    });
  });

  describe("getCampaignRankings", () => {
    it("returns empty array when no campaigns exist", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([]);

      const result = await CampaignAnalyticsService.getCampaignRankings(
        "store-1",
        undefined,
        "revenue",
        10
      );

      expect(result).toEqual([]);
    });

    it("returns campaigns sorted by revenue", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([
        { id: "camp-1", name: "Campaign 1", templateType: "NEWSLETTER", status: "ACTIVE" },
        { id: "camp-2", name: "Campaign 2", templateType: "SPIN_TO_WIN", status: "ACTIVE" },
      ]);

      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 10 } },
        { campaignId: "camp-2", _count: { id: 20 } },
      ]);

      (mockGetImpressions as any).mockResolvedValueOnce(
        new Map([
          ["camp-1", 100],
          ["camp-2", 200],
        ])
      );

      (mockGetClicks as any).mockResolvedValueOnce(
        new Map([
          ["camp-1", 20],
          ["camp-2", 40],
        ])
      );

      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _sum: { totalPrice: 500 }, _count: { id: 5 } },
        { campaignId: "camp-2", _sum: { totalPrice: 1000 }, _count: { id: 10 } },
      ]);

      const result = await CampaignAnalyticsService.getCampaignRankings(
        "store-1",
        undefined,
        "revenue",
        10
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("camp-2"); // Higher revenue
      expect(result[0].revenue).toBe(1000);
      expect(result[1].id).toBe("camp-1");
      expect(result[1].revenue).toBe(500);
    });

    it("returns campaigns sorted by conversion rate", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([
        { id: "camp-1", name: "Low Conv", templateType: "NEWSLETTER", status: "ACTIVE" },
        { id: "camp-2", name: "High Conv", templateType: "SPIN_TO_WIN", status: "ACTIVE" },
      ]);

      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 10 } }, // 10% conv
        { campaignId: "camp-2", _count: { id: 50 } }, // 25% conv
      ]);

      (mockGetImpressions as any).mockResolvedValueOnce(
        new Map([
          ["camp-1", 100],
          ["camp-2", 200],
        ])
      );

      (mockGetClicks as any).mockResolvedValueOnce(new Map());
      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([]);

      const result = await CampaignAnalyticsService.getCampaignRankings(
        "store-1",
        undefined,
        "conversionRate",
        10
      );

      expect(result[0].id).toBe("camp-2"); // 25% conversion rate
      expect(result[0].conversionRate).toBeCloseTo(25);
      expect(result[1].id).toBe("camp-1"); // 10% conversion rate
      expect(result[1].conversionRate).toBeCloseTo(10);
    });

    it("respects the limit parameter", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([
        { id: "camp-1", name: "Campaign 1", templateType: "NEWSLETTER", status: "ACTIVE" },
        { id: "camp-2", name: "Campaign 2", templateType: "SPIN_TO_WIN", status: "ACTIVE" },
        { id: "camp-3", name: "Campaign 3", templateType: "FLASH_SALE", status: "ACTIVE" },
      ]);

      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([]);
      (mockGetImpressions as any).mockResolvedValueOnce(new Map());
      (mockGetClicks as any).mockResolvedValueOnce(new Map());
      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([]);

      const result = await CampaignAnalyticsService.getCampaignRankings(
        "store-1",
        undefined,
        "revenue",
        2
      );

      expect(result).toHaveLength(2);
    });
  });

  describe("getPerformanceByTemplateType", () => {
    it("returns empty array when no campaigns exist", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([]);

      const result = await CampaignAnalyticsService.getPerformanceByTemplateType("store-1");

      expect(result).toEqual([]);
    });

    it("aggregates metrics by template type", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([
        { id: "camp-1", templateType: "NEWSLETTER" },
        { id: "camp-2", templateType: "NEWSLETTER" },
        { id: "camp-3", templateType: "SPIN_TO_WIN" },
      ]);

      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _count: { id: 30 } },
        { campaignId: "camp-2", _count: { id: 20 } },
        { campaignId: "camp-3", _count: { id: 50 } },
      ]);

      (mockGetImpressions as any).mockResolvedValueOnce(
        new Map([
          ["camp-1", 500],
          ["camp-2", 500],
          ["camp-3", 1000],
        ])
      );

      (mockGetClicks as any).mockResolvedValueOnce(
        new Map([
          ["camp-1", 100],
          ["camp-2", 100],
          ["camp-3", 300],
        ])
      );

      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _sum: { totalPrice: 1000 }, _count: { id: 5 } },
        { campaignId: "camp-2", _sum: { totalPrice: 1000 }, _count: { id: 5 } },
        { campaignId: "camp-3", _sum: { totalPrice: 5000 }, _count: { id: 20 } },
      ]);

      const result = await CampaignAnalyticsService.getPerformanceByTemplateType("store-1");

      expect(result).toHaveLength(2);

      // Spin to win should be first (higher revenue)
      const spinToWin = result.find((r) => r.templateType === "SPIN_TO_WIN");
      expect(spinToWin).toBeDefined();
      expect(spinToWin!.campaignCount).toBe(1);
      expect(spinToWin!.totalLeads).toBe(50);
      expect(spinToWin!.totalImpressions).toBe(1000);
      expect(spinToWin!.totalRevenue).toBe(5000);
      expect(spinToWin!.avgConversionRate).toBeCloseTo(5); // 50/1000 * 100

      // Newsletter
      const newsletter = result.find((r) => r.templateType === "NEWSLETTER");
      expect(newsletter).toBeDefined();
      expect(newsletter!.campaignCount).toBe(2);
      expect(newsletter!.totalLeads).toBe(50); // 30 + 20
      expect(newsletter!.totalImpressions).toBe(1000); // 500 + 500
      expect(newsletter!.totalRevenue).toBe(2000); // 1000 + 1000
    });

    it("sorts results by revenue descending", async () => {
      (mockPrisma.campaign.findMany as any).mockResolvedValueOnce([
        { id: "camp-1", templateType: "NEWSLETTER" },
        { id: "camp-2", templateType: "SPIN_TO_WIN" },
        { id: "camp-3", templateType: "FLASH_SALE" },
      ]);

      (mockPrisma.lead.groupBy as any).mockResolvedValueOnce([]);
      (mockGetImpressions as any).mockResolvedValueOnce(new Map());
      (mockGetClicks as any).mockResolvedValueOnce(new Map());

      (mockPrisma.campaignConversion.groupBy as any).mockResolvedValueOnce([
        { campaignId: "camp-1", _sum: { totalPrice: 500 }, _count: { id: 2 } },
        { campaignId: "camp-2", _sum: { totalPrice: 1500 }, _count: { id: 5 } },
        { campaignId: "camp-3", _sum: { totalPrice: 1000 }, _count: { id: 3 } },
      ]);

      const result = await CampaignAnalyticsService.getPerformanceByTemplateType("store-1");

      expect(result[0].templateType).toBe("SPIN_TO_WIN"); // $1500
      expect(result[1].templateType).toBe("FLASH_SALE"); // $1000
      expect(result[2].templateType).toBe("NEWSLETTER"); // $500
    });
  });
});

