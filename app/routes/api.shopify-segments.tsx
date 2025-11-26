/**
 * GET /api/shopify-segments
 *
 * Returns Shopify customer segments for use in the admin audience selector.
 * Backed by the Admin GraphQL API (no stubs).
 *
 * Supports just-in-time permission flow:
 * - If read_customers scope is not granted, returns scopeRequired flag
 * - UI can then prompt user to grant the scope
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

const REQUIRED_SCOPE = "read_customers";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session, scopes } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      return data({ error: "Authentication failed" }, { status: 401 });
    }

    // Check if read_customers scope is granted
    const scopeDetails = await scopes.query();
    const hasCustomerScope = scopeDetails.granted.includes(REQUIRED_SCOPE);

    if (!hasCustomerScope) {
      // Return response indicating scope is required
      return createSuccessResponse({
        segments: [],
        scopeRequired: REQUIRED_SCOPE,
        scopeMessage:
          "To target specific customer segments (like VIP customers or first-time buyers), we need permission to read your customer segment data. We only check if a visitor belongs to your selected segments.",
      });
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
      scopeGranted: true,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/shopify-segments");
  }
}
