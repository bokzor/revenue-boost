/**
 * ProductPicker Component
 *
 * Reusable component for selecting Shopify products or collections using App Bridge modal.
 * Provides a native Shopify picker experience for selecting resources.
 *
 * Features:
 * - Product selection (single or multiple)
 * - Collection selection (single or multiple)
 * - Variant selection
 * - Returns Shopify GIDs for use in discount configuration
 * - Visual selection UI with product/collection details
 *
 * Usage:
 * ```tsx
 * <ProductPicker
 *   mode="product"
 *   selectionType="single"
 *   selectedIds={[productGid]}
 *   onSelect={(selections) => handleSelect(selections)}
 * />
 * ```
 */

import { useState, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Button, InlineStack, BlockStack, Text, Badge, Box } from "@shopify/polaris";
import { ProductIcon, CollectionIcon } from "@shopify/polaris-icons";

export interface ProductPickerSelection {
  id: string; // Shopify GID (e.g., gid://shopify/Product/123456789)
  title: string;
  handle?: string;
  images?: Array<{
    originalSrc: string;
    altText?: string;
  }>;
  variants?: Array<{
    id: string; // Shopify GID (e.g., gid://shopify/ProductVariant/987654321)
    title: string;
    price: string;
  }>;
}

export interface ProductPickerProps {
  /** Type of resource to pick */
  mode: "product" | "collection" | "variant";
  /** Single or multiple selection */
  selectionType?: "single" | "multiple";
  /** Currently selected IDs (Shopify GIDs) */
  selectedIds?: string[];
  /** Callback when selection changes */
  onSelect: (selections: ProductPickerSelection[]) => void;
  /** Button label override */
  buttonLabel?: string;
  /** Show selected products/collections */
  showSelected?: boolean;
  /** Error message */
  error?: string;
}

export function ProductPicker({
  mode,
  selectionType = "single",
  selectedIds = [],
  onSelect,
  buttonLabel,
  showSelected = true,
  error,
}: ProductPickerProps) {
  const shopify = useAppBridge();
  const [isLoading, setIsLoading] = useState(false);
  const [selections, setSelections] = useState<ProductPickerSelection[]>([]);

  const openPicker = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use App Bridge resource picker
      // Note: This uses the new App Bridge intents API for resource selection
      const resource = mode === "product" || mode === "variant" ? "Product" : "Collection";
      
      // Invoke the picker intent
      const intentOptions: Record<string, any> = {
        multiple: selectionType === "multiple",
      };
      if (selectedIds.length > 0) {
        intentOptions.value = selectionType === "single" ? selectedIds[0] : selectedIds;
      }
      const result = await shopify.intents.invoke?.("select:shopify/" + resource, intentOptions);

      if (result && Array.isArray(result)) {
        const newSelections: ProductPickerSelection[] = result.map((item: any) => ({
          id: item.id,
          title: item.title,
          handle: item.handle,
          images: item.images?.edges?.map((edge: any) => ({
            originalSrc: edge.node.originalSrc || edge.node.url,
            altText: edge.node.altText,
          })),
          variants: item.variants?.edges?.map((edge: any) => ({
            id: edge.node.id,
            title: edge.node.title,
            price: edge.node.price,
          })),
        }));

        setSelections(newSelections);
        onSelect(newSelections);
      }
    } catch (err) {
      console.error("ProductPicker error:", err);
      // User cancelled or error occurred
    } finally {
      setIsLoading(false);
    }
  }, [shopify, mode, selectionType, selectedIds, onSelect]);

  const removeSelection = useCallback(
    (idToRemove: string) => {
      const updated = selections.filter((s) => s.id !== idToRemove);
      setSelections(updated);
      onSelect(updated);
    },
    [selections, onSelect]
  );

  const getButtonLabel = () => {
    if (buttonLabel) return buttonLabel;
    if (mode === "product") return "Select Product";
    if (mode === "collection") return "Select Collection";
    return "Select Variant";
  };

  const getIcon = () => {
    return mode === "collection" ? CollectionIcon : ProductIcon;
  };

  return (
    <BlockStack gap="200">
      <Button
        icon={getIcon()}
        onClick={openPicker}
        loading={isLoading}
        disabled={isLoading}
      >
        {getButtonLabel()}
      </Button>

      {error && (
        <Text as="p" tone="critical" variant="bodySm">
          {error}
        </Text>
      )}

      {showSelected && selections.length > 0 && (
        <Box paddingBlockStart="200">
          <BlockStack gap="200">
            <Text as="h4" variant="headingSm">
              Selected {mode === "collection" ? "Collections" : "Products"}:
            </Text>
            {selections.map((selection) => (
              <Box
                key={selection.id}
                padding="300"
                borderWidth="025"
                borderRadius="200"
                borderColor="border"
              >
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {selection.title}
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {selection.id}
                    </Text>
                    {selection.variants && selection.variants.length > 0 && (
                      <Badge tone="info">
                        {`${selection.variants.length} variant${selection.variants.length > 1 ? "s" : ""}`}
                      </Badge>
                    )}
                  </BlockStack>
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={() => removeSelection(selection.id)}
                  >
                    Remove
                  </Button>
                </InlineStack>
              </Box>
            ))}
          </BlockStack>
        </Box>
      )}
    </BlockStack>
  );
}
