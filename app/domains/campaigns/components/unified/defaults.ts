/**
 * Unified Campaign Creator Defaults
 *
 * Shared default configurations used across SingleCampaignFlow and VariantCampaignEditor.
 * Centralized to prevent drift between components.
 */

import type { DiscountConfig } from "../../types/campaign";
import type { FrequencyCappingConfig } from "~/domains/targeting/components/FrequencyCappingPanel";

// =============================================================================
// TARGETING DEFAULTS
// =============================================================================

export interface TargetingConfigDefaults {
  enhancedTriggers: {
    enabled: boolean;
    page_load?: { enabled: boolean; delay: number };
  };
  audienceTargeting: {
    enabled: boolean;
    shopifySegmentIds: string[];
  };
  geoTargeting: {
    enabled: boolean;
    mode: "include" | "exclude";
    countries: string[];
  };
}

export const DEFAULT_TARGETING_CONFIG: TargetingConfigDefaults = {
  enhancedTriggers: {
    enabled: true,
    page_load: { enabled: true, delay: 3000 },
  },
  audienceTargeting: {
    enabled: false,
    shopifySegmentIds: [],
  },
  geoTargeting: {
    enabled: false,
    mode: "include",
    countries: [],
  },
};

// =============================================================================
// FREQUENCY CAPPING DEFAULTS
// =============================================================================

export const DEFAULT_FREQUENCY_CONFIG: FrequencyCappingConfig = {
  enabled: true,
  max_triggers_per_session: 1,
  max_triggers_per_day: 3,
  cooldown_between_triggers: 300,
  respectGlobalCap: true,
};

// =============================================================================
// SCHEDULE DEFAULTS
// =============================================================================

export interface ScheduleConfigDefaults {
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  priority: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfigDefaults = {
  status: "DRAFT",
  priority: 50,
};

// =============================================================================
// DISCOUNT DEFAULTS
// =============================================================================

export const DEFAULT_DISCOUNT_CONFIG: DiscountConfig = {
  enabled: false,
  showInPreview: true,
  strategy: "simple",
  type: "shared",
  valueType: "PERCENTAGE",
  value: 10,
  expiryDays: 30,
  prefix: "WELCOME",
  behavior: "SHOW_CODE_AND_AUTO_APPLY",
};

// =============================================================================
// SECTION DEFINITIONS
// =============================================================================

export type SectionId =
  | "recipe"
  | "basics"
  | "quickConfig"
  | "content"
  | "design"
  | "discount"
  | "targeting"
  | "frequency"
  | "schedule";

export interface SectionDef {
  id: SectionId;
  icon: string;
  title: string;
  subtitle: string;
  /** If true, section is conditionally visible (e.g., quickConfig only shows if recipe has inputs) */
  conditional?: boolean;
}

export const EDITOR_SECTIONS: SectionDef[] = [
  {
    id: "basics",
    icon: "📝",
    title: "Campaign Name & Description",
    subtitle: "Give your campaign a name and optional description",
  },
  {
    id: "quickConfig",
    icon: "⚙️",
    title: "Quick Configuration",
    subtitle: "Configure your offer details",
    conditional: true,
  },
  {
    id: "content",
    icon: "✏️",
    title: "Content & Design",
    subtitle: "Configure headlines, buttons, colors, and styling",
  },
  {
    id: "targeting",
    icon: "🎯",
    title: "Targeting & Triggers",
    subtitle: "Define who sees your popup and when",
  },
  {
    id: "frequency",
    icon: "🔄",
    title: "Frequency",
    subtitle: "Control how often the popup appears",
  },
  {
    id: "schedule",
    icon: "📅",
    title: "Schedule & Settings",
    subtitle: "Set start/end dates and priority",
  },
];

// Non-control variants don't see schedule (inherits from control)
export const VARIANT_SECTIONS = EDITOR_SECTIONS.filter((s) => s.id !== "schedule");

// =============================================================================
// TYPE HELPERS
// =============================================================================

/**
 * Convert targeting config to a generic record for components that expect Record<string, unknown>
 * This provides type-safe conversion without losing information.
 * Accepts any targeting config structure (TargetingConfigDefaults, TargetingConfig, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional for flexible targeting config types
export function toTargetRulesRecord(config: any): Record<string, unknown> {
  return config as Record<string, unknown>;
}
