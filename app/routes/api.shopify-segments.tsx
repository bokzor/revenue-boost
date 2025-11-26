/**
 * GET /api/shopify-segments
 *
 * Returns Shopify customer segments for use in the admin audience selector.
 * Backed by the Admin GraphQL API (no stubs).
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { listCustomerSegments } from "~/lib/shopify/segments.server";

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

    const { segments } = await listCustomerSegments(admin, { first });

    // Shape response for UI consumption
    const payload = {
      segments: segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        // Use the segment query as a human-readable description when available
        description: segment.query || "",
      })),
    };

    return createSuccessResponse(payload);
  } catch (error) {
    return handleApiError(error, "GET /api/shopify-segments");
  }
}
