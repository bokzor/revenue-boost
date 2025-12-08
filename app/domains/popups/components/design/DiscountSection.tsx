/**
 * DiscountSection Component
 *
 * A compact discount configuration section for the Template & Design step.
 * Shows basic discount options with an "Advanced Settings" button that opens
 * the full DiscountSettingsStep in a modal.
 */

import { useState } from "react";
import {
  FormLayout,
  Select,
  TextField,
  Checkbox,
  Button,
  Modal,
  Box,
  BlockStack,
  Text,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { SettingsIcon } from "@shopify/polaris-icons";
import { DiscountAdvancedSettings } from "~/domains/campaigns/components/DiscountSettingsStep";
import type {
  DiscountConfig,
} from "~/domains/popups/services/discounts/discount.server";
import type { DiscountBehavior } from "~/domains/campaigns/types/campaign";

/**
 * Allowed discount value types for the DiscountSection component.
 */
export type DiscountValueTypeOption = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

interface DiscountSectionProps {
  goal?: string;
  discountConfig?: DiscountConfig;
  onConfigChange: (config: DiscountConfig) => void;
  /**
   * Which discount value types to show in the selector.
   * Defaults to all types: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']
   *
   * For Free Shipping Bar, use ['FREE_SHIPPING'] to hide irrelevant options.
   */
  allowedValueTypes?: DiscountValueTypeOption[];
  /**
   * Whether the campaign captures email addresses.
   * When true, enables the "Show Code + Assign to Email" behavior option.
   */
  hasEmailCapture?: boolean;
}

const ALL_VALUE_TYPES: DiscountValueTypeOption[] = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"];

const VALUE_TYPE_OPTIONS: Record<DiscountValueTypeOption, { label: string; value: string }> = {
  PERCENTAGE: { label: "Percentage Off", value: "PERCENTAGE" },
  FIXED_AMOUNT: { label: "Fixed Amount Off", value: "FIXED_AMOUNT" },
  FREE_SHIPPING: { label: "Free Shipping", value: "FREE_SHIPPING" },
};

export function DiscountSection({
  goal = "NEWSLETTER_SIGNUP",
  discountConfig,
  onConfigChange,
  allowedValueTypes = ALL_VALUE_TYPES,
  hasEmailCapture,
}: DiscountSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Determine default value type based on allowed types
  const defaultValueType = allowedValueTypes.includes("PERCENTAGE")
    ? "PERCENTAGE"
    : allowedValueTypes[0];

  // Initialize with defaults if not provided
  const config: DiscountConfig = {
    enabled: discountConfig?.enabled !== false,
    showInPreview: discountConfig?.showInPreview !== false,
    type: discountConfig?.type || "shared",
    valueType: discountConfig?.valueType || defaultValueType,
    value: discountConfig?.valueType === "FREE_SHIPPING" ? undefined : discountConfig?.value || 10,
    minimumAmount: discountConfig?.minimumAmount,
    usageLimit: discountConfig?.usageLimit,
    expiryDays: discountConfig?.expiryDays || 30,
    prefix: discountConfig?.prefix || "FREESHIP",
    behavior: discountConfig?.behavior || "SHOW_CODE_AND_AUTO_APPLY",
  };

  const updateConfig = (updates: Partial<DiscountConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const getRecommendedValue = () => {
    if (goal === "NEWSLETTER_SIGNUP") return 10;
    if (goal === "PRODUCT_UPSELL") return 15;
    if (goal === "CART_RECOVERY") return 20;
    return 10;
  };

  const getValueLabel = () => {
    return config.valueType === "PERCENTAGE" ? "Discount (%)" : "Discount ($)";
  };

  const getValueSuffix = () => {
    return config.valueType === "PERCENTAGE" ? "%" : "$";
  };

  return (
    <BlockStack gap="400">
      {/* Enable/Disable Toggle */}
      <Checkbox
        label="Offer discount incentive"
        checked={config.enabled !== false}
        onChange={(enabled) => updateConfig({ enabled })}
        helpText="Encourage conversions with a discount offer"
      />

      {config.enabled !== false && (
        <FormLayout>
          {/* Discount Type - only show if more than one type allowed */}
          {allowedValueTypes.length > 1 && (
            <Select
              label="Discount Type"
              options={allowedValueTypes.map((type) => VALUE_TYPE_OPTIONS[type])}
              value={config.valueType}
              onChange={(valueType) => {
                const updates: Partial<DiscountConfig> = {
                  valueType: valueType as DiscountValueTypeOption,
                };
                // Clear value when switching to FREE_SHIPPING
                if (valueType === "FREE_SHIPPING") {
                  updates.value = undefined;
                } else if (!config.value) {
                  // Set default value when switching from FREE_SHIPPING
                  updates.value = getRecommendedValue();
                }
                updateConfig(updates);
              }}
            />
          )}

          {/* Discount Value */}
          {config.valueType !== "FREE_SHIPPING" && (
            <>
              <TextField
                label={getValueLabel()}
                type="number"
                suffix={getValueSuffix()}
                value={config.value?.toString() ?? ""}
                onChange={(value) => updateConfig({ value: value === "" ? undefined : parseFloat(value) })}
                placeholder={getRecommendedValue().toString()}
                autoComplete="off"
                min={0}
                max={config.valueType === "PERCENTAGE" ? 100 : undefined}
                helpText={`Recommended: ${getRecommendedValue()}${getValueSuffix()}`}
              />

              {goal === "PRODUCT_UPSELL" &&
                config.valueType === "PERCENTAGE" &&
                typeof config.value === "number" && (
                  <Box paddingBlockStart="100">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {`Example: if upsell items total $80, this discount saves ~$${(
                        (80 * config.value) /
                        100
                      ).toFixed(2)} for the shopper.`}
                    </Text>
                  </Box>
                )}
            </>
          )}

          {config.valueType === "FREE_SHIPPING" && (
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <Text as="p" variant="bodySm">
                🚚 <strong>Free Shipping Discount</strong>
                <br />
                Customers will get free shipping with their order. No discount value needed.
              </Text>
            </Box>
          )}

          {/* Discount Behavior */}
          <Select
            label="How customers receive discounts"
            options={[
              {
                label: "Show code + auto-apply to cart",
                value: "SHOW_CODE_AND_AUTO_APPLY",
              },
              { label: "Show code only (manual entry)", value: "SHOW_CODE_ONLY" },
              {
                label: "Show code + assign to email",
                value: "SHOW_CODE_AND_ASSIGN_TO_EMAIL",
              },
            ]}
            value={config.behavior || "SHOW_CODE_AND_AUTO_APPLY"}
            onChange={(behavior) =>
              updateConfig({
                behavior: behavior as DiscountBehavior,
              })
            }
            helpText={
              config.behavior === "SHOW_CODE_AND_AUTO_APPLY"
                ? "Display the code and automatically apply it to the customer's cart."
                : config.behavior === "SHOW_CODE_ONLY"
                  ? "Display the code only. Customer must manually enter it at checkout."
                  : "Display the code and restrict usage to the captured email address."
            }
          />

          {/* Code Prefix */}
          <TextField
            label="Discount Code Prefix"
            value={config.prefix || ""}
            onChange={(prefix) => updateConfig({ prefix: prefix.toUpperCase() })}
            placeholder="WELCOME"
            autoComplete="off"
            helpText="Prefix for generated codes (e.g., WELCOME10)"
          />

          {/* Advanced Settings Button */}
          <Box paddingBlockStart="200">
            <InlineStack align="space-between" blockAlign="center">
              <Button
                variant="plain"
                icon={SettingsIcon}
                onClick={() => setShowAdvanced(true)}
                data-testid="open-advanced-discount-settings"
              >
                Advanced Settings
              </Button>
              <Badge tone="info">
                {config.behavior === "SHOW_CODE_AND_AUTO_APPLY"
                  ? "Auto-Apply + Code"
                  : config.behavior === "SHOW_CODE_ONLY"
                    ? "Show Code"
                    : "Email-Restricted"}
              </Badge>
            </InlineStack>
          </Box>
        </FormLayout>
      )}

      {/* Advanced Settings Modal */}
      <Modal
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        title="Advanced Discount Settings"
        size="large"
        primaryAction={{
          content: "Done",
          onAction: () => setShowAdvanced(false),
        }}
      >
        <Modal.Section>
          <div data-testid="advanced-discount-settings-modal">
            <DiscountAdvancedSettings
              goal={goal}
              discountConfig={config}
              onConfigChange={(newConfig) => {
                onConfigChange(newConfig);
              }}
              hasEmailCapture={hasEmailCapture}
            />
          </div>
        </Modal.Section>
      </Modal>
    </BlockStack>
  );
}
