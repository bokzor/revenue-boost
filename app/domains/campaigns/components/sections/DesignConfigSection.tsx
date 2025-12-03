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
import {
  Card,
  BlockStack,
  Text,
  Divider,
  Select,
  Banner,
  Button,
  RangeSlider,
} from "@shopify/polaris";
import { ColorField, FormGrid, CollapsibleSection, useCollapsibleSections } from "../form";
import type { DesignConfig, TemplateType } from "~/domains/campaigns/types/campaign";
import { type NewsletterThemeKey, resolveThemeForTemplate } from "~/config/color-presets";
import {
  BACKGROUND_PRESETS,
  getBackgroundById,
  getBackgroundUrl,
  getDefaultBackgroundForTheme,
} from "~/config/background-presets";
import { ThemePresetSelector } from "../shared/ThemePresetSelector";
import { CustomPresetSelector } from "../shared/CustomPresetSelector";
import { LayoutSelector, type LayoutOption } from "../shared/LayoutSelector";
import { MobileLayoutSelector, type MobileLayoutOption } from "../shared/MobileLayoutSelector";
import { getDesignCapabilities } from "~/domains/templates/registry/design-capabilities";
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
  /** Optional callback when mobile layout is changed - can be used to switch preview to mobile */
  onMobileLayoutChange?: () => void;
}

/**
 * Maps LayoutOption to leadCaptureLayout config (preserving existing fine-tuning)
 */
function mapLayoutOptionToConfig(
  layout: LayoutOption,
  existing?: DesignConfig["leadCaptureLayout"]
): DesignConfig["leadCaptureLayout"] {
  // Preserve existing mobile/visualSize settings when changing desktop layout
  const preservedMobile = existing?.mobile || "content-only";
  const preservedVisualSize = existing?.visualSizeDesktop || "50%";
  // Enable gradient when stacked (smooth image-to-form transition)
  const needsGradient = preservedMobile === "stacked";

  switch (layout) {
    case "split-left":
      return {
        desktop: "split-left",
        mobile: preservedMobile,
        visualSizeDesktop: preservedVisualSize,
        visualGradient: needsGradient,
      };
    case "split-right":
      return {
        desktop: "split-right",
        mobile: preservedMobile,
        visualSizeDesktop: preservedVisualSize,
        visualGradient: needsGradient,
      };
    case "hero":
      return {
        desktop: "stacked",
        mobile: "stacked",
        visualSizeDesktop: "40%",
        visualSizeMobile: "30%",
        visualGradient: true,
      };
    case "full":
      return { desktop: "overlay", mobile: "overlay", visualSizeDesktop: "100%" };
    case "minimal":
      return { desktop: "content-only", mobile: "content-only" };
  }
}

/**
 * Maps leadCaptureLayout config to LayoutOption for UI display
 */
function mapConfigToLayoutOption(config?: DesignConfig["leadCaptureLayout"]): LayoutOption {
  if (!config) return "split-left"; // Default

  switch (config.desktop) {
    case "split-left":
      return "split-left";
    case "split-right":
      return "split-right";
    case "stacked":
      return "hero";
    case "overlay":
      return "full";
    case "content-only":
      return "minimal";
    default:
      return "split-left";
  }
}

/**
 * Maps legacy imagePosition to leadCaptureLayout (for theme presets that still use it)
 */
function mapLegacyImagePositionToLayout(
  imagePosition: "left" | "right" | "top" | "bottom" | "full" | "none"
): DesignConfig["leadCaptureLayout"] {
  switch (imagePosition) {
    case "left":
      return { desktop: "split-left", mobile: "content-only", visualSizeDesktop: "50%" };
    case "right":
      return { desktop: "split-right", mobile: "content-only", visualSizeDesktop: "50%" };
    case "top":
    case "bottom":
      return {
        desktop: "stacked",
        mobile: "stacked",
        visualSizeDesktop: "40%",
        visualSizeMobile: "30%",
      };
    case "full":
      return { desktop: "overlay", mobile: "overlay", visualSizeDesktop: "100%" };
    case "none":
    default:
      return { desktop: "content-only", mobile: "content-only" };
  }
}

