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
import type {
  DiscountConfig,
  DiscountBehavior,
} from "~/domains/commerce/services/discount.server";

/**
 * Discount strategy types that can be shown in the component.
 * - basic: Simple percentage, fixed amount, or free shipping (storewide/cart)
 * - bundle: Product-scoped percentage/fixed discount for selected upsell items
 * - tiered: Spend more, save more (e.g., $50 = 10%, $100 = 20%)
 * - bogo: Buy X, Get Y deals
 * - free_gift: Free gift with purchase
 */
export type DiscountStrategyOption = "basic" | "bundle" | "tiered" | "bogo" | "free_gift";

interface GenericDiscountComponentProps {
  goal?: string;
  discountConfig?: DiscountConfig;
  onConfigChange: (config: DiscountConfig) => void;
  /**
   * Which discount strategies to show in the selector.
   * Defaults to all strategies: ['basic', 'tiered', 'bogo', 'free_gift']
   *
   * For gamified templates (Spin-to-Win, Scratch Card), use ['basic', 'free_gift']
   * since tiered and BOGO don't make sense for per-segment/prize discounts.
   */
  allowedStrategies?: DiscountStrategyOption[];
  /**
   * Whether the campaign captures email addresses.
   * When true, enables the "Show Code + Assign to Email" behavior option.
   */
  hasEmailCapture?: boolean;
}

const ALL_STRATEGIES: DiscountStrategyOption[] = [
  "basic",
  "bundle",
  "tiered",
  "bogo",
  "free_gift",
];

const STRATEGY_OPTIONS: Record<DiscountStrategyOption, { label: string; value: string }> = {
  basic: { label: "Basic Discount - Simple percentage or fixed amount", value: "basic" },
  bundle: { label: "Bundle Discount - Specific upsell products only", value: "bundle" },
  tiered: { label: "Tiered Discounts - Spend more, save more", value: "tiered" },
  bogo: { label: "BOGO Deal - Buy X, Get Y", value: "bogo" },
  free_gift: { label: "Free Gift - Gift with purchase", value: "free_gift" },
};

// Tips and explanations for each discount strategy
const STRATEGY_TIPS: Record<DiscountStrategyOption, { title: string; tips: string[] }> = {
  basic: {
    title: "💡 Basic Discount Tips",
    tips: [
      "10-15% off works well for welcome offers and newsletter signups",
      "20-30% creates urgency for flash sales",
      "Free shipping is highly effective - customers hate paying for shipping!",
    ],
  },
  bundle: {
    title: "🧺 Bundle Discount Tips",
    tips: [
      "Scope discounts to the exact upsell items to protect margins",
      "Keep bundle offers simple (10-20%) so customers understand quickly",
      "Pair with product-specific copy: “Save 15% on these add-ons”",
      "Use product scoping so discounts don’t leak to the entire cart",
    ],
  },
  tiered: {
    title: "📈 Tiered Discount Tips",
    tips: [
      "Set thresholds just above your average order value to encourage larger carts",
      "Use 3 tiers maximum - more can confuse customers",
      "Example: $50→10%, $100→20%, $150→30% works well for most stores",
      "Display thresholds on your popup to motivate customers to add more",
    ],
  },
  bogo: {
    title: "🛍️ BOGO Tips",
    tips: [
      "\"Buy 1 Get 1 Free\" is one of the most compelling offers for customers",
      "Great for moving excess inventory or introducing new products",
      "Consider \"Buy 2 Get 1 Free\" for higher margins while still feeling generous",
      "Limit to specific products/collections to protect your margins",
    ],
  },
  free_gift: {
    title: "🎁 Free Gift Tips",
    tips: [
      "Free gifts feel more valuable than equivalent discounts",
      "Use low-cost, high-perceived-value items (samples, accessories)",
      "Set a minimum purchase to protect margins and increase AOV",
      "Great for product launches - give samples of new products",
    ],
  },
};

