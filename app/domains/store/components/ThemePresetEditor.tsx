/**
 * ThemePresetEditor Component
 *
 * Two-column layout for creating/editing theme presets.
 * Left: Simplified color form (4-5 colors + font)
 * Right: Live preview using TemplatePreview
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Card,
  Layout,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Select,
  Button,
  Divider,
  Collapsible,
  Banner,
} from "@shopify/polaris";
import { ChevronDownIcon, ChevronUpIcon } from "@shopify/polaris-icons";

import { ColorField } from "~/domains/campaigns/components/form";
import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { Affix } from "~/shared/components/ui/Affix";
import type { ThemePresetInput } from "../types/theme-preset";
import { expandThemePreset, createEmptyThemePreset, getWheelColorsFromPreset } from "../types/theme-preset";
import { TemplateTypeEnum } from "~/lib/template-types.enum";

// ============================================================================
// TYPES
// ============================================================================

export interface ThemePresetEditorProps {
  /** Initial preset data (for editing) or undefined (for creating) */
  initialPreset?: ThemePresetInput;
  /** Callback when preset is saved */
  onSave: (preset: ThemePresetInput) => void;
  /** Callback when editing is cancelled */
  onCancel: () => void;
  /** Whether the save is in progress */
  isSaving?: boolean;
}

import { loadGoogleFont } from "~/shared/utils/google-fonts";

