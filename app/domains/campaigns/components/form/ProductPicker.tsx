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

import { useState, useCallback, useEffect, useRef } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Button, InlineStack, BlockStack, Text, Badge, Box } from "@shopify/polaris";
import { ProductIcon, CollectionIcon } from "@shopify/polaris-icons";

/**
 * Convert title to URL handle (fallback when handle not provided)
 * "Summer Sale Collection" -> "summer-sale-collection"
 */
function extractHandleFromTitle(title: string | undefined): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const [isFetchingInitial, setIsFetchingInitial] = useState(false);
  const fetchedIdsRef = useRef<string>("");

  // Fetch initial selections when selectedIds are provided
  useEffect(() => {
    const fetchInitialSelections = async () => {
      // Create a stable key from selectedIds
      const idsKey = [...selectedIds].sort().join(",");

      // Only fetch if we have selectedIds and haven't fetched these exact IDs yet
      if (selectedIds.length === 0 || fetchedIdsRef.current === idsKey) {
        return;
      }

      setIsFetchingInitial(true);
      fetchedIdsRef.current = idsKey;

      try {
        const type = mode === "collection" ? "collection" : "product";
        const idsParam = selectedIds.join(",");
        const response = await fetch(
          `/api/resources?ids=${encodeURIComponent(idsParam)}&type=${type}`
        );

        if (!response.ok) {
          console.error("Failed to fetch initial selections:", response.statusText);
          setIsFetchingInitial(false);
          return;
        }

        const data = (await response.json()) as { resources?: unknown[] };
        const resources = (data.resources || []) as Array<{
          id: string;
          title: string;
          handle?: string;
          images?: ProductPickerSelection["images"];
          variants?: ProductPickerSelection["variants"];
        }>;

        // Map API response to ProductPickerSelection format
        const initialSelections: ProductPickerSelection[] = resources.map((resource) => ({
          id: resource.id,
          title: resource.title,
          handle: resource.handle,
          images: resource.images,
          variants: resource.variants,
        }));

        setSelections(initialSelections);
      } catch (err) {
        console.error("Error fetching initial selections:", err);
      } finally {
        setIsFetchingInitial(false);
      }
    };

    fetchInitialSelections();
  }, [selectedIds, mode]);

  const openPicker = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use App Home Resource Picker API (not intents) for selecting Shopify resources
      const type =
        mode === "product" ? "product" : mode === "collection" ? "collection" : "variant";

      // Prepare preselected ids if provided
      const selectionIds = selectedIds.length > 0 ? selectedIds.map((id) => ({ id })) : undefined;

      const selected = await shopify.resourcePicker({
        type,
        multiple: selectionType === "multiple",
        ...(selectionIds ? { selectionIds } : {}),
      });

      if (selected && Array.isArray(selected)) {
        // Log raw selection for debugging
        console.log("[ProductPicker] Raw selection:", JSON.stringify(selected, null, 2));

        const newSelections: ProductPickerSelection[] = (
          selected as unknown as Array<Record<string, unknown>>
        ).map((item) => {
          // Extract handle - Shopify Resource Picker returns it at root level
          const handle = (item.handle as string) || "";

          // If no handle, try to extract from ID (gid://shopify/Collection/123456789)
          // Note: This is a fallback - ideally we fetch the handle from the API
          const fallbackHandle = handle || extractHandleFromTitle(item.title as string);

          const base: ProductPickerSelection = {
            id: item.id as string,
            title:
              (item.title as string) ||
              (item.displayName as string) ||
              fallbackHandle ||
              "Untitled",
            handle: handle || fallbackHandle,
          };

          console.log("[ProductPicker] Processed item:", { id: base.id, title: base.title, handle: base.handle });

          // Normalize images (supports Resource Picker payload or GraphQL edges)
          const images = Array.isArray(item.images)
            ? (item.images as Array<Record<string, unknown>>).map((img) => ({
                originalSrc: (img.originalSrc as string) || (img.url as string),
                altText: img.altText as string,
              }))
            : item.image
              ? [
                  {
                    originalSrc:
                      ((item.image as Record<string, unknown>).originalSrc as string) ||
                      ((item.image as Record<string, unknown>).url as string),
                    altText: (item.image as Record<string, unknown>).altText as string,
                  },
                ]
              : (item.images as Record<string, unknown>)?.edges
                ? (
                    (item.images as Record<string, unknown>).edges as Array<Record<string, unknown>>
                  ).map((edge) => ({
                    originalSrc:
                      ((edge.node as Record<string, unknown>).originalSrc as string) ||
                      ((edge.node as Record<string, unknown>).url as string),
                    altText: (edge.node as Record<string, unknown>).altText as string,
                  }))
                : undefined;

          // Normalize variants (supports Resource Picker payload or GraphQL edges)
          const variants = Array.isArray(item.variants)
            ? (item.variants as Array<Record<string, unknown>>).filter(Boolean).map((v) => ({
                id: v.id as string,
                title: (v.title as string) || (v.displayName as string),
                // Price in Resource Picker is Money (string); fallback to nested forms if present
                price:
                  typeof v.price === "string"
                    ? v.price
                    : ((v.price as Record<string, unknown>)?.amount as string) ||
                      (v.price as string),
              }))
            : (item.variants as Record<string, unknown>)?.edges
              ? (
                  (item.variants as Record<string, unknown>).edges as Array<Record<string, unknown>>
                ).map((edge) => ({
                  id: (edge.node as Record<string, unknown>).id as string,
                  title: (edge.node as Record<string, unknown>).title as string,
                  price: (edge.node as Record<string, unknown>).price as string,
                }))
              : undefined;

          return {
            ...base,
            ...(images ? { images } : {}),
            ...(variants ? { variants } : {}),
          };
        });

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

  const isLoadingAny = isLoading || isFetchingInitial;

  // Show count indicator when we have selectedIds but haven't loaded details yet
  const showLoadingIndicator = isFetchingInitial && selectedIds.length > 0 && selections.length === 0;

  return (
    <BlockStack gap="200">
      <InlineStack gap="300" blockAlign="center">
        <Button icon={getIcon()} onClick={openPicker} loading={isLoadingAny} disabled={isLoadingAny}>
          {getButtonLabel()}
        </Button>
        {!isFetchingInitial && selectedIds.length > 0 && (
          <Badge tone="info">
            {`${selectedIds.length} ${mode === "collection" ? (selectedIds.length === 1 ? "collection" : "collections") : (selectedIds.length === 1 ? "product" : "products")} selected`}
          </Badge>
        )}
      </InlineStack>

      {showLoadingIndicator && (
        <Box paddingBlockStart="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Loading {selectedIds.length} selected {mode === "collection" ? (selectedIds.length === 1 ? "collection" : "collections") : (selectedIds.length === 1 ? "product" : "products")}...
          </Text>
        </Box>
      )}

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
