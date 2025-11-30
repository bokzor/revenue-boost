/**
 * Dashboard Metrics API
 *
 * GET /api/dashboard/metrics?timeRange=30d
 *
 * Returns global metrics for the dashboard (revenue, leads, active campaigns, conversion rate).
 * Used for lazy loading the dashboard metrics cards.
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService } from "~/domains/campaigns";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { handleApiError } from "~/lib/api-error-handler.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await authenticate.admin(request);
    const storeId = await getStoreId(request);

    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || "30d";

    // Fetch all campaigns
    const allCampaigns = await CampaignService.getAllCampaigns(storeId);

    if (allCampaigns.length === 0) {
      return data({
        success: true,
        data: {
          revenue: 0,
          leads: 0,
          activeCampaigns: 0,
          conversionRate: 0,
        },
        hasCampaigns: false,
        timeRange,
      });
    }

    const campaignIds = allCampaigns.map((c) => c.id);

    // Calculate date range
    let dateFrom: Date | undefined;
    const now = new Date();
    if (timeRange === "7d") {
      dateFrom = new Date(now.setDate(now.getDate() - 7));
    } else if (timeRange === "30d") {
      dateFrom = new Date(now.setDate(now.getDate() - 30));
    }
    // "all" -> dateFrom undefined

    // Fetch analytics data
    const [statsMap, revenueMap] = await Promise.all([
      CampaignAnalyticsService.getCampaignStats(campaignIds, { from: dateFrom }),
      CampaignAnalyticsService.getRevenueBreakdownByCampaignIds(campaignIds, { from: dateFrom }),
    ]);

    // Aggregate metrics
    let totalRevenue = 0;
    let totalLeads = 0;
    let totalImpressions = 0;
    let activeCampaignsCount = 0;

    allCampaigns.forEach((campaign) => {
      const stats = statsMap.get(campaign.id);
      const revenueStats = revenueMap.get(campaign.id);

      totalRevenue += revenueStats?.revenue || 0;
      totalLeads += stats?.leadCount || 0;
      totalImpressions += stats?.impressions || 0;

      if (campaign.status === "ACTIVE") {
        activeCampaignsCount++;
      }
    });

    const globalConversionRate = totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0;

    return data({
      success: true,
      data: {
        revenue: totalRevenue,
        leads: totalLeads,
        activeCampaigns: activeCampaignsCount,
        conversionRate: globalConversionRate,
      },
      hasCampaigns: true,
      timeRange,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/dashboard/metrics");
  }
}

