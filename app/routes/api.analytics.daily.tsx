/**
 * Analytics Daily Metrics API
 *
 * GET /api/analytics/daily?timeRange=30d
 *
 * Returns daily metrics (impressions, leads, revenue) aggregated across all campaigns.
 * Used by the global analytics dashboard for the revenue chart.
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { getDaysFromRange, getTimeRangeFromRequest } from "~/lib/date-range.server";
import { handleApiError } from "~/lib/api-error-handler.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await authenticate.admin(request);
    const storeId = await getStoreId(request);
    const timeRange = getTimeRangeFromRequest(request);
    const days = getDaysFromRange(timeRange);

    const dailyMetrics = await CampaignAnalyticsService.getGlobalDailyMetrics(storeId, days);

    return data({
      success: true,
      data: { dailyMetrics },
      timeRange,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/analytics/daily");
  }
}

