/**
 * PageLoadTrigger - Page load timing configuration
 *
 * Single Responsibility: Configure page load trigger settings
 */

import { FormLayout, TextField, Checkbox } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface PageLoadTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function PageLoadTrigger({ config, onChange }: PageLoadTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      page_load: {
        enabled: false,
        ...(typeof config.page_load === 'object' && config.page_load !== null
          ? config.page_load
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Page Load Trigger"
      enabled={config.page_load?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <FormLayout>
        <TextField
          autoComplete="off"
          label="Delay (seconds)"
          type="number"
          value={config.page_load?.delay?.toString() || "3"}
          onChange={(value) => updateConfig({ delay: parseInt(value) || 3 })}
          helpText="Seconds to wait after page loads (0 = immediate)"
          min={0}
          max={60}
        />

        <Checkbox
          label="Wait for DOM ready"
          checked={config.page_load?.require_dom_ready !== false}
          onChange={(checked) => updateConfig({ require_dom_ready: checked })}
          helpText="Wait for page content to be fully loaded"
        />

        <Checkbox
          label="Wait for images to load"
          checked={config.page_load?.require_images_loaded || false}
          onChange={(checked) => updateConfig({ require_images_loaded: checked })}
          helpText="Wait for all images to finish loading (may delay popup)"
        />
      </FormLayout>
    </TriggerCard>
  );
}

