/**
 * CartDrawerOpenTrigger - Cart drawer open event configuration
 *
 * Single Responsibility: Configure cart drawer trigger settings
 */

import { Text, FormLayout, TextField, Banner } from "@shopify/polaris";
import type { EnhancedTriggersConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import { TriggerCard } from "./TriggerCard";

interface CartDrawerOpenTriggerProps {
  config: EnhancedTriggersConfig;
  onChange: (config: EnhancedTriggersConfig) => void;
}

export function CartDrawerOpenTrigger({ config, onChange }: CartDrawerOpenTriggerProps) {
  const updateConfig = (updates: Record<string, unknown>) => {
    onChange({
      ...config,
      cart_drawer_open: {
        enabled: false,
        ...(typeof config.cart_drawer_open === "object" && config.cart_drawer_open !== null
          ? config.cart_drawer_open
          : {}),
        ...updates,
      },
    });
  };

  return (
    <TriggerCard
      title="Cart Drawer Open"
      enabled={config.cart_drawer_open?.enabled || false}
      onEnabledChange={(enabled) => updateConfig({ enabled })}
    >
      <Text as="p" variant="bodySm" tone="subdued">
        Trigger when the cart drawer/mini-cart opens. Great for last-minute upsells or discount
        offers.
      </Text>

      <Banner tone="warning">
        <Text as="p" variant="bodySm">
          <strong>Theme-Dependent:</strong> This trigger works on ~70% of themes. It detects cart
          drawer opens using MutationObserver and common theme events. Please test on your store to
          verify compatibility.
        </Text>
      </Banner>

      <FormLayout>
        <TextField
          autoComplete="off"
          label="Delay (milliseconds)"
          type="number"
          value={config.cart_drawer_open?.delay?.toString() || "1000"}
          onChange={(value) => updateConfig({ delay: parseInt(value) || 1000 })}
          helpText="Time to wait after drawer opens before showing popup"
        />

        <TextField
          autoComplete="off"
          label="Max triggers per session"
          type="number"
          value={config.cart_drawer_open?.max_triggers_per_session?.toString() || "2"}
          onChange={(value) => updateConfig({ max_triggers_per_session: parseInt(value) || 2 })}
          helpText="Maximum times to trigger per session"
        />
      </FormLayout>
    </TriggerCard>
  );
}
