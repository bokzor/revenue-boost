/**
 * Enhanced Triggers Types
 */

import type {
  EnhancedTriggersConfig,
} from "~/domains/campaigns/types/campaign";

export type {
  EnhancedTriggersConfig,
  AudienceTargetingConfig,
  TargetRulesConfig,
  TriggerType,
  TriggerRule,
  EnhancedTrigger,
} from "~/domains/campaigns/types/campaign";

// Alias for backward compatibility
export type EnhancedTriggerConfig = EnhancedTriggersConfig;
