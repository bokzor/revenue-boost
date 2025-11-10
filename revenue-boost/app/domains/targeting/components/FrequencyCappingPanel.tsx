/**
 * Frequency Capping Panel - Configure popup display frequency limits - Simplified
 */
import { BlockStack } from "@shopify/polaris";
import { FrequencyCappingToggle } from "./FrequencyCappingToggle";
import { FrequencyLimitsCard } from "./FrequencyLimitsCard";
import { GlobalFrequencyCapCard } from "./GlobalFrequencyCapCard";
import { FrequencyBestPracticesCard } from "./FrequencyBestPracticesCard";

/**
 * Frequency Capping Configuration
 * Note: This is a UI-specific interface for the frequency capping panel.
 * The actual frequency capping logic uses EnhancedTriggersConfig.frequency_capping
 * from ~/domains/campaigns/types/campaign
 */
export interface FrequencyCappingConfig {
  enabled: boolean;
  maxViews: number;
  timeWindow: number;
  respectGlobalCap: boolean;
  cooldownHours?: number;
}

export interface FrequencyCappingPanelProps {
  config: FrequencyCappingConfig;
  onConfigChange: (config: FrequencyCappingConfig) => void;
}

export function FrequencyCappingPanel({
  config,
  onConfigChange,
}: FrequencyCappingPanelProps) {
  return (
    <BlockStack gap="400">
      <FrequencyCappingToggle
        enabled={config.enabled}
        onEnabledChange={(enabled) => onConfigChange({ ...config, enabled })}
      />

      {config.enabled && (
        <>
          <FrequencyLimitsCard
            maxViews={config.maxViews}
            timeWindow={config.timeWindow}
            cooldownHours={config.cooldownHours}
            onMaxViewsChange={(value) => {
              const maxViews = Math.max(1, parseInt(value) || 1);
              onConfigChange({ ...config, maxViews });
            }}
            onTimeWindowChange={(value) => {
              const timeWindow = parseInt(value);
              onConfigChange({ ...config, timeWindow });
            }}
            onCooldownChange={(value) => {
              const cooldownHours = parseFloat(value);
              onConfigChange({ ...config, cooldownHours });
            }}
          />

          <GlobalFrequencyCapCard
            respectGlobalCap={config.respectGlobalCap}
            onGlobalCapChange={(respectGlobalCap) => onConfigChange({ ...config, respectGlobalCap })}
          />

          <FrequencyBestPracticesCard />
        </>
      )}
    </BlockStack>
  );
}
