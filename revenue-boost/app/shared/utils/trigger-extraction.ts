/**
 * Trigger Extraction Utilities (Stub)
 *
 * TODO: Implement trigger extraction and parsing utilities
 * This is a stub to fix import errors
 */

import type { EnhancedTriggersConfig, CampaignWithConfigs } from "~/domains/campaigns/types/campaign";

/**
 * Extract trigger configuration from campaign
 */
export function extractTriggerConfig(campaign: CampaignWithConfigs): EnhancedTriggersConfig {
  // Extract from targetRules if it contains trigger configuration
  if (campaign.targetRules && typeof campaign.targetRules === 'object') {
    return campaign.targetRules as EnhancedTriggersConfig;
  }

  // Return default configuration
  return {
    enabled: true,
    page_load: {
      enabled: true,
      delay: 0,
    },
  };
}


