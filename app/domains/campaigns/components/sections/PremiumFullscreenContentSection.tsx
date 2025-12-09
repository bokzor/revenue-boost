/**
 * Premium Fullscreen Content Configuration Section
 *
 * Form section for configuring premium fullscreen popup content
 * Includes features list editor, urgency messaging, and high-end display options
 */

import { useState } from "react";
import type { KeyboardEvent } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Button,
  Collapsible,
  InlineStack,
  Tag,
  TextField as PolarisTextField,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from "@shopify/polaris-icons";
import { TextField, CheckboxField, FormGrid } from "../form";
import { ProductPicker, type ProductPickerSelection } from "../form/ProductPicker";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import type { PremiumFullscreenContent } from "../../types/campaign";

export interface PremiumFullscreenContentSectionProps {
  content: Partial<PremiumFullscreenContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<PremiumFullscreenContent>) => void;
}

export function PremiumFullscreenContentSection({
  content,
  errors,
  onChange,
}: PremiumFullscreenContentSectionProps) {
  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basicContent: true,
    productSelection: false,
    features: true, // Key feature - open by default
    displayOptions: false,
    discount: false,
  });

  // New feature input state
  const [newFeature, setNewFeature] = useState("");

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleKeyDown = (section: string) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleSection(section);
    }
  };

  const updateField = useFieldUpdater(content, onChange);

  // Features management
  const features = content.features || [];

  const addFeature = () => {
    if (newFeature.trim()) {
      updateField("features", [...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    updateField("features", features.filter((_, i) => i !== index));
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFeature();
    }
  };

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Premium Fullscreen Content
          </Text>
          <Text as="p" tone="subdued">
            Configure your immersive fullscreen offer with features and urgency messaging.
          </Text>
        </BlockStack>

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
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <TextField
                  label="Headline"
                  name="content.headline"
                  value={content.headline || ""}
                  error={errors?.headline}
                  required
                  placeholder="Exclusive Offer"
                  helpText="Main headline for the offer"
                  onChange={(value) => updateField("headline", value)}
                />

                <TextField
                  label="Subheadline"
                  name="content.subheadline"
                  value={content.subheadline || ""}
                  error={errors?.subheadline}
                  placeholder="Upgrade your experience with our premium selection"
                  helpText="Supporting text (optional)"
                  onChange={(value) => updateField("subheadline", value)}
                />

                <TextField
                  label="Urgency Message"
                  name="content.urgencyMessage"
                  value={content.urgencyMessage || ""}
                  placeholder="🔥 Limited time offer - Only 3 left in stock!"
                  helpText="Creates urgency at the top of the popup (optional)"
                  onChange={(value) => updateField("urgencyMessage", value)}
                />
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Features List Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("features")}
              onKeyDown={handleKeyDown("features")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.features ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  ✨ Features List
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.features}
              id="features-section"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <Text as="p" tone="subdued" variant="bodySm">
                  Add selling points that appear with checkmarks next to the product.
                </Text>

                {/* Current features */}
                {features.length > 0 && (
                  <InlineStack gap="200" wrap>
                    {features.map((feature, index) => (
                      <Tag key={index} onRemove={() => removeFeature(index)}>
                        {feature}
                      </Tag>
                    ))}
                  </InlineStack>
                )}

                {/* Add new feature */}
                <InlineStack gap="200" blockAlign="end">
                  <div style={{ flex: 1 }}>
                    <PolarisTextField
                      label="Add feature"
                      labelHidden
                      value={newFeature}
                      onChange={setNewFeature}
                      onKeyDown={handleFeatureKeyDown}
                      placeholder="e.g., Free express shipping"
                      autoComplete="off"
                    />
                  </div>
                  <Button icon={PlusIcon} onClick={addFeature} disabled={!newFeature.trim()}>
                    Add
                  </Button>
                </InlineStack>
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
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <ProductPicker
                  mode="product"
                  selectionType="single"
                  selectedIds={content.selectedProducts || []}
                  onSelect={(selections: ProductPickerSelection[]) => {
                    const productIds = selections.map((s) => s.id);
                    updateField("selectedProducts", productIds);
                  }}
                  buttonLabel="Select premium product to feature"
                  showSelected={true}
                />
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Display Options Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("displayOptions")}
              onKeyDown={handleKeyDown("displayOptions")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.displayOptions ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Display Options
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.displayOptions}
              id="display-options-section"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
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
                    helpText="Show original price struck through"
                    onChange={(checked) => updateField("showCompareAtPrice", checked)}
                  />

                  <CheckboxField
                    label="Show Ratings"
                    name="content.showRatings"
                    checked={content.showRatings !== false}
                    helpText="Display star ratings"
                    onChange={(checked) => updateField("showRatings", checked)}
                  />
                </FormGrid>

                <CheckboxField
                  label="Show Review Count"
                  name="content.showReviewCount"
                  checked={content.showReviewCount !== false}
                  helpText="Display number of reviews"
                  onChange={(checked) => updateField("showReviewCount", checked)}
                />
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Discount Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("discount")}
              onKeyDown={handleKeyDown("discount")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.discount ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Discount
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.discount}
              id="discount-section"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <FormGrid columns={2}>
                  <TextField
                    label="Discount (%)"
                    name="content.bundleDiscount"
                    value={content.bundleDiscount?.toString() ?? ""}
                    placeholder="20"
                    helpText="Discount applied when customer claims the deal"
                    onChange={(value) => updateField("bundleDiscount", (value === "" ? undefined : parseInt(value)) as number)}
                  />

                  <TextField
                    label="Discount Label"
                    name="content.bundleDiscountText"
                    value={content.bundleDiscountText || ""}
                    placeholder="Save 20% Today"
                    helpText="Optional text shown with the discount"
                    onChange={(value) => updateField("bundleDiscountText", value)}
                  />
                </FormGrid>

                <TextField
                  label="Currency"
                  name="content.currency"
                  value={content.currency || "USD"}
                  placeholder="USD"
                  helpText="Currency code for price display"
                  onChange={(value) => updateField("currency", value.toUpperCase())}
                />
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Button Text Section */}
          <FormGrid columns={2}>
            <TextField
              label="Button Text"
              name="content.buttonText"
              value={content.buttonText || ""}
              error={errors?.buttonText}
              placeholder="Claim This Deal"
              onChange={(value) => updateField("buttonText", value)}
            />

            <TextField
              label="Decline Button Text"
              name="content.secondaryCtaLabel"
              value={content.secondaryCtaLabel || ""}
              placeholder="Maybe later"
              onChange={(value) => updateField("secondaryCtaLabel", value)}
            />
          </FormGrid>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}