export function GenericDiscountComponent({
  goal = "NEWSLETTER_SIGNUP",
  discountConfig,
  onConfigChange,
  allowedStrategies = ALL_STRATEGIES,
  hasEmailCapture,
}: GenericDiscountComponentProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [freeGiftVariants, setFreeGiftVariants] = useState<Array<{ id: string; title: string }>>();

  // Initialize with defaults if not provided
  const config: DiscountConfig = {
    enabled: discountConfig?.enabled !== false,
    showInPreview: discountConfig?.showInPreview !== false,
    strategy: discountConfig?.strategy || "simple",
    type: discountConfig?.type || "shared",
    valueType: discountConfig?.valueType || "PERCENTAGE",
    value: discountConfig?.valueType === "FREE_SHIPPING" ? undefined : discountConfig?.value || 10,
    minimumAmount: discountConfig?.minimumAmount,
    usageLimit: discountConfig?.usageLimit,
    expiryDays: discountConfig?.expiryDays || 30,
    prefix: discountConfig?.prefix || "WELCOME",
    behavior: discountConfig?.behavior || "SHOW_CODE_AND_AUTO_APPLY",
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
  const hasAdvancedDiscount = !!(
    config.tiers?.length ||
    config.bogo ||
    config.freeGift ||
    config.strategy === "tiered" ||
    config.strategy === "bogo" ||
    config.strategy === "free_gift"
  );

  // Tiered discount handlers
  const addTier = () => {
    const tiers = config.tiers || [];
    const newTier = {
      thresholdCents:
        tiers.length > 0 ? Math.max(...tiers.map((t) => t.thresholdCents)) + 2500 : 5000,
      discount: {
        kind: "percentage" as const,
        value: 10,
      },
    };
    updateConfig({ tiers: [...tiers, newTier] });
  };

  const updateTier = (
    index: number,
    updates: Partial<{
      thresholdCents: number;
      discount: { kind: "percentage" | "fixed" | "free_shipping"; value: number };
    }>
  ) => {
    const tiers = [...(config.tiers || [])];
    tiers[index] = { ...tiers[index], ...updates };
    updateConfig({ tiers });
  };

  const removeTier = (index: number) => {
    const tiers = (config.tiers || []).filter((_, i) => i !== index);
    updateConfig({ tiers: tiers.length > 0 ? tiers : undefined });
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
          {/* Determine current strategy for tips */}
          {(() => {
            const inferredStrategy: DiscountStrategyOption =
              config.strategy === "bundle"
                ? "bundle"
                : config.strategy === "tiered" || config.tiers?.length
                  ? "tiered"
                  : config.strategy === "bogo" || config.bogo
                    ? "bogo"
                    : config.strategy === "free_gift" || config.freeGift
                      ? "free_gift"
                      : "basic";

            const currentStrategy: DiscountStrategyOption = allowedStrategies.includes(
              inferredStrategy
            )
              ? inferredStrategy
              : "basic";

            const tips = STRATEGY_TIPS[currentStrategy];

            return (
              <Banner tone="info" title={tips.title}>
                <BlockStack gap="100">
                  {tips.tips.map((tip, index) => (
                    <Text key={index} as="p" variant="bodySm">
                      • {tip}
                    </Text>
                  ))}
                </BlockStack>
              </Banner>
            );
          })()}

          {/* Advanced Discount Type Selector - only show if more than one strategy allowed */}
          {allowedStrategies.length > 1 && (
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Discount Strategy
                </Text>
                <Select
                  label=""
                  options={allowedStrategies.map((strategy) => STRATEGY_OPTIONS[strategy])}
                  value={
                    config.strategy === "bundle" && allowedStrategies.includes("bundle")
                      ? "bundle"
                      : config.strategy === "tiered" && allowedStrategies.includes("tiered")
                        ? "tiered"
                        : config.strategy === "bogo" && allowedStrategies.includes("bogo")
                          ? "bogo"
                          : config.strategy === "free_gift" && allowedStrategies.includes("free_gift")
                            ? "free_gift"
                            : config.tiers?.length && allowedStrategies.includes("tiered")
                              ? "tiered"
                              : config.bogo && allowedStrategies.includes("bogo")
                                ? "bogo"
                                : config.freeGift && allowedStrategies.includes("free_gift")
                                  ? "free_gift"
                                  : "basic"
                  }
                  onChange={(value) => {
                  // Build a single new config to avoid stale merges across sequential updates
                  const base: DiscountConfig = {
                    ...config,
                    tiers: undefined,
                    bogo: undefined,
                    freeGift: undefined,
                    strategy:
                      value === "basic"
                        ? "simple"
                        : (value as "bundle" | "tiered" | "bogo" | "free_gift"),
                  };

                  if (value === "tiered") {
                    base.tiers = [
                      {
                        thresholdCents: 5000,
                        discount: { kind: "percentage" as const, value: 10 },
                      },
                    ];
                  } else if (value === "bundle") {
                    base.applicability = {
                      scope: "products",
                      productIds:
                        config.applicability?.scope === "products"
                          ? config.applicability.productIds || []
                          : [],
                    };
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
          )}

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
                      valueType: valueType as "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING",
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
                    value={config.value?.toString() ?? ""}
                    onChange={(value) => updateConfig({ value: value === "" ? undefined : parseFloat(value) })}
                    placeholder={getRecommendedValue().toString()}
                    autoComplete="off"
                    min={0}
                    max={config.valueType === "PERCENTAGE" ? 100 : undefined}
                    helpText={`Recommended: ${getRecommendedValue()}${getValueSuffix()}`}
                  />
                )}
              </FormGrid>

              {config.valueType === "FREE_SHIPPING" && (
                <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                  <Text as="p" variant="bodySm">
                    🚚 <strong>Free Shipping Discount</strong>
                    <br />
                    Customers will get free shipping with their order. No discount value needed.
                  </Text>
                </Box>
              )}

              {/* Applicability / Scope */}
              <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="300">
                  <Text as="h4" variant="headingSm">
                    Applies to
                  </Text>
                  <FormGrid columns={2}>
                    <Select
                      label="Discount applies to"
                      options={[
                        { label: "Entire store", value: "all" },
                        { label: "Entire cart", value: "cart" },
                        { label: "Specific products", value: "products" },
                        { label: "Specific collections", value: "collections" },
                      ]}
                      value={config.applicability?.scope || "all"}
                      onChange={(scope) => {
                        const nextScope = scope as "all" | "cart" | "products" | "collections";
                        const current = config.applicability || { scope: nextScope };
                        updateConfig({
                          applicability: {
                            scope: nextScope,
                            productIds:
                              nextScope === "products" ? current.productIds || [] : undefined,
                            collectionIds:
                              nextScope === "collections" ? current.collectionIds || [] : undefined,
                          },
                        });
                      }}
                    />
                  </FormGrid>

                  {config.applicability?.scope === "products" && (
                    <ProductPicker
                      mode="product"
                      selectionType="multiple"
                      selectedIds={config.applicability?.productIds || []}
                      onSelect={(items: ProductPickerSelection[]) =>
                        updateConfig({
                          applicability: {
                            scope: "products",
                            productIds: items.map((item) => item.id),
                          },
                        })
                      }
                      buttonLabel="Select products"
                    />
                  )}

                  {config.applicability?.scope === "collections" && (
                    <ProductPicker
                      mode="collection"
                      selectionType="multiple"
                      selectedIds={config.applicability?.collectionIds || []}
                      onSelect={(items: ProductPickerSelection[]) =>
                        updateConfig({
                          applicability: {
                            scope: "collections",
                            collectionIds: items.map((item) => item.id),
                          },
                        })
                      }
                      buttonLabel="Select collections"
                    />
                  )}
                </BlockStack>
              </Box>
            </>
          )}

          {/* ========== TIERED DISCOUNTS SECTION ========== */}
          {allowedStrategies.includes("tiered") && config.tiers && config.tiers.length > 0 && (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h4" variant="headingSm">
                    🎯 Tiered Discounts
                  </Text>
                  <Button variant="plain" icon={PlusIcon} onClick={addTier}>
                    Add Tier
                  </Button>
                </InlineStack>

                <Text as="p" variant="bodySm" tone="subdued">
                  The higher customers spend, the more they save. Great for increasing average order value!
                </Text>

                {/* Show preview of tiers */}
                <Box padding="200" background="bg-surface" borderRadius="100">
                  <InlineStack gap="200" wrap={false}>
                    {config.tiers.map((tier, index) => (
                      <Badge key={index} tone="success">
                        {`$${tier.thresholdCents / 100} → ${tier.discount.kind === "free_shipping" ? "Free Ship" :
                          tier.discount.kind === "percentage" ? `${tier.discount.value}% OFF` :
                          `$${tier.discount.value} OFF`}`}
                      </Badge>
                    ))}
                  </InlineStack>
                </Box>

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
                          <Badge tone="info">{`Tier ${index + 1}: Spend $${tier.thresholdCents / 100}+`}</Badge>
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
                                discount: {
                                  ...tier.discount,
                                  kind: kind as "percentage" | "fixed" | "free_shipping",
                                },
                              })
                            }
                          />

                          {tier.discount.kind !== "free_shipping" && (
                            <TextField
                              label="Discount Value"
                              type="number"
                              value={tier.discount.value.toString() ?? ""}
                              onChange={(value) =>
                                updateTier(index, {
                                  discount: { ...tier.discount, value: value === "" ? 0 : parseFloat(value) },
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
          {allowedStrategies.includes("bogo") && config.bogo && (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h4" variant="headingSm">
                    🎁 BOGO Configuration
                  </Text>
                  <Badge tone="success">
                    {`Buy ${config.bogo.buy.quantity} Get ${config.bogo.get.quantity} ${
                      config.bogo.get.discount.kind === "free_product" ? "FREE" :
                      `${config.bogo.get.discount.value}% OFF`
                    }`}
                  </Badge>
                </InlineStack>

                {/* BUY Configuration */}
                <Box
                  padding="300"
                  background="bg-surface"
                  borderRadius="200"
                  borderColor="border"
                  borderWidth="025"
                >
                  <BlockStack gap="300">
                    <BlockStack gap="100">
                      <Text as="h5" variant="headingSm">
                        Step 1: What must customers buy?
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Define what products qualify for this BOGO deal
                      </Text>
                    </BlockStack>

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
                        value={config.bogo.buy.quantity.toString() ?? ""}
                        onChange={(value) => updateBogoField("buy.quantity", value === "" ? 1 : parseInt(value))}
                        min={1}
                        autoComplete="off"
                      />
                    </FormGrid>

                    {config.bogo.buy.scope === "products" && (
                      <ProductPicker
                        mode="product"
                        selectionType="multiple"
                        selectedIds={config.bogo.buy.ids || []}
                        onSelect={(items: ProductPickerSelection[]) =>
                          updateBogoField("buy.ids", items.map((item) => item.id))
                        }
                        buttonLabel="Select products to buy"
                      />
                    )}

                    {config.bogo.buy.scope === "collections" && (
                      <ProductPicker
                        mode="collection"
                        selectionType="multiple"
                        selectedIds={config.bogo.buy.ids || []}
                        onSelect={(items: ProductPickerSelection[]) =>
                          updateBogoField("buy.ids", items.map((item) => item.id))
                        }
                        buttonLabel="Select collections to buy from"
                      />
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
                    <BlockStack gap="100">
                      <Text as="h5" variant="headingSm">
                        Step 2: What do they get?
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Define the reward customers receive
                      </Text>
                    </BlockStack>

                    <FormGrid columns={2}>
                      <Select
                        label="Reward Products From"
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
                        value={config.bogo.get.quantity.toString() ?? ""}
                        onChange={(value) => updateBogoField("get.quantity", value === "" ? 1 : parseInt(value))}
                        min={1}
                        autoComplete="off"
                      />
                    </FormGrid>

                    {config.bogo.get.scope === "products" && (
                      <ProductPicker
                        mode="product"
                        selectionType="multiple"
                        selectedIds={config.bogo.get.ids || []}
                        onSelect={(items: ProductPickerSelection[]) => {
                          // Store product IDs
                          updateBogoField("get.ids", items.map((item) => item.id));
                          // Store first variant ID for each product (for add-to-cart)
                          const variantIds = items.map((item) =>
                            item.variants?.[0]?.id || ""
                          ).filter(Boolean);
                          if (variantIds.length > 0) {
                            updateBogoField("get.variantIds", variantIds);
                          }
                          // Store product handles (for navigation)
                          const handles = items.map((item) => item.handle || "").filter(Boolean);
                          if (handles.length > 0) {
                            updateBogoField("get.productHandles", handles);
                          }
                        }}
                        buttonLabel="Select products to get"
                      />
                    )}

                    {config.bogo.get.scope === "collections" && (
                      <ProductPicker
                        mode="collection"
                        selectionType="multiple"
                        selectedIds={config.bogo.get.ids || []}
                        onSelect={(items: ProductPickerSelection[]) =>
                          updateBogoField("get.ids", items.map((item) => item.id))
                        }
                        buttonLabel="Select collections to get from"
                      />
                    )}

                    {/* Info banner explaining CTA behavior */}
                    {config.bogo.get.ids && config.bogo.get.ids.length > 0 && (
                      <Banner tone="info">
                        <Text as="p" variant="bodySm">
                          💡 When customers click the popup button, the first selected product will be automatically added to their cart with the BOGO discount applied.
                        </Text>
                      </Banner>
                    )}

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
                          value={config.bogo.get.discount.value.toString() ?? ""}
                          onChange={(value) =>
                            updateBogoField("get.discount.value", value === "" ? 0 : parseFloat(value))
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
          {allowedStrategies.includes("free_gift") && config.freeGift && (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="400">
                <Text as="h4" variant="headingSm">
                  🎉 Free Gift Configuration
                </Text>

                <Text as="p" variant="bodySm" tone="subdued">
                  Offer a free product with purchase
                </Text>

                <Banner tone="info">
                  <Text as="p" variant="bodySm">
                    Tip: Use the Shopify picker below to select a product. You can still edit GIDs
                    manually.
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
                    // Store product title for storefront display
                    updateFreeGiftField("productTitle", first.title);
                    // Store first product image URL for storefront display
                    const firstImageUrl = first.images?.[0]?.originalSrc;
                    if (firstImageUrl) {
                      updateFreeGiftField("productImageUrl", firstImageUrl);
                    }
                    // If variants are present, default to the first one
                    const variants = (first.variants || []).map((v) => ({
                      id: v.id,
                      title: v.title,
                    }));
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
                      options={freeGiftVariants.map((v) => ({ label: v.title, value: v.id }))}
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
                    value={config.freeGift.quantity.toString() ?? ""}
                    onChange={(value) => updateFreeGiftField("quantity", value === "" ? 1 : parseInt(value))}
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

              {/* Discount Behavior & Code Prefix - 2 Column Grid */}
              <FormGrid columns={2}>
                <Select
                  label="Discount Behavior"
                  options={[
                    {
                      label: "Show Code + Auto-Apply",
                      value: "SHOW_CODE_AND_AUTO_APPLY",
                    },
                    { label: "Show Code Only", value: "SHOW_CODE_ONLY" },
                    {
                      label: "Show Code + Assign to Email",
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
                      ? "Code is displayed and automatically applied to the cart."
                      : config.behavior === "SHOW_CODE_ONLY"
                        ? "Code is displayed but customer must manually enter it."
                        : "Code is shown and restricted to the captured email address."
                  }
                />

                <TextField
                  label="Discount Code Prefix"
                  value={config.prefix || ""}
                  onChange={(prefix) => updateConfig({ prefix: prefix.toUpperCase() })}
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
                  {config.behavior === "SHOW_CODE_AND_AUTO_APPLY"
                    ? "Auto-Apply + Code"
                    : config.behavior === "SHOW_CODE_ONLY"
                      ? "Show Code"
                      : "Email-Restricted"}
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
              hasEmailCapture={hasEmailCapture}
            />
          </div>
        </Modal.Section>
      </Modal>
    </BlockStack>
  );
}
