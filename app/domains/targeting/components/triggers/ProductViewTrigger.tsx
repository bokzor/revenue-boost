/**
 * ProductViewTrigger - Product view event configuration
 *
 * Single Responsibility: Configure product view trigger settings
 */

import { Text, FormLayout, TextField, Checkbox } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface ProductViewTriggerProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function ProductViewTrigger({ config, onChange }: ProductViewTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      product_view: {
        enabled: false,
        ...(typeof config.product_view === 'object' && config.product_view !== null
          ? config.product_view
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Product View"
      enabled={config.product_view?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <Text as="p" variant="bodySm" tone="subdued">
        Trigger when a customer views a product page. Ideal for cross-sells, product
        recommendations, or limited-time offers.
      </Text>

      <FormLayout>
        <TextField
          autoComplete="off"
          label="Time on page (seconds)"
          type="number"
          value={config.product_view?.time_on_page?.toString() || "5"}
          onChange={(value) => updateConfig({ time_on_page: parseInt(value) || 5 })}
          helpText="Seconds customer must spend on product page before triggering"
        />

        <Checkbox
          label="Require scroll interaction"
          checked={config.product_view?.require_scroll || false}
          onChange={(checked) => updateConfig({ require_scroll: checked })}
          helpText="Only trigger if customer scrolls on the product page"
        />
      </FormLayout>
    </TriggerCard>
  );
}

