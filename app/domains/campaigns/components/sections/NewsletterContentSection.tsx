/**
 * Newsletter Content Configuration Section
 *
 * Self-contained template-specific section for Newsletter campaigns.
 * Includes Content, Discount, and Design subsections all in one component.
 *
 * Follows Interface Segregation Principle - specific to newsletter needs
 */

import { useState } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Select,
  TextField as PolarisTextField,
  Collapsible,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { TextField, CheckboxField, FormGrid, ColorField } from "../form";
import { GenericDiscountComponent } from "../form/GenericDiscountComponent";
import type { NewsletterContentSchema, DesignConfig } from "../../types/campaign";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { NEWSLETTER_THEMES, themeColorsToDesignConfig, type NewsletterThemeKey } from "~/config/color-presets";
import { ThemePresetSelector } from "../shared/ThemePresetSelector";


export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;

export interface NewsletterContentSectionProps {
  content: Partial<NewsletterContent>;
  designConfig?: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<NewsletterContent>) => void;
  onDesignChange?: (design: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function NewsletterContentSection({
  content,
  designConfig = {},
  discountConfig,
  errors,
  onChange,
  onDesignChange,
  onDiscountChange,
}: NewsletterContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);
  const [showAdvancedDesign, setShowAdvancedDesign] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState(designConfig.imageUrl || "");

  // Design field updater
  const updateDesignField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    if (onDesignChange) {
      onDesignChange({ ...designConfig, [field]: value });
    }
  };

  // Handle theme selection - applies all theme colors and default image
  const handleThemeChange = (themeKey: NewsletterThemeKey) => {
    if (!onDesignChange) return;

    const themeColors = NEWSLETTER_THEMES[themeKey];
    const designConfigFromTheme = themeColorsToDesignConfig(themeColors);

    // Apply all theme colors and set default theme image
    onDesignChange({
      ...designConfig,
      theme: themeKey,
      backgroundColor: designConfigFromTheme.backgroundColor,
      textColor: designConfigFromTheme.textColor,
      descriptionColor: designConfigFromTheme.descriptionColor,
      accentColor: designConfigFromTheme.accentColor,
      buttonColor: designConfigFromTheme.buttonColor,
      buttonTextColor: designConfigFromTheme.buttonTextColor,
      inputBackgroundColor: designConfigFromTheme.inputBackgroundColor,
      inputTextColor: designConfigFromTheme.inputTextColor,
      inputBorderColor: designConfigFromTheme.inputBorderColor,
      imageBgColor: designConfigFromTheme.imageBgColor,
      successColor: designConfigFromTheme.successColor,
      fontFamily: designConfigFromTheme.fontFamily,
      titleFontSize: designConfigFromTheme.titleFontSize,
      titleFontWeight: designConfigFromTheme.titleFontWeight,
      titleTextShadow: designConfigFromTheme.titleTextShadow,
      descriptionFontSize: designConfigFromTheme.descriptionFontSize,
      descriptionFontWeight: designConfigFromTheme.descriptionFontWeight,
      inputBackdropFilter: designConfigFromTheme.inputBackdropFilter,
      inputBoxShadow: designConfigFromTheme.inputBoxShadow,
      imageUrl: `/newsletter-backgrounds/${themeKey}.png`,
    });
    setCustomImageUrl(`/newsletter-backgrounds/${themeKey}.png`);
  };

  const handleImageUrlChange = (value: string) => {
    setCustomImageUrl(value);
    updateDesignField("imageUrl", value || undefined);
  };

  return (
    <>
      {/* ========== CONTENT SECTION ========== */}
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              📝 Content
            </Text>
            <Text as="p" tone="subdued">
              Configure the text and messaging for your newsletter popup
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
              placeholder="Get 10% off your first order!"
              helpText="Main headline that grabs attention"
              onChange={(value) => updateField("headline", value)}
            />

            <TextField
              label="Subheadline"
              name="content.subheadline"
              value={content.subheadline || ""}
              error={errors?.subheadline}
              placeholder="Join our newsletter for exclusive deals"
              helpText="Supporting text (optional)"
              onChange={(value) => updateField("subheadline", value)}
            />

            <FormGrid columns={2}>
              <TextField
                label="Button Text"
                name="content.buttonText"
                value={content.buttonText || "Subscribe"}
                error={errors?.buttonText}
                required
                placeholder="Subscribe"
                onChange={(value) => updateField("buttonText", value)}
              />

              <TextField
                label="Email Label"
                name="content.emailLabel"
                value={content.emailLabel || ""}
                error={errors?.emailLabel}
                placeholder="Email"
                helpText="Label shown above email field"
                onChange={(value) => updateField("emailLabel", value)}
              />
            </FormGrid>

            <TextField
              label="Email Placeholder"
              name="content.emailPlaceholder"
              value={content.emailPlaceholder || "Enter your email"}
              error={errors?.emailPlaceholder}
              placeholder="Enter your email"
              helpText="Placeholder text inside email field"
              onChange={(value) => updateField("emailPlaceholder", value)}
            />

            <TextField
              label="Success Message"
              name="content.successMessage"
              value={content.successMessage || ""}
              error={errors?.successMessage}
              required
              placeholder="Thanks for subscribing!"
              helpText="Message shown after successful submission"
              onChange={(value) => updateField("successMessage", value)}
            />

            <TextField
              label="Failure Message"
              name="content.failureMessage"
              value={content.failureMessage || ""}
              error={errors?.failureMessage}
              placeholder="Something went wrong. Please try again."
              helpText="Message shown if submission fails (optional)"
              onChange={(value) => updateField("failureMessage", value)}
            />

            <FormGrid columns={2}>
              <CheckboxField
                label="Require Email"
                name="content.emailRequired"
                checked={content.emailRequired !== false}
                helpText="Make email field mandatory"
                onChange={(checked) => updateField("emailRequired", checked)}
              />

              <CheckboxField
                label="Enable Name Field"
                name="content.nameFieldEnabled"
                checked={content.nameFieldEnabled || false}
                helpText="Add an optional name field"
                onChange={(checked) => updateField("nameFieldEnabled", checked)}
              />
            </FormGrid>

            {content.nameFieldEnabled && (
              <FormGrid columns={2}>
                <CheckboxField
                  label="Require Name"
                  name="content.nameFieldRequired"
                  checked={content.nameFieldRequired || false}
                  onChange={(checked) => updateField("nameFieldRequired", checked)}
                />

                <TextField
                  label="Name Field Placeholder"
                  name="content.nameFieldPlaceholder"
                  value={content.nameFieldPlaceholder || ""}
                  placeholder="Enter your name"
                  onChange={(value) => updateField("nameFieldPlaceholder", value)}
                />
              </FormGrid>
            )}

            <CheckboxField
              label="Enable Consent Checkbox"
              name="content.consentFieldEnabled"
              checked={content.consentFieldEnabled || false}
              helpText="Add a consent checkbox (e.g., for GDPR compliance)"
              onChange={(checked) => updateField("consentFieldEnabled", checked)}
            />

            {content.consentFieldEnabled && (
              <FormGrid columns={2}>
                <CheckboxField
                  label="Require Consent"
                  name="content.consentFieldRequired"
                  checked={content.consentFieldRequired || false}
                  onChange={(checked) => updateField("consentFieldRequired", checked)}
                />

                <TextField
                  label="Consent Text"
                  name="content.consentFieldText"
                  value={content.consentFieldText || ""}
                  placeholder="I agree to receive marketing emails"
                  multiline
                  rows={2}
                  onChange={(value) => updateField("consentFieldText", value)}
                />
              </FormGrid>
            )}
          </BlockStack>
        </BlockStack>
      </Card>

      {/* ========== DISCOUNT SECTION ========== */}
      {onDiscountChange && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                💰 Discount
              </Text>
              <Text as="p" tone="subdued">
                Offer a discount incentive to encourage newsletter signups
              </Text>
            </BlockStack>

            <Divider />

            <GenericDiscountComponent
              goal="NEWSLETTER_SIGNUP"
              discountConfig={discountConfig}
              onConfigChange={onDiscountChange}
            />
          </BlockStack>
        </Card>
      )}

      {/* ========== DESIGN SECTION ========== */}
      {onDesignChange && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                🎨 Design & Colors
              </Text>
              <Text as="p" tone="subdued">
                Customize the visual appearance of your newsletter popup
              </Text>
            </BlockStack>

            <Divider />

              <BlockStack gap="400">
              {/* Theme & Layout */}
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">Theme</Text>
                <ThemePresetSelector
                  selected={(designConfig.theme as NewsletterThemeKey) || "modern"}
                  onSelect={handleThemeChange}
                />
              </BlockStack>

              <FormGrid columns={2}>
                <Select
                  label="Position"
                  value={designConfig.position || "center"}
                  options={[
                    { label: "Center", value: "center" },
                    { label: "Top", value: "top" },
                    { label: "Bottom", value: "bottom" },
                    { label: "Left", value: "left" },
                    { label: "Right", value: "right" },
                  ]}
                  onChange={(value) => updateDesignField("position", value as DesignConfig["position"])}
                />

                <Select
                  label="Size"
                  value={designConfig.size || "medium"}
                  options={[
                    { label: "Small", value: "small" },
                    { label: "Medium", value: "medium" },
                    { label: "Large", value: "large" },
                  ]}
                  onChange={(value) => updateDesignField("size", value as DesignConfig["size"])}
                />
              </FormGrid>

              {/* Main Colors - 2 column grid */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Main Colors
                </Text>

                <FormGrid columns={2}>
                  <ColorField
                    label="Background Color"
                    name="design.backgroundColor"
                    value={designConfig.backgroundColor || "#FFFFFF"}
                    error={errors?.backgroundColor}
                    helpText="Popup background color (supports gradients)"
                    onChange={(value) => updateDesignField("backgroundColor", value)}
                  />

                  <ColorField
                    label="Heading Text Color"
                    name="design.textColor"
                    value={designConfig.textColor || "#333333"}
                    error={errors?.textColor}
                    helpText="Heading and title text color"
                    onChange={(value) => updateDesignField("textColor", value)}
                  />

                  <ColorField
                    label="Description Color"
                    name="design.descriptionColor"
                    value={designConfig.descriptionColor || "#666666"}
                    error={errors?.descriptionColor}
                    helpText="Description and subheadline text color"
                    onChange={(value) => updateDesignField("descriptionColor", value)}
                  />

                  <ColorField
                    label="Accent Color"
                    name="design.accentColor"
                    value={designConfig.accentColor || "#007BFF"}
                    error={errors?.accentColor}
                    helpText="Accent and highlight color"
                    onChange={(value) => updateDesignField("accentColor", value)}
                  />

                  <ColorField
                    label="Success Color"
                    name="design.successColor"
                    value={designConfig.successColor || "#10b981"}
                    error={errors?.successColor}
                    helpText="Success state color"
                    onChange={(value) => updateDesignField("successColor", value)}
                  />
                </FormGrid>
              </BlockStack>

              {/* Button Colors - 2 column grid */}
              <BlockStack gap="300">
                <Text as="h4" variant="headingSm">
                  Button Colors
                </Text>

                <FormGrid columns={2}>
                  <ColorField
                    label="Button Background"
                    name="design.buttonColor"
                    value={designConfig.buttonColor || "#007BFF"}
                    error={errors?.buttonColor}
                    helpText="CTA button background"
                    onChange={(value) => updateDesignField("buttonColor", value)}
                  />

                  <ColorField
                    label="Button Text"
                    name="design.buttonTextColor"
                    value={designConfig.buttonTextColor || "#FFFFFF"}
                    error={errors?.buttonTextColor}
                    helpText="CTA button text color"
                    onChange={(value) => updateDesignField("buttonTextColor", value)}
                  />
                </FormGrid>
              </BlockStack>

              {/* Advanced Options - Collapsible */}
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h4" variant="headingSm">
                    Advanced Options
                  </Text>
                  <Button
                    variant="plain"
                    onClick={() => setShowAdvancedDesign(!showAdvancedDesign)}
                    icon={showAdvancedDesign ? ChevronUpIcon : ChevronDownIcon}
                  >
                    {showAdvancedDesign ? "Hide" : "Show"}
                  </Button>
                </InlineStack>

                <Collapsible
                  open={showAdvancedDesign}
                  id="advanced-design-options"
                  transition={{ duration: "200ms", timingFunction: "ease-in-out" }}
                >
                  <BlockStack gap="400">
                    {/* Input Field Colors - 2 column grid */}
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">
                        Input Field Colors
                      </Text>

                      <FormGrid columns={2}>
                        <ColorField
                          label="Input Background"
                          name="design.inputBackgroundColor"
                          value={designConfig.inputBackgroundColor || "#FFFFFF"}
                          error={errors?.inputBackgroundColor}
                          helpText="Email/form input background (supports rgba)"
                          onChange={(value) => updateDesignField("inputBackgroundColor", value)}
                        />

                        <ColorField
                          label="Input Text"
                          name="design.inputTextColor"
                          value={designConfig.inputTextColor || "#333333"}
                          error={errors?.inputTextColor}
                          helpText="Email/form input text"
                          onChange={(value) => updateDesignField("inputTextColor", value)}
                        />

                        <ColorField
                          label="Input Border"
                          name="design.inputBorderColor"
                          value={designConfig.inputBorderColor || "#D1D5DB"}
                          error={errors?.inputBorderColor}
                          helpText="Email/form input border (supports rgba)"
                          onChange={(value) => updateDesignField("inputBorderColor", value)}
                        />

                        <ColorField
                          label="Image Background Color"
                          name="design.imageBgColor"
                          value={designConfig.imageBgColor || "#F4F4F5"}
                          error={errors?.imageBgColor}
                          helpText="Background color for image placeholder (supports rgba)"
                          onChange={(value) => updateDesignField("imageBgColor", value)}
                        />
                      </FormGrid>
                    </BlockStack>

                    {/* Image Configuration */}
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">
                        Background Image
                      </Text>

                      <FormGrid columns={2}>
                        <Select
                          label="Image Position"
                          value={designConfig.imagePosition || "left"}
                          options={[
                            { label: "Left Side", value: "left" },
                            { label: "Right Side", value: "right" },
                            { label: "Top", value: "top" },
                            { label: "Bottom", value: "bottom" },
                            { label: "No Image", value: "none" },
                          ]}
                          onChange={(value) => updateDesignField("imagePosition", value as DesignConfig["imagePosition"])}
                          helpText="Position of the background image in the popup"
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <Select
                            label="Image URL"
                            value={customImageUrl || "custom"}
                            options={[
                              { label: "Custom URL (enter below)", value: "custom" },
                              { label: "Modern Theme Image", value: "/newsletter-backgrounds/modern.png" },
                              { label: "Minimal Theme Image", value: "/newsletter-backgrounds/minimal.png" },
                              { label: "Elegant Theme Image", value: "/newsletter-backgrounds/elegant.png" },
                              { label: "Bold Theme Image", value: "/newsletter-backgrounds/bold.png" },
                              { label: "Glass Theme Image", value: "/newsletter-backgrounds/glass.png" },
                              { label: "Dark Theme Image", value: "/newsletter-backgrounds/dark.png" },
                              { label: "Gradient Theme Image", value: "/newsletter-backgrounds/gradient.png" },
                              { label: "Luxury Theme Image", value: "/newsletter-backgrounds/luxury.png" },
                              { label: "Neon Theme Image", value: "/newsletter-backgrounds/neon.png" },
                              { label: "Ocean Theme Image", value: "/newsletter-backgrounds/ocean.png" },
                            ]}
                            onChange={(value) => {
                              if (value !== "custom") {
                                handleImageUrlChange(value);
                              }
                            }}
                            helpText="Select a theme image or enter a custom URL below"
                          />
                          {(!customImageUrl || customImageUrl === "custom" || !customImageUrl.startsWith("/newsletter-backgrounds/")) && (
                            <PolarisTextField
                              label="Custom Image URL"
                              value={customImageUrl === "custom" ? "" : customImageUrl}
                              onChange={handleImageUrlChange}
                              placeholder="https://example.com/image.png"
                              helpText="Enter a custom image URL"
                              autoComplete="off"
                            />
                          )}
                        </div>
                      </FormGrid>

                      {customImageUrl && designConfig.imagePosition !== "none" && (
                        <div style={{
                          marginTop: "0.5rem",
                          padding: "1rem",
                          border: "1px solid #e1e3e5",
                          borderRadius: "8px",
                          backgroundColor: "#f6f6f7"
                        }}>
                          <Text as="p" variant="bodySm" tone="subdued" fontWeight="semibold">
                            Image Preview:
                          </Text>
                          <div style={{ marginTop: "0.5rem", maxWidth: "200px" }}>
                            <img
                              src={customImageUrl}
                              alt="Newsletter background preview"
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: "4px",
                                border: "1px solid #c9cccf"
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </BlockStack>

                    {/* Overlay Settings - 2 column grid */}
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">
                        Overlay Settings
                      </Text>

                      <FormGrid columns={2}>
                        <ColorField
                          label="Overlay Color"
                          name="design.overlayColor"
                          value={designConfig.overlayColor || "#000000"}
                          error={errors?.overlayColor}
                          helpText="Background overlay color"
                          onChange={(value) => updateDesignField("overlayColor", value)}
                        />

                        <Select
                          label="Overlay Opacity"
                          value={String(designConfig.overlayOpacity || 0.5)}
                          options={[
                            { label: "0% (Transparent)", value: "0" },
                            { label: "10%", value: "0.1" },
                            { label: "20%", value: "0.2" },
                            { label: "30%", value: "0.3" },
                            { label: "40%", value: "0.4" },
                            { label: "50%", value: "0.5" },
                            { label: "60%", value: "0.6" },
                            { label: "70%", value: "0.7" },
                            { label: "80%", value: "0.8" },
                            { label: "90%", value: "0.9" },
                            { label: "100% (Opaque)", value: "1" },
                          ]}
                          onChange={(value) => updateDesignField("overlayOpacity", parseFloat(value))}
                        />
                      </FormGrid>
                    </BlockStack>
                  </BlockStack>
                </Collapsible>
              </BlockStack>
            </BlockStack>
          </BlockStack>
        </Card>
      )}
    </>
  );
}

