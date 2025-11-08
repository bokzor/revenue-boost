/**
 * IdleTimerTrigger - Idle timer detection configuration
 *
 * Single Responsibility: Configure idle timer trigger settings
 */

import { FormLayout, TextField, Checkbox } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface IdleTimerTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function IdleTimerTrigger({ config, onChange }: IdleTimerTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      idle_timer: {
        enabled: false,
        ...(typeof config.idle_timer === 'object' && config.idle_timer !== null
          ? config.idle_timer
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Idle Timer Detection"
      enabled={config.idle_timer?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <FormLayout>
        <TextField
          autoComplete="off"
          label="Idle duration (seconds)"
          type="number"
          value={config.idle_timer?.idle_duration?.toString() || "30"}
          onChange={(value) => updateConfig({ idle_duration: parseInt(value) || 30 })}
          helpText="Time of inactivity before triggering"
        />

        <TextField
          autoComplete="off"
          label="Mouse movement threshold (pixels)"
          type="number"
          value={config.idle_timer?.mouse_movement_threshold?.toString() || "10"}
          onChange={(value) => updateConfig({ mouse_movement_threshold: parseInt(value) || 10 })}
          helpText="Minimum mouse movement to reset idle timer"
        />

        <Checkbox
          label="Track keyboard activity"
          checked={config.idle_timer?.keyboard_activity !== false}
          onChange={(checked) => updateConfig({ keyboard_activity: checked })}
        />

        <Checkbox
          label="Trigger when page becomes visible"
          checked={config.idle_timer?.page_visibility || false}
          onChange={(checked) => updateConfig({ page_visibility: checked })}
          helpText="Trigger when user returns to tab after being idle"
        />
      </FormLayout>
    </TriggerCard>
  );
}

