/**
 * CTA Configuration Editor
 *
 * Admin component for configuring CTA (Call-to-Action) buttons.
 * Supports navigation, cart actions, and discount application.
 */

import { useCallback } from "react";
import {
  BlockStack,
  TextField,
  Select,
  Checkbox,
  Text,
  Box,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { ProductPicker } from "./ProductPicker";
import {
  type CTAConfig,
  type CTAAction,
  CTA_ACTION_OPTIONS,
  getCTAActionOption,
} from "../../types/cta";

interface CTAConfigEditorProps {
  config: Partial<CTAConfig>;
  onChange: (config: Partial<CTAConfig>) => void;
  /** Limit which actions are available */
  allowedActions?: CTAAction[];
  /** Show discount integration options */
  showDiscountOptions?: boolean;
}

export function CTAConfigEditor({
  config,
  onChange,
  allowedActions,
  showDiscountOptions = true,
}: CTAConfigEditorProps) {
  // Filter actions if allowedActions is specified
  const availableActions = allowedActions
    ? CTA_ACTION_OPTIONS.filter((opt) => allowedActions.includes(opt.value))
    : CTA_ACTION_OPTIONS;

  const currentAction = config.action || "navigate_collection";
  const actionOption = getCTAActionOption(currentAction);
  const successBehavior = config.successBehavior ?? {};
  const secondaryAction = successBehavior.secondaryAction;

  const updateConfig = useCallback(
    (updates: Partial<CTAConfig>) => {
      onChange({ ...config, ...updates });
    },
    [config, onChange]
  );

  const handleActionChange = useCallback(
    (action: string) => {
      // Clear action-specific fields when changing action type
      updateConfig({
        action: action as CTAAction,
        url: undefined,
        productId: undefined,
        productHandle: undefined,
        collectionId: undefined,
        collectionHandle: undefined,
        variantId: undefined,
      });
    },
    [updateConfig]
  );

  return (
    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h4" variant="headingSm">
            Button Configuration
          </Text>
          {actionOption && (
            <Badge tone="info">{actionOption.label}</Badge>
          )}
        </InlineStack>

        {/* Button Label */}
        <TextField
          label="Button Text"
          value={config.label || ""}
          onChange={(label) => updateConfig({ label })}
          placeholder="Shop Now"
          autoComplete="off"
        />

        {/* Action Type */}
        <Select
          label="When clicked..."
          options={availableActions.map((opt) => ({
            label: opt.label,
            value: opt.value,
            // Could add helpText here
          }))}
          value={currentAction}
          onChange={handleActionChange}
          helpText={actionOption?.description}
        />

        {/* Action-specific fields */}

        {/* URL input for navigate_url */}
        {actionOption?.requiresUrl && (
          <TextField
            label="Destination URL"
            value={config.url || ""}
            onChange={(url) => updateConfig({ url })}
            placeholder="/collections/sale"
            autoComplete="off"
            helpText="Enter the full path or URL"
          />
        )}

        {/* Collection picker for navigate_collection */}
        {actionOption?.requiresCollection && (
          <BlockStack gap="200">
            <ProductPicker
              mode="collection"
              selectionType="single"
              selectedIds={config.collectionId ? [config.collectionId] : []}
              onSelect={(selections) => {
                if (selections.length > 0) {
                  const collection = selections[0];
                  updateConfig({
                    collectionId: collection.id,
                    collectionHandle: collection.handle,
                  });
                } else {
                  updateConfig({ collectionId: undefined, collectionHandle: undefined });
                }
              }}
              buttonLabel="Select Collection"
              showSelected={true}
            />
          </BlockStack>
        )}

        {/* Product picker for navigate_product */}
        {actionOption?.requiresProduct && (
          <BlockStack gap="200">
            <ProductPicker
              mode="product"
              selectionType="single"
              selectedIds={config.productId ? [config.productId] : []}
              onSelect={(selections) => {
                if (selections.length > 0) {
                  const product = selections[0];
                  updateConfig({
                    productId: product.id,
                    productHandle: product.handle,
                  });
                } else {
                  updateConfig({ productId: undefined, productHandle: undefined });
                }
              }}
              buttonLabel="Select Product"
              showSelected={true}
            />
          </BlockStack>
        )}

        {/* Product/Variant picker for cart actions */}
        {actionOption?.requiresVariant && (
          <BlockStack gap="300">
            <ProductPicker
              mode="product"
              selectionType="single"
              selectedIds={config.productId ? [config.productId] : []}
              onSelect={(selections) => {
                if (selections.length > 0) {
                  const product = selections[0];
                  // Get first variant from product for add-to-cart action
                  const firstVariant = product.variants?.[0];
                  updateConfig({
                    productId: product.id,
                    productHandle: product.handle,
                    variantId: firstVariant?.id,
                  });
                } else {
                  updateConfig({ productId: undefined, productHandle: undefined, variantId: undefined });
                }
              }}
              buttonLabel="Select Product"
              showSelected={true}
            />
            {config.productId && config.variantId && (
              <Text as="p" variant="bodySm" tone="subdued">
                Selected variant: {config.variantId.split("/").pop()}
              </Text>
            )}
            <TextField
              label="Quantity"
              type="number"
              value={String(config.quantity || 1)}
              onChange={(val) => updateConfig({ quantity: parseInt(val) || 1 })}
              min={1}
              autoComplete="off"
            />
          </BlockStack>
        )}

        {/* Open in new tab (for navigation actions) */}
        {(currentAction === "navigate_url" ||
          currentAction === "navigate_product" ||
          currentAction === "navigate_collection") && (
          <Checkbox
            label="Open in new tab"
            checked={config.openInNewTab === true}
            onChange={(checked) => updateConfig({ openInNewTab: checked })}
          />
        )}

        {/* Success Behavior (shown for non-navigation actions or when discount options enabled) */}
        {showDiscountOptions && (
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">
              After Action Completes
            </Text>

            <Checkbox
              label="Show discount code"
              checked={config.successBehavior?.showDiscountCode !== false}
              onChange={(checked) =>
                updateConfig({
                  successBehavior: {
                    ...config.successBehavior,
                    showDiscountCode: checked,
                  },
                })
              }
              helpText="Display the discount code in the success state"
            />

            <TextField
              label="Auto-close delay (seconds)"
              type="number"
              value={String(successBehavior.autoCloseDelay ?? 5)}
              onChange={(value) =>
                updateConfig({
                  successBehavior: {
                    ...config.successBehavior,
                    autoCloseDelay: parseInt(value) || 0,
                  },
                })
              }
              min={0}
              max={30}
              autoComplete="off"
              helpText="Popup closes automatically after this delay (0 = no auto-close)"
            />

            <BlockStack gap="200">
              <Checkbox
                label="Show secondary action button"
                checked={!!secondaryAction}
                onChange={(checked) =>
                  updateConfig({
                    successBehavior: {
                      ...config.successBehavior,
                      secondaryAction: checked
                        ? { label: "View Cart", url: "/cart" }
                        : undefined,
                    },
                  })
                }
                helpText="Add a button like 'View Cart' or 'Continue Shopping'"
              />

              {secondaryAction && (
                <InlineStack gap="300" wrap={false}>
                  <Box minWidth="120px">
                    <TextField
                      label="Button Label"
                      value={secondaryAction.label || ""}
                      onChange={(value) =>
                        updateConfig({
                          successBehavior: {
                            ...config.successBehavior,
                            secondaryAction: {
                              ...secondaryAction,
                              label: value,
                            },
                          },
                        })
                      }
                      placeholder="View Cart"
                      autoComplete="off"
                    />
                  </Box>
                  <Box minWidth="200px">
                    <TextField
                      label="URL"
                      value={secondaryAction.url || ""}
                      onChange={(value) =>
                        updateConfig({
                          successBehavior: {
                            ...config.successBehavior,
                            secondaryAction: {
                              ...secondaryAction,
                              url: value,
                            },
                          },
                        })
                      }
                      placeholder="/cart"
                      autoComplete="off"
                    />
                  </Box>
                </InlineStack>
              )}
            </BlockStack>
          </BlockStack>
        )}
      </BlockStack>
    </Box>
  );
}

export default CTAConfigEditor;