export function DesignConfigSection({
  design,
  errors,
  onChange,
  templateType,
  customThemePresets,
  onThemeChange,
  onCustomPresetApply,
  onMobileLayoutChange,
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

  const updateField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    onChange({ ...design, [field]: value });
  };

  const imageMode = (design.backgroundImageMode ?? "none") as DesignConfig["backgroundImageMode"];
  const selectedPresetKey = design.backgroundImagePresetKey as NewsletterThemeKey | undefined;
  const previewImageUrl = design.imageUrl;
  const currentLayout = design.leadCaptureLayout;
  const isFullBackground = currentLayout?.desktop === "overlay";
  const isMinimalLayout = currentLayout?.desktop === "content-only";

  // Handle theme selection - applies all theme colors and template-specific overrides
  const handleThemeChange = (themeKey: NewsletterThemeKey) => {
    // Resolve theme with template-specific behavior
    const resolved = resolveThemeForTemplate(
      themeKey,
      (templateType as TemplateType) ?? "NEWSLETTER"
    );

    // Apply all theme colors and template-specific image settings
    // Clear customThemePresetId when selecting a built-in theme
    onChange({
      ...design,
      theme: themeKey,
      customThemePresetId: undefined, // Clear custom theme selection

      // Colors from resolved theme
      backgroundColor: resolved.colors.backgroundColor,
      textColor: resolved.colors.textColor,
      descriptionColor: resolved.colors.descriptionColor,
      accentColor: resolved.colors.accentColor,
      buttonColor: resolved.colors.buttonColor,
      buttonTextColor: resolved.colors.buttonTextColor,
      inputBackgroundColor: resolved.colors.inputBackgroundColor,
      inputTextColor: resolved.colors.inputTextColor,
      inputBorderColor: resolved.colors.inputBorderColor,
      imageBgColor: resolved.colors.imageBgColor,
      successColor: resolved.colors.successColor,

      // Typography
      fontFamily: resolved.colors.fontFamily,
      titleFontSize: resolved.colors.titleFontSize,
      titleFontWeight: resolved.colors.titleFontWeight,
      titleTextShadow: resolved.colors.titleTextShadow,
      descriptionFontSize: resolved.colors.descriptionFontSize,
      descriptionFontWeight: resolved.colors.descriptionFontWeight,

      // Input styling
      inputBackdropFilter: resolved.colors.inputBackdropFilter,
      inputBoxShadow: resolved.colors.inputBoxShadow,

      // Template-specific background image settings
      backgroundImageMode: resolved.backgroundImageMode,
      backgroundImagePresetKey: resolved.backgroundImagePresetKey,
      backgroundImageFileId: undefined,
      imageUrl: resolved.backgroundImageUrl,
      // Map legacy defaultImagePosition to leadCaptureLayout
      leadCaptureLayout: mapLegacyImagePositionToLayout(resolved.behavior.defaultImagePosition),
      backgroundOverlayOpacity: resolved.behavior.defaultOverlayOpacity,
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

        {/* Layout Selector - Visual layout picker with fine-tuning */}
        {caps?.usesImage !== false && (
          <>
            <LayoutSelector
              title="Layout"
              helpText="Choose how the image and form are arranged"
              selected={mapConfigToLayoutOption(currentLayout)}
              onSelect={(layout) => {
                const newLayout = mapLayoutOptionToConfig(layout, currentLayout);
                updateField("leadCaptureLayout", newLayout);
              }}
            />

            {/* Fine-tuning controls - only show for layouts with visual area */}
            {currentLayout && currentLayout.desktop !== "content-only" && (
              <BlockStack gap="300">
                {/* Visual Size Slider - only for split layouts */}
                {(currentLayout.desktop === "split-left" ||
                  currentLayout.desktop === "split-right") && (
                  <RangeSlider
                    label="Image width"
                    value={parseInt(currentLayout.visualSizeDesktop || "50")}
                    min={30}
                    max={60}
                    step={5}
                    suffix={
                      <Text as="span" variant="bodySm">
                        {currentLayout.visualSizeDesktop || "50%"}
                      </Text>
                    }
                    onChange={(value) => {
                      updateField("leadCaptureLayout", {
                        ...currentLayout,
                        visualSizeDesktop: `${value}%`,
                      });
                    }}
                  />
                )}

                {/* Mobile Layout Selector */}
                {currentLayout.desktop !== "overlay" && (
                  <MobileLayoutSelector
                    selected={(currentLayout.mobile || "content-only") as MobileLayoutOption}
                    onSelect={(value) => {
                      updateField("leadCaptureLayout", {
                        ...currentLayout,
                        mobile: value,
                        // Enable gradient when stacked (smooth image-to-form transition)
                        visualGradient: value === "stacked" || currentLayout.desktop === "stacked",
                      });
                      // Switch preview to mobile mode so user can see the effect
                      onMobileLayoutChange?.();
                    }}
                    title="Mobile Layout"
                    helpText="How the popup appears on mobile devices"
                  />
                )}
              </BlockStack>
            )}
            <Divider />
          </>
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

        {/* Background - Color and optional image */}
        <CollapsibleSection
          id="background-section"
          title="Background"
          isOpen={openSections.backgroundImage}
          onToggle={() => toggle("backgroundImage")}
        >
          <BlockStack gap="400">
            {/* Background Color */}
            <ColorField
              label="Background Color"
              name="design.backgroundColor"
              value={design.backgroundColor || "#FFFFFF"}
              error={errors?.backgroundColor}
              helpText="Popup background color (supports gradients)"
              onChange={(value) => updateField("backgroundColor", value)}
            />

            {/* Background Image - Only show if template supports images and layout is not minimal */}
            {caps?.usesImage !== false && !isMinimalLayout && (
              <>
                <Divider />
                <Text as="h3" variant="headingSm">
                  Background Image
                </Text>
                <FormGrid columns={2}>
                  <Select
                    label="Preset background"
                    value={imageMode === "preset" && selectedPresetKey ? selectedPresetKey : "none"}
                    options={[
                      { label: "No preset image", value: "none" },
                      // Theme-matched backgrounds
                      ...BACKGROUND_PRESETS.filter((bg) => bg.category === "theme").map(
                        (preset) => ({
                          label: preset.name,
                          value: preset.id,
                        })
                      ),
                      // Seasonal backgrounds
                      ...BACKGROUND_PRESETS.filter((bg) => bg.category === "seasonal").map(
                        (preset) => ({
                          label: `🎄 ${preset.name}`,
                          value: preset.id,
                        })
                      ),
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

                      const bgPreset = getBackgroundById(value);
                      if (bgPreset) {
                        onChange({
                          ...design,
                          backgroundImageMode: "preset",
                          backgroundImagePresetKey: bgPreset.id,
                          backgroundImageFileId: undefined,
                          imageUrl: getBackgroundUrl(bgPreset),
                        });
                      }
                    }}
                    helpText="Use one of the built-in background images"
                  />

                  <BlockStack gap="100">
                    <Text as="span" variant="bodySm" fontWeight="medium">
                      Or upload your own
                    </Text>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleBackgroundFileChange}
                    />
                    <Button
                      onClick={handleBackgroundFileClick}
                      loading={isUploadingBackground}
                      disabled={isUploadingBackground}
                    >
                      {imageMode === "file" && previewImageUrl
                        ? "Change background image"
                        : "Upload image"}
                    </Button>
                    {uploadError && (
                      <Text as="p" variant="bodySm" tone="critical">
                        {uploadError}
                      </Text>
                    )}
                  </BlockStack>
                </FormGrid>

                {/* Overlay opacity slider - only show for full background mode */}
                {isFullBackground && previewImageUrl && (
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
                      onChange={(value) =>
                        updateField("backgroundOverlayOpacity", (value as number) / 100)
                      }
                      output
                      suffix={
                        <Text as="span" variant="bodySm">
                          %
                        </Text>
                      }
                    />
                    <Text as="p" variant="bodySm" tone="subdued">
                      Higher values make the overlay darker for better text readability
                    </Text>
                  </BlockStack>
                )}

                {previewImageUrl && (
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
              </>
            )}
          </BlockStack>
        </CollapsibleSection>

        <Divider />

        {/* Text Colors - Heading, description, accent */}
        <CollapsibleSection
          id="text-colors-section"
          title="Text Colors"
          isOpen={openSections.mainColors}
          onToggle={() => toggle("mainColors")}
        >
          <BlockStack gap="300">
            <FormGrid columns={2}>
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
