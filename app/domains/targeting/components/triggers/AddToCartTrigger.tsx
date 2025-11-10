/**
 * AddToCartTrigger - Add to cart event configuration
 *
 * Single Responsibility: Configure add-to-cart trigger settings
 */

import { Text, FormLayout, TextField, Checkbox } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface AddToCartTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function AddToCartTrigger({ config, onChange }: AddToCartTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      add_to_cart: {
        enabled: false,
        ...(typeof config.add_to_cart === 'object' && config.add_to_cart !== null
          ? config.add_to_cart
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Add to Cart"
      enabled={config.add_to_cart?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <Text as="p" variant="bodySm" tone="subdued">
        Trigger when a customer adds a product to their cart. Perfect for free shipping
        thresholds, cart upsells, or related product recommendations.
      </Text>

      <FormLayout>
        <TextField
          autoComplete="off"
          label="Delay (milliseconds)"
          type="number"
          value={config.add_to_cart?.delay?.toString() || "500"}
          onChange={(value) => updateConfig({ delay: parseInt(value) || 500 })}
          helpText="Time to wait after add-to-cart event before showing popup"
        />

        <Checkbox
          label="Trigger immediately"
          checked={config.add_to_cart?.immediate || false}
          onChange={(checked) => updateConfig({ immediate: checked })}
          helpText="Show popup immediately without delay"
        />
      </FormLayout>
    </TriggerCard>
  );
}
