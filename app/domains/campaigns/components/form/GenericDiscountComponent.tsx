/**
 * GenericDiscountComponent
 *
 * Reusable discount configuration component for campaign forms.
 * Based on DiscountSection but designed to be embedded within template sections.
 *
 * Features:
 * - Enable/disable discount toggle
 * - Show in preview toggle (NEW)
 * - Basic discount configuration (type, value, delivery mode, code prefix)
 * - Advanced settings modal for detailed configuration
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
import { DiscountSettingsStep } from "~/domains/campaigns/components/DiscountSettingsStep";
import { FormGrid } from "~/domains/campaigns/components/form";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

interface GenericDiscountComponentProps {
  goal?: string;
  discountConfig?: DiscountConfig;
  onConfigChange: (config: DiscountConfig) => void;
}

export function GenericDiscountComponent({
  goal = "NEWSLETTER_SIGNUP",
  discountConfig,
  onConfigChange,
}: GenericDiscountComponentProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize with defaults if not provided
  const config: DiscountConfig = {
    enabled: discountConfig?.enabled !== false,
    showInPreview: discountConfig?.showInPreview !== false, // NEW: Default to true
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
    deliveryMode: discountConfig?.deliveryMode || "show_code_always",
    requireLogin: discountConfig?.requireLogin,
    storeInMetafield: discountConfig?.storeInMetafield,
    authorizedEmail: discountConfig?.authorizedEmail,
    requireEmailMatch: discountConfig?.requireEmailMatch,
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
        <BlockStack gap="400">
          {/* Show in Preview Toggle - NEW */}
          <Checkbox
            label="Show discount in preview"
            checked={config.showInPreview !== false}
            onChange={(showInPreview) => updateConfig({ showInPreview })}
            helpText="Display discount information in the campaign preview"
          />

          {/* Discount Type & Value - 2 Column Grid */}
          <FormGrid columns={2}>
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
            )}
          </FormGrid>

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

          {/* Delivery Mode & Code Prefix - 2 Column Grid */}
          <FormGrid columns={2}>
            <Select
              label="How customers receive discounts"
              options={[
                { label: "Show code in popup", value: "show_code_always" },
                {
                  label: "Show code (authorized email only)",
                  value: "show_code_fallback",
                },
              ]}
              value={config.deliveryMode || "show_code_always"}
              onChange={(deliveryMode) =>
                updateConfig({
                  deliveryMode: deliveryMode as "auto_apply_only" | "show_code_fallback" | "show_code_always",
                  requireEmailMatch:
                    deliveryMode === "show_code_fallback"
                      ? true
                      : config.requireEmailMatch,
                })
              }
              helpText={
                config.deliveryMode === "show_code_fallback"
                  ? "Code will only work for the subscriber's email. We'll authorize it automatically."
                  : "Code will be shown immediately after signup."
              }
            />

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
          </FormGrid>

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
                {config.deliveryMode === "show_code_fallback"
                  ? "Authorized Email Only"
                  : "Show Code"}
              </Badge>
            </InlineStack>
          </Box>
        </BlockStack>
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
            <DiscountSettingsStep
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

