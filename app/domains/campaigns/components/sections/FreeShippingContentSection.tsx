/**
 * Free Shipping Content Configuration Section
 *
 * Structured similarly to NewsletterContentSection with clear subsections
 * and optional Theme Presets (color swatches) when design handlers are provided.
 */

import { TextField, CheckboxField, FormGrid, SelectField } from "../form";
import { RangeSlider, Text, BlockStack, Divider } from "@shopify/polaris";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";
import type { DesignConfig } from "../../types/campaign";
import { NEWSLETTER_THEMES, themeColorsToDesignConfig, type NewsletterThemeKey } from "~/config/color-presets";
import { ThemePresetSelector } from "../shared/ThemePresetSelector";


export interface FreeShippingContent {
  threshold?: number;
  currency?: string;
  nearMissThreshold?: number;
  emptyMessage?: string;
  progressMessage?: string;
  nearMissMessage?: string;
  unlockedMessage?: string;
  barPosition?: "top" | "bottom"; // Renamed from 'position' to avoid conflict
  dismissible?: boolean;
  showIcon?: boolean;
  celebrateOnUnlock?: boolean;
  animationDuration?: number;
  // Preview-only
  previewCartTotal?: number;
}

export interface FreeShippingContentSectionProps {
  content: Partial<FreeShippingContent>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<FreeShippingContent>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
  // Optional: allow quick theme presets like Newsletter section
  designConfig?: Partial<DesignConfig>;
  onDesignChange?: (design: Partial<DesignConfig>) => void;
}

