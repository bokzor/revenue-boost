/**
 * Enhanced Color Customization Panel - Comprehensive color system
 *
 * Features:
 * - Full color palette customization
 * - Template-specific color options
 * - Color presets and themes
 * - Brand color integration
 * - Color harmony generation
 * - Real-time accessibility checking
 * - Advanced color picker interface
 */

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Button,
  Box,
  Tooltip,
  Banner,
  Badge,
  Tabs,
  Collapsible,
  Icon,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon, ColorIcon } from "@shopify/polaris-icons";
import styles from "./ColorCustomizationPanel.module.css";

// Import our enhanced types and utilities
import type {
  ExtendedColorConfig,
  ColorCustomizationProps,
  BrandColorConfig,
  ColorChangeEvent,
  ColorPresetAppliedEvent,
} from "~/domains/popups/color-customization.types";
import { validateColors, isValidHexColor } from "~/shared/utils/color-utilities";
import { getColorPresetsForTemplate, getPopularColorPresets } from "~/config/color-presets";

// Legacy interface for backward compatibility
export interface ColorConfig {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor?: string;
}

export interface ColorCustomizationPanelProps extends Partial<ColorCustomizationProps> {
  /**
   * Current color configuration (legacy support)
   */
  colors: ColorConfig | ExtendedColorConfig;

  /**
   * Callback when colors change (legacy support)
   */
  onChange: (colors: ColorConfig | ExtendedColorConfig) => void;

  /**
   * Brand color presets (legacy support)
   */
  legacyBrandColors?: string[];

  /**
   * Show contrast checker (legacy support)
   */
  showContrastChecker?: boolean;

  /**
   * Template type for specific customizations
   */
  templateType?: string;

  /**
   * Brand color configuration
   */
  brandColors?: BrandColorConfig;

  /**
   * Show advanced color options
   */
  showAdvanced?: boolean;

  /**
   * Enable real-time preview updates
   */
  enablePreview?: boolean;

  /**
   * Callback when individual color changes
   */
  onColorChange?: (event: ColorChangeEvent) => void;

  /**
   * Callback when color preset is applied
   */
  onPresetApplied?: (event: ColorPresetAppliedEvent) => void;
}

// Default brand color presets (legacy support)
const DEFAULT_BRAND_COLORS = [
  "#008060", // Shopify green
  "#5C6AC4", // Shopify purple
  "#007BFF", // Blue
  "#28A745", // Green
  "#DC3545", // Red
  "#FFC107", // Yellow
  "#6C757D", // Gray
  "#000000", // Black
];

// Color property groups for organization
const COLOR_PROPERTY_GROUPS = {
  basic: {
    title: "Basic Colors",
    description: "Essential colors that all templates need",
    properties: ["backgroundColor", "textColor", "buttonColor", "buttonTextColor"] as const,
    icon: ColorIcon,
  },
  accent: {
    title: "Accent Colors",
    description: "Secondary colors for highlights and accents",
    properties: ["accentColor", "secondaryColor", "linkColor", "borderColor"] as const,
    icon: ColorIcon,
  },
  forms: {
    title: "Form Elements",
    description: "Colors for input fields and form elements",
    properties: [
      "inputBackgroundColor",
      "inputBorderColor",
      "inputTextColor",
      "inputFocusColor",
    ] as const,
    icon: ColorIcon,
  },
  feedback: {
    title: "Status & Feedback",
    description: "Colors for success, error, and warning states",
    properties: ["successColor", "errorColor", "warningColor", "infoColor"] as const,
    icon: ColorIcon,
  },
} as const;

