/**
 * Campaign Segment Sync Service
 *
 * Handles automatic syncing of Shopify customer segment memberships
 * when campaigns are saved with segment targeting enabled.
 *
 * This runs asynchronously (fire-and-forget) after campaign save
 * to not block the user experience.
 */

import { logger } from "~/lib/logger.server";
import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import type { TargetRulesConfig } from "~/domains/campaigns/types/campaign";
import {
  syncSegmentMembershipsForStore,
  hasSegmentMembershipData,
} from "./segment-membership.server";

interface TriggerSyncOptions {
  storeId: string;
  targetRules?: TargetRulesConfig | null;
  admin: AdminApiContext;
  /** If true, forces sync even if membership data already exists */
  forceSync?: boolean;
}

/**
 * Extract Shopify segment IDs from campaign target rules
 */
function extractShopifySegmentIds(targetRules?: TargetRulesConfig | null): string[] {
  if (!targetRules) return [];

  const audienceTargeting = targetRules.audienceTargeting;
  if (!audienceTargeting) return [];

  const segmentIds = audienceTargeting.shopifySegmentIds;
  if (!Array.isArray(segmentIds)) return [];

  // Filter to only valid Shopify segment GIDs
  return segmentIds.filter(
    (id): id is string =>
      typeof id === "string" && id.startsWith("gid://shopify/Segment/")
  );
}

/**
 * Trigger async segment membership sync after campaign save
 *
 * This function:
 * 1. Extracts Shopify segment IDs from targetRules
 * 2. Checks if membership data already exists (unless forceSync)
 * 3. Syncs memberships in the background if needed
 *
 * Runs asynchronously - does not block the caller
 */
export function triggerCampaignSegmentSync(options: TriggerSyncOptions): void {
  const { storeId, targetRules, admin, forceSync = false } = options;

  // Extract segment IDs from target rules
  const segmentIds = extractShopifySegmentIds(targetRules);

  if (segmentIds.length === 0) {
    // No segments to sync
    return;
  }

  // Run sync asynchronously (fire-and-forget)
  // We don't await this - it runs in the background
  performSyncAsync({
    storeId,
    segmentIds,
    admin,
    forceSync,
  }).catch((error) => {
    // Log error but don't throw - this is background work
    logger.error({ error }, "[CampaignSegmentSync] Background sync failed:");
  });
}

async function performSyncAsync(options: {
  storeId: string;
  segmentIds: string[];
  admin: AdminApiContext;
  forceSync: boolean;
}): Promise<void> {
  const { storeId, segmentIds, admin, forceSync } = options;

  console.log(
    `[CampaignSegmentSync] Checking sync for ${segmentIds.length} segment(s)`,
    { storeId, segmentIds }
  );

  // Check if we already have membership data for these segments
  if (!forceSync) {
    const hasData = await hasSegmentMembershipData({ storeId, segmentIds });
    if (hasData) {
      logger.debug("[CampaignSegmentSync] Membership data already exists, skipping sync");
      return;
    }
  }

  logger.debug("[CampaignSegmentSync] Starting membership sync...");
  const startTime = Date.now();

  try {
    await syncSegmentMembershipsForStore({
      storeId,
      segmentIds,
      admin,
    });

    const duration = Date.now() - startTime;
    console.log(
      `[CampaignSegmentSync] Sync completed in ${duration}ms for ${segmentIds.length} segment(s)`
    );
  } catch (error) {
    logger.error({ error }, "[CampaignSegmentSync] Sync failed:");
    throw error;
  }
}

/**
 * Check if the store has granted read_customers scope
 * Required for segment membership sync
 */
export async function hasCustomerScope(scopes: {
  query: () => Promise<{ granted: string[] }>;
}): Promise<boolean> {
  try {
    const scopeDetails = await scopes.query();
    return scopeDetails.granted.includes("read_customers");
  } catch {
    return false;
  }
}

