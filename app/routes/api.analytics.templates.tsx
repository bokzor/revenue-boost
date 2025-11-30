/**
 * Analytics Template Performance API
 *
 * GET /api/analytics/templates?timeRange=30d
 *
 * Returns performance metrics grouped by template type.
 * Used by the global analytics dashboard for the template performance table.
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
    const { current } = getDateRanges(timeRange);

    const templatePerformance = await CampaignAnalyticsService.getPerformanceByTemplateType(
      storeId,
      current
    );

    return data({
      success: true,
      data: { templatePerformance },
      timeRange,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/analytics/templates");
  }
}

