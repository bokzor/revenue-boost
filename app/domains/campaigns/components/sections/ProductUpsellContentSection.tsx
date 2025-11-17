/**
 * Product Upsell Content Configuration Section
 *
 * Form section for configuring product upsell popup content
 */

import { useEffect } from "react";
import { Card, BlockStack, Text, Divider, Select } from "@shopify/polaris";
import { TextField, CheckboxField, FormGrid } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import type { ProductUpsellContent } from "../../types/campaign";

export interface ProductUpsellContentSectionProps {
  content: Partial<ProductUpsellContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<ProductUpsellContent>) => void;
}

export function ProductUpsellContentSection({
  content,
  errors,
  onChange,
}: ProductUpsellContentSectionProps) {
  const selectionMethod: ProductUpsellContent["productSelectionMethod"] =
    content.productSelectionMethod === "ai" ||
    content.productSelectionMethod === "manual" ||
    content.productSelectionMethod === "collection"
      ? (content.productSelectionMethod as ProductUpsellContent["productSelectionMethod"])
      : "ai";

  const layout: ProductUpsellContent["layout"] =
    content.layout === "grid" || content.layout === "carousel" || content.layout === "card"
      ? (content.layout as ProductUpsellContent["layout"])
      : "grid";


  // Normalize selection method to a safe default and persist if missing/invalid
  useEffect(() => {
    if (
      content.productSelectionMethod !== selectionMethod &&
      (content.productSelectionMethod !== "ai" &&
        content.productSelectionMethod !== "manual" &&
        content.productSelectionMethod !== "collection")
    ) {
      updateField("productSelectionMethod", selectionMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.productSelectionMethod, selectionMethod]);

  // Normalize layout to a safe default and persist if missing/invalid
  useEffect(() => {
    if (
      content.layout !== layout &&
      (content.layout !== "grid" &&
        content.layout !== "carousel" &&
        content.layout !== "card")
    ) {
      updateField("layout", layout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.layout, layout]);

  const updateField = useFieldUpdater(content, onChange);

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Product Upsell Content
          </Text>
          <Text as="p" tone="subdued">
            Configure which products to show and how the upsell looks.
          </Text>
        </BlockStack>

        <Divider />

        <BlockStack gap="400">
          <TextField
            label="Headline"
            name="content.headline"
            value={content.headline || ""}
            error={errors?.headline}
            required
            placeholder="Complete Your Order & Save 15%"
            helpText="Main headline"
            onChange={(value) => updateField("headline", value)}
          />

      <TextField
        label="Subheadline"
        name="content.subheadline"
        value={content.subheadline || ""}
        error={errors?.subheadline}
        placeholder="These items pair perfectly together"
        helpText="Supporting text (optional)"
        onChange={(value) => updateField("subheadline", value)}
      />

      <h3>Product Selection</h3>

      <Select
        label="How should products be chosen?"
        name="content.productSelectionMethod"
        options={[
          { label: "Smart recommendations (default)", value: "ai" },
          { label: "Manual selection", value: "manual" },
          { label: "From a collection", value: "collection" },
        ]}
        helpText="Use recommendations by default, or specify products or a collection."
        value={selectionMethod}
        onChange={(value) =>
          updateField(
            "productSelectionMethod",
            value as ProductUpsellContent["productSelectionMethod"],
          )
        }
      />

      {selectionMethod === "manual" && (
        <TextField
          label="Product IDs (comma separated)"
          name="content.selectedProducts"
          value={(content.selectedProducts || []).join(", ")}
          placeholder="gid://shopify/Product/123, gid://shopify/Product/456"
          helpText="Enter Shopify product IDs or GIDs to feature in this upsell."
          onChange={(value) => {
            const ids = value
              .split(/[ ,]+/)
              .map((id) => id.trim())
              .filter(Boolean);
            updateField("selectedProducts", ids);
          }}
        />
      )}

      {selectionMethod === "collection" && (
        <TextField
          label="Collection ID or handle"
          name="content.selectedCollection"
          value={content.selectedCollection || ""}
          placeholder="gid://shopify/Collection/123 or collection-handle"
          helpText="Products will be pulled from this collection."
          onChange={(value) => updateField("selectedCollection", value)}
        />
      )}

      <TextField
        label="Maximum Products to Display"
        name="content.maxProducts"
        value={content.maxProducts?.toString() || "3"}
        error={errors?.maxProducts}
        placeholder="3"
        helpText="Maximum number of products to show (1-12)"
        onChange={(value) => updateField("maxProducts", parseInt(value) || 3)}
      />

      <h3>Layout & Display</h3>

      <FormGrid columns={2}>
        <Select
          label="Layout"
          name="content.layout"
          options={[
            { label: "Grid", value: "grid" },
            { label: "Carousel", value: "carousel" },
            { label: "Card", value: "card" },
          ]}
          helpText="Choose how upsell products are laid out."
          value={layout}
          onChange={(value) => updateField("layout", value as ProductUpsellContent["layout"])}
        />

        {layout === "grid" && (
          <TextField
            label="Number of Columns"
            name="content.columns"
            value={content.columns?.toString() || "2"}
            placeholder="2"
            helpText="Columns in grid layout (1-4)"
            onChange={(value) => updateField("columns", parseInt(value) || 2)}
          />
        )}
      </FormGrid>

      <FormGrid columns={2}>
        <CheckboxField
          label="Show Product Images"
          name="content.showImages"
          checked={content.showImages !== false}
          onChange={(checked) => updateField("showImages", checked)}
        />

        <CheckboxField
          label="Show Product Prices"
          name="content.showPrices"
          checked={content.showPrices !== false}
          onChange={(checked) => updateField("showPrices", checked)}
        />
      </FormGrid>

      <FormGrid columns={2}>
        <CheckboxField
          label="Show Compare-At Price"
          name="content.showCompareAtPrice"
          checked={content.showCompareAtPrice !== false}
          helpText="Show original price if discounted"
          onChange={(checked) => updateField("showCompareAtPrice", checked)}
        />

        <CheckboxField
          label="Show Ratings"
          name="content.showRatings"
          checked={content.showRatings || false}
          helpText="Display product star ratings"
          onChange={(checked) => updateField("showRatings", checked)}
        />
      </FormGrid>

      <CheckboxField
        label="Show Review Count"
        name="content.showReviewCount"
        checked={content.showReviewCount || false}
        helpText="Display number of reviews"
        onChange={(checked) => updateField("showReviewCount", checked)}
      />

      <h3>Bundle Discount</h3>

      <FormGrid columns={2}>
        <TextField
          label="Bundle Discount (%)"
          name="content.bundleDiscount"
          value={content.bundleDiscount?.toString() || "15"}
          placeholder="15"
          helpText="Percentage discount when buying together"
          onChange={(value) => updateField("bundleDiscount", parseInt(value) || 15)}
        />

        <TextField
          label="Bundle Discount Text"
          name="content.bundleDiscountText"
          value={content.bundleDiscountText || ""}
          placeholder="Save 15% when you buy together!"
          onChange={(value) => updateField("bundleDiscountText", value)}
        />
      </FormGrid>

      <TextField
        label="Currency"
        name="content.currency"
        value={content.currency || "USD"}
        placeholder="USD"
        helpText="Currency code used for price display (e.g. USD, EUR)"
        onChange={(value) => updateField("currency", value.toUpperCase())}
      />

      <h3>Behavior</h3>

      <CheckboxField
        label="Allow Multi-Select"
        name="content.multiSelect"
        checked={content.multiSelect !== false}
        helpText="Allow customers to select multiple products"
        onChange={(checked) => updateField("multiSelect", checked)}
      />

      <FormGrid columns={2}>
        <TextField
          label="Button Text"
          name="content.buttonText"
          value={content.buttonText || ""}
          error={errors?.buttonText}
          required
          placeholder="Add to Cart"
          onChange={(value) => updateField("buttonText", value)}
        />

        <TextField
          label="Secondary CTA Label"
          name="content.secondaryCtaLabel"
          value={content.secondaryCtaLabel || ""}
          placeholder="No thanks"
          helpText="Optional decline button text"
          onChange={(value) => updateField("secondaryCtaLabel", value)}
        />
      </FormGrid>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

