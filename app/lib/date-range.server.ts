/**
 * Date Range Utilities
 *
 * Helper functions for calculating date ranges used in analytics.
 */

import type { DateRangeOptions } from "~/domains/campaigns/services/campaign-analytics.server";

export type TimeRangeKey = "7d" | "30d" | "90d" | "all";

/**
 * Get the number of days from a time range key.
 */
export function getDaysFromRange(timeRange: string): number {
  switch (timeRange) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
      return 365 * 3; // 3 years for "all time"
    default:
      return 30;
  }
}

/**
 * Calculate current and previous date ranges based on time range key.
 * Returns both ranges for period-over-period comparison.
 *
 * Example for "30d":
 * - current: last 30 days (today - 30 days to today)
 * - previous: 30 days before that (today - 60 days to today - 30 days)
 */
export function getDateRanges(timeRange: string): {
  current: DateRangeOptions;
  previous: DateRangeOptions;
} {
  const now = new Date();
  const days = getDaysFromRange(timeRange);

  // Current period: from (now - days) to now
  const currentFrom = new Date(now);
  currentFrom.setDate(currentFrom.getDate() - days);
  currentFrom.setHours(0, 0, 0, 0);

  const currentTo = new Date(now);
  currentTo.setHours(23, 59, 59, 999);

  // Previous period: from (now - 2*days) to (now - days)
  const previousFrom = new Date(now);
  previousFrom.setDate(previousFrom.getDate() - days * 2);
  previousFrom.setHours(0, 0, 0, 0);

  const previousTo = new Date(currentFrom);
  previousTo.setMilliseconds(-1); // Just before current period starts

  return {
    current: { from: currentFrom, to: currentTo },
    previous: { from: previousFrom, to: previousTo },
  };
}

/**
 * Parse time range from request URL.
 */
export function getTimeRangeFromRequest(request: Request): TimeRangeKey {
  const url = new URL(request.url);
  const timeRange = url.searchParams.get("timeRange");

  if (timeRange === "7d" || timeRange === "30d" || timeRange === "90d" || timeRange === "all") {
    return timeRange;
  }

  return "30d"; // default
}

