/**
 * Cart Abandonment Content Configuration Section
 *
 * Form section for configuring cart abandonment popup content
 */

import { TextField, CheckboxField, FormGrid, SelectField } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";
import { DiscountSection } from "~/domains/popups/components/design/DiscountSection";
import type { DiscountConfig } from "~/domains/popups/services/discounts/discount.server";

export interface CartAbandonmentContent {
  headline?: string;
  subheadline?: string;
  showCartItems?: boolean;
  maxItemsToShow?: number;
  showCartTotal?: boolean;
  showUrgency?: boolean;
  urgencyTimer?: number;
  urgencyMessage?: string;
  showStockWarnings?: boolean;
  stockWarningMessage?: string;
  ctaUrl?: string;
  buttonText?: string;
  saveForLaterText?: string;
  currency?: string;
}

export interface CartAbandonmentContentSectionProps {
  content: Partial<CartAbandonmentContent>;
  discountConfig?: DiscountConfig;
  errors?: Record<string, string>;
  onChange: (content: Partial<CartAbandonmentContent>) => void;
  onDiscountChange?: (config: DiscountConfig) => void;
}

export function CartAbandonmentContentSection({
  content,
  discountConfig,
  errors,
  onChange,
  onDiscountChange,
}: CartAbandonmentContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <>
      <TextField
        label="Headline"
        name="content.headline"
        value={content.headline || ""}
        error={errors?.headline}
        required
        placeholder="You left something behind"
        helpText="Main headline to grab attention"
        onChange={(value) => updateField("headline", value)}
      />

      <TextField
        label="Subheadline"
        name="content.subheadline"
        value={content.subheadline || ""}
        error={errors?.subheadline}
        placeholder="Complete your purchase before it's gone"
        helpText="Supporting text (optional)"
        onChange={(value) => updateField("subheadline", value)}
      />

      <h3>Cart Display</h3>

      <FormGrid columns={2}>
        <CheckboxField
          label="Show Cart Items"
          name="content.showCartItems"
          checked={content.showCartItems !== false}
          helpText="Display items in the abandoned cart"
          onChange={(checked) => updateField("showCartItems", checked)}
        />

        <CheckboxField
          label="Show Cart Total"
          name="content.showCartTotal"
          checked={content.showCartTotal !== false}
          helpText="Display total cart value"
          onChange={(checked) => updateField("showCartTotal", checked)}
        />
      </FormGrid>

      {content.showCartItems && (
        <TextField
          label="Max Items to Show"
          name="content.maxItemsToShow"
          value={content.maxItemsToShow?.toString() || "3"}
          error={errors?.maxItemsToShow}
          placeholder="3"
          helpText="Maximum number of cart items to display"
          onChange={(value) => updateField("maxItemsToShow", parseInt(value) || 3)}
        />
      )}

      <h3>Urgency & Scarcity</h3>

      <CheckboxField
        label="Enable Urgency Timer"
        name="content.showUrgency"
        checked={content.showUrgency !== false}
        helpText="Show countdown timer to create urgency"
        onChange={(checked) => updateField("showUrgency", checked)}
      />

      {content.showUrgency && (
        <>
          <FormGrid columns={2}>
            <TextField
              label="Urgency Timer (seconds)"
              name="content.urgencyTimer"
              value={content.urgencyTimer?.toString() || "300"}
              error={errors?.urgencyTimer}
              placeholder="300"
              helpText="Timer duration (default: 5 minutes)"
              onChange={(value) => updateField("urgencyTimer", parseInt(value) || 300)}
            />

            <TextField
              label="Urgency Message"
              name="content.urgencyMessage"
              value={content.urgencyMessage || ""}
              placeholder="Complete your order in {{time}} to save 10%"
              helpText="Use {{time}} for timer placeholder"
              onChange={(value) => updateField("urgencyMessage", value)}
            />
          </FormGrid>
        </>
      )}

      <CheckboxField
        label="Show Stock Warnings"
        name="content.showStockWarnings"
        checked={content.showStockWarnings || false}
        helpText="Display low stock warnings for cart items"
        onChange={(checked) => updateField("showStockWarnings", checked)}
      />

      {content.showStockWarnings && (
        <TextField
          label="Stock Warning Message"
          name="content.stockWarningMessage"
          value={content.stockWarningMessage || ""}
          placeholder="⚠️ Items in your cart are selling fast!"
          onChange={(value) => updateField("stockWarningMessage", value)}
        />
      )}

      <h3>Call to Action</h3>

      <FormGrid columns={2}>
        <TextField
          label="Button Text"
          name="content.buttonText"
          value={content.buttonText || ""}
          error={errors?.buttonText}
          required
          placeholder="Resume Checkout"
          onChange={(value) => updateField("buttonText", value)}
        />

        <TextField
          label="CTA URL"
          name="content.ctaUrl"
          value={content.ctaUrl || ""}
          error={errors?.ctaUrl}
          placeholder="/checkout"
          helpText="Where to send users when they click the button"
          onChange={(value) => updateField("ctaUrl", value)}
        />
      </FormGrid>

      <TextField
        label="Save for Later Text"
        name="content.saveForLaterText"
        value={content.saveForLaterText || ""}
        placeholder="Save for Later"
        helpText="Secondary action text (optional)"
        onChange={(value) => updateField("saveForLaterText", value)}
      />

      {/* Discount Configuration */}
      {onDiscountChange && (
        <DiscountSection
          goal="CART_RECOVERY"
          discountConfig={discountConfig}
          onConfigChange={onDiscountChange}
        />
      )}
    </>
  );
}

