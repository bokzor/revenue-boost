/**
 * Campaign Analytics Service
 *
 * Optimized queries for campaign analytics and statistics
 * Eliminates N+1 queries by using aggregations and batch queries
 */

import { logger } from "~/lib/logger.server";
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

// ============================================================================
// Global Analytics Types
// ============================================================================

export interface GlobalMetrics {
  totalRevenue: number;
  totalLeads: number;
  totalImpressions: number;
  totalClicks: number;
  totalOrders: number;
  avgConversionRate: number;
  avgOrderValue: number;
}

export interface GlobalMetricsWithComparison {
  current: GlobalMetrics;
  previous: GlobalMetrics;
  changes: {
    revenue: number;
    leads: number;
    impressions: number;
    orders: number;
    conversionRate: number;
    aov: number;
  };
}

export interface CampaignRanking {
  id: string;
  name: string;
  templateType: string;
  status: string;
  impressions: number;
  leads: number;
  clicks: number;
  revenue: number;
  orders: number;
  conversionRate: number;
  aov: number;
}

export interface TemplatePerformance {
  templateType: string;
  campaignCount: number;
  totalImpressions: number;
  totalLeads: number;
  totalClicks: number;
  totalRevenue: number;
  totalOrders: number;
  avgConversionRate: number;
  avgOrderValue: number;
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

