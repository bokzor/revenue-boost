/**
 * Countdown Urgency Content Configuration Section
 *
 * Form section for configuring countdown urgency popup content
 * Includes countdown-specific fields (duration, social proof) plus product upsell fields
 */

import { useState } from "react";
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
import type { CountdownUrgencyContent } from "../../types/campaign";

export interface CountdownUrgencyContentSectionProps {
  content: Partial<CountdownUrgencyContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<CountdownUrgencyContent>) => void;
}

export function CountdownUrgencyContentSection({
  content,
  errors,
  onChange,
}: CountdownUrgencyContentSectionProps) {
  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basicContent: true,
    countdownSettings: true, // Open by default - key feature
    productSelection: false,
    displayOptions: false,
    bundleDiscount: false,
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

  const updateField = useFieldUpdater(content, onChange);

  // Countdown duration options
  const countdownOptions = [
    { label: "1 minute", value: "60" },
    { label: "2 minutes", value: "120" },
    { label: "5 minutes", value: "300" },
    { label: "10 minutes", value: "600" },
    { label: "15 minutes", value: "900" },
    { label: "30 minutes", value: "1800" },
    { label: "1 hour", value: "3600" },
  ];

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Flash Deal Countdown Content
          </Text>
          <Text as="p" tone="subdued">
            Configure your time-limited offer with countdown timer.
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
                  placeholder="Flash Deal!"
                  helpText="Main headline for the offer"
                  onChange={(value) => updateField("headline", value)}
                />

                <TextField
                  label="Subheadline"
                  name="content.subheadline"
                  value={content.subheadline || ""}
                  error={errors?.subheadline}
                  placeholder="This exclusive offer expires soon"
                  helpText="Supporting text (optional)"
                  onChange={(value) => updateField("subheadline", value)}
                />
              </BlockStack>
            </Collapsible>
          </BlockStack>

          <Divider />

          {/* Countdown Settings Section */}
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("countdownSettings")}
              onKeyDown={handleKeyDown("countdownSettings")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.countdownSettings ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  ⏱️ Countdown Settings
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.countdownSettings}
              id="countdown-settings-section"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <Banner tone="info">
                  <Text as="p" variant="bodySm">
                    The countdown creates urgency. When it expires, the popup auto-closes.
                  </Text>
                </Banner>

                <Select
                  label="Countdown Duration"
                  name="content.expiresInSeconds"
                  options={countdownOptions}
                  helpText="How long until the offer expires"
                  value={(content.expiresInSeconds || 300).toString()}
                  onChange={(value) => updateField("expiresInSeconds", parseInt(value))}
                />

                <TextField
                  label="Social Proof Message"
                  name="content.socialProofMessage"
                  value={content.socialProofMessage || ""}
                  placeholder="🔥 47 people are viewing this right now"
                  helpText="Optional message to create urgency (leave empty to hide)"
                  onChange={(value) => updateField("socialProofMessage", value)}
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
                  buttonLabel="Select product to feature"
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

                <CheckboxField
                  label="Show Compare-At Price"
                  name="content.showCompareAtPrice"
                  checked={content.showCompareAtPrice !== false}
                  helpText="Show original price struck through when discounted"
                  onChange={(checked) => updateField("showCompareAtPrice", checked)}
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
                  Discount
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.bundleDiscount}
              id="bundle-discount-section"
              transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
            >
              <BlockStack gap="300">
                <FormGrid columns={2}>
                  <TextField
                    label="Discount (%)"
                    name="content.bundleDiscount"
                    value={content.bundleDiscount?.toString() ?? ""}
                    placeholder="25"
                    helpText="Discount applied when customer claims the deal"
                    onChange={(value) => updateField("bundleDiscount", (value === "" ? undefined : parseInt(value)) as number)}
                  />

                  <TextField
                    label="Discount Label"
                    name="content.bundleDiscountText"
                    value={content.bundleDiscountText || ""}
                    placeholder="Limited Time Price"
                    helpText="Text shown above the discounted price"
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
              placeholder="Claim This Deal Now"
              onChange={(value) => updateField("buttonText", value)}
            />

            <TextField
              label="Decline Button Text"
              name="content.secondaryCtaLabel"
              value={content.secondaryCtaLabel || ""}
              placeholder="No thanks"
              onChange={(value) => updateField("secondaryCtaLabel", value)}
            />
          </FormGrid>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}

