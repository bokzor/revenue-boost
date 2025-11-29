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

import { useRef, useMemo } from "react";
import type { ChangeEvent } from "react";
import { Card, BlockStack, Text, Divider, Select, Banner, Button, RangeSlider } from "@shopify/polaris";
import { ColorField, FormGrid, CollapsibleSection, useCollapsibleSections } from "../form";
import type { DesignConfig, TemplateType } from "~/domains/campaigns/types/campaign";
import {
  themeColorsToDesignConfig,
  type NewsletterThemeKey,
  NEWSLETTER_BACKGROUND_PRESETS,
  getNewsletterBackgroundUrl,
} from "~/config/color-presets";
import {
  getThemeConfigForTemplate,
  getThemeBackgroundUrl,
  type ThemeKey,
} from "~/config/theme-config";
import { ThemePresetSelector } from "../shared/ThemePresetSelector";
import { CustomPresetSelector } from "../shared/CustomPresetSelector";
import { getDesignCapabilities, type ImagePositionOption } from "~/domains/templates/registry/design-capabilities";
import { useShopifyFileUpload } from "~/shared/hooks/useShopifyFileUpload";
import type { ThemePresetInput } from "~/domains/store/types/theme-preset";
import { loadGoogleFont } from "~/shared/utils/google-fonts";

