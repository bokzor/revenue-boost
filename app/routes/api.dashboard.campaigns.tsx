/**
 * Dashboard Campaigns API
 *
 * GET /api/dashboard/campaigns?timeRange=30d
 *
 * Returns campaigns list with stats and experiments data.
 * Used for lazy loading the dashboard campaigns table.
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignService, ExperimentService } from "~/domains/campaigns";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { handleApiError } from "~/lib/api-error-handler.server";

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
          campaigns: [] as CampaignDashboardRow[],
          experiments: [],
        },
        timeRange,
      });
    }

    // Fetch experiments for campaigns
    const experimentIds = Array.from(
      new Set(allCampaigns.map((c) => c.experimentId).filter((id): id is string => Boolean(id)))
    );

    const experiments = experimentIds.length > 0
      ? await ExperimentService.getExperimentsByIds(storeId, experimentIds)
      : [];

    const campaignIds = allCampaigns.map((c) => c.id);

    // Calculate date range
    let dateFrom: Date | undefined;
    const now = new Date();
    if (timeRange === "7d") {
      dateFrom = new Date(now.setDate(now.getDate() - 7));
    } else if (timeRange === "30d") {
      dateFrom = new Date(now.setDate(now.getDate() - 30));
    }

    // Fetch analytics data
    const [statsMap, revenueMap] = await Promise.all([
      CampaignAnalyticsService.getCampaignStats(campaignIds, { from: dateFrom }),
      CampaignAnalyticsService.getRevenueBreakdownByCampaignIds(campaignIds, { from: dateFrom }),
    ]);

    // Build campaign rows
    const campaignsData: CampaignDashboardRow[] = allCampaigns.map((campaign) => {
      const stats = statsMap.get(campaign.id);
      const revenueStats = revenueMap.get(campaign.id);

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
    });

    return data({
      success: true,
      data: {
        campaigns: campaignsData,
        experiments,
      },
      timeRange,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/dashboard/campaigns");
  }
}

