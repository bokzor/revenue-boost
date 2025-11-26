/**
 * Campaign Analytics Service
 *
 * Optimized queries for campaign analytics and statistics
 * Eliminates N+1 queries by using aggregations and batch queries
 */

import prisma from "~/db.server";
import { Prisma } from "@prisma/client";
import { PopupEventService } from "~/domains/analytics/popup-events.server";
import { CampaignServiceError } from "~/lib/errors.server";

export interface CampaignStats {
  campaignId: string;
  leadCount: number;
  impressions: number;
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

export interface DateRangeOptions {
  from?: Date;
  to?: Date;
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
  static async getLeadCounts(
    campaignIds: string[],
    options?: DateRangeOptions
  ): Promise<Map<string, number>> {
    if (campaignIds.length === 0) {
      return new Map();
    }

    try {
      const where: Prisma.LeadWhereInput = {
        campaignId: {
          in: campaignIds,
        },
      };

      if (options?.from || options?.to) {
        where.submittedAt = {};
        if (options.from) where.submittedAt.gte = options.from;
        if (options.to) where.submittedAt.lte = options.to;
      }

      const counts = await prisma.lead.groupBy({
        by: ["campaignId"],
        where,
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
  static async getCampaignStats(
    campaignIds: string[],
    options?: DateRangeOptions
  ): Promise<Map<string, CampaignStats>> {
    if (campaignIds.length === 0) {
      return new Map();
    }

    try {
      // Fetch all stats in parallel
      const [leadCounts, lastLeadTimes, impressionCounts] = await Promise.all([
        this.getLeadCounts(campaignIds, options),
        this.getLastLeadTimes(campaignIds), // Last lead time is usually global, but could be ranged. Keeping global for "Last Updated" feel.
        PopupEventService.getImpressionCountsByCampaign(campaignIds, {
          from: options?.from,
          to: options?.to,
        }),
      ]);

      const statsMap = new Map<string, CampaignStats>();

      campaignIds.forEach((campaignId) => {
        const leadCount = leadCounts.get(campaignId) || 0;
        const lastLeadAt = lastLeadTimes.get(campaignId) || null;
        const impressions = impressionCounts.get(campaignId) || 0;

        const conversionRate = impressions > 0 ? (leadCount / impressions) * 100 : 0;

        statsMap.set(campaignId, {
          campaignId,
          leadCount,
          impressions,
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
    options?: DateRangeOptions
  ): Promise<Map<string, { revenue: number; discount: number; orderCount: number; aov: number }>> {
    if (campaignIds.length === 0) {
      return new Map();
    }

    try {
      const where: Prisma.CampaignConversionWhereInput = {
        campaignId: { in: campaignIds },
      };

      if (options?.from || options?.to) {
        where.createdAt = {};
        if (options.from) where.createdAt.gte = options.from;
        if (options.to) where.createdAt.lte = options.to;
      }

      const rows = await prisma.campaignConversion.groupBy({
        by: ["campaignId"],
        where,
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
        const discount = row._sum.discountAmount ? Number(row._sum.discountAmount) : 0;
        const orderCount = row._count.id ?? 0;
        const aov = orderCount > 0 ? revenue / orderCount : 0;

        result.set(row.campaignId, { revenue, discount, orderCount, aov });
      });

      return result;
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGN_REVENUE_FAILED",
        "Failed to fetch campaign revenue",
        error
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
    options?: DateRangeOptions
  ): Promise<Map<string, number>> {
    const breakdown = await this.getRevenueBreakdownByCampaignIds(campaignIds, options);

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

        const conversionRate = impressions > 0 ? (leadCount / impressions) * 100 : 0;

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
  /**
   * Get daily metrics for a campaign (impressions, leads, revenue)
   * for the last N days.
   *
   * Merges data from popup_events (impressions, leads) and campaign_conversions (revenue).
   */
  static async getDailyMetrics(
    campaignId: string | string[],
    days: number = 30
  ): Promise<Array<{ date: string; impressions: number; leads: number; revenue: number }>> {
    try {
      const ids = Array.isArray(campaignId) ? campaignId : [campaignId];
      if (ids.length === 0) return [];

      const whereClause = Prisma.sql`"campaignId" IN (${Prisma.join(ids)})`;

      // 1. Get Impressions & Leads per day
      const events = await prisma.$queryRaw<Array<{ date: Date; type: string; count: bigint }>>`
        SELECT
          DATE_TRUNC('day', "createdAt") as date,
          "eventType" as type,
          COUNT(*) as count
        FROM "popup_events"
        WHERE ${whereClause}
          AND "eventType" IN ('VIEW', 'SUBMIT')
          AND "createdAt" > NOW() - INTERVAL '1 day' * ${days}
        GROUP BY DATE_TRUNC('day', "createdAt"), "eventType"
        ORDER BY date ASC
      `;

      // 2. Get Revenue per day
      const conversions = await prisma.$queryRaw<Array<{ date: Date; revenue: number }>>`
        SELECT
          DATE_TRUNC('day', "createdAt") as date,
          SUM("totalPrice") as revenue
        FROM "campaign_conversions"
        WHERE ${whereClause}
          AND "createdAt" > NOW() - INTERVAL '1 day' * ${days}
        GROUP BY DATE_TRUNC('day', "createdAt")
        ORDER BY date ASC
      `;

      // 3. Merge and format
      const metricsMap = new Map<string, { impressions: number; leads: number; revenue: number }>();

      // Initialize map with empty days if needed, or just sparse
      // For charts, sparse is usually fine if the frontend handles it,
      // but filling gaps is nicer. Let's just return sparse for now.

      events.forEach((row) => {
        const dateKey = row.date.toISOString().split("T")[0];
        const current = metricsMap.get(dateKey) || {
          impressions: 0,
          leads: 0,
          revenue: 0,
        };

        if (row.type === "VIEW") current.impressions = Number(row.count);
        if (row.type === "SUBMIT") current.leads = Number(row.count);

        metricsMap.set(dateKey, current);
      });

      conversions.forEach((row) => {
        const dateKey = row.date.toISOString().split("T")[0];
        const current = metricsMap.get(dateKey) || {
          impressions: 0,
          leads: 0,
          revenue: 0,
        };
        current.revenue = Number(row.revenue);
        metricsMap.set(dateKey, current);
      });

      // Convert to array and sort
      return Array.from(metricsMap.entries())
        .map(([date, metrics]) => ({ date, ...metrics }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("Failed to fetch daily metrics:", error);
      // Return empty array instead of throwing to avoid breaking the whole page
      return [];
    }
  }
}
