/**
 * Flash Sale Content Configuration Section
 *
 * Form section for configuring flash sale popup content
 */

import { TextField, CheckboxField, FormGrid } from "../form";
import type { FlashSaleContentSchema, DesignConfig } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

export type FlashSaleContent = z.infer<typeof FlashSaleContentSchema>;

export interface FlashSaleContentSectionProps {
  content: Partial<FlashSaleContent>;
  designConfig?: Partial<DesignConfig>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<FlashSaleContent>) => void;
  onDesignChange?: (design: Partial<DesignConfig>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function FlashSaleContentSection({
  content,
  designConfig = {},
  discountConfig,
  errors,
  onChange,
  onDesignChange,
  onDiscountChange,
}: FlashSaleContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  // Design field updater
  const updateDesignField = <K extends keyof DesignConfig>(
    field: K,
    value: DesignConfig[K] | undefined
  ) => {
    if (onDesignChange) {
      onDesignChange({ ...designConfig, [field]: value });
    }
  };

  return (
    <>
      <FormGrid columns={2}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Popup Size</label>
          <select
            value={designConfig.popupSize || "standard"}
            onChange={(e) => updateDesignField("popupSize", e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="compact">Compact (24rem)</option>
            <option value="standard">Standard (32rem)</option>
            <option value="wide">Wide (56rem)</option>
            <option value="full">Full (90%)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Controls the width of the popup</p>
        </div>
      </FormGrid>

      <TextField
        label="Headline"
        name="content.headline"
        value={content.headline || ""}
        error={errors?.headline}
        required
        placeholder="Flash Sale! Limited Time Only"
        onChange={(value) => updateField("headline", value)}
      />

      <TextField
        label="Urgency Message"
        name="content.urgencyMessage"
        value={content.urgencyMessage || ""}
        error={errors?.urgencyMessage}
        required
        placeholder="Hurry! Sale ends soon"
        helpText="Message that creates urgency"
        onChange={(value) => updateField("urgencyMessage", value)}
      />

      <TextField
        label="Subheadline"
        name="content.subheadline"
        value={content.subheadline || ""}
        placeholder="Don't miss out on these amazing deals"
        onChange={(value) => updateField("subheadline", value)}
      />

      <FormGrid columns={2}>
        <TextField
          label="Button Text"
          name="content.buttonText"
          value={content.buttonText || "Shop Now"}
          error={errors?.buttonText}
          required
          placeholder="Shop Now"
          onChange={(value) => updateField("buttonText", value)}
        />

        <TextField
          label="Discount Percentage"
          name="content.discountPercentage"
          value={content.discountPercentage?.toString() || ""}
          error={errors?.discountPercentage}
          required
          placeholder="20"
          helpText="Discount percentage (0-100)"
          onChange={(value) => updateField("discountPercentage", parseFloat(value) || 0)}
        />
      </FormGrid>

      <FormGrid columns={2}>
        <TextField
          label="Original Price"
          name="content.originalPrice"
          value={content.originalPrice?.toString() || ""}
          placeholder="99.99"
          helpText="Original price (optional)"
          onChange={(value) => updateField("originalPrice", parseFloat(value) || undefined)}
        />

        <TextField
          label="Sale Price"
          name="content.salePrice"
          value={content.salePrice?.toString() || ""}
          placeholder="79.99"
          helpText="Sale price (optional)"
          onChange={(value) => updateField("salePrice", parseFloat(value) || undefined)}
        />
      </FormGrid>

      <CheckboxField
        label="Show Countdown Timer"
        name="content.showCountdown"
        checked={content.showCountdown !== false}
        helpText="Display a countdown timer"
        onChange={(checked) => updateField("showCountdown", checked)}
      />

      {content.showCountdown !== false && (
        <TextField
          label="Countdown Duration (seconds)"
          name="content.countdownDuration"
          value={content.countdownDuration?.toString() || "3600"}
          placeholder="3600"
          helpText="Duration in seconds (default: 3600 = 1 hour)"
          onChange={(value) => updateField("countdownDuration", parseInt(value) || 3600)}
        />
      )}

      <CheckboxField
        label="Show Stock Counter"
        name="content.showStockCounter"
        checked={content.showStockCounter || false}
        helpText="Display remaining stock count"
        onChange={(checked) => updateField("showStockCounter", checked)}
      />

      {content.showStockCounter && (
        <TextField
          label="Stock Message"
          name="content.stockMessage"
          value={(content as any).stockMessage || ""}
          placeholder="Only 5 left in stock!"
          helpText="Message to display with animated dot indicator"
          onChange={(value) => (updateField as any)("stockMessage", value)}
        />
      )}

      <h3>Additional Options</h3>

      <TextField
        label="CTA URL"
        name="content.ctaUrl"
        value={content.ctaUrl || ""}
        placeholder="/collections/sale"
        helpText="Where to send users when they click the button"
        onChange={(value) => updateField("ctaUrl", value)}
      />

      <FormGrid columns={2}>
        <CheckboxField
          label="Hide on Expiry"
          name="content.hideOnExpiry"
          checked={content.hideOnExpiry !== false}
          helpText="Automatically hide popup when timer expires (legacy)"
          onChange={(checked) => updateField("hideOnExpiry", checked)}
        />

        <CheckboxField
          label="Auto-Hide on Expire"
          name="content.autoHideOnExpire"
          checked={(content as any).autoHideOnExpire || false}
          helpText="Auto-hide popup 2 seconds after timer expires"
          onChange={(checked) => (updateField as any)("autoHideOnExpire", checked)}
        />
      </FormGrid>

      {/* Discount Configuration */}
      {onDiscountChange && (
        <DiscountSection
          goal="INCREASE_REVENUE"
          discountConfig={discountConfig}
          onConfigChange={onDiscountChange}
        />
      )}
    </>
  );
}
