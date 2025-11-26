/**
 * ExitIntentTrigger - Exit intent detection configuration
 *
 * Single Responsibility: Configure exit intent trigger settings
 */

import { FormLayout, Select, TextField, Checkbox } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface ExitIntentTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

const SENSITIVITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

export function ExitIntentTrigger({ config, onChange }: ExitIntentTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      exit_intent: {
        enabled: false,
        ...(typeof config.exit_intent === "object" && config.exit_intent !== null
          ? config.exit_intent
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Exit Intent Detection"
      enabled={config.exit_intent?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <FormLayout>
        <Select
          label="Sensitivity"
          options={SENSITIVITY_OPTIONS}
          value={config.exit_intent?.sensitivity || "medium"}
          onChange={(value) => updateConfig({ sensitivity: value })}
          helpText="Higher sensitivity triggers more easily but may have false positives"
        />

        <TextField
          autoComplete="off"
          label="Delay (milliseconds)"
          type="number"
          value={config.exit_intent?.delay?.toString() || "1000"}
          onChange={(value) => updateConfig({ delay: parseInt(value) || 1000 })}
          helpText="Minimum time before exit intent can trigger"
        />

        <Checkbox
          label="Enable on mobile devices"
          checked={config.exit_intent?.mobile_enabled || false}
          onChange={(checked) => updateConfig({ mobile_enabled: checked })}
          helpText="Exit intent detection is less reliable on mobile"
        />

        <TextField
          autoComplete="off"
          label="Exclude pages (comma-separated)"
          value={config.exit_intent?.exclude_pages?.join(", ") || ""}
          onChange={(value) =>
            updateConfig({
              exclude_pages: value
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean),
            })
          }
          helpText="Pages where exit intent should not trigger"
          placeholder="/checkout, /cart"
        />
      </FormLayout>
    </TriggerCard>
  );
}
