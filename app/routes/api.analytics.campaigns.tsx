/**
 * Analytics Campaign Rankings API
 *
 * GET /api/analytics/campaigns?timeRange=30d&sortBy=revenue&limit=20
 *
 * Returns campaign performance rankings sorted by the specified metric.
 * Used by the global analytics dashboard for the campaign performance table.
 */

import { data, type LoaderFunctionArgs } from "react-router";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { CampaignAnalyticsService } from "~/domains/campaigns/services/campaign-analytics.server";
import { getDateRanges, getTimeRangeFromRequest } from "~/lib/date-range.server";
import { handleApiError } from "~/lib/api-error-handler.server";

type SortByOption = "revenue" | "leads" | "conversionRate" | "impressions";

function parseSortBy(value: string | null): SortByOption {
  if (
    value === "revenue" ||
    value === "leads" ||
    value === "conversionRate" ||
    value === "impressions"
  ) {
    return value;
  }
  return "revenue";
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await authenticate.admin(request);
    const storeId = await getStoreId(request);
    const url = new URL(request.url);

    const timeRange = getTimeRangeFromRequest(request);
    const sortBy = parseSortBy(url.searchParams.get("sortBy"));
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);

    const { current } = getDateRanges(timeRange);

    const rankings = await CampaignAnalyticsService.getCampaignRankings(
      storeId,
      current,
      sortBy,
      limit
    );

    return data({
      success: true,
      data: { rankings },
      timeRange,
      sortBy,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/analytics/campaigns");
  }
}

