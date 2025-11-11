/**
 * Flash Sale Content Configuration Section
 *
 * Form section for configuring flash sale popup content
 */

import { TextField, CheckboxField, FormGrid } from "../form";
import type { FlashSaleContentSchema } from "../../types/campaign";
import { z } from "zod";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

type FlashSaleContent = z.infer<typeof FlashSaleContentSchema>;

export interface FlashSaleContentSectionProps {
  content: Partial<FlashSaleContent>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<FlashSaleContent>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function FlashSaleContentSection({
  content,
  discountConfig,
  errors,
  onChange,
  onDiscountChange,
}: FlashSaleContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <>
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

      <TextField
        label="Success Message"
        name="content.successMessage"
        value={content.successMessage || ""}
        error={errors?.successMessage}
        required
        placeholder="Discount applied! Happy shopping!"
        onChange={(value) => updateField("successMessage", value)}
      />

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
          label="Stock Count"
          name="content.stockCount"
          value={content.stockCount?.toString() || ""}
          placeholder="50"
          helpText="Number of items in stock"
          onChange={(value) => updateField("stockCount", parseInt(value) || undefined)}
        />
      )}

      <h3>Additional Options</h3>

      <FormGrid columns={2}>
        <TextField
          label="CTA URL"
          name="content.ctaUrl"
          value={content.ctaUrl || ""}
          placeholder="/collections/sale"
          helpText="Where to send users when they click the button"
          onChange={(value) => updateField("ctaUrl", value)}
        />

        <CheckboxField
          label="Hide on Expiry"
          name="content.hideOnExpiry"
          checked={content.hideOnExpiry !== false}
          helpText="Automatically hide popup when timer expires"
          onChange={(checked) => updateField("hideOnExpiry", checked)}
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

