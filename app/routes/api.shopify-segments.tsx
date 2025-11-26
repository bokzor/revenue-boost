/**
 * GET /api/shopify-segments
 *
 * Returns Shopify customer segments for use in the admin audience selector.
 * Backed by the Admin GraphQL API.
 *
 * Query parameters:
 * - first: Number of segments to fetch (default: 50, max: 250)
 * - includeCounts: Whether to include customer counts per segment (default: false)
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import {
  listCustomerSegments,
  getCustomerSegmentMembersCount,
} from "~/lib/shopify/segments.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      return data({ error: "Authentication failed" }, { status: 401 });
    }

    const url = new URL(request.url);
    const firstParam = url.searchParams.get("first");
    const first =
      Number.isFinite(Number(firstParam)) && Number(firstParam) > 0
        ? Math.min(Number(firstParam), 250)
        : 50;
    const includeCounts = url.searchParams.get("includeCounts") === "true";

    const { segments } = await listCustomerSegments(admin, { first });

    // Optionally fetch customer counts (can be slow for many segments)
    let segmentsWithCounts = segments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      description: segment.query || "",
      customerCount: undefined as number | undefined,
    }));

    if (includeCounts && segments.length > 0) {
      // Fetch counts in parallel (limit to first 10 to avoid rate limits)
      const segmentsToCount = segments.slice(0, 10);
      const countPromises = segmentsToCount.map(async (segment) => {
        try {
          const count = await getCustomerSegmentMembersCount(admin, segment.id);
          return { id: segment.id, count };
        } catch (error) {
          console.warn(`[Shopify Segments] Failed to get count for ${segment.id}:`, error);
          return { id: segment.id, count: undefined };
        }
      });

      const counts = await Promise.all(countPromises);
      const countMap = new Map(counts.map((c) => [c.id, c.count]));

      segmentsWithCounts = segmentsWithCounts.map((segment) => ({
        ...segment,
        customerCount: countMap.get(segment.id),
      }));
    }

    return createSuccessResponse({
      segments: segmentsWithCounts,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/shopify-segments");
  }
}