      // Initialize map with all days in range (fill gaps for better chart rendering)
      const today = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        metricsMap.set(dateKey, { impressions: 0, leads: 0, revenue: 0 });
      }

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
      logger.error({ error }, "Failed to fetch daily metrics:");
      // Return empty array instead of throwing to avoid breaking the whole page
      return [];
    }
  }

  // ============================================================================
  // Global Analytics Methods (Store-wide aggregations)
  // ============================================================================

  /**
   * Get aggregated metrics across all campaigns for a store.
   * Used by the global analytics dashboard.
   */
  static async getGlobalMetrics(
    storeId: string,
    options?: DateRangeOptions
  ): Promise<GlobalMetrics> {
    try {
      // 1. Get all campaign IDs for this store
      const campaigns = await prisma.campaign.findMany({
        where: { storeId },
        select: { id: true },
      });
      const campaignIds = campaigns.map((c) => c.id);

      if (campaignIds.length === 0) {
        return {
          totalRevenue: 0,
          totalLeads: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalOrders: 0,
          avgConversionRate: 0,
          avgOrderValue: 0,
        };
      }

      // 2. Fetch all stats in parallel
      const [leadCounts, impressionCounts, clickCounts, revenueBreakdown] = await Promise.all([
        this.getLeadCounts(campaignIds, options),
        PopupEventService.getImpressionCountsByCampaign(campaignIds, {
          from: options?.from,
          to: options?.to,
        }),
        PopupEventService.getClickCountsByCampaign(campaignIds, {
          from: options?.from,
          to: options?.to,
        }),
        this.getRevenueBreakdownByCampaignIds(campaignIds, options),
      ]);

      // 3. Aggregate totals
      let totalLeads = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalRevenue = 0;
      let totalOrders = 0;

      leadCounts.forEach((count) => (totalLeads += count));
      impressionCounts.forEach((count) => (totalImpressions += count));
      clickCounts.forEach((count) => (totalClicks += count));
      revenueBreakdown.forEach((breakdown) => {
        totalRevenue += breakdown.revenue;
        totalOrders += breakdown.orderCount;
      });

      return {
        totalRevenue,
        totalLeads,
        totalImpressions,
        totalClicks,
        totalOrders,
        avgConversionRate: totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      };
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_GLOBAL_METRICS_FAILED",
        "Failed to fetch global metrics",
        error
      );
    }
  }

  /**
   * Get global metrics with comparison to previous period.
   * Calculates percentage changes between current and previous periods.
   */
  static async getGlobalMetricsWithComparison(
    storeId: string,
    currentRange: DateRangeOptions,
    previousRange: DateRangeOptions
  ): Promise<GlobalMetricsWithComparison> {
    const [current, previous] = await Promise.all([
      this.getGlobalMetrics(storeId, currentRange),
      this.getGlobalMetrics(storeId, previousRange),
    ]);

    const calcChange = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      current,
      previous,
      changes: {
        revenue: calcChange(current.totalRevenue, previous.totalRevenue),
        leads: calcChange(current.totalLeads, previous.totalLeads),
        impressions: calcChange(current.totalImpressions, previous.totalImpressions),
        orders: calcChange(current.totalOrders, previous.totalOrders),
        conversionRate: calcChange(current.avgConversionRate, previous.avgConversionRate),
        aov: calcChange(current.avgOrderValue, previous.avgOrderValue),
      },
    };
  }

  /**
   * Get daily metrics aggregated across all campaigns for a store.
   * Used for the global analytics revenue chart.
   */
  static async getGlobalDailyMetrics(
    storeId: string,
    days: number = 30
  ): Promise<Array<{ date: string; impressions: number; leads: number; revenue: number }>> {
    try {
      // Get all campaign IDs for this store
      const campaigns = await prisma.campaign.findMany({
        where: { storeId },
        select: { id: true },
      });
      const campaignIds = campaigns.map((c) => c.id);

      if (campaignIds.length === 0) {
        return [];
      }

      // Reuse the existing getDailyMetrics method which already supports multiple campaign IDs
      return this.getDailyMetrics(campaignIds, days);
    } catch (error) {
      logger.error({ error }, "Failed to fetch global daily metrics:");
      return [];
    }
  }

  /**
   * Get campaign rankings sorted by a specific metric.
   * Used for the campaign performance table in global analytics.
   */
  static async getCampaignRankings(
    storeId: string,
    options: DateRangeOptions | undefined,
    sortBy: "revenue" | "leads" | "conversionRate" | "impressions" = "revenue",
    limit: number = 20
  ): Promise<CampaignRanking[]> {
    try {
      // 1. Get all campaigns with basic info
      const campaigns = await prisma.campaign.findMany({
        where: { storeId },
        select: {
          id: true,
          name: true,
          templateType: true,
          status: true,
        },
      });

      if (campaigns.length === 0) {
        return [];
      }

      const campaignIds = campaigns.map((c) => c.id);

      // 2. Fetch all stats in parallel
      const [leadCounts, impressionCounts, clickCounts, revenueBreakdown] = await Promise.all([
        this.getLeadCounts(campaignIds, options),
        PopupEventService.getImpressionCountsByCampaign(campaignIds, {
          from: options?.from,
          to: options?.to,
        }),
        PopupEventService.getClickCountsByCampaign(campaignIds, {
          from: options?.from,
          to: options?.to,
        }),
        this.getRevenueBreakdownByCampaignIds(campaignIds, options),
      ]);

      // 3. Build rankings array
      const rankings: CampaignRanking[] = campaigns.map((campaign) => {
        const leads = leadCounts.get(campaign.id) || 0;
        const impressions = impressionCounts.get(campaign.id) || 0;
        const clicks = clickCounts.get(campaign.id) || 0;
        const revData = revenueBreakdown.get(campaign.id) || {
          revenue: 0,
          orderCount: 0,
          aov: 0,
        };

        return {
          id: campaign.id,
          name: campaign.name,
          templateType: campaign.templateType,
          status: campaign.status,
          impressions,
          leads,
          clicks,
          revenue: revData.revenue,
          orders: revData.orderCount,
          conversionRate: impressions > 0 ? (leads / impressions) * 100 : 0,
          aov: revData.aov,
        };
      });

      // 4. Sort by requested metric (descending)
      rankings.sort((a, b) => {
        switch (sortBy) {
          case "revenue":
            return b.revenue - a.revenue;
          case "leads":
            return b.leads - a.leads;
          case "conversionRate":
            return b.conversionRate - a.conversionRate;
          case "impressions":
            return b.impressions - a.impressions;
          default:
            return b.revenue - a.revenue;
        }
      });

      // 5. Limit results
      return rankings.slice(0, limit);
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGN_RANKINGS_FAILED",
        "Failed to fetch campaign rankings",
        error
      );
    }
  }

  /**
   * Get performance metrics grouped by template type.
   * Used for the template performance table in global analytics.
   */
  static async getPerformanceByTemplateType(
    storeId: string,
    options?: DateRangeOptions
  ): Promise<TemplatePerformance[]> {
    try {
      // 1. Get all campaigns grouped by template type
      const campaigns = await prisma.campaign.findMany({
        where: { storeId },
        select: {
          id: true,
          templateType: true,
        },
      });

      if (campaigns.length === 0) {
        return [];
      }

      // Group campaign IDs by template type
      const templateGroups = new Map<string, string[]>();
      campaigns.forEach((campaign) => {
        const ids = templateGroups.get(campaign.templateType) || [];
        ids.push(campaign.id);
        templateGroups.set(campaign.templateType, ids);
      });

      const campaignIds = campaigns.map((c) => c.id);

      // 2. Fetch all stats in parallel
      const [leadCounts, impressionCounts, clickCounts, revenueBreakdown] = await Promise.all([
        this.getLeadCounts(campaignIds, options),
        PopupEventService.getImpressionCountsByCampaign(campaignIds, {
          from: options?.from,
          to: options?.to,
        }),
        PopupEventService.getClickCountsByCampaign(campaignIds, {
          from: options?.from,
          to: options?.to,
        }),
        this.getRevenueBreakdownByCampaignIds(campaignIds, options),
      ]);

      // 3. Aggregate by template type
      const performances: TemplatePerformance[] = [];

      templateGroups.forEach((ids, templateType) => {
        let totalImpressions = 0;
        let totalLeads = 0;
        let totalClicks = 0;
        let totalRevenue = 0;
        let totalOrders = 0;

        ids.forEach((id) => {
          totalLeads += leadCounts.get(id) || 0;
          totalImpressions += impressionCounts.get(id) || 0;
          totalClicks += clickCounts.get(id) || 0;
          const revData = revenueBreakdown.get(id);
          if (revData) {
            totalRevenue += revData.revenue;
            totalOrders += revData.orderCount;
          }
        });

        performances.push({
          templateType,
          campaignCount: ids.length,
          totalImpressions,
          totalLeads,
          totalClicks,
          totalRevenue,
          totalOrders,
          avgConversionRate: totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0,
          avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        });
      });

      // Sort by revenue descending
      performances.sort((a, b) => b.totalRevenue - a.totalRevenue);

      return performances;
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_TEMPLATE_PERFORMANCE_FAILED",
        "Failed to fetch template performance",
        error
      );
    }
  }
}
