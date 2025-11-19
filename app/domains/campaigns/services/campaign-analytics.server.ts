/**
 * Campaign Analytics Service
 *
 * Optimized queries for campaign analytics and statistics
 * Eliminates N+1 queries by using aggregations and batch queries
 */

import prisma from "~/db.server";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { CampaignServiceError } from "~/lib/errors.server";

export interface CampaignStats {
  campaignId: string;
  leadCount: number;
  conversionRate: number;
  lastLeadAt: Date | null;
}

export interface CampaignWithStats {
  id: string;
  name: string;
  status: string;
  leadCount: number;
  conversionRate: number;
  lastLeadAt: Date | null;
}

/**
 * Campaign Analytics Service
 * Provides optimized analytics queries
 */
export class CampaignAnalyticsService {
  /**
   * Get lead counts for multiple campaigns in a single query
   * OPTIMIZED: Batch query instead of N queries
   */
  static async getLeadCounts(campaignIds: string[]): Promise<Map<string, number>> {
    if (campaignIds.length === 0) {
      return new Map();
    }

    try {
      const counts = await prisma.lead.groupBy({
        by: ['campaignId'],
        where: {
          campaignId: {
            in: campaignIds,
          },
        },
        _count: {
          id: true,
        },
      });

      const countMap = new Map<string, number>();
      counts.forEach(({ campaignId, _count }) => {
        countMap.set(campaignId, _count.id);
      });

      return countMap;
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_LEAD_COUNTS_FAILED",
        "Failed to fetch lead counts",
        error
      );
    }
  }

  /**
   * Get last lead submission time for multiple campaigns
   * OPTIMIZED: Single query with subquery instead of N queries
   */
  static async getLastLeadTimes(campaignIds: string[]): Promise<Map<string, Date>> {
    if (campaignIds.length === 0) {
      return new Map();
    }

    try {
      // Use raw SQL for optimal performance
      const results = await prisma.$queryRaw<Array<{ campaignId: string; lastLeadAt: Date }>>`
        SELECT
          "campaignId",
          MAX("submittedAt") as "lastLeadAt"
        FROM "leads"
        WHERE "campaignId" = ANY(${campaignIds})
        GROUP BY "campaignId"
      `;

      const timeMap = new Map<string, Date>();
      results.forEach(({ campaignId, lastLeadAt }) => {
        timeMap.set(campaignId, lastLeadAt);
      });

      return timeMap;
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_LAST_LEAD_TIMES_FAILED",
        "Failed to fetch last lead times",
        error
      );
    }
  }

  /**
   * Get comprehensive stats for multiple campaigns
   * OPTIMIZED: Batch queries instead of N+1
   */
  static async getCampaignStats(campaignIds: string[]): Promise<Map<string, CampaignStats>> {
    if (campaignIds.length === 0) {
      return new Map();
    }

    try {
      // Fetch all stats in parallel
      const [leadCounts, lastLeadTimes, impressionCounts] = await Promise.all([
        this.getLeadCounts(campaignIds),
        this.getLastLeadTimes(campaignIds),
        PopupEventService.getImpressionCountsByCampaign(campaignIds),
      ]);

      const statsMap = new Map<string, CampaignStats>();

      campaignIds.forEach((campaignId) => {
        const leadCount = leadCounts.get(campaignId) || 0;
        const lastLeadAt = lastLeadTimes.get(campaignId) || null;
        const impressions = impressionCounts.get(campaignId) || 0;

        const conversionRate = impressions > 0
          ? (leadCount / impressions) * 100
          : 0;

        statsMap.set(campaignId, {
          campaignId,
          leadCount,
          conversionRate,
          lastLeadAt,
        });
      });

      return statsMap;
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGN_STATS_FAILED",
        "Failed to fetch campaign stats",
        error
      );
    }
  }

  /**
   * Get attributed revenue stats per campaign from CampaignConversion.
   *
   * Uses:
   * - SUM(totalPrice) as gross "Total Revenue"
   * - SUM(discountAmount) as "Total Discount Given"
   * - COUNT(*) as order count
   * - AOV (gross) = SUM(totalPrice) / COUNT(*)
   */
  static async getRevenueBreakdownByCampaignIds(
    campaignIds: string[],
  ): Promise<
    Map<string, { revenue: number; discount: number; orderCount: number; aov: number }>
  > {
    if (campaignIds.length === 0) {
      return new Map();
    }

    try {
      const rows = await prisma.campaignConversion.groupBy({
        by: ["campaignId"],
        where: {
          campaignId: { in: campaignIds },
        },
        _sum: {
          totalPrice: true,
          discountAmount: true,
        },
        _count: {
          id: true,
        },
      });

      const result = new Map<
        string,
        { revenue: number; discount: number; orderCount: number; aov: number }
      >();

      rows.forEach((row) => {
        const revenue = row._sum.totalPrice ? Number(row._sum.totalPrice) : 0;
        const discount = row._sum.discountAmount
          ? Number(row._sum.discountAmount)
          : 0;
        const orderCount = row._count.id ?? 0;
        const aov = orderCount > 0 ? revenue / orderCount : 0;

        result.set(row.campaignId, { revenue, discount, orderCount, aov });
      });

      return result;
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGN_REVENUE_FAILED",
        "Failed to fetch campaign revenue",
        error,
      );
    }
  }

  /**
   * Get attributed gross revenue per campaign from CampaignConversion.
   *
   * Convenience wrapper over getRevenueBreakdownByCampaignIds that only returns
   * revenue.
   */
  static async getRevenueByCampaignIds(
    campaignIds: string[],
  ): Promise<Map<string, number>> {
    const breakdown = await this.getRevenueBreakdownByCampaignIds(campaignIds);

    const revenueMap = new Map<string, number>();
    breakdown.forEach((value, campaignId) => {
      revenueMap.set(campaignId, value.revenue);
    });

    return revenueMap;
  }

  /**
   * Get campaigns with their stats in a single optimized query
   * OPTIMIZED: Uses LEFT JOIN instead of N+1 queries
   */
  static async getCampaignsWithStats(storeId: string): Promise<CampaignWithStats[]> {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: { storeId },
        select: {
          id: true,
          name: true,
          status: true,
          _count: {
            select: {
              leads: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const campaignIds = campaigns.map((c) => c.id);

      const [lastLeadTimes, impressionCounts] = await Promise.all([
        this.getLastLeadTimes(campaignIds),
        PopupEventService.getImpressionCountsByCampaign(campaignIds),
      ]);

      return campaigns.map((campaign) => {
        const leadCount = campaign._count.leads;
        const lastLeadAt = lastLeadTimes.get(campaign.id) || null;
        const impressions = impressionCounts.get(campaign.id) || 0;

        const conversionRate = impressions > 0
          ? (leadCount / impressions) * 100
          : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          leadCount,
          conversionRate,
          lastLeadAt,
        };
      });
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGNS_WITH_STATS_FAILED",
        "Failed to fetch campaigns with stats",
        error
      );
    }
  }
}

