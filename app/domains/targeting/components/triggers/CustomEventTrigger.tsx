/**
 * CustomEventTrigger - Custom JavaScript event configuration
 *
 * Single Responsibility: Configure custom event trigger settings
 */

import { Text, FormLayout, TextField } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface CustomEventTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function CustomEventTrigger({ config, onChange }: CustomEventTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      custom_event: {
        enabled: false,
        ...(typeof config.custom_event === "object" && config.custom_event !== null
          ? config.custom_event
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Custom Event"
      enabled={config.custom_event?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <Text as="p" variant="bodySm" tone="subdued">
        Trigger on custom JavaScript events. Advanced option for developers to trigger popups based
        on custom interactions.
      </Text>

      <FormLayout>
        <TextField
          autoComplete="off"
          label="Event names (comma-separated)"
          value={config.custom_event?.event_names?.join(", ") || ""}
          onChange={(value) =>
            updateConfig({
              event_names: value
                .split(",")
                .map((e) => e.trim())
                .filter(Boolean),
            })
          }
          placeholder="custom:action, user:interaction"
          helpText="Custom event names to listen for"
        />

        <TextField
          autoComplete="off"
          label="Debounce time (milliseconds)"
          type="number"
          value={config.custom_event?.debounce_time?.toString() ?? ""}
          onChange={(value) => updateConfig({ debounce_time: value === "" ? undefined : parseInt(value) })}
          helpText="Delay between event triggers to prevent excessive firing"
          placeholder="100"
        />
      </FormLayout>
    </TriggerCard>
  );
}
