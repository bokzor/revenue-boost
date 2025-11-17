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
import type { DiscountConfig, DiscountDeliveryMode } from "~/domains/popups/services/discounts/discount.server";

interface DiscountSectionProps {
  goal?: string;
  discountConfig?: DiscountConfig;
  onConfigChange: (config: DiscountConfig) => void;
}

export function DiscountSection({
  goal = "NEWSLETTER_SIGNUP",
  discountConfig,
  onConfigChange,
}: DiscountSectionProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize with defaults if not provided
  const config: DiscountConfig = {
    enabled: discountConfig?.enabled !== false,
    showInPreview: discountConfig?.showInPreview !== false,
    type: discountConfig?.type || "shared",
    valueType: discountConfig?.valueType || "PERCENTAGE",
    value:
      discountConfig?.valueType === "FREE_SHIPPING"
        ? undefined
        : discountConfig?.value || 10,
    minimumAmount: discountConfig?.minimumAmount,
    usageLimit: discountConfig?.usageLimit,
    expiryDays: discountConfig?.expiryDays || 30,
    prefix: discountConfig?.prefix || "WELCOME",
    deliveryMode: discountConfig?.deliveryMode || "show_code_fallback",
    requireLogin: discountConfig?.requireLogin,
    storeInMetafield: discountConfig?.storeInMetafield,
    authorizedEmail: discountConfig?.authorizedEmail,
    requireEmailMatch: discountConfig?.requireEmailMatch,
    autoApplyMode: discountConfig?.autoApplyMode || "ajax",
    codePresentation: discountConfig?.codePresentation || "show_code",
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
          {/* Discount Type */}
          <Select
            label="Discount Type"
            options={[
              { label: "Percentage Off", value: "PERCENTAGE" },
              { label: "Fixed Amount Off", value: "FIXED_AMOUNT" },
              { label: "Free Shipping", value: "FREE_SHIPPING" },
            ]}
            value={config.valueType}
            onChange={(valueType) => {
              const updates: Partial<DiscountConfig> = {
                valueType: valueType as
                  | "PERCENTAGE"
                  | "FIXED_AMOUNT"
                  | "FREE_SHIPPING",
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

          {/* Discount Value */}
          {config.valueType !== "FREE_SHIPPING" && (
            <>
              <TextField
                label={getValueLabel()}
                type="number"
                suffix={getValueSuffix()}
                value={config.value?.toString() || ""}
                onChange={(value) =>
                  updateConfig({ value: parseFloat(value) || 0 })
                }
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
            <Box
              padding="300"
              background="bg-surface-secondary"
              borderRadius="200"
            >
              <Text as="p" variant="bodySm">
                🚚 <strong>Free Shipping Discount</strong>
                <br />
                Customers will get free shipping with their order. No discount
                value needed.
              </Text>
            </Box>
          )}

          {/* Delivery Mode */}
          <Select
            label="How customers receive discounts"
            options={[
              { label: "Auto-apply only (no code shown)", value: "auto_apply_only" },
              {
                label: "Auto-apply with fallback (show code if needed)",
                value: "show_code_fallback",
              },
              { label: "Show code in popup", value: "show_code_always" },
            ]}
            value={config.deliveryMode || "show_code_fallback"}
            onChange={(deliveryMode) =>
              updateConfig({
                deliveryMode: deliveryMode as DiscountDeliveryMode,
              })
            }
            helpText={
              config.deliveryMode === "auto_apply_only"
                ? "Discount will be applied automatically at checkout. No code is shown."
                : config.deliveryMode === "show_code_fallback"
                  ? "We'll try to auto-apply the discount. If we can't, the code will be shown."
                  : "Code will be shown immediately after signup."
            }
          />

          {/* Code Prefix */}
          <TextField
            label="Discount Code Prefix"
            value={config.prefix || ""}
            onChange={(prefix) =>
              updateConfig({ prefix: prefix.toUpperCase() })
            }
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
                {config.deliveryMode === "auto_apply_only"
                  ? "Auto-Apply"
                  : config.deliveryMode === "show_code_fallback"
                    ? "Auto-Apply + Code"
                    : "Show Code"}
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
          />
          </div>
        </Modal.Section>
      </Modal>
    </BlockStack>
  );
}