// Template-specific color groups
const TEMPLATE_SPECIFIC_GROUPS = {
  newsletter: {
    ...COLOR_PROPERTY_GROUPS,
    newsletter: {
      title: "Newsletter Specific",
      description: "Colors specific to newsletter templates",
      properties: ["successIconColor", "consentTextColor"] as const,
      icon: ColorIcon,
    },
  },
  sales: {
    ...COLOR_PROPERTY_GROUPS,
    sales: {
      title: "Sales & Urgency",
      description: "Colors for sales templates and urgency indicators",
      properties: [
        "urgencyTextColor",
        "discountHighlightColor",
        "priceTextColor",
        "timerColor",
      ] as const,
      icon: ColorIcon,
    },
  },
  "exit-intent": {
    ...COLOR_PROPERTY_GROUPS,
    "exit-intent": {
      title: "Exit Intent",
      description: "Colors for exit-intent specific elements",
      properties: ["urgencyIndicatorColor", "lastChanceTextColor"] as const,
      icon: ColorIcon,
    },
  },
  "product-recommendation": {
    ...COLOR_PROPERTY_GROUPS,
    "product-recommendation": {
      title: "Product Display",
      description: "Colors for product recommendation elements",
      properties: [
        "productCardBackgroundColor",
        "productTitleColor",
        "productPriceColor",
        "addToCartButtonColor",
      ] as const,
      icon: ColorIcon,
    },
  },
  announcement: {
    ...COLOR_PROPERTY_GROUPS,
    announcement: {
      title: "Announcement",
      description: "Colors for announcement elements",
      properties: ["announcementBannerColor", "highlightTextColor"] as const,
      icon: ColorIcon,
    },
  },
  "social-proof": {
    ...COLOR_PROPERTY_GROUPS,
    "social-proof": {
      title: "Social Proof",
      description: "Colors for social proof elements",
      properties: [
        "notificationBackgroundColor",
        "customerNameColor",
        "productNameColor",
        "timestampColor",
      ] as const,
      icon: ColorIcon,
    },
  },
};

// Human-readable property labels
const PROPERTY_LABELS: Record<string, string> = {
  backgroundColor: "Background",
  textColor: "Text",
  buttonColor: "Button Background",
  buttonTextColor: "Button Text",
  accentColor: "Accent",
  secondaryColor: "Secondary",
  linkColor: "Links",
  borderColor: "Borders",
  inputBackgroundColor: "Input Background",
  inputBorderColor: "Input Border",
  inputTextColor: "Input Text",
  inputFocusColor: "Input Focus",
  successColor: "Success",
  errorColor: "Error",
  warningColor: "Warning",
  infoColor: "Info",
  urgencyTextColor: "Urgency Text",
  discountHighlightColor: "Discount Highlight",
  priceTextColor: "Price Text",
  timerColor: "Timer",
  urgencyIndicatorColor: "Urgency Indicator",
  lastChanceTextColor: "Last Chance Text",
  productCardBackgroundColor: "Product Card Background",
  productTitleColor: "Product Title",
  productPriceColor: "Product Price",
  addToCartButtonColor: "Add to Cart Button",
  announcementBannerColor: "Announcement Banner",
  highlightTextColor: "Highlight Text",
  notificationBackgroundColor: "Notification Background",
  customerNameColor: "Customer Name",
  productNameColor: "Product Name",
  timestampColor: "Timestamp",
  successIconColor: "Success Icon",
  consentTextColor: "Consent Text",
};

