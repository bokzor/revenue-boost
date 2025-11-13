/**
 * Discount Settings Step - Comprehensive discount configuration
 *
 * Uses existing DiscountConfig from our discount service
 * Supports all discount types, delivery modes, and configurations
 */


import {
  Card,
  Text,
  Select,
  TextField,
  Checkbox,
  Banner,
  FormLayout,
  BlockStack,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { DiscountConfig, DiscountDeliveryMode } from "~/domains/popups/services/discounts/discount.server";


interface DiscountSettingsStepProps {
  goal?: string;
  discountConfig?: DiscountConfig;
  onConfigChange: (config: DiscountConfig) => void;
}

export function DiscountSettingsStep({
  goal,
  discountConfig,
  onConfigChange,
}: DiscountSettingsStepProps) {
  // Initialize with defaults if not provided, preserving existing configuration
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
    deliveryMode: discountConfig?.deliveryMode || "show_code_always",
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

  const getDiscountTypeOptions = () => {
    const options = [
      { label: "Shared Code (Multiple Uses)", value: "shared" },
      { label: "Single-Use Codes", value: "single_use" },
    ];

    // Add goal-specific recommendations
    if (goal === "NEWSLETTER_SIGNUP") {
      return [
        { label: "Shared Code (Recommended for newsletters)", value: "shared" },
        { label: "Single-Use Codes", value: "single_use" },
      ];
    }

    return options;
  };

  const getDeliveryModeDescription = (mode: DiscountDeliveryMode) => {
    switch (mode) {
      case "auto_apply_only":
        return {
          title: "🔒 Auto-Apply Only",
          description:
            "Maximum security. Customers must create an account and log in to receive their discount.",
          tone: "info" as const,
        };
      case "show_code_fallback":
        return {
          title: "⚖️ Auto-Apply with Fallback",
          description:
            "Recommended. Logged-in customers get automatic discount application. Guest shoppers see the code.",
          tone: "success" as const,
        };
      case "show_code_always":
        return {
          title: "📋 Always Show Code",
          description:
            "Least secure. Discount code is shown immediately. Easier for customers but may be shared.",
          tone: "warning" as const,
        };
      case "show_in_popup_authorized_only":
        return {
          title: "📧 Email Authorization Only",
          description:
            "High security. Discount code only works with the email address that subscribed. Blocks guest checkout.",
          tone: "info" as const,
        };
      default:
        return {
          title: "⚖️ Auto-Apply with Fallback",
          description:
            "Recommended. Logged-in customers get automatic discount application. Guest shoppers see the code.",
          tone: "success" as const,
        };
    }
  };

  const getValueLabel = () => {
    return config.valueType === "PERCENTAGE"
      ? "Discount Percentage"
      : "Discount Amount ($)";
  };

  const getValueSuffix = () => {
    return config.valueType === "PERCENTAGE" ? "%" : "$";
  };

  const getValuePlaceholder = () => {
    return config.valueType === "PERCENTAGE" ? "10" : "10.00";
  };

  const getRecommendedValue = () => {
    if (goal === "NEWSLETTER_SIGNUP") return 10;
    if (goal === "PRODUCT_UPSELL") return 15;
    if (goal === "CART_RECOVERY") return 20;
    return 10;
  };

  return (
    <div data-testid="admin-discount-settings-step">
      <BlockStack gap="600">
      {/* Header */}
      <Card>
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">
            Discount Configuration
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Configure discount settings to incentivize conversions. Choose how
            customers receive and use their discounts.
          </Text>

          <div data-testid="discount-enabled">
            <Checkbox
              label="Enable discount for this campaign"
              checked={config.enabled !== false}
              onChange={(enabled) => updateConfig({ enabled })}
              helpText="Offer a discount to users who complete the desired action"
            />
          </div>
        </BlockStack>
      </Card>

      {config.enabled !== false && (
        <>
          {/* Discount Type Settings */}
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Discount Type
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Choose how discount codes are generated and used.
              </Text>

              <FormLayout>
                <div data-testid="discount-type">
                  <Select
                    label="Discount Code Type"
                    options={getDiscountTypeOptions()}
                    value={config.type === "single_use" ? "single_use" : "shared"}
                    onChange={(type) =>
                      updateConfig({
                        type: type as "shared" | "single_use",
                        usageLimit: type === "single_use" ? 1 : config.usageLimit,
                      })
                    }
                    helpText={
                      config.type === "single_use"
                        ? "Unique code for each customer (e.g., WELCOME10-XYZ123)"
                        : "One code shared by all customers (e.g., WELCOME10)"
                    }
                  />
                </div>

                <div data-testid="discount-value-type">
                  <Select
                    label="Discount Value Type"
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
                        // Set default value when switching from FREE_SHIPPING to other types
                        updates.value = 10;
                      }
                      updateConfig(updates);
                    }}
                  />
                </div>

                {config.valueType !== "FREE_SHIPPING" && (
                  <div data-testid="discount-value">
                    <TextField
                      label={getValueLabel()}
                      type="number"
                      suffix={getValueSuffix()}
                      value={config.value?.toString() || ""}
                      onChange={(value) =>
                        updateConfig({ value: parseFloat(value) || 0 })
                      }
                      placeholder={getValuePlaceholder()}
                      autoComplete="off"
                      min={0}
                      max={config.valueType === "PERCENTAGE" ? 100 : undefined}
                      helpText={
                        goal && (
                          <span>
                            Recommended for {goal.replace("_", " ").toLowerCase()}
                            : {getRecommendedValue()}
                            {getValueSuffix()}
                          </span>
                        )
                      }
                    />
                  </div>
                )}

                {config.valueType === "FREE_SHIPPING" && (
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "#F6F6F7",
                      borderRadius: "4px",
                    }}
                  >
                    <Text as="p" variant="bodySm">
                      🚚 <strong>Free Shipping Discount</strong>
                      <br />
                      This discount will provide free shipping to customers. No
                      discount value is needed.
                    </Text>
                  </div>
                )}

                <div data-testid="discount-minimum-amount">
                  <TextField
                    label="Minimum Order Amount (Optional)"
                    type="number"
                    prefix="$"
                    value={config.minimumAmount?.toString() || ""}
                    onChange={(value) =>
                      updateConfig({
                        minimumAmount: parseFloat(value) || undefined,
                      })
                    }
                    placeholder="0.00"
                    autoComplete="off"
                    min={0}
                    helpText="Only apply discount if order total meets this minimum"
                  />
                </div>
              </FormLayout>
            </BlockStack>
          </Card>

          {/* Delivery Mode Settings */}
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                How Customers Receive Discounts
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Choose how customers will receive and use their discount codes.
                This affects security and user experience.
              </Text>

              <FormLayout>
                <div data-testid="discount-delivery-mode">
                  <Select
                    label="Delivery Mode"
                    options={[
                    { label: "Show code in popup", value: "show_code_always" },
                    {
                      label: "Show code (authorized email only)",
                      value: "show_in_popup_authorized_only",
                    },
                    { label: "Auto-apply with fallback", value: "show_code_fallback" },
                  ]}
                  value={config.deliveryMode || "show_code_always"}
                  onChange={(deliveryMode) => {
                    const mapped =
                      deliveryMode === "show_in_popup_authorized_only"
                        ? "show_code_always"
                        : deliveryMode;
                    updateConfig({
                      deliveryMode: mapped as "auto_apply_only" | "show_code_fallback" | "show_code_always",
                      requireEmailMatch:
                        deliveryMode === "show_in_popup_authorized_only"
                          ? true
                          : config.requireEmailMatch,
                    });
                  }}
                />
                </div>

                {config.deliveryMode && (
                  <div data-testid="discount-delivery-description">
                  <Banner
                    tone={getDeliveryModeDescription(config.deliveryMode).tone}
                    title={
                      getDeliveryModeDescription(config.deliveryMode).title
                    }
                  >
                    <p>
                      {
                        getDeliveryModeDescription(config.deliveryMode)
                          .description
                      }
                    </p>
                  </Banner>
                  </div>
                )}
              </FormLayout>
            </BlockStack>
          </Card>

          {/* Additional Settings */}
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Additional Settings
              </Text>
              <FormLayout>
                <div data-testid="discount-prefix">
                  <TextField
                    label="Discount Code Prefix"
                    value={config.prefix || ""}
                    onChange={(prefix) =>
                      updateConfig({ prefix: prefix.toUpperCase() })
                    }
                    placeholder="WELCOME"
                    autoComplete="off"
                    helpText="Prefix for generated discount codes (e.g., WELCOME10)"
                  />
                </div>

                <div data-testid="discount-expiry-days">
                  <TextField
                    label="Expires After (Days)"
                    type="number"
                    value={config.expiryDays?.toString() || "30"}
                    onChange={(value) =>
                      updateConfig({ expiryDays: parseInt(value) || 30 })
                    }
                    placeholder="30"
                    autoComplete="off"
                    min={1}
                    helpText="How many days until the discount expires"
                  />
                </div>

                {config.type === "shared" && (
                  <div data-testid="discount-usage-limit">
                    <TextField
                      label="Usage Limit (Optional)"
                      type="number"
                      value={config.usageLimit?.toString() || ""}
                      onChange={(value) =>
                        updateConfig({ usageLimit: parseInt(value) || undefined })
                      }
                      placeholder="1000"
                      autoComplete="off"
                      min={1}
                      helpText="Maximum number of times this discount can be used"
                    />
                  </div>
                )}
              </FormLayout>
            </BlockStack>
          </Card>

          {/* Goal-Specific Recommendations */}
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                Recommendations for {goal ? goal.replace("_", " ").toUpperCase() : "YOUR CAMPAIGN"}
              </Text>

              {goal === "NEWSLETTER_SIGNUP" && (
                <BlockStack gap="300">
                  <InlineStack gap="200">
                    <Badge tone="success">Best Practice</Badge>
                    <Text as="span" variant="bodySm">
                      Shared codes work well for newsletters
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • 10-15% discount and &#34;Show code in popup&#34; delivery
                    <br />
                    • 30-day expiry period
                    <br />• No minimum order amount for maximum signups
                  </Text>
                </BlockStack>
              )}

              {goal === "PRODUCT_UPSELL" && (
                <BlockStack gap="300">
                  <InlineStack gap="200">
                    <Badge tone="attention">High Value</Badge>
                    <Text as="span" variant="bodySm">
                      Upsell campaigns justify higher discounts
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • 15-25% discount on specific products
                    <br />
                    • Consider minimum amount to ensure profitability
                    <br />• Auto-apply mode works well for registered customers
                  </Text>
                </BlockStack>
              )}

              {goal === "CART_RECOVERY" && (
                <BlockStack gap="300">
                  <InlineStack gap="200">
                    <Badge tone="warning">Urgency</Badge>
                    <Text as="span" variant="bodySm">
                      Cart recovery needs strong incentives
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • 20% discount or free shipping offer
                    <br />
                    • Short expiry (7-14 days) for urgency
                    <br />• Single-use codes prevent sharing
                  </Text>
                </BlockStack>
              )}

              {goal === "SALES_BOOST" && (
                <BlockStack gap="300">
                  <InlineStack gap="200">
                    <Badge tone="info">Flexible</Badge>
                    <Text as="span" variant="bodySm">
                      Adjust based on margin goals
                    </Text>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    • 10-20% discount for general sales campaigns
                    <br />
                    • Consider tiered discounts for different products
                    <br />• Show code always for maximum conversion
                  </Text>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </>
      )}
    </BlockStack>
    </div>
  );
}

