/**
 * AddToCartTrigger - Add to cart event configuration
 *
 * Single Responsibility: Configure add-to-cart trigger settings
 */

import { Text, FormLayout, TextField, Checkbox } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";
import {
  ProductPicker,
  type ProductPickerSelection,
} from "~/domains/campaigns/components/form/ProductPicker";

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
        ...(typeof config.add_to_cart === "object" && config.add_to_cart !== null
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
        Trigger when a customer adds a product to their cart. Optionally, target specific products
        or collections that should trigger the popup when added to cart.
      </Text>

      <FormLayout>
        <ProductPicker
          mode="product"
          selectionType="multiple"
          selectedIds={config.add_to_cart?.productIds || []}
          onSelect={(selections: ProductPickerSelection[]) => {
            const productIds = selections.map((s) => s.id);
            updateConfig({ productIds });
          }}
          buttonLabel="Select products (optional)"
          showSelected={true}
        />

        <ProductPicker
          mode="collection"
          selectionType="multiple"
          selectedIds={config.add_to_cart?.collectionIds || []}
          onSelect={(selections: ProductPickerSelection[]) => {
            const collectionIds = selections.map((s) => s.id);
            updateConfig({ collectionIds });
          }}
          buttonLabel="Select collections (optional)"
          showSelected={true}
        />

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
