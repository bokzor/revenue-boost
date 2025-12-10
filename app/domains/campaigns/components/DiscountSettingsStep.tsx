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
import type { DiscountConfig } from "~/domains/campaigns/types/campaign";
import type { DiscountBehavior } from "~/domains/campaigns/types/campaign";

interface DiscountSettingsStepProps {
  goal?: string;
  discountConfig?: DiscountConfig;
  onConfigChange: (config: DiscountConfig) => void;
  hasEmailCapture?: boolean; // Whether the campaign captures email
  contentConfig?: Record<string, unknown>; // To detect email capture from content
}

export function DiscountSettingsStep({
  goal,
  discountConfig,
  onConfigChange,
  hasEmailCapture,
  contentConfig,
}: DiscountSettingsStepProps) {
  // Detect if email capture is enabled from contentConfig
  const emailCaptureEnabled =
    hasEmailCapture ??
    (contentConfig?.emailRequired === true ||
      contentConfig?.emailPlaceholder !== undefined ||
      contentConfig?.enableEmailRecovery === true);

  // Initialize with defaults if not provided
  // IMPORTANT: Preserve advanced discount fields (bogo, tiers, freeGift) from incoming config
  // Use nullish coalescing (??) instead of || to preserve 0 and other falsy values
  const config: DiscountConfig = {
    enabled: discountConfig?.enabled !== false,
    showInPreview: discountConfig?.showInPreview !== false,
    strategy: discountConfig?.strategy ?? "simple",
    type: discountConfig?.type ?? "shared",
    valueType: discountConfig?.valueType ?? "PERCENTAGE",
    value: discountConfig?.valueType === "FREE_SHIPPING" ? undefined : (discountConfig?.value ?? 10),
    minimumAmount: discountConfig?.minimumAmount,
    usageLimit: discountConfig?.usageLimit,
    expiryDays: discountConfig?.expiryDays ?? 30,
    prefix: discountConfig?.prefix ?? "WELCOME",
    behavior: discountConfig?.behavior ?? "SHOW_CODE_AND_AUTO_APPLY",
    // Preserve advanced discount structures
    bogo: discountConfig?.bogo,
    tiers: discountConfig?.tiers,
    freeGift: discountConfig?.freeGift,
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

  const getBehaviorDescription = (behavior: DiscountBehavior) => {
    switch (behavior) {
      case "SHOW_CODE_AND_AUTO_APPLY":
        return {
          title: "🎯 Show Code + Auto-Apply",
          description:
            "Recommended. The discount code is displayed to the customer AND automatically applied to their cart when they continue. Best user experience.",
          tone: "success" as const,
        };
      case "SHOW_CODE_ONLY":
        return {
          title: "📋 Show Code Only",
          description:
            "The discount code is displayed to the customer, but they must manually enter it at checkout. Simple but requires extra customer effort.",
          tone: "info" as const,
        };
      case "SHOW_CODE_AND_ASSIGN_TO_EMAIL":
        return {
          title: "🔒 Show Code + Assign to Email",
          description:
            "The discount code is displayed AND restricted to the captured email address only. Highest security, prevents code sharing. Requires email capture.",
          tone: "warning" as const,
        };
      default:
        return {
          title: "🎯 Show Code + Auto-Apply",
          description:
            "Recommended. The discount code is displayed to the customer AND automatically applied to their cart when they continue.",
          tone: "success" as const,
        };
    }
  };

  const getValueLabel = () => {
    return config.valueType === "PERCENTAGE" ? "Discount Percentage" : "Discount Amount ($)";
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

  // Detect active advanced discount type
  const hasAdvancedDiscount = config.bogo || config.tiers?.length || config.freeGift;
  const advancedDiscountType = config.bogo ? "BOGO" :
    config.tiers?.length ? "Tiered" :
    config.freeGift ? "Free Gift" : null;

  return (
    <div data-testid="admin-discount-settings-step">
      <BlockStack gap="600">
        {/* Header */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd">
                Discount Configuration
              </Text>
              {hasAdvancedDiscount && advancedDiscountType && (
                <Badge tone="success">{`${advancedDiscountType} Active`}</Badge>
              )}
            </InlineStack>
            <Text as="p" variant="bodyMd" tone="subdued">
              Configure discount settings to incentivize conversions. Choose how customers receive
              and use their discounts.
            </Text>

            {/* Show banner when advanced discount is configured */}
            {hasAdvancedDiscount && (
              <Banner tone="info">
                This campaign uses a <strong>{advancedDiscountType}</strong> discount strategy.
                The settings below apply to code generation and delivery.
              </Banner>
            )}

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
            {/* Discount Code Settings - Always shown */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Code Settings
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Configure how discount codes are generated and delivered.
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

                  {/* Only show basic discount value settings when NOT using advanced strategies */}
                  {!hasAdvancedDiscount && (
                    <>
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
                              valueType: valueType as "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING",
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
                            value={config.value?.toString() ?? ""}
                            onChange={(value) => updateConfig({ value: value === "" ? undefined : parseFloat(value) })}
                            placeholder={getValuePlaceholder()}
                            autoComplete="off"
                            min={0}
                            max={config.valueType === "PERCENTAGE" ? 100 : undefined}
                            helpText={
                              goal && (
                                <span>
                                  Recommended for {goal.replace("_", " ").toLowerCase()}:{" "}
                                  {getRecommendedValue()}
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
                            This discount will provide free shipping to customers. No discount value is
                            needed.
                          </Text>
                        </div>
                      )}

                      <div data-testid="discount-minimum-amount">
                        <TextField
                          label="Minimum Order Amount (Optional)"
                          type="number"
                          prefix="$"
                          value={config.minimumAmount?.toString() ?? ""}
                          onChange={(value) =>
                            updateConfig({
                              minimumAmount: value === "" ? undefined : parseFloat(value),
                            })
                          }
                          placeholder="0.00"
                          autoComplete="off"
                          min={0}
                          helpText="Only apply discount if order total meets this minimum"
                        />
                      </div>
                    </>
                  )}
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Discount Behavior Settings */}
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">
                  Discount Behavior
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Choose how customers will see and use their discount code. This affects both user
                  experience and security.
                </Text>

                <FormLayout>
                  <div data-testid="discount-behavior">
                    <Select
                      label="How should the discount be delivered?"
                      options={[
                        {
                          label: "Show Code + Auto-Apply (Recommended)",
                          value: "SHOW_CODE_AND_AUTO_APPLY",
                        },
                        {
                          label: "Show Code Only",
                          value: "SHOW_CODE_ONLY",
                        },
                        {
                          label: "Show Code + Assign to Email User",
                          value: "SHOW_CODE_AND_ASSIGN_TO_EMAIL",
                          disabled: !emailCaptureEnabled,
                        },
                      ]}
                      value={config.behavior || "SHOW_CODE_AND_AUTO_APPLY"}
                      onChange={(behavior) => {
                        updateConfig({
                          behavior: behavior as DiscountBehavior,
                        });
                      }}
                      helpText={
                        !emailCaptureEnabled && config.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL"
                          ? "Email assignment requires email capture to be enabled"
                          : undefined
                      }
                    />
                  </div>

                  {config.behavior && (
                    <div data-testid="discount-behavior-description">
                      <Banner
                        tone={getBehaviorDescription(config.behavior).tone}
                        title={getBehaviorDescription(config.behavior).title}
                      >
                        <p>{getBehaviorDescription(config.behavior).description}</p>
                      </Banner>
                    </div>
                  )}

                  {/* Validation warning for email assignment without email capture */}
                  {config.behavior === "SHOW_CODE_AND_ASSIGN_TO_EMAIL" && !emailCaptureEnabled && (
                    <Banner tone="critical">
                      <p>
                        <strong>Email capture required:</strong> To use email-specific discount
                        assignment, you must enable email capture in your campaign content
                        configuration.
                      </p>
                    </Banner>
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
                      onChange={(prefix) => updateConfig({ prefix: prefix.toUpperCase() })}
                      placeholder="WELCOME"
                      autoComplete="off"
                      helpText="Prefix for generated discount codes (e.g., WELCOME10)"
                    />
                  </div>

                  <div data-testid="discount-expiry-days">
                    <TextField
                      label="Expires After (Days)"
                      type="number"
                      value={config.expiryDays?.toString() ?? ""}
                      onChange={(value) => updateConfig({ expiryDays: value === "" ? undefined : parseInt(value) })}
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
                        value={config.usageLimit?.toString() ?? ""}
                        onChange={(value) =>
                          updateConfig({ usageLimit: value === "" ? undefined : parseInt(value) })
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
                  Recommendations for{" "}
                  {goal ? goal.replace("_", " ").toUpperCase() : "YOUR CAMPAIGN"}
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

// Alias with a clearer name since this is used inside modals, not as a route step
export { DiscountSettingsStep as DiscountAdvancedSettings };
