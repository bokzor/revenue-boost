/**
 * Frequency Capping Panel - Configure popup display frequency limits - Simplified
 */
import { BlockStack, Banner } from "@shopify/polaris";
import { FrequencyCappingToggle } from "./FrequencyCappingToggle";
import { FrequencyLimitsCard } from "./FrequencyLimitsCard";
import { GlobalFrequencyCapCard } from "./GlobalFrequencyCapCard";
import { FrequencyBestPracticesCard } from "./FrequencyBestPracticesCard";
import type { TemplateType } from "~/domains/campaigns/types/campaign";
import { getFrequencyCappingHelpText } from "~/domains/campaigns/utils/frequency-defaults";

/**
 * Frequency Capping Configuration
 * Matches the server format (EnhancedTriggersConfig.frequency_capping)
 * Used throughout the app - single source of truth
 */
export interface FrequencyCappingConfig {
  enabled: boolean; // UI-only field to toggle frequency capping on/off
  max_triggers_per_session?: number;
  max_triggers_per_day?: number;
  cooldown_between_triggers?: number; // in seconds
  respectGlobalCap?: boolean; // Whether to respect store-wide frequency limits
}

export interface FrequencyCappingPanelProps {
  config: FrequencyCappingConfig;
  onConfigChange: (config: FrequencyCappingConfig) => void;
  templateType?: TemplateType;
}

export function FrequencyCappingPanel({
  config,
  onConfigChange,
  templateType,
}: FrequencyCappingPanelProps) {
  const helpText = templateType ? getFrequencyCappingHelpText(templateType) : null;

  return (
    <BlockStack gap="400">
      {helpText && <Banner tone="info">{helpText}</Banner>}

      <FrequencyCappingToggle
        enabled={config.enabled}
        onEnabledChange={(enabled) => onConfigChange({ ...config, enabled })}
      />

      {config.enabled && (
        <>
          <FrequencyLimitsCard
            maxTriggersPerSession={config.max_triggers_per_session}
            maxTriggersPerDay={config.max_triggers_per_day}
            cooldownBetweenTriggers={config.cooldown_between_triggers}
            onMaxTriggersPerSessionChange={(value) => {
              const max_triggers_per_session = value
                ? Math.max(1, parseInt(value) || 1)
                : undefined;
              onConfigChange({ ...config, max_triggers_per_session });
            }}
            onMaxTriggersPerDayChange={(value) => {
              const max_triggers_per_day = value ? Math.max(1, parseInt(value) || 1) : undefined;
              onConfigChange({ ...config, max_triggers_per_day });
            }}
            onCooldownChange={(value) => {
              const cooldown_between_triggers = value
                ? Math.max(0, parseInt(value) || 0)
                : undefined;
              onConfigChange({ ...config, cooldown_between_triggers });
            }}
          />

          <GlobalFrequencyCapCard
            respectGlobalCap={config.respectGlobalCap ?? true}
            onGlobalCapChange={(respectGlobalCap) =>
              onConfigChange({ ...config, respectGlobalCap })
            }
          />

          <FrequencyBestPracticesCard />
        </>
      )}
    </BlockStack>
  );
}