// Font family options for the typography selector
const FONT_FAMILY_OPTIONS = [
  { label: "System Default", value: "inherit" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', system-ui, sans-serif" },
  { label: "Lato", value: "Lato, system-ui, sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
  { label: "Playfair Display (Serif)", value: "'Playfair Display', Georgia, serif" },
  { label: "Merriweather (Serif)", value: "Merriweather, Georgia, serif" },
];

export interface DesignConfigSectionProps {
  design: Partial<DesignConfig>;
  errors?: Record<string, string>;
  onChange: (design: Partial<DesignConfig>) => void;
  templateType?: string;
  /** Custom theme presets from store settings */
  customThemePresets?: Array<{
    id: string;
    name: string;
    brandColor: string;
    backgroundColor: string;
    textColor: string;
    surfaceColor?: string;
    successColor?: string;
    fontFamily?: string;
  }>;
  /** Optional callback invoked when a theme preset is applied */
  onThemeChange?: (themeKey: NewsletterThemeKey) => void;
  /** Optional callback to apply wheel colors when custom preset is applied (for Spin-to-Win) */
  onCustomPresetApply?: (presetId: string, brandColor: string) => void;
}

export function DesignConfigSection({
  design,
  errors,
  onChange,
  templateType,
  customThemePresets,
  onThemeChange,
  onCustomPresetApply,
}: DesignConfigSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload
  const {
    uploadFile,
    isUploading: isUploadingBackground,
    error: uploadError,
  } = useShopifyFileUpload();

  // Collapsible section state using the new hook
  const { openSections, toggle } = useCollapsibleSections({
    backgroundImage: false,
    mainColors: false,
    typography: false,
    buttonColors: false,
    inputColors: false,
    overlaySettings: false,
  });

  // Resolve design capabilities for this template (gates which controls to show)
  const caps = templateType ? getDesignCapabilities(templateType as TemplateType) : undefined;

  // Position/Size filtering based on capabilities
  const ALL_POSITIONS = ["center", "top", "bottom", "left", "right"] as const;
  const ALL_SIZES = ["small", "medium", "large"] as const;
  const ALL_IMAGE_POSITIONS: ImagePositionOption[] = ["left", "right", "top", "bottom", "full", "none"];

  const allowedPositions = caps?.supportsPosition ?? ALL_POSITIONS;
  const allowedSizes = caps?.supportsSize ?? ALL_SIZES;
  const allowedImagePositions = caps?.supportedImagePositions ?? ALL_IMAGE_POSITIONS;

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

  // Build filtered image position options
  const imagePositionOptions = useMemo(() => {
    const allOptions = [
      { label: "Left side", value: "left" },
      { label: "Right side", value: "right" },
      { label: "Top", value: "top" },
      { label: "Bottom", value: "bottom" },
      { label: "Full background", value: "full" },
      { label: "No image", value: "none" },
    ];
    return allOptions.filter((opt) => allowedImagePositions.includes(opt.value as ImagePositionOption));
  }, [allowedImagePositions]);

  const updateField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    onChange({ ...design, [field]: value });
  };

  const imageMode = (design.backgroundImageMode ?? "none") as DesignConfig["backgroundImageMode"];
  const selectedPresetKey = design.backgroundImagePresetKey as NewsletterThemeKey | undefined;
  const previewImageUrl = design.imageUrl;
  const isFullBackground = design.imagePosition === "full";

  // Handle theme selection - applies all theme colors and template-specific overrides
  const handleThemeChange = (themeKey: NewsletterThemeKey) => {
    // Get template-specific theme configuration
    const resolvedTheme = getThemeConfigForTemplate(
      themeKey as ThemeKey,
      (templateType as TemplateType) ?? "NEWSLETTER"
    );

    // Convert base colors to design config format
    const designConfig = themeColorsToDesignConfig(resolvedTheme.colors);

    // Get the background image URL (will be undefined if template doesn't use images)
    const backgroundUrl = getThemeBackgroundUrl(
      themeKey as ThemeKey,
      (templateType as TemplateType) ?? "NEWSLETTER"
    );

    // Apply all theme colors and template-specific image settings
    // Clear customThemePresetId when selecting a built-in theme
    onChange({
      ...design,
      theme: themeKey,
      customThemePresetId: undefined, // Clear custom theme selection

      // Colors from base theme
      backgroundColor: designConfig.backgroundColor,
      textColor: designConfig.textColor,
      descriptionColor: designConfig.descriptionColor,
      accentColor: resolvedTheme.accentColorOverride ?? designConfig.accentColor,
      buttonColor: resolvedTheme.buttonColorOverride ?? designConfig.buttonColor,
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

      // Template-specific background image settings
      backgroundImageMode: resolvedTheme.backgroundImageMode,
      backgroundImagePresetKey: resolvedTheme.backgroundImagePresetKey,
      backgroundImageFileId: undefined,
      imageUrl: backgroundUrl,
      imagePosition: resolvedTheme.imagePosition,
      backgroundOverlayOpacity: resolvedTheme.backgroundOverlayOpacity,
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

        {/* Custom Theme Presets (from store settings) */}
        {customThemePresets && customThemePresets.length > 0 && (
          <>
            <CustomPresetSelector
              presets={customThemePresets as ThemePresetInput[]}
              appliedPresetId={design.customThemePresetId}
              onApplyPreset={(expandedConfig, presetId) => {
                // Apply expanded config while preserving non-color fields
                // Clear theme when selecting a custom preset
                onChange({
                  ...design,
                  ...expandedConfig,
                  theme: undefined, // Clear built-in theme selection
                  customThemePresetId: presetId, // Track the applied custom preset
                });

                // If callback provided (for Spin-to-Win wheel colors), call it
                const preset = customThemePresets.find((p) => p.id === presetId);
                if (onCustomPresetApply && preset) {
                  onCustomPresetApply(presetId, preset.brandColor);
                }
              }}
              helpText="Apply your saved brand colors"
            />
            <Divider />
          </>
        )}

        {/* Built-in Theme Presets (Swatches) */}
        <ThemePresetSelector
          title="Built-in Themes"
          helpText="Quick start themes with pre-configured colors. Fine-tune individual colors below."
          selected={design.customThemePresetId ? undefined : (design.theme as NewsletterThemeKey)}
          onSelect={handleThemeChange}
        />

        <Divider />

        {/* Position & Size - only show if at least one option is available */}
        {(positionOptions.length > 0 || sizeOptions.length > 0) && (
          <FormGrid columns={positionOptions.length > 0 && sizeOptions.length > 0 ? 2 : 1}>
            {positionOptions.length > 0 && (
              <Select
                label="Position"
                value={design.position || "center"}
                options={positionOptions}
                onChange={(value) => updateField("position", value as DesignConfig["position"])}
                helpText={
                  caps?.supportsPosition ? "Position options filtered for this template" : undefined
                }
              />
            )}

            {sizeOptions.length > 0 && (
              <Select
                label="Size"
                value={design.size || "medium"}
                options={sizeOptions}
                onChange={(value) => updateField("size", value as DesignConfig["size"])}
              />
            )}
          </FormGrid>
        )}

        {/* TODO: Add Animation selector here
         * The `animation` property exists in DesignConfigSchema (fade/slide/bounce/none)
         * and is used by PopupPortal for entry animations. Currently not exposed in UI.
         * Should be gated by template capabilities (e.g., banners might not need animation).
         * Options: fade, slide, bounce, none
         */}

        {/* Flash Sale specific popup size - only show for popup mode, not banner */}
        {templateType === "FLASH_SALE" && design.displayMode !== "banner" && (
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
        {/* Display Mode - Show for templates that support banner/popup toggle */}
        {caps?.supportsDisplayMode && (
          <Select
            label="Display Mode"
            value={design.displayMode || "popup"}
            options={[
              { label: "Popup (centered overlay)", value: "popup" },
              { label: "Banner (top or bottom)", value: "banner" },
            ]}
            onChange={(value) => updateField("displayMode", value as DesignConfig["displayMode"])}
            helpText="Choose whether this appears as a centered popup or as a top/bottom banner."
          />
        )}

        <Divider />

        {/* Image Configuration - Only show if template supports images */}
        {caps?.usesImage !== false && (
          <CollapsibleSection
            id="background-image-section"
            title="Background Image"
            isOpen={openSections.backgroundImage}
            onToggle={() => toggle("backgroundImage")}
          >
            <BlockStack gap="300">
              <FormGrid columns={2}>
                <Select
                  label="Image position"
                  value={design.imagePosition || (imagePositionOptions[0]?.value ?? "none")}
                  options={imagePositionOptions}
                  onChange={(value) =>
                    updateField("imagePosition", value as DesignConfig["imagePosition"])
                  }
                  helpText={isFullBackground
                    ? "Full background with overlay for better text readability"
                    : "Position of the background image in the popup"}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Select
                    label="Preset background"
                    value={imageMode === "preset" && selectedPresetKey ? selectedPresetKey : "none"}
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
                </div>
              </FormGrid>

              {/* Overlay opacity slider - only show for full background mode */}
              {isFullBackground && previewImageUrl && design.imagePosition !== "none" && (
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    Overlay Opacity: {Math.round((design.backgroundOverlayOpacity ?? 0.6) * 100)}%
                  </Text>
                  <RangeSlider
                    label="Overlay opacity"
                    labelHidden
                    value={(design.backgroundOverlayOpacity ?? 0.6) * 100}
                    min={0}
                    max={100}
                    step={5}
                    onChange={(value) => updateField("backgroundOverlayOpacity", (value as number) / 100)}
                    output
                    suffix={<Text as="span" variant="bodySm">%</Text>}
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Higher values make the overlay darker for better text readability
                  </Text>
                </BlockStack>
              )}

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
          </CollapsibleSection>
        )}

        {caps?.usesImage !== false && <Divider />}

        {/* Main Colors - Always shown */}
        <CollapsibleSection
          id="main-colors-section"
          title="Main Colors"
          isOpen={openSections.mainColors}
          onToggle={() => toggle("mainColors")}
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
        </CollapsibleSection>

        <Divider />

        {/* Typography Section */}
        <CollapsibleSection
          id="typography-section"
          title="Typography"
          isOpen={openSections.typography}
          onToggle={() => toggle("typography")}
        >
          <BlockStack gap="300">
            <Select
              label="Font Family"
              value={design.fontFamily || "inherit"}
              options={FONT_FAMILY_OPTIONS}
              onChange={(value) => {
                // Load the Google Font when selected
                loadGoogleFont(value);
                updateField("fontFamily", value);
              }}
              helpText="Choose a font for your popup text"
            />
          </BlockStack>
        </CollapsibleSection>

        <Divider />

        {/* Button Colors - Only show if template uses buttons */}
        {caps?.usesButtons !== false && (
          <CollapsibleSection
            id="button-colors-section"
            title="Button Colors"
            isOpen={openSections.buttonColors}
            onToggle={() => toggle("buttonColors")}
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
          </CollapsibleSection>
        )}

        {caps?.usesButtons !== false && <Divider />}

        {/* Input Field Colors - Only show if template uses inputs */}
        {caps?.usesInputs !== false && (
          <CollapsibleSection
            id="input-colors-section"
            title="Input Field Colors"
            isOpen={openSections.inputColors}
            onToggle={() => toggle("inputColors")}
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
          </CollapsibleSection>
        )}

        {caps?.usesInputs !== false && <Divider />}

        {/* Overlay Colors - Only show if template uses overlay */}
        {caps?.usesOverlay !== false && (
          <CollapsibleSection
            id="overlay-settings-section"
            title="Overlay Settings"
            isOpen={openSections.overlaySettings}
            onToggle={() => toggle("overlaySettings")}
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
          </CollapsibleSection>
        )}
      </BlockStack>
    </Card>
  );
}