export function FreeShippingContentSection({
  content,
  discountConfig,
  errors,
  onChange,
  onDiscountChange,
  designConfig,
  onDesignChange,
}: FreeShippingContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  // Apply a theme preset to design config (if handlers provided)
  const handleThemeChange = (themeKey: NewsletterThemeKey) => {
    if (!onDesignChange) return;
    const themeColors = NEWSLETTER_THEMES[themeKey];
    const dc = themeColorsToDesignConfig(themeColors);
    onDesignChange({
      ...designConfig,
      theme: themeKey,
      backgroundColor: dc.backgroundColor,
      textColor: dc.textColor,
      descriptionColor: dc.descriptionColor,
      accentColor: dc.accentColor,
      buttonColor: dc.buttonColor,
      buttonTextColor: dc.buttonTextColor,
      inputBackgroundColor: dc.inputBackgroundColor,
      inputTextColor: dc.inputTextColor,
      inputBorderColor: dc.inputBorderColor,
      imageBgColor: dc.imageBgColor,
      successColor: dc.successColor,
      fontFamily: dc.fontFamily,
      titleFontSize: dc.titleFontSize,
      titleFontWeight: dc.titleFontWeight,
      titleTextShadow: dc.titleTextShadow,
      descriptionFontSize: dc.descriptionFontSize,
      descriptionFontWeight: dc.descriptionFontWeight,
      inputBackdropFilter: dc.inputBackdropFilter,
      inputBoxShadow: dc.inputBoxShadow,
      imageUrl: `/newsletter-backgrounds/${themeKey}.png`,
    });
  };
  return (
    <BlockStack gap="500">
      <Text as="h3" variant="headingMd">📦 Threshold & Behavior</Text>
      <Text as="p" tone="subdued">Configure thresholds and preview cart progress.</Text>
      <Divider />

      <FormGrid columns={2}>
        <TextField
          label="Free Shipping Threshold"
          name="content.threshold"
          value={content.threshold?.toString() || "75"}
          error={errors?.threshold}
          required
          placeholder="75"
          helpText="Minimum cart value for free shipping"
          onChange={(value) => updateField("threshold", parseFloat(value) || 75)}
        />

        <TextField
          label="Currency Symbol"
          name="content.currency"
          value={content.currency || "$"}
          placeholder="$"
          helpText="Currency symbol to display"
          onChange={(value) => updateField("currency", value)}
        />
      </FormGrid>

      <TextField
        label="Near-Miss Threshold"
        name="content.nearMissThreshold"
        value={content.nearMissThreshold?.toString() || "10"}
        placeholder="10"
        helpText="Amount remaining to trigger urgency state (e.g., 'Only $10 to go!')"
        onChange={(value) => updateField("nearMissThreshold", parseFloat(value) || 10)}
      />

      {/* Preview: Cart total slider (for admin preview only) */}
      <div style={{ marginTop: "8px" }}>
        <RangeSlider
          label="Cart total (preview)"
          value={content.previewCartTotal ?? 0}
          onChange={(value) =>
            updateField(
              "previewCartTotal",
              Array.isArray(value) ? Number(value[0]) : Number(value)
            )
          }
          min={0}
          max={Math.max(content.threshold ?? 75, (content.threshold ?? 75) * 2)}
          step={1}
          output
          suffix={
            <Text as="span" variant="bodySm">
              {(content.currency ?? "$")}
              {(content.previewCartTotal ?? 0).toFixed(0)}
            </Text>
          }
        />
      </div>

      <Text as="h3" variant="headingMd">💬 Messages</Text>
      <Text as="p" tone="subdued">Customize messaging for each state.</Text>
      <Divider />

      <TextField
        label="Empty Cart Message"
        name="content.emptyMessage"
        value={content.emptyMessage || ""}
        placeholder="Add items to unlock free shipping"
        helpText="Message shown when cart is empty"
        onChange={(value) => updateField("emptyMessage", value)}
      />

      <TextField
        label="Progress Message"
        name="content.progressMessage"
        value={content.progressMessage || ""}
        placeholder="You're {remaining} away from free shipping"
        helpText="Use {remaining} for amount needed. Shown while making progress."
        onChange={(value) => updateField("progressMessage", value)}
      />

      <TextField
        label="Near-Miss Message"
        name="content.nearMissMessage"
        value={content.nearMissMessage || ""}
        placeholder="Only {remaining} to go!"
        helpText="Use {remaining} for amount needed. Shown when close to threshold."
        onChange={(value) => updateField("nearMissMessage", value)}
      />

      <TextField
        label="Unlocked Message"
        name="content.unlockedMessage"
        value={content.unlockedMessage || ""}
        placeholder="You've unlocked free shipping! 🎉"
        helpText="Message when threshold is reached"
        onChange={(value) => updateField("unlockedMessage", value)}
      />

      <Text as="h3" variant="headingMd">⚙️ Display Options</Text>
      <Text as="p" tone="subdued">Control position and visual behaviors.</Text>
      <Divider />

      <FormGrid columns={2}>
        <SelectField
          label="Bar Position"
          name="content.barPosition"
          value={content.barPosition || "top"}
          options={[
            { label: "Top of Page", value: "top" },
            { label: "Bottom of Page", value: "bottom" },
          ]}
          helpText="Where to display the bar"
          onChange={(value) => updateField("barPosition", value as FreeShippingContent["barPosition"])}
        />

        <CheckboxField
          label="Dismissible"
          name="content.dismissible"
          checked={content.dismissible !== false}
          helpText="Allow users to close the bar"
          onChange={(checked) => updateField("dismissible", checked)}
        />
      </FormGrid>

      <FormGrid columns={2}>
        <CheckboxField
          label="Show Icon"
          name="content.showIcon"
          checked={content.showIcon !== false}
          helpText="Display state icon (🚚, ⚡, ✓)"
          onChange={(checked) => updateField("showIcon", checked)}
        />

        <CheckboxField
          label="Celebrate on Unlock"
          name="content.celebrateOnUnlock"
          checked={content.celebrateOnUnlock !== false}
          helpText="Play celebration animation when unlocked"
          onChange={(checked) => updateField("celebrateOnUnlock", checked)}
        />
      </FormGrid>

      <TextField
        label="Animation Duration (ms)"
        name="content.animationDuration"
        value={content.animationDuration?.toString() || "500"}
        placeholder="500"
        helpText="Progress bar animation duration in milliseconds (100-2000)"
        onChange={(value) => updateField("animationDuration", parseInt(value) || 500)}
      />

      {/* Quick Theme Presets (optional) */}
      {onDesignChange && (
        <>
          <Text as="h3" variant="headingMd">🎨 Quick Theme Presets</Text>
          <Text as="p" tone="subdued">Apply a color theme for the bar (affects the Design section).</Text>
          <Divider />
          <ThemePresetSelector
            selected={(designConfig?.theme as NewsletterThemeKey) || "modern"}
            onSelect={handleThemeChange}
          />
        </>
      )}

      {/* Discount Configuration (Optional - in addition to free shipping) */}
      {onDiscountChange && (
        <DiscountSection
          goal="INCREASE_REVENUE"
          discountConfig={discountConfig}
          onConfigChange={onDiscountChange}
        />
      )}
    </BlockStack>
  );
}

