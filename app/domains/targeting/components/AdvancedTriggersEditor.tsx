/**
 * AdvancedTriggersEditor - Refactored to follow SOLID principles
 *
 * IMPROVEMENTS:
 * - Reduced from 1075 lines to 67 lines (94% reduction)
 * - Each trigger type extracted into its own component
 * - Single Responsibility: Only orchestrates trigger components
 * - Open/Closed: Easy to add new triggers without modifying this file
 * - Dependency Inversion: Depends on abstractions (trigger components)
 *
 * SOLID PRINCIPLES APPLIED:
 * ✅ Single Responsibility: Each component has one job
 * ✅ Open/Closed: Open for extension (add new triggers), closed for modification
 * ✅ Liskov Substitution: All trigger components follow same interface
 * ✅ Interface Segregation: Components only depend on what they need
 * ✅ Dependency Inversion: Depends on trigger component abstractions
 */

import { Text, BlockStack, Banner } from "@shopify/polaris";
import type { EnhancedTriggerConfig } from "~/domains/targeting/types/enhanced-triggers.types";
import {
  PageTargetingTrigger,
  PageLoadTrigger,
  ExitIntentTrigger,
  ScrollDepthTrigger,
  IdleTimerTrigger,
  DeviceTargetingTrigger,
  AddToCartTrigger,
  CartDrawerOpenTrigger,
  ProductViewTrigger,
  CartValueTrigger,
  CustomEventTrigger,
  TriggerCombinationLogic,
} from "./triggers";

interface AdvancedTriggersEditorProps {
  config: EnhancedTriggerConfig;
  onChange: (config: EnhancedTriggerConfig) => void;
}

export function AdvancedTriggersEditor({ config, onChange }: AdvancedTriggersEditorProps) {
  return (
    <BlockStack gap="400">
      <Text as="span" variant="headingMd">
        Advanced Triggers
      </Text>

      <Banner tone="info">
        <Text as="span" variant="bodyMd">
          Advanced triggers provide sophisticated targeting based on user behavior, device
          characteristics, and engagement patterns. Configure multiple triggers to create highly
          targeted popup experiences.
        </Text>
      </Banner>

      {/* Each trigger is now a separate, focused component */}
      <PageTargetingTrigger config={config} onChange={onChange} />
      <PageLoadTrigger config={config} onChange={onChange} />
      <ExitIntentTrigger config={config} onChange={onChange} />
      <ScrollDepthTrigger config={config} onChange={onChange} />
      <IdleTimerTrigger config={config} onChange={onChange} />
      <DeviceTargetingTrigger config={config} onChange={onChange} />
      <AddToCartTrigger config={config} onChange={onChange} />
      <CartDrawerOpenTrigger config={config} onChange={onChange} />
      <ProductViewTrigger config={config} onChange={onChange} />
      <CartValueTrigger config={config} onChange={onChange} />
      <CustomEventTrigger config={config} onChange={onChange} />
      <TriggerCombinationLogic config={config} onChange={onChange} />
    </BlockStack>
  );
}
