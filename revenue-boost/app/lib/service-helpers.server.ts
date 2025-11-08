/**
 * Service Helper Utilities
 *
 * Shared Prisma query patterns and data transformations
 */

import type { Prisma } from "@prisma/client";

/**
 * Creates a Prisma where clause for global or store-specific resources
 * Eliminates duplicate OR query patterns
 *
 * @example
 * const templates = await prisma.template.findMany({
 *   where: {
 *     ...globalOrStoreWhere(storeId),
 *     isActive: true
 *   }
 * });
 */
export function globalOrStoreWhere(storeId?: string): Prisma.TemplateWhereInput {
  return {
    OR: [
      { storeId: null }, // Global resources
      { storeId }, // Store-specific resources
    ],
  };
}

/**
 * Standard template include for campaign queries
 * Eliminates duplicate include patterns
 */
export const CAMPAIGN_TEMPLATE_INCLUDE = {
  template: {
    select: {
      id: true,
      name: true,
      templateType: true,
    },
  },
} as const;

/**
 * Extended template include with content config
 */
export const CAMPAIGN_TEMPLATE_INCLUDE_EXTENDED = {
  template: {
    select: {
      id: true,
      name: true,
      templateType: true,
      contentConfig: true,
    },
  },
} as const;

/**
 * Standard experiment include for campaign queries
 */
export const CAMPAIGN_EXPERIMENT_INCLUDE = {
  experiment: {
    select: {
      id: true,
      name: true,
      status: true,
    },
  },
} as const;

/**
 * Extended experiment include with traffic allocation
 */
export const CAMPAIGN_EXPERIMENT_INCLUDE_EXTENDED = {
  experiment: {
    select: {
      id: true,
      name: true,
      status: true,
      trafficAllocation: true,
    },
  },
} as const;

/**
 * Standard campaign include for experiment queries
 */
export const EXPERIMENT_CAMPAIGNS_INCLUDE = {
  campaigns: {
    select: {
      id: true,
      name: true,
      variantKey: true,
      isControl: true,
      status: true,
    },
  },
} as const;

/**
 * Extended campaign include with template type
 */
export const EXPERIMENT_CAMPAIGNS_INCLUDE_EXTENDED = {
  campaigns: {
    select: {
      id: true,
      name: true,
      variantKey: true,
      isControl: true,
      status: true,
      templateType: true,
    },
  },
} as const;

// ============================================================================
// DATA TRANSFORMATION HELPERS
// ============================================================================

/**
 * Maps experiment campaigns to variant objects
 * Eliminates duplicate variant mapping logic
 *
 * @example
 * return {
 *   ...parseExperimentFields(experiment),
 *   variants: mapCampaignsToVariants(experiment.campaigns)
 * };
 */
export function mapCampaignsToVariants(
  campaigns: Array<{
    id: string;
    name: string;
    variantKey: string | null;
    isControl: boolean;
  }>
): Array<{
  id: string;
  variantKey: "A" | "B" | "C" | "D";
  name: string;
  isControl: boolean;
  trafficPercentage: number;
}> {
  return campaigns.map((campaign) => ({
    id: campaign.id,
    variantKey: campaign.variantKey as "A" | "B" | "C" | "D",
    name: campaign.name,
    isControl: campaign.isControl,
    trafficPercentage: 0, // Will be calculated from trafficAllocation
  }));
}

