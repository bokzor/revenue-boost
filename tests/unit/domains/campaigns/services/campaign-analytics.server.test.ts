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
});

