/**
 * Recommendations Service
 *
 * Re-exports unified recommendations service for backward compatibility
 */

export * from "./unified-recommendations.server";

import type { CampaignGoal } from "@prisma/client";

/**
 * Campaign Context (alias for RecommendationContext)
 */
export interface CampaignContext {
  goal?: CampaignGoal;
  storeId?: string;
  currentTemplate?: string;
  previousCampaigns?: string[];
}

