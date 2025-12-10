/**
 * Unified Campaign Creator Types
 *
 * Shared types for the unified campaign creation flow.
 */

import type { StyledRecipe } from "../../recipes/styled-recipe-types";
import type { CampaignData } from "./SingleCampaignFlow";

// =============================================================================
// EXPERIMENT TYPES
// =============================================================================

export interface Variant {
  id: string;
  name: string;
  status: "empty" | "configured";
  isControl: boolean;
  recipe?: StyledRecipe;
  campaignData?: CampaignData;
}

export interface TrafficAllocation {
  variantId: string;
  percentage: number;
}

export type SuccessMetric = "email_signups" | "discount_redemptions" | "ctr" | "revenue";

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  successMetric: SuccessMetric;
  variants: Variant[];
  trafficAllocation: TrafficAllocation[];
  status: "draft" | "running" | "completed";
}

// =============================================================================
// SUCCESS METRIC OPTIONS
// =============================================================================

export const SUCCESS_METRICS: { value: SuccessMetric; label: string }[] = [
  { value: "email_signups", label: "Email Signups" },
  { value: "discount_redemptions", label: "Discount Redemptions" },
  { value: "ctr", label: "Click-through Rate" },
  { value: "revenue", label: "Revenue Generated" },
];

