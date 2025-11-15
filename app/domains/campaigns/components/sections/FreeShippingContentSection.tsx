/**
 * Free Shipping Content Configuration Section
 *
 * Structured similarly to other template content sections with clear subsections.
 * Design colors and themes are handled via the shared DesignConfigSection.
 */

import { useEffect } from "react";
import { TextField, CheckboxField, FormGrid, SelectField } from "../form";
import { RangeSlider, Text, BlockStack, Divider, Card } from "@shopify/polaris";
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
  dismissLabel?: string;
  showIcon?: boolean;
  celebrateOnUnlock?: boolean;
  animationDuration?: number;
  // Preview-only
  previewCartTotal?: number;
  // Optional email gate for claiming the discount once threshold is reached
  requireEmailToClaim?: boolean;
  claimButtonLabel?: string;
  claimEmailPlaceholder?: string;
  claimSuccessMessage?: string;
  claimErrorMessage?: string;
}

export interface FreeShippingContentSectionProps {
  content: Partial<FreeShippingContent>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<FreeShippingContent>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
  // Optional: designConfig/onDesignChange are reserved for future design integrations
  designConfig?: Partial<DesignConfig>;
  onDesignChange?: (design: Partial<DesignConfig>) => void;
}

export function FreeShippingContentSection({
  content,
  discountConfig,
  errors,
  onChange,
  onDiscountChange,
  designConfig = {},
  onDesignChange,
}: FreeShippingContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  // Normalize bar position to ensure select always has a valid value
  const barPosition: FreeShippingContent["barPosition"] =
    content.barPosition === "bottom" ? "bottom" : "top";

  // If barPosition is missing/invalid (e.g. old data), persist a safe default
  useEffect(() => {
    if (content.barPosition !== "top" && content.barPosition !== "bottom") {
      updateField("barPosition", barPosition);
    }
    // we intentionally depend only on content.barPosition and barPosition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.barPosition, barPosition]);

  const handleThemeChange = (themeKey: NewsletterThemeKey) => {
    if (!onDesignChange) return;

    const themeColors = NEWSLETTER_THEMES[themeKey];
    const designConfigFromTheme = themeColorsToDesignConfig(themeColors);

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
    });
  };

  return (
    <BlockStack gap="500">
      <Card>
        <BlockStack gap="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">📦 Threshold & Behavior</Text>
            <Text as="p" tone="subdued">Configure thresholds and preview cart progress.</Text>
          </BlockStack>

          <Divider />

      <FormGrid columns={2}>
        <TextField
          label="Discount Threshold"
          name="content.threshold"
          value={content.threshold?.toString() || "75"}
          error={errors?.threshold}
          required
          placeholder="75"
          helpText="Minimum cart value to unlock this discount"
          onChange={(value) => {
            const threshold = parseFloat(value) || 75;
            updateField("threshold", threshold);
            if (onDiscountChange && discountConfig) {
              onDiscountChange({ ...discountConfig, minimumAmount: threshold });
            }
          }}
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
          value={barPosition}
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

      <TextField
        label="Dismiss Button Text"
        name="content.dismissLabel"
        value={content.dismissLabel || ""}
        error={errors?.dismissLabel}
        placeholder="No thanks"
        helpText="Text for the inline dismiss link that closes the bar"
        onChange={(value) => updateField("dismissLabel", value)}
      />

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

      <Text as="h3" variant="headingMd">
        🎯 Claim behavior
      </Text>
      <Text as="p" tone="subdued">
        Optionally require an email address to claim the discount once the bar is unlocked.
      </Text>
      <Divider />

      <CheckboxField
        label="Require email to claim discount"
        name="content.requireEmailToClaim"
        checked={content.requireEmailToClaim || false}
        helpText="Show a Claim Discount button and email field when the threshold is reached."
        onChange={(checked) => updateField("requireEmailToClaim", checked)}
      />

      {content.requireEmailToClaim && (
        <FormGrid columns={2}>
          <TextField
            label="Claim button label"
            name="content.claimButtonLabel"
            value={content.claimButtonLabel || "Claim discount"}
            placeholder="Claim discount"
            onChange={(value) => updateField("claimButtonLabel", value)}
          />

          <TextField
            label="Email field placeholder"
            name="content.claimEmailPlaceholder"
            value={content.claimEmailPlaceholder || "Enter your email"}
            placeholder="Enter your email"
            onChange={(value) => updateField("claimEmailPlaceholder", value)}
          />
        </FormGrid>
      )}
        </BlockStack>
      </Card>

      {/* Discount Configuration (Optional - in addition to free shipping) */}
      {onDiscountChange && (
        <Card>
          <BlockStack gap="400">
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                💰 Discount
              </Text>
              <Text as="p" tone="subdued">
                Configure the discount that unlocks when customers reach the threshold.
              </Text>
            </BlockStack>

            <Divider />

            <DiscountSection
              goal="INCREASE_REVENUE"
              discountConfig={discountConfig}
              onConfigChange={onDiscountChange}
            />
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}

