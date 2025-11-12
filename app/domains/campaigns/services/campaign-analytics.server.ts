/**
 * Campaign Analytics Service
 * 
 * Optimized queries for campaign analytics and statistics
 * Eliminates N+1 queries by using aggregations and batch queries
 */

import prisma from "~/db.server";
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
      const [leadCounts, lastLeadTimes] = await Promise.all([
        this.getLeadCounts(campaignIds),
        this.getLastLeadTimes(campaignIds),
      ]);

      const statsMap = new Map<string, CampaignStats>();
      
      campaignIds.forEach(campaignId => {
        const leadCount = leadCounts.get(campaignId) || 0;
        const lastLeadAt = lastLeadTimes.get(campaignId) || null;
        
        // Calculate conversion rate (placeholder - would need impression data)
        const conversionRate = 0; // TODO: Implement with impression tracking

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
        orderBy: { createdAt: 'desc' },
      });

      // Get last lead times in batch
      const campaignIds = campaigns.map(c => c.id);
      const lastLeadTimes = await this.getLastLeadTimes(campaignIds);

      return campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        leadCount: campaign._count.leads,
        conversionRate: 0, // TODO: Implement with impression tracking
        lastLeadAt: lastLeadTimes.get(campaign.id) || null,
      }));
    } catch (error) {
      throw new CampaignServiceError(
        "FETCH_CAMPAIGNS_WITH_STATS_FAILED",
        "Failed to fetch campaigns with stats",
        error
      );
    }
  }
}

