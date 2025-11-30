/**
 * Product Upsell Content Configuration Section
 *
 * Form section for configuring product upsell popup content
 * Organized into collapsible sections for better UX
 */

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Select,
  Button,
  Collapsible,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { TextField, CheckboxField, FormGrid } from "../form";
import { ProductPicker, type ProductPickerSelection } from "../form/ProductPicker";
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
  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basicContent: true, // Basic content open by default for first-time setup
    productSelection: false,
    layoutDisplay: false,
    bundleDiscount: false,
    behavior: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleKeyDown = (section: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSection(section);
    }
  };

  const selectionMethod: ProductUpsellContent["productSelectionMethod"] =
    content.productSelectionMethod === "ai" ||
    content.productSelectionMethod === "manual" ||
    content.productSelectionMethod === "collection"
      ? (content.productSelectionMethod as ProductUpsellContent["productSelectionMethod"])
      : "ai";

  // Valid layout options
  const validLayouts = ["grid", "card", "carousel", "featured", "stack"] as const;
  const layout: ProductUpsellContent["layout"] =
    validLayouts.includes(content.layout as typeof validLayouts[number])
      ? (content.layout as ProductUpsellContent["layout"])
      : "grid";

  // Normalize selection method to a safe default and persist if missing/invalid
  useEffect(() => {
    if (
      content.productSelectionMethod !== selectionMethod &&
      content.productSelectionMethod !== "ai" &&
      content.productSelectionMethod !== "manual" &&
      content.productSelectionMethod !== "collection"
    ) {
      updateField("productSelectionMethod", selectionMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.productSelectionMethod, selectionMethod]);

  // Normalize layout to a safe default and persist if missing/invalid
  useEffect(() => {
    if (
      content.layout !== layout &&
      !validLayouts.includes(content.layout as typeof validLayouts[number])
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

        {/* Informational Banner about Trigger Products */}
        <Banner tone="info">
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd">
              <strong>Tip:</strong> The products selected below are the{" "}
              <strong>suggested products</strong> (what you want to upsell).
            </Text>
            <Text as="p" variant="bodyMd">
              To show this upsell only when{" "}
              <strong>specific products are added to cart or viewed</strong> (trigger products),
              configure them in the <strong>Targeting &amp; Triggers</strong> step:
            </Text>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                • For &ldquo;Post-Add Upsell&rdquo;: Enable <strong>Add to Cart</strong> trigger and
                select trigger products
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                • For &ldquo;Product Page Cross-Sell&rdquo;: Enable <strong>Product View</strong>{" "}
                trigger and select trigger products
              </Text>
            </BlockStack>
          </BlockStack>
        </Banner>

        <Divider />

        <BlockStack gap="400">
          {/* Basic Content Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("basicContent")}
              onKeyDown={handleKeyDown("basicContent")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.basicContent ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Basic Content
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.basicContent}
              id="basic-content-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
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
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Product Selection Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("productSelection")}
              onKeyDown={handleKeyDown("productSelection")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.productSelection ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Product Selection
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.productSelection}
              id="product-selection-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
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
                      value as ProductUpsellContent["productSelectionMethod"]
                    )
                  }
                />

                {selectionMethod === "manual" && (
                  <ProductPicker
                    mode="product"
                    selectionType="multiple"
                    selectedIds={content.selectedProducts || []}
                    onSelect={(selections: ProductPickerSelection[]) => {
                      const productIds = selections.map((s) => s.id);
                      updateField("selectedProducts", productIds);
                    }}
                    buttonLabel="Select products to feature"
                    showSelected={true}
                  />
                )}

                {selectionMethod === "collection" && (
                  <ProductPicker
                    mode="collection"
                    selectionType="single"
                    selectedIds={content.selectedCollection ? [content.selectedCollection] : []}
                    onSelect={(selections: ProductPickerSelection[]) => {
                      const collectionId = selections[0]?.id || "";
                      updateField("selectedCollection", collectionId);
                    }}
                    buttonLabel="Select collection"
                    showSelected={true}
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
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Layout & Display Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("layoutDisplay")}
              onKeyDown={handleKeyDown("layoutDisplay")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.layoutDisplay ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Layout & Display
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.layoutDisplay}
              id="layout-display-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
                <FormGrid columns={2}>
                  <Select
                    label="Layout"
                    name="content.layout"
                    options={[
                      { label: "Grid", value: "grid" },
                      { label: "List", value: "card" },
                      { label: "Carousel", value: "carousel" },
                      { label: "Featured + Grid", value: "featured" },
                      { label: "Stack", value: "stack" },
                    ]}
                    helpText={
                      layout === "carousel"
                        ? "One product at a time with swipe navigation - great for mobile"
                        : layout === "featured"
                          ? "First product highlighted as hero, others in smaller grid"
                          : layout === "stack"
                            ? "Overlapping cards - interactive and fun"
                            : "Choose how upsell products are laid out"
                    }
                    value={layout}
                    onChange={(value) =>
                      updateField("layout", value as ProductUpsellContent["layout"])
                    }
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
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Bundle Discount Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("bundleDiscount")}
              onKeyDown={handleKeyDown("bundleDiscount")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.bundleDiscount ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Bundle Discount
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.bundleDiscount}
              id="bundle-discount-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="400">
                <Banner tone="info">
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">
                      <strong>How Bundle Discounts Work:</strong>
                    </Text>
                    <Text as="p" variant="bodySm">
                      The bundle discount is automatically applied to <strong>any products the customer selects</strong> from the upsell popup.
                      The discount only applies to the upsell items, not the entire cart.
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      ✨ No additional discount configuration needed – the bundle discount is auto-created when customers add items.
                    </Text>
                  </BlockStack>
                </Banner>

                <FormGrid columns={2}>
                  <TextField
                    label="Bundle Discount (%)"
                    name="content.bundleDiscount"
                    value={content.bundleDiscount?.toString() || "15"}
                    placeholder="15"
                    helpText="Discount applied to selected upsell products"
                    onChange={(value) => updateField("bundleDiscount", parseInt(value) || 15)}
                  />

                  <TextField
                    label="Bundle Discount Text"
                    name="content.bundleDiscountText"
                    value={content.bundleDiscountText || ""}
                    placeholder="Save 15% on selected items!"
                    helpText="Promotional text shown to customers"
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
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Behavior Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("behavior")}
              onKeyDown={handleKeyDown("behavior")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.behavior ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Behavior & Actions
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.behavior}
              id="behavior-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
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
            </Collapsible>
          </BlockStack>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
