/**
 * GenericDiscountComponent - Enhanced
 *
 * Reusable discount configuration component for campaign forms.
 * Now supports advanced discount types: tiered discounts, BOGO deals, and free gifts.
 *
 * Features:
 * - Enable/disable discount toggle
 * - Show in preview toggle
 * - Basic discount configuration (type, value, delivery mode, code prefix)
 * - Advanced discount types: Tiered, BOGO, Free Gift
 * - Advanced settings modal for detailed configuration
 */

import { useState } from "react";
import {
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
  Banner,
} from "@shopify/polaris";
import { SettingsIcon, DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { DiscountAdvancedSettings } from "~/domains/campaigns/components/DiscountSettingsStep";
import { FormGrid, ProductPicker } from "~/domains/campaigns/components/form";
import type { ProductPickerSelection } from "~/domains/campaigns/components/form";
import type { DiscountConfig, DiscountDeliveryMode } from "~/domains/commerce/services/discount.server";

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
  const [freeGiftVariants, setFreeGiftVariants] = useState<Array<{ id: string; title: string }>>();

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
    deliveryMode: discountConfig?.deliveryMode || "show_code_always",
    requireLogin: discountConfig?.requireLogin,
    storeInMetafield: discountConfig?.storeInMetafield,
    authorizedEmail: discountConfig?.authorizedEmail,
    requireEmailMatch: discountConfig?.requireEmailMatch,
    autoApplyMode: discountConfig?.autoApplyMode || "ajax",
    codePresentation: discountConfig?.codePresentation || "show_code",
    // Enhanced fields
    applicability: discountConfig?.applicability,
    tiers: discountConfig?.tiers,
    bogo: discountConfig?.bogo,
    freeGift: discountConfig?.freeGift,
    combineWith: discountConfig?.combineWith,
  };

  const updateConfig = (updates: Partial<DiscountConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const getRecommendedValue = () => {
    if (goal === "NEWSLETTER_SIGNUP") return 10;
    if (goal === "PRODUCT_UPSELL") return 15;
    if (goal === "CART_RECOVERY") return 20;
    if (goal === "INCREASE_REVENUE") return 15;
    return 10;
  };

  const getValueLabel = () => {
    return config.valueType === "PERCENTAGE" ? "Discount (%)" : "Discount ($)";
  };

  const getValueSuffix = () => {
    return config.valueType === "PERCENTAGE" ? "%" : "$";
  };

  // Check if any advanced discount type is active
  const hasAdvancedDiscount = !!(config.tiers?.length || config.bogo || config.freeGift);

  // Tiered discount handlers
  const addTier = () => {
    const tiers = config.tiers || [];
    const newTier = {
      thresholdCents: tiers.length > 0 ? Math.max(...tiers.map(t => t.thresholdCents)) + 2500 : 5000,
      discount: {
        kind: "percentage" as const,
        value: 10,
      },
    };
    updateConfig({ tiers: [...tiers, newTier] });
  };

  const updateTier = (index: number, updates: Partial<{ thresholdCents: number; discount: { kind: "percentage" | "fixed" | "free_shipping"; value: number } }>) => {
    const tiers = [...(config.tiers || [])];
    tiers[index] = { ...tiers[index], ...updates };
    updateConfig({ tiers });
  };

  const removeTier = (index: number) => {
    const tiers = (config.tiers || []).filter((_, i) => i !== index);
    updateConfig({ tiers: tiers.length > 0 ? tiers : undefined });
  };

  // BOGO handlers
  const toggleBogo = (enabled: boolean) => {
    if (enabled) {
      updateConfig({
        bogo: {
          buy: {
            scope: "any" as const,
            quantity: 1,
            ids: [],
          },
          get: {
            scope: "products" as const,
            ids: [],
            quantity: 1,
            discount: {
              kind: "free_product" as const,
              value: 100,
            },
            appliesOncePerOrder: true,
          },
        },
      });
    } else {
      updateConfig({ bogo: undefined });
    }
  };

  const updateBogoField = (path: string, value: unknown) => {
    const bogo = config.bogo ? { ...config.bogo } : undefined;
    if (!bogo) return;

    const keys = path.split(".");
    let current: Record<string, unknown> = bogo as Record<string, unknown>;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = value;
    updateConfig({ bogo });
  };

  // Free gift handlers
  const toggleFreeGift = (enabled: boolean) => {
    if (enabled) {
      updateConfig({
        freeGift: {
          productId: "",
          variantId: "",
          quantity: 1,
          minSubtotalCents: 0,
        },
      });
    } else {
      updateConfig({ freeGift: undefined });
    }
  };

  const updateFreeGiftField = (field: string, value: unknown) => {
    const freeGift = config.freeGift ? { ...config.freeGift } : undefined;
    if (!freeGift) return;
    (freeGift as Record<string, unknown>)[field] = value;
    updateConfig({ freeGift });
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
          {/* Show in Preview Toggle */}
          <Checkbox
            label="Show discount in preview"
            checked={config.showInPreview !== false}
            onChange={(showInPreview) => updateConfig({ showInPreview })}
            helpText="Display discount information in the campaign preview"
          />

          {/* Advanced Discount Type Selector */}
          <Box
            padding="300"
            background="bg-surface-secondary"
            borderRadius="200"
          >
            <BlockStack gap="300">
              <Text as="h4" variant="headingSm">
                Discount Strategy
              </Text>
              <Select
                label=""
                options={[
                  { label: "Basic Discount - Simple percentage or fixed amount", value: "basic" },
                  { label: "Tiered Discounts - Spend more, save more", value: "tiered" },
                  { label: "BOGO Deal - Buy X, Get Y", value: "bogo" },
                  { label: "Free Gift - Gift with purchase", value: "free_gift" },
                ]}
                value={
                  config.bogo
                    ? "bogo"
                    : config.freeGift
                    ? "free_gift"
                    : config.tiers?.length
                    ? "tiered"
                    : "basic"
                }
                onChange={(value) => {
                  // Build a single new config to avoid stale merges across sequential updates
                  const base = {
                    ...config,
                    tiers: undefined,
                    bogo: undefined,
                    freeGift: undefined,
                  } as DiscountConfig;

                  if (value === "tiered") {
                    base.tiers = [
                      {
                        thresholdCents: 5000,
                        discount: { kind: "percentage" as const, value: 10 },
                      },
                    ];
                  } else if (value === "bogo") {
                    base.bogo = {
                      buy: { scope: "any" as const, quantity: 1, ids: [] },
                      get: {
                        scope: "products" as const,
                        ids: [],
                        quantity: 1,
                        discount: { kind: "free_product" as const, value: 100 },
                        appliesOncePerOrder: true,
                      },
                    };
                  } else if (value === "free_gift") {
                    base.freeGift = {
                      productId: "",
                      variantId: "",
                      quantity: 1,
                      minSubtotalCents: 0,
                    };
                  }

                  onConfigChange(base);
                }}
                helpText="Choose your discount strategy"
              />
            </BlockStack>
          </Box>

          {/* Basic Discount Configuration */}
          {!hasAdvancedDiscount && (
            <>
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
            </>
          )}

          {/* ========== TIERED DISCOUNTS SECTION ========== */}
          {config.tiers && config.tiers.length > 0 && (
            <Box
              padding="400"
              background="bg-surface-secondary"
              borderRadius="200"
            >
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h4" variant="headingSm">
                    🎯 Tiered Discounts
                  </Text>
                  <Button
                    variant="plain"
                    icon={PlusIcon}
                    onClick={addTier}
                  >
                    Add Tier
                  </Button>
                </InlineStack>

                <Text as="p" variant="bodySm" tone="subdued">
                  Reward higher spending with better discounts (e.g., "Spend $50 get 10%, $100 get 20%")
                </Text>

                <BlockStack gap="300">
                  {config.tiers.map((tier, index) => (
                    <Box
                      key={index}
                      padding="300"
                      background="bg-surface"
                      borderRadius="200"
                      borderColor="border"
                      borderWidth="025"
                    >
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <Badge tone="info">{`Tier ${index + 1}`}</Badge>
                          {config.tiers!.length > 1 && (
                            <Button
                              variant="plain"
                              icon={DeleteIcon}
                              tone="critical"
                              onClick={() => removeTier(index)}
                            />
                          )}
                        </InlineStack>

                        <FormGrid columns={3}>
                          <TextField
                            label="Spend Threshold ($)"
                            type="number"
                            value={(tier.thresholdCents / 100).toString()}
                            onChange={(value) =>
                              updateTier(index, {
                                thresholdCents: Math.round(parseFloat(value) * 100) || 0,
                              })
                            }
                            prefix="$"
                            placeholder="50"
                            autoComplete="off"
                            min={0}
                          />

                          <Select
                            label="Discount Type"
                            value={tier.discount.kind}
                            options={[
                              { label: "Percentage", value: "percentage" },
                              { label: "Fixed Amount", value: "fixed" },
                              { label: "Free Shipping", value: "free_shipping" },
                            ]}
                            onChange={(kind) =>
                              updateTier(index, {
                                discount: { ...tier.discount, kind: kind as "percentage" | "fixed" | "free_shipping" },
                              })
                            }
                          />

                          {tier.discount.kind !== "free_shipping" && (
                            <TextField
                              label="Discount Value"
                              type="number"
                              value={tier.discount.value.toString()}
                              onChange={(value) =>
                                updateTier(index, {
                                  discount: { ...tier.discount, value: parseFloat(value) || 0 },
                                })
                              }
                              suffix={tier.discount.kind === "percentage" ? "%" : "$"}
                              placeholder="10"
                              autoComplete="off"
                              min={0}
                              max={tier.discount.kind === "percentage" ? 100 : undefined}
                            />
                          )}
                        </FormGrid>
                      </BlockStack>
                    </Box>
                  ))}
                </BlockStack>
              </BlockStack>
            </Box>
          )}

          {/* ========== BOGO SECTION ========== */}
          {config.bogo && (
            <Box
              padding="400"
              background="bg-surface-secondary"
              borderRadius="200"
            >
              <BlockStack gap="400">
                <Text as="h4" variant="headingSm">
                  🎁 BOGO Configuration
                </Text>

                <Text as="p" variant="bodySm" tone="subdued">
                  Buy X Get Y deals (e.g., "Buy 2 Get 1 Free")
                </Text>

                {/* BUY Configuration */}
                <Box
                  padding="300"
                  background="bg-surface"
                  borderRadius="200"
                  borderColor="border"
                  borderWidth="025"
                >
                  <BlockStack gap="300">
                    <Text as="h5" variant="headingSm">
                      Buy Requirements
                    </Text>

                    <FormGrid columns={2}>
                      <Select
                        label="Buy From"
                        value={config.bogo.buy.scope}
                        options={[
                          { label: "Any Products", value: "any" },
                          { label: "Specific Products", value: "products" },
                          { label: "Specific Collections", value: "collections" },
                        ]}
                        onChange={(scope) => updateBogoField("buy.scope", scope)}
                      />

                      <TextField
                        label="Quantity"
                        type="number"
                        value={config.bogo.buy.quantity.toString()}
                        onChange={(value) => updateBogoField("buy.quantity", parseInt(value) || 1)}
                        min={1}
                        autoComplete="off"
                      />
                    </FormGrid>

                    {config.bogo.buy.scope !== "any" && (
                      <Banner tone="info">
                        <Text as="p" variant="bodySm">
                          Product/Collection IDs will be configurable via Shopify picker (coming soon). For now, use Advanced Settings to add GIDs manually.
                        </Text>
                      </Banner>
                    )}

                    <TextField
                      label="Minimum Subtotal ($) - Optional"
                      type="number"
                      value={
                        config.bogo.buy.minSubtotalCents
                          ? (config.bogo.buy.minSubtotalCents / 100).toString()
                          : ""
                      }
                      onChange={(value) =>
                        updateBogoField(
                          "buy.minSubtotalCents",
                          value ? Math.round(parseFloat(value) * 100) : undefined
                        )
                      }
                      prefix="$"
                      placeholder="0"
                      autoComplete="off"
                      min={0}
                    />
                  </BlockStack>
                </Box>

                {/* GET Configuration */}
                <Box
                  padding="300"
                  background="bg-surface"
                  borderRadius="200"
                  borderColor="border"
                  borderWidth="025"
                >
                  <BlockStack gap="300">
                    <Text as="h5" variant="headingSm">
                      Get Reward
                    </Text>

                    <FormGrid columns={2}>
                      <Select
                        label="Get From"
                        value={config.bogo.get.scope}
                        options={[
                          { label: "Specific Products", value: "products" },
                          { label: "Specific Collections", value: "collections" },
                        ]}
                        onChange={(scope) => updateBogoField("get.scope", scope)}
                      />

                      <TextField
                        label="Quantity"
                        type="number"
                        value={config.bogo.get.quantity.toString()}
                        onChange={(value) => updateBogoField("get.quantity", parseInt(value) || 1)}
                        min={1}
                        autoComplete="off"
                      />
                    </FormGrid>

                    <FormGrid columns={2}>
                      <Select
                        label="Discount Type"
                        value={config.bogo.get.discount.kind}
                        options={[
                          { label: "Free Product (100% off)", value: "free_product" },
                          { label: "Percentage Off", value: "percentage" },
                          { label: "Fixed Amount Off", value: "fixed" },
                        ]}
                        onChange={(kind) => updateBogoField("get.discount.kind", kind)}
                      />

                      {config.bogo.get.discount.kind !== "free_product" && (
                        <TextField
                          label="Discount Value"
                          type="number"
                          value={config.bogo.get.discount.value.toString()}
                          onChange={(value) =>
                            updateBogoField("get.discount.value", parseFloat(value) || 0)
                          }
                          suffix={config.bogo.get.discount.kind === "percentage" ? "%" : "$"}
                          min={0}
                          max={config.bogo.get.discount.kind === "percentage" ? 100 : undefined}
                          autoComplete="off"
                        />
                      )}
                    </FormGrid>

                    <Checkbox
                      label="Applies once per order"
                      checked={config.bogo.get.appliesOncePerOrder !== false}
                      onChange={(checked) => updateBogoField("get.appliesOncePerOrder", checked)}
                      helpText="Limit to one reward per order"
                    />
                  </BlockStack>
                </Box>
              </BlockStack>
            </Box>
          )}

          {/* ========== FREE GIFT SECTION ========== */}
          {config.freeGift && (
            <Box
              padding="400"
              background="bg-surface-secondary"
              borderRadius="200"
            >
              <BlockStack gap="400">
                <Text as="h4" variant="headingSm">
                  🎉 Free Gift Configuration
                </Text>

                <Text as="p" variant="bodySm" tone="subdued">
                  Offer a free product with purchase
                </Text>

                <Banner tone="info">
                  <Text as="p" variant="bodySm">
                    Tip: Use the Shopify picker below to select a product. You can still edit GIDs manually.
                  </Text>
                </Banner>

                {/* Shopify Product Picker */}
                <ProductPicker
                  mode="product"
                  selectionType="single"
                  selectedIds={config.freeGift.productId ? [config.freeGift.productId] : []}
                  onSelect={(items: ProductPickerSelection[]) => {
                    const first = items[0];
                    if (!first) return;
                    updateFreeGiftField("productId", first.id);
                    // If variants are present, default to the first one
                    const variants = (first.variants || []).map(v => ({ id: v.id, title: v.title }));
                    setFreeGiftVariants(variants.length > 0 ? variants : undefined);
                    if (variants.length > 0) {
                      updateFreeGiftField("variantId", variants[0].id);
                    }
                  }}
                />

                {/* If variants are available from picker, allow choosing one */}
                {freeGiftVariants && freeGiftVariants.length > 0 && (
                  <FormGrid columns={2}>
                    <Select
                      label="Select Variant"
                      options={freeGiftVariants.map(v => ({ label: v.title, value: v.id }))}
                      value={config.freeGift.variantId || freeGiftVariants[0].id}
                      onChange={(value) => updateFreeGiftField("variantId", value)}
                    />
                  </FormGrid>
                )}

                <FormGrid columns={2}>
                  <TextField
                    label="Product ID (Shopify GID)"
                    value={config.freeGift.productId}
                    onChange={(value) => updateFreeGiftField("productId", value)}
                    placeholder="gid://shopify/Product/123456"
                    autoComplete="off"
                    helpText="Shopify product global ID"
                  />

                  <TextField
                    label="Variant ID (Shopify GID)"
                    value={config.freeGift.variantId}
                    onChange={(value) => updateFreeGiftField("variantId", value)}
                    placeholder="gid://shopify/ProductVariant/123456"
                    autoComplete="off"
                    helpText="Shopify variant global ID"
                  />
                </FormGrid>

                <FormGrid columns={2}>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={config.freeGift.quantity.toString()}
                    onChange={(value) => updateFreeGiftField("quantity", parseInt(value) || 1)}
                    min={1}
                    autoComplete="off"
                  />

                  <TextField
                    label="Minimum Subtotal ($) - Optional"
                    type="number"
                    value={
                      config.freeGift.minSubtotalCents
                        ? (config.freeGift.minSubtotalCents / 100).toString()
                        : ""
                    }
                    onChange={(value) =>
                      updateFreeGiftField(
                        "minSubtotalCents",
                        value ? Math.round(parseFloat(value) * 100) : undefined
                      )
                    }
                    prefix="$"
                    placeholder="0"
                    autoComplete="off"
                    min={0}
                    helpText="Minimum cart value required"
                  />
                </FormGrid>
              </BlockStack>
            </Box>
          )}

          {/* Basic Settings - Only show if not using advanced discount types */}
          {!hasAdvancedDiscount && (
            <>
              {/* Code Generation Type */}
              <Select
                label="Discount code type"
                options={[
                  { label: "Shared Code (multiple uses)", value: "shared" },
                  { label: "Single-Use Codes (1 per subscriber)", value: "single_use" },
                ]}
                value={config.type === "single_use" ? "single_use" : "shared"}
                onChange={(value) =>
                  updateConfig({
                    type: value as "shared" | "single_use",
                    // For single-use, enforce usageLimit=1; otherwise leave unchanged
                    usageLimit: value === "single_use" ? 1 : config.usageLimit,
                  })
                }
                helpText={
                  config.type === "single_use"
                    ? "Generates a unique code for each subscriber"
                    : "One shared code for all subscribers"
                }
              />

              {/* Delivery Mode & Code Prefix - 2 Column Grid */}
              <FormGrid columns={2}>
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
            </>
          )}

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
              <InlineStack gap="200">
                {hasAdvancedDiscount && (
                  <Badge tone="attention">
                    {config.tiers?.length
                      ? `${config.tiers.length} Tiers`
                      : config.bogo
                      ? "BOGO"
                      : "Free Gift"}
                  </Badge>
                )}
                <Badge tone="info">
                  {config.deliveryMode === "show_code_fallback"
                    ? "Authorized Email Only"
                    : "Show Code"}
                </Badge>
              </InlineStack>
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
