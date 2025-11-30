/**
 * Analytics Summary API
 *
 * GET /api/analytics/summary?timeRange=30d
 *
 * Returns global metrics for the store with period-over-period comparison.
 * Used by the global analytics dashboard for the summary cards.
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { getDateRanges, getTimeRangeFromRequest } from "~/lib/date-range.server";
import { handleApiError } from "~/lib/api-error-handler.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await authenticate.admin(request);
    const storeId = await getStoreId(request);
    const timeRange = getTimeRangeFromRequest(request);
    const { current, previous } = getDateRanges(timeRange);

    const metricsWithComparison = await CampaignAnalyticsService.getGlobalMetricsWithComparison(
      storeId,
      current,
      previous
    );

    return data({
      success: true,
      data: metricsWithComparison,
      timeRange,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/analytics/summary");
  }
}