export function ColorCustomizationPanel({
  colors,
  onChange,
  legacyBrandColors = DEFAULT_BRAND_COLORS,
  showContrastChecker = true,
  templateType = "newsletter",
  brandColors,
  showAdvanced = false,
  enablePreview: _enablePreview = true,
  onColorChange,
  onPresetApplied,
}: ColorCustomizationPanelProps) {
  // State management
  void _enablePreview; // legacy flag kept for compatibility
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);
  const [_selectedColorGroup] = useState<string>("basic");
  void _selectedColorGroup;
  const [colorHarmonyBase, setColorHarmonyBase] = useState<string>(colors.buttonColor);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Memoized calculations
  const extendedColors = useMemo((): ExtendedColorConfig => {
    // Convert legacy ColorConfig to ExtendedColorConfig if needed
    if ("accentColor" in colors && typeof colors.accentColor === "string") {
      return colors as ExtendedColorConfig;
    }

    return {
      backgroundColor: colors.backgroundColor,
      textColor: colors.textColor,
      buttonColor: colors.buttonColor,
      buttonTextColor: colors.buttonTextColor,
      accentColor: colors.accentColor,
      overlayOpacity: 0.6,
    };
  }, [colors]);

  const validation = useMemo(() => validateColors(extendedColors), [extendedColors]);
  const colorPresets = useMemo(() => getColorPresetsForTemplate(templateType), [templateType]);
  const popularPresets = useMemo(() => getPopularColorPresets(), []);
  const propertyGroups = useMemo(
    () => (TEMPLATE_SPECIFIC_GROUPS as Partial<Record<string, typeof COLOR_PROPERTY_GROUPS[number]>>)[templateType as string] || COLOR_PROPERTY_GROUPS,
    [templateType]
  );

  // Brand color suggestions
  const brandSuggestions = useMemo(() => {
    if (!brandColors) return null;
    // TODO: Implement generateBrandColorSuggestions function
    return null;
  }, [brandColors]);

  // Color harmony generation
  const colorHarmony = useMemo(() => {
    if (!colorHarmonyBase) return [];
    // TODO: Implement generateColorHarmony function
    return [];
  }, [colorHarmonyBase]);

  // Event handlers
  const handleColorChange = useCallback(
    (field: keyof ExtendedColorConfig, value: string) => {
      // Validate hex color
      if (value && !isValidHexColor(value)) {
        return;
      }

      const previousValue = extendedColors[field] as string;
      const updatedColors = {
        ...extendedColors,
        [field]: value,
      };

      onChange(updatedColors);

      // Add to recent colors
      if (value && !recentColors.includes(value)) {
        setRecentColors((prev) => [value, ...prev].slice(0, 12));
      }

      // Fire color change event
      if (onColorChange) {
        onColorChange({
          property: field,
          value,
          previousValue,
          source: "picker",
        });
      }
    },
    [extendedColors, onChange, recentColors, onColorChange]
  );

  const handlePresetClick = useCallback(
    (preset: import("~/domains/popups/color-customization.types").ColorPreset) => {
      onChange(preset.colors);
      setSelectedPreset(preset.id);

      // Fire preset applied event
      if (onPresetApplied) {
        onPresetApplied({
          presetName: preset.name,
          colors: preset.colors,
        });
      }
    },
    [onChange, onPresetApplied]
  );

  const handleSwatchClick = useCallback(
    (field: keyof ExtendedColorConfig, color: string) => {
      handleColorChange(field, color);
    },
    [handleColorChange]
  );

  const handleBrandSuggestionApply = useCallback(() => {
    if (brandSuggestions) {
      onChange(brandSuggestions);
      if (onColorChange) {
        Object.entries(brandSuggestions).forEach(([key, value]) => {
          if (typeof value === "string") {
            onColorChange({
              property: key as keyof ExtendedColorConfig,
              value,
              previousValue: (extendedColors[key as keyof ExtendedColorConfig] as string) || "",
              source: "brand",
            });
          }
        });
      }
    }
  }, [brandSuggestions, onChange, onColorChange, extendedColors]);

  // Helper functions
  const renderColorSwatch = useCallback((color: string, onClick: () => void, tooltip?: string) => {
    const content = (
      <button
        className={styles.colorSwatch}
        style={{ backgroundColor: color }}
        onClick={onClick}
        aria-label={tooltip || `Set color to ${color}`}
      />
    );

    return tooltip ? <Tooltip content={tooltip}>{content}</Tooltip> : content;
  }, []);

  const renderColorInput = useCallback(
    (field: keyof ExtendedColorConfig, label: string) => {
      const value = (extendedColors[field] as string) || "";
      const isValid = !value || isValidHexColor(value);

      return (
        <Box key={field}>
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {label}
            </Text>
            <InlineStack gap="200" blockAlign="center">
              <button
                type="button"
                className={styles.colorPreview}
                style={{ backgroundColor: value || "#FFFFFF" }}
                onClick={() => {
                  const input = document.getElementById(
                    `color-input-${String(field)}`
                  ) as HTMLInputElement;
                  input?.click();
                }}
                aria-label={`Pick ${label}`}
              />
              <TextField
                id={`color-input-${String(field)}`}
                label=""
                labelHidden
                type="text"
                value={value}
                onChange={(newValue) => handleColorChange(field, newValue)}
                placeholder="#000000"
                autoComplete="off"
                maxLength={7}
                error={!isValid ? "Please enter a valid hex color" : undefined}
              />
            </InlineStack>

            {/* Brand color swatches */}
            <InlineStack gap="100" wrap>
              {legacyBrandColors.map((color) =>
                renderColorSwatch(color, () => handleSwatchClick(field, color), `Apply ${color}`)
              )}
              {/* Color harmony suggestions */}
              {colorHarmony
                .slice(0, 4)
                .map((color) =>
                  renderColorSwatch(
                    color,
                    () => handleSwatchClick(field, color),
                    `Harmony color: ${color}`
                  )
                )}
            </InlineStack>
          </BlockStack>
        </Box>
      );
    },
    [
      extendedColors,
      handleColorChange,
      handleSwatchClick,
      legacyBrandColors,
      colorHarmony,
      renderColorSwatch,
    ]
  );

  const renderColorGroup = useCallback(
    (groupKey: string, group: {
      icon?: IconProps["source"];
      title: string;
      description?: string;
      properties: Array<keyof ExtendedColorConfig>;
    }) => {
      return (
        <Card key={groupKey}>
          <BlockStack gap="300">
            <Box>
              <InlineStack gap="200" blockAlign="center">
                {group.icon && <Icon source={group.icon} />}
                <Text as="h4" variant="headingSm">
                  {group.title}
                </Text>
              </InlineStack>
              <Box paddingBlockStart="100">
                <Text as="p" variant="bodySm" tone="subdued">
                  {group.description}
                </Text>
              </Box>
            </Box>

            <BlockStack gap="400">
              {group.properties.map((property: keyof ExtendedColorConfig) =>
                renderColorInput(
                  property,
                  PROPERTY_LABELS[property as string] || (property as string)
                )
              )}
            </BlockStack>
          </BlockStack>
        </Card>
      );
    },
    [renderColorInput]
  );

  const renderPresetCard = useCallback(
    (preset: import("~/domains/popups/color-customization.types").ColorPreset) => {
      const isSelected = selectedPreset === preset.id;

      return (
        <button
          type="button"
          key={preset.id}
          className={`${styles.presetCard} ${isSelected ? styles.selected : ""}`}
          onClick={() => handlePresetClick(preset)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handlePresetClick(preset);
            }
          }}
        >
          {isSelected && <div className={styles.selectedBadge}>✓</div>}

          <div
            className={styles.presetPreview}
            style={{ backgroundColor: preset.colors.backgroundColor }}
          >
            <div className={styles.presetContent} style={{ color: preset.colors.textColor }}>
              <div className={styles.presetTitle}>Sample Title</div>
              <div className={styles.presetDescription}>Description text here</div>
              <div
                className={styles.presetButton}
                style={{
                  backgroundColor: preset.colors.buttonColor,
                  color: preset.colors.buttonTextColor,
                }}
              >
                Button
              </div>
            </div>
          </div>

          <div className={styles.presetInfo}>
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {preset.name}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {preset.description}
            </Text>
            {preset.isPopular && (
              <Badge tone="success" size="small">
                Popular
              </Badge>
            )}
          </div>
        </button>
      );
    },
    [selectedPreset, handlePresetClick]
  );

  // Tab configuration
  const tabs = [
    {
      id: "presets",
      content: "Color Presets",
      panelID: "presets-panel",
    },
    {
      id: "custom",
      content: "Custom Colors",
      panelID: "custom-panel",
    },
    ...(brandSuggestions
      ? [
          {
            id: "brand",
            content: "Brand Colors",
            panelID: "brand-panel",
          },
        ]
      : []),
  ];

  const isAccessible =
    (validation.contrastRatios?.textOnBackground ?? 0) >= 4.5 &&
    (validation.contrastRatios?.buttonTextOnButton ?? 0) >= 4.5;

  return (
    <Card>
      <BlockStack gap="500">
        {/* Header */}
        <Box>
          <InlineStack gap="200" blockAlign="center">
            <Icon source={ColorIcon} />
            <Text as="h3" variant="headingMd">
              Color Customization
            </Text>
          </InlineStack>
          <Box paddingBlockStart="100">
            <Text as="p" variant="bodySm" tone="subdued">
              Customize colors for your {templateType.replace("-", " ")} template
            </Text>
          </Box>
        </Box>

        {/* Validation Warnings */}
        {!validation.isValid && (
          <Banner tone="warning">
            <BlockStack gap="200">
              <Text as="p" variant="bodySm">
                Please fix the following issues:
              </Text>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index}>
                    <Text as="span" variant="bodySm">
                      {error}
                    </Text>
                  </li>
                ))}
              </ul>
            </BlockStack>
          </Banner>
        )}

        {/* Accessibility Status */}
        {showContrastChecker && (
          <Box>
            {isAccessible ? (
              <Banner tone="success">
                <Text as="p" variant="bodySm">
                  ✓ Colors meet WCAG accessibility standards
                </Text>
              </Banner>
            ) : (
              <Banner tone="critical">
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" fontWeight="semibold">
                    ⚠ Accessibility issues detected:
                  </Text>
                  {validation.warnings.map((warning, index) => (
                    <Text key={index} as="p" variant="bodySm">
                      {warning}
                    </Text>
                  ))}
                </BlockStack>
              </Banner>
            )}
          </Box>
        )}

        {/* Main Tabs */}
        <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab}>
          {/* Presets Tab */}
          {activeTab === 0 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <Box>
                  <Text as="h4" variant="headingSm">
                    Popular Presets
                  </Text>
                  <Box paddingBlockStart="200">
                    <div className={styles.presetGrid}>{popularPresets.map(renderPresetCard)}</div>
                  </Box>
                </Box>

                <Box>
                  <Text as="h4" variant="headingSm">
                    {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Optimized
                  </Text>
                  <Box paddingBlockStart="200">
                    <div className={styles.presetGrid}>
                      {colorPresets.filter((p) => !p.isPopular).map(renderPresetCard)}
                    </div>
                  </Box>
                </Box>
              </BlockStack>
            </Box>
          )}

          {/* Custom Colors Tab */}
          {activeTab === 1 && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                {/* Basic Colors (Always Visible) */}
                {renderColorGroup("basic", propertyGroups.basic)}

                {/* Advanced Options Toggle */}
                <Box>
                  <Button
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    variant="plain"
                    icon={showAdvancedOptions ? ChevronUpIcon : ChevronDownIcon}
                  >
                    Advanced Options
                  </Button>
                </Box>

                {/* Advanced Color Groups */}
                <Collapsible
                  open={showAdvancedOptions}
                  id="advanced-colors"
                  transition={{
                    duration: "200ms",
                    timingFunction: "ease-in-out",
                  }}
                >
                  <BlockStack gap="400">
                    {Object.entries(propertyGroups)
                      .filter(([key]) => key !== "basic")
                      .map(([key, group]) => renderColorGroup(key, group))}
                  </BlockStack>
                </Collapsible>

                {/* Recent Colors */}
                {recentColors.length > 0 && (
                  <Card>
                    <BlockStack gap="300">
                      <Text as="h4" variant="headingSm">
                        Recent Colors
                      </Text>
                      <InlineStack gap="100" wrap>
                        {recentColors.map((color) =>
                          renderColorSwatch(
                            color,
                            () => setColorHarmonyBase(color),
                            `Recent color: ${color}`
                          )
                        )}
                      </InlineStack>
                    </BlockStack>
                  </Card>
                )}
              </BlockStack>
            </Box>
          )}

          {/* Brand Colors Tab */}
          {activeTab === 2 && brandSuggestions && (
            <Box paddingBlockStart="400">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="300">
                    <Text as="h4" variant="headingSm">
                      Brand Color Suggestions
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Colors generated from your brand palette, optimized for {templateType}{" "}
                      templates
                    </Text>

                    {/* Brand Color Preview */}
                    <div className={styles.brandPreview}>
                      <div
                        className={styles.brandPreviewContent}
                        style={{
                          backgroundColor: (brandSuggestions as Record<string, string>)
                            ?.backgroundColor,
                          color: (brandSuggestions as Record<string, string>)?.textColor,
                          borderColor: (brandSuggestions as Record<string, string>)?.borderColor,
                        }}
                      >
                        <div className={styles.brandPreviewTitle}>Your Brand Colors</div>
                        <div className={styles.brandPreviewDescription}>
                          See how your brand colors look in this template
                        </div>
                        <div
                          className={styles.brandPreviewButton}
                          style={{
                            backgroundColor: (brandSuggestions as Record<string, string>)
                              ?.buttonColor,
                            color: (brandSuggestions as Record<string, string>)?.buttonTextColor,
                          }}
                        >
                          Call to Action
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleBrandSuggestionApply} variant="primary">
                      Apply Brand Colors
                    </Button>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Box>
          )}
        </Tabs>
      </BlockStack>
    </Card>
  );
}
