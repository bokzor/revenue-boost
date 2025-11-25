/**
 * GET /api/product-tags
 *
 * Returns Shopify product tags for use in admin tag autocompletes.
 * Backed by the Admin GraphQL API.
 */

import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { listProductTags } from "~/lib/shopify/product-tags.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      return data({ error: "Authentication failed" }, { status: 401 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const q = (searchParams.get("q") || "").trim();
    const firstParam = searchParams.get("first");
    const first =
      Number.isFinite(Number(firstParam)) && Number(firstParam) > 0
        ? Math.min(Number(firstParam), 5000)
        : 500;

    // Fetch tags (single page). The Admin API does not support a search argument,
    // so we filter client-side for autocomplete.
    const { tags } = await listProductTags(admin, { first });

    const filtered = q ? tags.filter((tag) => tag.toLowerCase().includes(q.toLowerCase())) : tags;

    const limited = filtered.slice(0, 20);

    const payload = {
      tags: limited,
    };

    return createSuccessResponse(payload);
  } catch (error) {
    return handleApiError(error, "GET /api/product-tags");
  }
}
