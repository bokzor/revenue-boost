/**
 * Newsletter Content Configuration Section
 *
 * Self-contained template-specific section for Newsletter campaigns.
 * Includes Content, Discount, and Design subsections all in one component.
 *
 * Follows Interface Segregation Principle - specific to newsletter needs
 */

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Select,
  Collapsible,
  Button,
  InlineStack,
  Banner,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { TextField, FormGrid, ColorField } from "../form";
import { FieldConfigurationSection } from "./FieldConfigurationSection";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { NewsletterContentSchema, DesignConfig } from "../../types/campaign";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import {
  NEWSLETTER_THEMES,
  themeColorsToDesignConfig,
  type NewsletterThemeKey,
  NEWSLETTER_BACKGROUND_PRESETS,
  getNewsletterBackgroundUrl,
} from "~/config/color-presets";
import { ThemePresetSelector } from "../shared/ThemePresetSelector";
import { useShopifyFileUpload } from "~/shared/hooks/useShopifyFileUpload";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload with scope handling
  const {
    uploadFile,
    isUploading,
    error: uploadError,
    scopeRequired: fileScopeRequired,
    requestScope: requestFileScope,
    isRequestingScope: isRequestingFileScope,
  } = useShopifyFileUpload();

  const imageMode = (designConfig.backgroundImageMode ??
    "none") as DesignConfig["backgroundImageMode"];
  const selectedPresetKey = designConfig.backgroundImagePresetKey as NewsletterThemeKey | undefined;
  const previewImageUrl = designConfig.imageUrl;

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
    const presetUrl = getNewsletterBackgroundUrl(themeKey);

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
      backgroundImageMode: "preset",
      backgroundImagePresetKey: themeKey,
      backgroundImageFileId: undefined,
      imageUrl: presetUrl,
    });
  };

  const handleBackgroundFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleBackgroundFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!onDesignChange) return;

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const createdFile = await uploadFile(file, `Campaign background: ${file.name}`);

      if (createdFile) {
        onDesignChange({
          ...designConfig,
          backgroundImageMode: "file",
          backgroundImageFileId: createdFile.id,
          backgroundImagePresetKey: undefined,
          imageUrl: createdFile.url,
        });
      }
    } finally {
      event.target.value = "";
    }
  };

  return (
    <>
      {/* ========== CONTENT SECTION ========== */}
      <Card data-test-id="newsletter-admin-form">
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
              data-test-id="newsletter-headline"
            />

            <TextField
              label="Subheadline"
              name="content.subheadline"
              value={content.subheadline || ""}
              error={errors?.subheadline}
              placeholder="Join our newsletter for exclusive deals"
              helpText="Supporting text (optional)"
              onChange={(value) => updateField("subheadline", value)}
              data-test-id="newsletter-subheadline"
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
                data-test-id="newsletter-button-text"
              />

              <TextField
                label="Email Label"
                name="content.emailLabel"
                value={content.emailLabel || ""}
                error={errors?.emailLabel}
                placeholder="Email"
                helpText="Label shown above email field"
                onChange={(value) => updateField("emailLabel", value)}
                data-test-id="newsletter-email-label"
              />
            </FormGrid>

            <TextField
              label="Dismiss Button Text"
              name="content.dismissLabel"
              value={content.dismissLabel || ""}
              error={errors?.dismissLabel}
              placeholder="No thanks"
              helpText="Secondary button text that closes the popup"
              onChange={(value) => updateField("dismissLabel", value)}
            />

            <TextField
              label="Email Placeholder"
              name="content.emailPlaceholder"
              value={content.emailPlaceholder || "Enter your email"}
              error={errors?.emailPlaceholder}
              placeholder="Enter your email"
              helpText="Placeholder text inside email field"
              onChange={(value) => updateField("emailPlaceholder", value)}
              data-test-id="newsletter-email-placeholder"
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
              data-test-id="newsletter-success-message"
            />

            <TextField
              label="Failure Message"
              name="content.failureMessage"
              value={content.failureMessage || ""}
              error={errors?.failureMessage}
              placeholder="Something went wrong. Please try again."
              helpText="Message shown if submission fails (optional)"
              onChange={(value) => updateField("failureMessage", value)}
              data-test-id="newsletter-failure-message"
            />

            {/* Field Configuration Section - Email, Name, GDPR */}
            <BlockStack gap="300">
              <Text as="h4" variant="headingSm">
                Field Configuration
              </Text>
              <FieldConfigurationSection
                emailRequired={content.emailRequired}
                emailLabel={content.emailLabel}
                emailPlaceholder={content.emailPlaceholder}
                nameFieldEnabled={content.nameFieldEnabled}
                nameFieldRequired={content.nameFieldRequired}
                nameFieldPlaceholder={content.nameFieldPlaceholder}
                consentFieldEnabled={content.consentFieldEnabled}
                consentFieldRequired={content.consentFieldRequired}
                consentFieldText={content.consentFieldText}
                onChange={(updates) => onChange({ ...content, ...updates })}
                errors={errors}
              />
            </BlockStack>
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

            <DiscountSection
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
                <Text as="h4" variant="headingSm">
                  Theme
                </Text>
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
                  onChange={(value) =>
                    updateDesignField("position", value as DesignConfig["position"])
                  }
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
                          onChange={(value) =>
                            updateDesignField(
                              "imagePosition",
                              value as DesignConfig["imagePosition"]
                            )
                          }
                          helpText="Position of the background image in the popup"
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <Select
                            label="Preset background"
                            value={
                              imageMode === "preset" && selectedPresetKey
                                ? selectedPresetKey
                                : "none"
                            }
                            options={[
                              { label: "No preset image", value: "none" },
                              ...NEWSLETTER_BACKGROUND_PRESETS.map((preset) => ({
                                label: preset.label,
                                value: preset.key,
                              })),
                            ]}
                            onChange={(value) => {
                              if (!onDesignChange) return;

                              if (value === "none") {
                                onDesignChange({
                                  ...designConfig,
                                  backgroundImageMode: "none",
                                  backgroundImagePresetKey: undefined,
                                  backgroundImageFileId: undefined,
                                  imageUrl: undefined,
                                });
                                return;
                              }

                              const key = value as NewsletterThemeKey;
                              const url = getNewsletterBackgroundUrl(key);
                              onDesignChange({
                                ...designConfig,
                                backgroundImageMode: "preset",
                                backgroundImagePresetKey: key,
                                backgroundImageFileId: undefined,
                                imageUrl: url,
                              });
                            }}
                            helpText="Use one of the built-in background images"
                          />

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleBackgroundFileChange}
                          />

                          {fileScopeRequired ? (
                            <Banner
                              title="Permission required"
                              tone="info"
                              action={{
                                content: isRequestingFileScope ? "Requesting..." : "Grant Access",
                                onAction: requestFileScope,
                                disabled: isRequestingFileScope,
                              }}
                            >
                              <Text as="p" variant="bodySm">
                                To upload custom images, we need permission to create files in your store.
                              </Text>
                            </Banner>
                          ) : (
                            <BlockStack gap="200">
                              <Button
                                onClick={handleBackgroundFileClick}
                                loading={isUploading}
                                disabled={isUploading}
                              >
                                {imageMode === "file" && previewImageUrl
                                  ? "Change background image"
                                  : "Upload image from your computer"}
                              </Button>
                              {uploadError && (
                                <Text as="p" variant="bodySm" tone="critical">
                                  {uploadError}
                                </Text>
                              )}
                            </BlockStack>
                          )}
                        </div>
                      </FormGrid>

                      {previewImageUrl && designConfig.imagePosition !== "none" && (
                        <div
                          style={{
                            marginTop: "0.5rem",
                            padding: "1rem",
                            border: "1px solid #e1e3e5",
                            borderRadius: "8px",
                            backgroundColor: "#f6f6f7",
                          }}
                        >
                          <Text as="p" variant="bodySm" tone="subdued" fontWeight="semibold">
                            Image Preview:
                          </Text>
                          <div style={{ marginTop: "0.5rem", maxWidth: "200px" }}>
                            <img
                              src={previewImageUrl}
                              alt="Newsletter background preview"
                              style={{
                                width: "100%",
                                height: "auto",
                                borderRadius: "4px",
                                border: "1px solid #c9cccf",
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
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
                          onChange={(value) =>
                            updateDesignField("overlayOpacity", parseFloat(value))
                          }
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
