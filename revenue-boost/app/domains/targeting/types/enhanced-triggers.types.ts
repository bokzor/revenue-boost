/**
 * Enhanced Triggers Types
 *
 * Re-exports targeting-related types from the canonical campaign types
 */

import type { EnhancedTriggersConfig } from "~/domains/campaigns/types/campaign";

export type {
  EnhancedTriggersConfig,
  AudienceTargetingConfig,
  PageTargetingConfig,
  TargetRulesConfig,
  TriggerType,
  TriggerRule,
  EnhancedTrigger,
} from "~/domains/campaigns/types/campaign";

// Alias for backward compatibility
export type EnhancedTriggerConfig = EnhancedTriggersConfig;
