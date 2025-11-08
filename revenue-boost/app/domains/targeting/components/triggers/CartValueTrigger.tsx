/**
 * CartValueTrigger - Cart value threshold configuration
 *
 * Single Responsibility: Configure cart value trigger settings
 */

import { Text, FormLayout, TextField } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface CartValueTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function CartValueTrigger({ config, onChange }: CartValueTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      cart_value: {
        enabled: false,
        ...(typeof config.cart_value === 'object' && config.cart_value !== null
          ? config.cart_value
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Cart Value Threshold"
      enabled={config.cart_value?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <Text as="p" variant="bodySm" tone="subdued">
        Trigger when cart value reaches a specific threshold. Perfect for free shipping offers
        or volume discounts.
      </Text>

      <FormLayout>
        <TextField
          autoComplete="off"
          label="Minimum cart value"
          type="number"
          prefix="$"
          value={config.cart_value?.min_value?.toString() || "50"}
          onChange={(value) => updateConfig({ min_value: parseFloat(value) || 50 })}
          helpText="Minimum cart value to trigger popup"
        />

        <TextField
          autoComplete="off"
          label="Maximum cart value (optional)"
          type="number"
          prefix="$"
          value={config.cart_value?.max_value?.toString() || ""}
          onChange={(value) => updateConfig({ max_value: value ? parseFloat(value) : undefined })}
          helpText="Optional maximum cart value (leave empty for no limit)"
        />

        <TextField
          autoComplete="off"
          label="Check interval (milliseconds)"
          type="number"
          value={config.cart_value?.check_interval?.toString() || "2000"}
          onChange={(value) => updateConfig({ check_interval: parseInt(value) || 2000 })}
          helpText="How often to check cart value"
        />
      </FormLayout>
    </TriggerCard>
  );
}

