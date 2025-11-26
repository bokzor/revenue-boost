/**
 * Design Configuration Section
 *
 * Handles all design and color settings for campaigns with template-aware control gating.
 *
 * Architecture:
 * - Uses a superset DesignConfig schema that works for all templates
 * - Gates UI controls based on template capabilities (design-capabilities.ts)
 * - All tokens are persisted; unused ones are ignored by templates
 * - Switching templates preserves design values
 */

import { useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Select,
  Banner,
  Button,
  Collapsible,
  InlineStack,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";
import { ColorField, FormGrid } from "../form";
import type { DesignConfig, TemplateType } from "~/domains/campaigns/types/campaign";
import {
  NEWSLETTER_THEMES,
  themeColorsToDesignConfig,
  type NewsletterThemeKey,
  NEWSLETTER_BACKGROUND_PRESETS,
  getNewsletterBackgroundUrl,
} from "~/config/color-presets";
import { ThemePresetSelector } from "../shared/ThemePresetSelector";
import { getDesignCapabilities } from "~/domains/templates/registry/design-capabilities";
import { useShopifyFileUpload } from "~/shared/hooks/useShopifyFileUpload";

export interface DesignConfigSectionProps {
  design: Partial<DesignConfig>;
  errors?: Record<string, string>;
  onChange: (design: Partial<DesignConfig>) => void;
  templateType?: string;
  /** Optional callback invoked when a theme preset is applied */
  onThemeChange?: (themeKey: NewsletterThemeKey) => void;
}

export function DesignConfigSection({
  design,
  errors,
  onChange,
  templateType,
  onThemeChange,
}: DesignConfigSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload with scope handling
  const {
    uploadFile,
    isUploading: isUploadingBackground,
    error: uploadError,
    scopeRequired: fileScopeRequired,
    requestScope: requestFileScope,
    isRequestingScope: isRequestingFileScope,
  } = useShopifyFileUpload();

  // Collapsible section state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    backgroundImage: false,
    mainColors: false,
    buttonColors: false,
    inputColors: false,
    overlaySettings: false,
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

  // Resolve design capabilities for this template (gates which controls to show)
  const caps = templateType ? getDesignCapabilities(templateType as TemplateType) : undefined;

  // Position/Size filtering based on capabilities
  const ALL_POSITIONS = ["center", "top", "bottom", "left", "right"] as const;
  const ALL_SIZES = ["small", "medium", "large"] as const;

  const allowedPositions = caps?.supportsPosition ?? ALL_POSITIONS;
  const allowedSizes = caps?.supportsSize ?? ALL_SIZES;

  // Build filtered option lists
  const positionOptions = [
    { label: "Center", value: "center" },
    { label: "Top", value: "top" },
    { label: "Bottom", value: "bottom" },
    { label: "Left", value: "left" },
    { label: "Right", value: "right" },
  ].filter((opt) => allowedPositions.includes(opt.value as (typeof allowedPositions)[number]));

  const sizeOptions = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" },
  ].filter((opt) => allowedSizes.includes(opt.value as (typeof allowedSizes)[number]));

  const updateField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    onChange({ ...design, [field]: value });
  };

  const imageMode = (design.backgroundImageMode ?? "none") as DesignConfig["backgroundImageMode"];
  const selectedPresetKey = design.backgroundImagePresetKey as NewsletterThemeKey | undefined;
  const previewImageUrl = design.imageUrl;

  // Handle theme selection - applies all theme colors and default image
  const handleThemeChange = (themeKey: NewsletterThemeKey) => {
    const themeColors = NEWSLETTER_THEMES[themeKey];
    const designConfig = themeColorsToDesignConfig(themeColors);
    const presetUrl = getNewsletterBackgroundUrl(themeKey);

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
      backgroundImageMode: "preset",
      backgroundImagePresetKey: themeKey,
      backgroundImageFileId: undefined,
      imageUrl: presetUrl,
    });

    // Allow template-specific integrations (e.g., Spin-to-Win wheel colors)
    if (onThemeChange) {
      onThemeChange(themeKey);
    }
  };

  const handleBackgroundFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleBackgroundFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const createdFile = await uploadFile(file, `Campaign background: ${file.name}`);

      if (createdFile) {
        onChange({
          ...design,
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
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">
          Design & Colors
        </Text>
        <Text as="p" tone="subdued">
          Customize the visual appearance of your campaign
        </Text>

        {/* Info banner about gated controls */}
        {templateType && caps && (
          <Banner tone="info">
            <Text as="p" variant="bodySm">
              Some controls are hidden because this template doesn&#39;t use them. Your design
              settings are preserved and will reappear if you switch templates.
            </Text>
          </Banner>
        )}

        <Divider />

        {/* Theme Presets (Swatches) */}
        <ThemePresetSelector
          title="Theme Presets"
          helpText="Theme presets apply color tokens universally. Gradient themes are supported. Fine-tune individual colors below."
          selected={(design.theme as NewsletterThemeKey) || "modern"}
          onSelect={handleThemeChange}
        />

        <Divider />

        {/* Position & Size */}
        <FormGrid columns={2}>
          <Select
            label="Position"
            value={design.position || "center"}
            options={positionOptions}
            onChange={(value) => updateField("position", value as DesignConfig["position"])}
            helpText={
              caps?.supportsPosition ? "Position options filtered for this template" : undefined
            }
          />

          <Select
            label="Size"
            value={design.size || "medium"}
            options={sizeOptions}
            onChange={(value) => updateField("size", value as DesignConfig["size"])}
            helpText={caps?.supportsSize ? "Size options filtered for this template" : undefined}
          />
        </FormGrid>

        {/* Flash Sale specific popup size */}
        {templateType === "FLASH_SALE" && (
          <Select
            label="Popup size"
            value={design.popupSize || "wide"}
            options={[
              { label: "Compact", value: "compact" },
              { label: "Standard", value: "standard" },
              { label: "Wide", value: "wide" },
              { label: "Full width", value: "full" },
            ]}
            onChange={(value) => updateField("popupSize", value as DesignConfig["popupSize"])}
            helpText="Controls the overall footprint of the Flash Sale popup."
          />
        )}

        {/* Flash Sale specific display mode */}
        {templateType === "FLASH_SALE" && (
          <Select
            label="Display Mode"
            value={design.displayMode || "modal"}
            options={[
              { label: "Popup (modal)", value: "modal" },
              { label: "Banner (top or bottom)", value: "banner" },
            ]}
            onChange={(value) => updateField("displayMode", value as DesignConfig["displayMode"])}
            helpText="Choose whether this flash sale appears as a popup or as a top/bottom banner."
          />
        )}

        <Divider />

        {/* Image Configuration - Only show if template supports images */}
        {caps?.usesImage !== false && (
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("backgroundImage")}
              onKeyDown={handleKeyDown("backgroundImage")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.backgroundImage ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Background Image
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.backgroundImage}
              id="background-image-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
                <FormGrid columns={2}>
                  <Select
                    label="Image position"
                    value={design.imagePosition || "left"}
                    options={[
                      { label: "Left side", value: "left" },
                      { label: "Right side", value: "right" },
                      { label: "Top", value: "top" },
                      { label: "Bottom", value: "bottom" },
                      { label: "No image", value: "none" },
                    ]}
                    onChange={(value) =>
                      updateField("imagePosition", value as DesignConfig["imagePosition"])
                    }
                    helpText="Position of the background image in the popup"
                  />

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <Select
                      label="Preset background"
                      value={
                        imageMode === "preset" && selectedPresetKey ? selectedPresetKey : "none"
                      }
                      options={[
                        { label: "No preset image", value: "none" },
                        ...NEWSLETTER_BACKGROUND_PRESETS.map((preset) => ({
                          label: preset.label,
                          value: preset.key,
                        })),
                      ]}
                      onChange={(value) => {
                        if (value === "none") {
                          onChange({
                            ...design,
                            backgroundImageMode: "none",
                            backgroundImagePresetKey: undefined,
                            backgroundImageFileId: undefined,
                            imageUrl: undefined,
                          });
                          return;
                        }

                        const key = value as NewsletterThemeKey;
                        const url = getNewsletterBackgroundUrl(key);
                        onChange({
                          ...design,
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
                          loading={isUploadingBackground}
                          disabled={isUploadingBackground}
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

                {previewImageUrl && design.imagePosition !== "none" && (
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
                      Image preview:
                    </Text>
                    <div style={{ marginTop: "0.5rem", maxWidth: "200px" }}>
                      <img
                        src={previewImageUrl}
                        alt="Background preview"
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
            </Collapsible>
          </BlockStack>
        )}

        {caps?.usesImage !== false && <Divider />}

        {/* Main Colors - Always shown */}
        <BlockStack gap="300">
          <div
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
            onClick={() => toggleSection("mainColors")}
            onKeyDown={handleKeyDown("mainColors")}
          >
            <InlineStack gap="200" blockAlign="center">
              <Button
                variant="plain"
                icon={openSections.mainColors ? ChevronUpIcon : ChevronDownIcon}
              />
              <Text as="h4" variant="headingSm">
                Main Colors
              </Text>
            </InlineStack>
          </div>

          <Collapsible
            open={openSections.mainColors}
            id="main-colors-section"
            transition={{
              duration: "200ms",
              timingFunction: "ease-in-out",
            }}
          >
            <BlockStack gap="300">
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

              {/* Accent and Success - Conditionally shown */}
              <FormGrid columns={2}>
                {caps?.usesAccent !== false && (
                  <ColorField
                    label="Accent Color"
                    name="design.accentColor"
                    value={design.accentColor || "#007BFF"}
                    error={errors?.accentColor}
                    helpText="Accent and highlight color"
                    onChange={(value) => updateField("accentColor", value)}
                  />
                )}

                {caps?.usesSuccessWarning !== false && (
                  <ColorField
                    label="Success Color"
                    name="design.successColor"
                    value={design.successColor || "#10b981"}
                    error={errors?.successColor}
                    helpText="Success state color"
                    onChange={(value) => updateField("successColor", value)}
                  />
                )}
              </FormGrid>
            </BlockStack>
          </Collapsible>
        </BlockStack>

        <Divider />

        {/* Button Colors - Only show if template uses buttons */}
        {caps?.usesButtons !== false && (
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("buttonColors")}
              onKeyDown={handleKeyDown("buttonColors")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.buttonColors ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Button Colors
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.buttonColors}
              id="button-colors-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
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
            </Collapsible>
          </BlockStack>
        )}

        {caps?.usesButtons !== false && <Divider />}

        {/* Input Field Colors - Only show if template uses inputs */}
        {caps?.usesInputs !== false && (
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("inputColors")}
              onKeyDown={handleKeyDown("inputColors")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.inputColors ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Input Field Colors
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.inputColors}
              id="input-colors-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
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
            </Collapsible>
          </BlockStack>
        )}

        {caps?.usesInputs !== false && <Divider />}

        {/* Overlay Colors - Only show if template uses overlay */}
        {caps?.usesOverlay !== false && (
          <BlockStack gap="300">
            <div
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => toggleSection("overlaySettings")}
              onKeyDown={handleKeyDown("overlaySettings")}
            >
              <InlineStack gap="200" blockAlign="center">
                <Button
                  variant="plain"
                  icon={openSections.overlaySettings ? ChevronUpIcon : ChevronDownIcon}
                />
                <Text as="h4" variant="headingSm">
                  Overlay Settings
                </Text>
              </InlineStack>
            </div>

            <Collapsible
              open={openSections.overlaySettings}
              id="overlay-settings-section"
              transition={{
                duration: "200ms",
                timingFunction: "ease-in-out",
              }}
            >
              <BlockStack gap="300">
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
            </Collapsible>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
