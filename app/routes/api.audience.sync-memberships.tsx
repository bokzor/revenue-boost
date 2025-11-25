/**
 * Audience Membership Sync API
 *
 * POST /api/audience/sync-memberships
 *
 * Admin-only endpoint to sync Shopify customer segment memberships into the
 * SegmentMembership table. This keeps runtime filtering fast and avoids using
 * the Admin API on storefront requests.
 */

import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { z } from "zod";

import prisma from "~/db.server";
import { authenticate } from "~/shopify.server";
import { getStoreId } from "~/lib/auth-helpers.server";
import { createSuccessResponse } from "~/lib/api-helpers.server";
import { handleApiError } from "~/lib/api-error-handler.server";
import { syncSegmentMembershipsForStore } from "~/domains/targeting/services/segment-membership.server";

const SyncMembershipsRequestSchema = z.object({
  segmentIds: z
    .array(z.string().min(1, "Segment ID is required"))
    .min(1, "At least one segmentId is required"),
});

export async function action({ request }: ActionFunctionArgs) {
  try {
    if (request.method !== "POST") {
      return data({ error: "Method not allowed. Use POST." }, { status: 405 });
    }

    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session?.shop) {
      return data({ error: "Authentication failed" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = SyncMembershipsRequestSchema.safeParse(raw);

    if (!parsed.success) {
      return data({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const segmentIds = Array.from(new Set(parsed.data.segmentIds.filter(Boolean)));

    if (segmentIds.length === 0) {
      return data({ error: "No valid segmentIds provided" }, { status: 400 });
    }

    const shopDomain: string = session.shop;

    // Ensure we have a Store record and get its ID. If the store does not yet
    // exist, getStoreId will provision it using the authenticated session.
    let storeId: string;
    const existingStore = await prisma.store.findUnique({
      where: { shopifyDomain: shopDomain },
      select: { id: true },
    });

    if (existingStore) {
      storeId = existingStore.id;
    } else {
      storeId = await getStoreId(request);
    }

    await syncSegmentMembershipsForStore({
      storeId,
      segmentIds,
      admin,
    });

    return createSuccessResponse({
      success: true,
      storeId,
      segmentIds,
    });
  } catch (error) {
    return handleApiError(error, "POST /api/audience/sync-memberships");
  }
}

// Disallow GET for this endpoint
export async function loader() {
  return data(
    { error: "Method not allowed. Use POST to sync audience memberships." },
    { status: 405 }
  );
}
