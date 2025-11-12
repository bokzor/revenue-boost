/**
 * Design Configuration Section
 *
 * Handles all design and color settings for campaigns.
 * This component works with the DesignConfig type and is reusable across all templates.
 */

import { Card, BlockStack, Text, Divider, FormLayout, Select, TextField, Button, InlineStack } from "@shopify/polaris";
import { ColorField, FormGrid } from "../form";
import type { DesignConfig } from "~/domains/campaigns/types/campaign";
import { NEWSLETTER_THEMES, themeColorsToDesignConfig, type NewsletterThemeKey } from "~/config/color-presets";
import { useState } from "react";

export interface DesignConfigSectionProps {
  design: Partial<DesignConfig>;
  errors?: Record<string, string>;
  onChange: (design: Partial<DesignConfig>) => void;
  templateType?: string;
}

export function DesignConfigSection({
  design,
  errors,
  onChange,
  templateType,
}: DesignConfigSectionProps) {
  const [customImageUrl, setCustomImageUrl] = useState(design.imageUrl || "");

  const updateField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    onChange({ ...design, [field]: value });
  };

  // Handle theme selection - applies all theme colors and default image
  const handleThemeChange = (themeKey: NewsletterThemeKey) => {
    const themeColors = NEWSLETTER_THEMES[themeKey];
    const designConfig = themeColorsToDesignConfig(themeColors);

    // Apply all theme colors and set default theme image
    onChange({
      ...design,
      theme: themeKey,
      backgroundColor: designConfig.backgroundColor,
      textColor: designConfig.textColor,
      descriptionColor: designConfig.descriptionColor,
      accentColor: designConfig.accentColor,
      buttonColor: designConfig.buttonColor,
      buttonTextColor: designConfig.buttonTextColor,
      inputBackgroundColor: designConfig.inputBackgroundColor,
      inputTextColor: designConfig.inputTextColor,
      inputBorderColor: designConfig.inputBorderColor,
      imageBgColor: designConfig.imageBgColor,
      successColor: designConfig.successColor,
      // Typography
      fontFamily: designConfig.fontFamily,
      titleFontSize: designConfig.titleFontSize,
      titleFontWeight: designConfig.titleFontWeight,
      titleTextShadow: designConfig.titleTextShadow,
      descriptionFontSize: designConfig.descriptionFontSize,
      descriptionFontWeight: designConfig.descriptionFontWeight,
      // Input styling
      inputBackdropFilter: designConfig.inputBackdropFilter,
      inputBoxShadow: designConfig.inputBoxShadow,
      imageUrl: `/newsletter-backgrounds/${themeKey}.png`, // Set default theme image
    });
    setCustomImageUrl(`/newsletter-backgrounds/${themeKey}.png`);
  };

  const handleImageUrlChange = (value: string) => {
    setCustomImageUrl(value);
    updateField("imageUrl", value || undefined);
  };


  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Design & Colors
        </Text>
        <Text as="p" tone="subdued">
          Customize the visual appearance of your campaign
        </Text>
        <Divider />

        {/* Theme & Layout */}
        <FormGrid columns={3}>
          <Select
            label="Theme"
            value={design.theme || "modern"}
            options={[
              { label: "Modern - Clean black & white", value: "modern" },
              { label: "Minimal - Ultra-light, subtle accents", value: "minimal" },
              { label: "Elegant - Warm yellow tones", value: "elegant" },
              { label: "Bold - Vibrant gradient", value: "bold" },
              { label: "Glass - Glassmorphism with blur", value: "glass" },
              { label: "Dark - Dark mode optimized", value: "dark" },
              { label: "Gradient - Purple gradient background", value: "gradient" },
              { label: "Luxury - Gold on black, premium feel", value: "luxury" },
              { label: "Neon - Cyberpunk glow effects", value: "neon" },
              { label: "Ocean - Fresh blue/teal palette", value: "ocean" },
            ]}
            onChange={(value) => handleThemeChange(value as NewsletterThemeKey)}
            helpText="Select a theme to automatically apply colors"
          />

          <Select
            label="Position"
            value={design.position || "center"}
            options={[
              { label: "Center", value: "center" },
              { label: "Top", value: "top" },
              { label: "Bottom", value: "bottom" },
              { label: "Left", value: "left" },
              { label: "Right", value: "right" },
            ]}
            onChange={(value) => updateField("position", value as DesignConfig["position"])}
          />

          <Select
            label="Size"
            value={design.size || "medium"}
            options={[
              { label: "Small", value: "small" },
              { label: "Medium", value: "medium" },
              { label: "Large", value: "large" },
            ]}
            onChange={(value) => updateField("size", value as DesignConfig["size"])}
          />
        </FormGrid>

        <Divider />

        {/* Image Configuration */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Background Image
          </Text>

          <FormGrid columns={2}>
            <Select
              label="Image Position"
              value={design.imagePosition || "left"}
              options={[
                { label: "Left Side", value: "left" },
                { label: "Right Side", value: "right" },
                { label: "Top", value: "top" },
                { label: "Bottom", value: "bottom" },
                { label: "No Image", value: "none" },
              ]}
              onChange={(value) => updateField("imagePosition", value as DesignConfig["imagePosition"])}
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
                <TextField
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

          {customImageUrl && design.imagePosition !== "none" && (
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

        <Divider />

        {/* Main Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Main Colors
          </Text>

          <FormGrid columns={3}>
            <ColorField
              label="Background Color"
              name="design.backgroundColor"
              value={design.backgroundColor || "#FFFFFF"}
              error={errors?.backgroundColor}
              helpText="Popup background color (supports gradients)"
              onChange={(value) => updateField("backgroundColor", value)}
            />

            <ColorField
              label="Heading Text Color"
              name="design.textColor"
              value={design.textColor || "#333333"}
              error={errors?.textColor}
              helpText="Heading and title text color"
              onChange={(value) => updateField("textColor", value)}
            />

            <ColorField
              label="Description Color"
              name="design.descriptionColor"
              value={design.descriptionColor || "#666666"}
              error={errors?.descriptionColor}
              helpText="Description and subheadline text color"
              onChange={(value) => updateField("descriptionColor", value)}
            />
          </FormGrid>

          <FormGrid columns={2}>
            <ColorField
              label="Accent Color"
              name="design.accentColor"
              value={design.accentColor || "#007BFF"}
              error={errors?.accentColor}
              helpText="Accent and highlight color"
              onChange={(value) => updateField("accentColor", value)}
            />

            <ColorField
              label="Success Color"
              name="design.successColor"
              value={design.successColor || "#10b981"}
              error={errors?.successColor}
              helpText="Success state color"
              onChange={(value) => updateField("successColor", value)}
            />
          </FormGrid>
        </BlockStack>

        <Divider />

        {/* Button Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Button Colors
          </Text>

          <FormGrid columns={2}>
            <ColorField
              label="Button Background"
              name="design.buttonColor"
              value={design.buttonColor || "#007BFF"}
              error={errors?.buttonColor}
              helpText="CTA button background"
              onChange={(value) => updateField("buttonColor", value)}
            />

            <ColorField
              label="Button Text"
              name="design.buttonTextColor"
              value={design.buttonTextColor || "#FFFFFF"}
              error={errors?.buttonTextColor}
              helpText="CTA button text color"
              onChange={(value) => updateField("buttonTextColor", value)}
            />
          </FormGrid>
        </BlockStack>

        <Divider />

        {/* Input Field Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Input Field Colors
          </Text>

          <FormGrid columns={3}>
            <ColorField
              label="Input Background"
              name="design.inputBackgroundColor"
              value={design.inputBackgroundColor || "#FFFFFF"}
              error={errors?.inputBackgroundColor}
              helpText="Email/form input background (supports rgba)"
              onChange={(value) => updateField("inputBackgroundColor", value)}
            />

            <ColorField
              label="Input Text"
              name="design.inputTextColor"
              value={design.inputTextColor || "#333333"}
              error={errors?.inputTextColor}
              helpText="Email/form input text"
              onChange={(value) => updateField("inputTextColor", value)}
            />

            <ColorField
              label="Input Border"
              name="design.inputBorderColor"
              value={design.inputBorderColor || "#D1D5DB"}
              error={errors?.inputBorderColor}
              helpText="Email/form input border (supports rgba)"
              onChange={(value) => updateField("inputBorderColor", value)}
            />
          </FormGrid>

          <FormGrid columns={1}>
            <ColorField
              label="Image Background Color"
              name="design.imageBgColor"
              value={design.imageBgColor || "#F4F4F5"}
              error={errors?.imageBgColor}
              helpText="Background color for image placeholder (supports rgba)"
              onChange={(value) => updateField("imageBgColor", value)}
            />
          </FormGrid>
        </BlockStack>

        <Divider />

        {/* Overlay Colors */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">
            Overlay Settings
          </Text>

          <FormGrid columns={2}>
            <ColorField
              label="Overlay Color"
              name="design.overlayColor"
              value={design.overlayColor || "#000000"}
              error={errors?.overlayColor}
              helpText="Background overlay color"
              onChange={(value) => updateField("overlayColor", value)}
            />

            <Select
              label="Overlay Opacity"
              value={String(design.overlayOpacity || 0.5)}
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
              onChange={(value) => updateField("overlayOpacity", parseFloat(value))}
            />
          </FormGrid>
        </BlockStack>
      </BlockStack>
    </Card>
  );
}


