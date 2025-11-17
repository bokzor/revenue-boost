/**
 * Audience Preview API
 *
 * POST /api/audience/preview
 *
 * Returns a live audience size estimate based on Shopify customer segments.
 * Uses the Admin GraphQL API (no stubs). Session rules are currently ignored
 * for the numeric estimate because they apply to anonymous/session context
 * that Shopify doesn't model.
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { z } from "zod";

import { authenticate } from "~/shopify.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { AudienceTargetingConfigSchema } from "~/domains/campaigns/types/campaign";
import { getCustomerSegmentMembersCount } from "~/lib/shopify/segments.server";

const AudiencePreviewRequestSchema = z.object({
  audienceTargeting: AudienceTargetingConfigSchema,
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      return data({ error: "Authentication failed" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = AudiencePreviewRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return data(
        { error: "Invalid audience targeting payload", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { audienceTargeting } = parsed.data;

    if (!audienceTargeting.enabled || audienceTargeting.shopifySegmentIds.length === 0) {
      return createSuccessResponse({
        estimatedReach: {
          totalCustomers: 0,
          perSegment: [],
        },
      });
    }

    const uniqueSegmentIds = Array.from(
      new Set(audienceTargeting.shopifySegmentIds.filter((id) => !!id)),
    );

    const counts = await Promise.all(
      uniqueSegmentIds.map(async (segmentId) => {
        const total = await getCustomerSegmentMembersCount(admin, segmentId);
        return { segmentId, totalCustomers: total };
      }),
    );

    const totalCustomers = counts.reduce((sum, entry) => sum + entry.totalCustomers, 0);

    return createSuccessResponse({
      estimatedReach: {
        totalCustomers,
        perSegment: counts,
      },
    });
  } catch (error) {
    return handleApiError(error, "POST /api/audience/preview");
  }
}

// Disallow GET for this endpoint
export async function loader() {
  return data(
    { error: "Method not allowed. Use POST to preview audience size." },
    { status: 405 },
  );
}

