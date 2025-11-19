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
    const rules = campaign.targetRules as any;
    // Check if it has the nested enhancedTriggers structure (from schema)
    if (rules.enhancedTriggers) {
      return rules.enhancedTriggers as EnhancedTriggersConfig;
    }
    // Fallback: check if targetRules itself matches the shape (legacy or direct assignment)
    if (rules.enabled !== undefined || rules.page_load || rules.exit_intent) {
      return rules as EnhancedTriggersConfig;
    }
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