// Font family options
const FONT_OPTIONS = [
  { label: "System Default", value: "inherit" },
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', system-ui, sans-serif" },
  { label: "Lato", value: "Lato, system-ui, sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
  { label: "Playfair Display (Serif)", value: "'Playfair Display', Georgia, serif" },
  { label: "Merriweather (Serif)", value: "Merriweather, Georgia, serif" },
];

// Template options for preview
const PREVIEW_TEMPLATE_OPTIONS = [
  { label: "Newsletter", value: TemplateTypeEnum.NEWSLETTER },
  { label: "Flash Sale", value: TemplateTypeEnum.FLASH_SALE },
  { label: "Spin to Win", value: TemplateTypeEnum.SPIN_TO_WIN },
  { label: "Announcement", value: TemplateTypeEnum.ANNOUNCEMENT },
  { label: "Free Shipping", value: TemplateTypeEnum.FREE_SHIPPING },
  { label: "Countdown Timer", value: TemplateTypeEnum.COUNTDOWN_TIMER },
  { label: "Social Proof", value: TemplateTypeEnum.SOCIAL_PROOF },
  { label: "Cart Abandonment", value: TemplateTypeEnum.CART_ABANDONMENT },
  { label: "Product Upsell", value: TemplateTypeEnum.PRODUCT_UPSELL },
  { label: "Scratch Card", value: TemplateTypeEnum.SCRATCH_CARD },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function ThemePresetEditor({
  initialPreset,
  onSave,
  onCancel,
  isSaving = false,
}: ThemePresetEditorProps) {
  // State
  const [preset, setPreset] = useState<ThemePresetInput>(
    initialPreset || createEmptyThemePreset()
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string>(TemplateTypeEnum.NEWSLETTER);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load Google Font dynamically when font changes
  useEffect(() => {
    loadGoogleFont(preset.fontFamily);
  }, [preset.fontFamily]);

  // Compute expanded design config for preview
  const expandedDesignConfig = useMemo(() => expandThemePreset(preset), [preset]);

  // Generate wheel segment colors from the preset (recomputes when brandColor changes)
  const wheelColors = useMemo(
    () => getWheelColorsFromPreset(preset, 6),
    [preset.brandColor, preset.backgroundColor, preset.textColor]
  );

  // Default content config for preview (template-specific)
  const previewContentConfig = useMemo(() => {
    switch (previewTemplate) {
      case TemplateTypeEnum.NEWSLETTER:
        return {
          headline: "Join Our Newsletter",
          subheadline: "Get exclusive offers and updates",
          emailPlaceholder: "Enter your email",
          submitButtonText: "Subscribe",
          successMessage: "Thanks for subscribing!",
        };
      case TemplateTypeEnum.FLASH_SALE:
        return {
          headline: "🔥 Flash Sale!",
          subheadline: "Limited time offer",
          discountText: "30% OFF",
          ctaText: "Shop Now",
          showCountdown: true,
          countdownDuration: 7200,
        };
      case TemplateTypeEnum.SPIN_TO_WIN:
        return {
          headline: "Spin to Win!",
          subheadline: "Try your luck for exclusive discounts",
          spinButtonText: "Spin Now",
          emailRequired: true,
          emailPlaceholder: "Enter your email",
          wheelSegments: [
            { id: "1", label: "10% OFF", probability: 0.2, color: wheelColors[0] },
            { id: "2", label: "Free Ship", probability: 0.2, color: wheelColors[1] },
            { id: "3", label: "15% OFF", probability: 0.15, color: wheelColors[2] },
            { id: "4", label: "Try Again", probability: 0.25, color: wheelColors[3] },
            { id: "5", label: "20% OFF", probability: 0.1, color: wheelColors[4] },
            { id: "6", label: "5% OFF", probability: 0.1, color: wheelColors[5] },
          ],
          wheelBorderColor: preset.brandColor,
          wheelBorderWidth: 4,
        };
      case TemplateTypeEnum.ANNOUNCEMENT:
        return {
          headline: "New Collection Available",
          message: "Check out our latest arrivals",
          ctaText: "Shop Now",
        };
      case TemplateTypeEnum.FREE_SHIPPING:
        return {
          headline: "Free Shipping!",
          subheadline: "On orders over $50",
          ctaText: "Shop Now",
          threshold: 50,
          showProgress: true,
        };
      case TemplateTypeEnum.COUNTDOWN_TIMER:
        return {
          headline: "Sale Ends Soon!",
          subheadline: "Don't miss out on these deals",
          ctaText: "Shop Now",
          countdownDuration: 3600,
        };
      case TemplateTypeEnum.SOCIAL_PROOF:
        return {
          displayDuration: 5,
          rotationInterval: 8,
          enablePurchaseNotifications: true,
          enableVisitorNotifications: true,
          showProductImage: true,
          showTimer: true,
        };
      case TemplateTypeEnum.CART_ABANDONMENT:
        return {
          headline: "Wait! Don't leave yet",
          subheadline: "Complete your purchase and get 10% off",
          ctaText: "Complete Purchase",
          dismissLabel: "No thanks",
          showCartItems: true,
        };
      case TemplateTypeEnum.PRODUCT_UPSELL:
        return {
          headline: "You might also like",
          subheadline: "Customers who bought this also bought",
          ctaText: "Add to Cart",
          dismissLabel: "No thanks",
        };
      case TemplateTypeEnum.SCRATCH_CARD:
        return {
          headline: "Scratch to Win!",
          subheadline: "Reveal your special discount",
          scratchInstruction: "Scratch the card to reveal your prize",
          emailRequired: true,
          emailPlaceholder: "Enter your email",
        };
      default:
        return {
          headline: "Sample Popup",
          subheadline: "Preview your theme",
        };
    }
  }, [previewTemplate, wheelColors, preset.brandColor]);

  // Handlers
  const updateField = useCallback(<K extends keyof ThemePresetInput>(
    field: K,
    value: ThemePresetInput[K]
  ) => {
    setPreset((prev) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date().toISOString(),
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const handleSave = useCallback(() => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!preset.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!preset.brandColor) {
      newErrors.brandColor = "Brand color is required";
    }
    if (!preset.backgroundColor) {
      newErrors.backgroundColor = "Background color is required";
    }
    if (!preset.textColor) {
      newErrors.textColor = "Text color is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(preset);
  }, [preset, onSave]);

  const isEditing = !!initialPreset;

  return (
    <Layout>
      {/* Left Column - Form */}
      <Layout.Section variant="oneHalf">
        <BlockStack gap="400">
          {/* Preset Name */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {isEditing ? "Edit Theme Preset" : "Create Theme Preset"}
              </Text>
              <TextField
                label="Preset Name"
                value={preset.name}
                onChange={(value) => updateField("name", value)}
                placeholder="e.g., My Brand Theme"
                error={errors.name}
                autoComplete="off"
              />
              <TextField
                label="Description (optional)"
                value={preset.description || ""}
                onChange={(value) => updateField("description", value)}
                placeholder="A short description of this theme"
                autoComplete="off"
              />
            </BlockStack>
          </Card>

          {/* Core Colors */}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Core Colors
              </Text>
              <Text as="p" tone="subdued">
                Choose 3 colors that define your brand. The system will automatically
                derive all other colors for buttons, inputs, and text.
              </Text>
              <Divider />

              <ColorField
                label="🎨 Brand Color"
                name="brandColor"
                value={preset.brandColor}
                onChange={(value) => updateField("brandColor", value)}
                helpText="Used for buttons, CTAs, and accent highlights"
                error={errors.brandColor}
              />

              <ColorField
                label="🖼️ Background Color"
                name="backgroundColor"
                value={preset.backgroundColor}
                onChange={(value) => updateField("backgroundColor", value)}
                helpText="Popup background (solid color)"
                error={errors.backgroundColor}
              />

              <ColorField
                label="✏️ Text Color"
                name="textColor"
                value={preset.textColor}
                onChange={(value) => updateField("textColor", value)}
                helpText="Headlines and body text"
                error={errors.textColor}
              />
            </BlockStack>
          </Card>

          {/* Advanced Options (Collapsible) */}
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Advanced Options
                </Text>
                <Button
                  variant="plain"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  icon={showAdvanced ? ChevronUpIcon : ChevronDownIcon}
                >
                  {showAdvanced ? "Hide" : "Show"}
                </Button>
              </InlineStack>

              <Collapsible open={showAdvanced} id="advanced-options">
                <BlockStack gap="400">
                  <ColorField
                    label="🔲 Surface Color"
                    name="surfaceColor"
                    value={preset.surfaceColor || "#F3F4F6"}
                    onChange={(value) => updateField("surfaceColor", value)}
                    helpText="Input fields and card backgrounds"
                  />

                  <ColorField
                    label="✅ Success Color"
                    name="successColor"
                    value={preset.successColor || "#10B981"}
                    onChange={(value) => updateField("successColor", value)}
                    helpText="Success states and confirmations"
                  />

                  <Select
                    label="📝 Font Family"
                    options={FONT_OPTIONS.map(({ label, value }) => ({ label, value }))}
                    value={preset.fontFamily || "inherit"}
                    onChange={(value) => updateField("fontFamily", value)}
                    helpText="Typography for popup text"
                  />
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Card>

          {/* Action Buttons */}
          <Card>
            <InlineStack gap="300" align="end">
              <Button onClick={onCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} loading={isSaving}>
                {isEditing ? "Save Changes" : "Create Preset"}
              </Button>
            </InlineStack>
          </Card>
        </BlockStack>
      </Layout.Section>

      {/* Right Column - Live Preview */}
      <Layout.Section variant="oneHalf">
        <Affix offsetTop={80}>
          <Card>
            <BlockStack gap="400">
              {/* Template selector - above preview with high z-index */}
              <div style={{ position: "relative", zIndex: 100 }}>
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Live Preview
                  </Text>
                  <Select
                    label=""
                    labelHidden
                    options={PREVIEW_TEMPLATE_OPTIONS}
                    value={previewTemplate}
                    onChange={setPreviewTemplate}
                  />
                </InlineStack>
              </div>

              <Divider />

              {/* Preview container - transform creates new containing block for fixed elements */}
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  transform: "translateZ(0)", // Forces fixed children to be relative to this container
                  backgroundColor: "#F3F4F6",
                  borderRadius: "8px",
                  minHeight: "550px",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden", // Clip fixed-positioned children within container
                }}
              >
                {/* Inner wrapper to properly position popup content */}
                <div
                  style={{
                    flex: 1,
                    width: "100%",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                  }}
                >
                  <TemplatePreview
                    templateType={previewTemplate}
                    config={previewContentConfig}
                    designConfig={expandedDesignConfig}
                  />
                </div>
              </div>

              {/* Banner with higher z-index to stay above preview */}
              <div style={{ position: "relative", zIndex: 10 }}>
                <Banner tone="info">
                  <p>
                    This preview shows how your theme will look. Colors are automatically
                    derived from your core color choices.
                  </p>
                </Banner>
              </div>
            </BlockStack>
          </Card>
        </Affix>
      </Layout.Section>
    </Layout>
  );
}

