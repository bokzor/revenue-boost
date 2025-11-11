/**
 * Free Shipping Content Configuration Section
 *
 * Form section for configuring free shipping threshold popup content
 */

import { TextField, CheckboxField, FormGrid, SelectField } from "../form";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export interface FreeShippingContent {
  headline?: string;
  subheadline?: string;
  freeShippingThreshold?: number;
  currency?: string;
  initialMessage?: string;
  progressMessage?: string;
  successTitle?: string;
  successSubhead?: string;
  showProducts?: boolean;
  maxProductsToShow?: number;
  productFilter?: "under_threshold" | "all" | "bestsellers";
  showProgress?: boolean;
  progressColor?: string;
  displayStyle?: "banner" | "modal" | "sticky";
  autoHide?: boolean;
  hideDelay?: number;
}

export interface FreeShippingContentSectionProps {
  content: Partial<FreeShippingContent>;
  errors?: Record<string, string>;
  onChange: (content: Partial<FreeShippingContent>) => void;
}

export function FreeShippingContentSection({
  content,
  errors,
  onChange,
}: FreeShippingContentSectionProps) {
  const updateField = useFieldUpdater(content, onChange);

  return (
    <>
      <TextField
        label="Headline"
        name="content.headline"
        value={content.headline || ""}
        error={errors?.headline}
        required
        placeholder="Free Shipping Progress"
        helpText="Main headline"
        onChange={(value) => updateField("headline", value)}
      />

      <TextField
        label="Subheadline"
        name="content.subheadline"
        value={content.subheadline || ""}
        error={errors?.subheadline}
        placeholder="You're almost there!"
        helpText="Supporting text (optional)"
        onChange={(value) => updateField("subheadline", value)}
      />

      <h3>Threshold Configuration</h3>

      <FormGrid columns={2}>
        <TextField
          label="Free Shipping Threshold"
          name="content.freeShippingThreshold"
          value={content.freeShippingThreshold?.toString() || "75"}
          error={errors?.freeShippingThreshold}
          required
          placeholder="75"
          helpText="Minimum cart value for free shipping"
          onChange={(value) => updateField("freeShippingThreshold", parseFloat(value) || 75)}
        />

        <SelectField
          label="Currency"
          name="content.currency"
          value={content.currency || "USD"}
          options={[
            { label: "USD ($)", value: "USD" },
            { label: "EUR (€)", value: "EUR" },
            { label: "GBP (£)", value: "GBP" },
            { label: "CAD ($)", value: "CAD" },
            { label: "AUD ($)", value: "AUD" },
          ]}
          onChange={(value) => updateField("currency", value)}
        />
      </FormGrid>

      <h3>Messages</h3>

      <TextField
        label="Initial Message"
        name="content.initialMessage"
        value={content.initialMessage || ""}
        placeholder="Add {{remaining}} more for FREE SHIPPING! 🚚"
        helpText="Use {{remaining}} for amount needed, {{percentage}} for progress"
        onChange={(value) => updateField("initialMessage", value)}
      />

      <TextField
        label="Progress Message"
        name="content.progressMessage"
        value={content.progressMessage || ""}
        placeholder="You're {{percentage}}% there!"
        helpText="Message shown while progressing (optional)"
        onChange={(value) => updateField("progressMessage", value)}
      />

      <TextField
        label="Success Title"
        name="content.successTitle"
        value={content.successTitle || ""}
        placeholder="You unlocked FREE SHIPPING! 🎉"
        helpText="Message when threshold is reached"
        onChange={(value) => updateField("successTitle", value)}
      />

      <TextField
        label="Success Subheading"
        name="content.successSubhead"
        value={content.successSubhead || ""}
        placeholder="Your order qualifies for free delivery"
        helpText="Additional success message (optional)"
        onChange={(value) => updateField("successSubhead", value)}
      />

      <h3>Progress Bar</h3>

      <FormGrid columns={2}>
        <CheckboxField
          label="Show Progress Bar"
          name="content.showProgress"
          checked={content.showProgress !== false}
          helpText="Display visual progress bar"
          onChange={(checked) => updateField("showProgress", checked)}
        />

        {content.showProgress && (
          <TextField
            label="Progress Bar Color"
            name="content.progressColor"
            value={content.progressColor || ""}
            placeholder="#10B981"
            helpText="Hex color code for progress bar"
            onChange={(value) => updateField("progressColor", value)}
          />
        )}
      </FormGrid>

      <h3>Product Recommendations</h3>

      <CheckboxField
        label="Show Product Recommendations"
        name="content.showProducts"
        checked={content.showProducts !== false}
        helpText="Display products to help reach threshold"
        onChange={(checked) => updateField("showProducts", checked)}
      />

      {content.showProducts && (
        <>
          <FormGrid columns={2}>
            <TextField
              label="Max Products to Show"
              name="content.maxProductsToShow"
              value={content.maxProductsToShow?.toString() || "3"}
              placeholder="3"
              helpText="Maximum number of products to display"
              onChange={(value) => updateField("maxProductsToShow", parseInt(value) || 3)}
            />

            <SelectField
              label="Product Filter"
              name="content.productFilter"
              value={content.productFilter || "under_threshold"}
              options={[
                { label: "Products Under Threshold", value: "under_threshold" },
                { label: "All Products", value: "all" },
                { label: "Bestsellers", value: "bestsellers" },
              ]}
              helpText="Which products to recommend"
              onChange={(value) => updateField("productFilter", value as FreeShippingContent["productFilter"])}
            />
          </FormGrid>
        </>
      )}

      <h3>Display Options</h3>

      <SelectField
        label="Display Style"
        name="content.displayStyle"
        value={content.displayStyle || "banner"}
        options={[
          { label: "Banner (Top/Bottom)", value: "banner" },
          { label: "Modal (Center)", value: "modal" },
          { label: "Sticky (Fixed Position)", value: "sticky" },
        ]}
        helpText="How to display the popup"
        onChange={(value) => updateField("displayStyle", value as FreeShippingContent["displayStyle"])}
      />

      <FormGrid columns={2}>
        <CheckboxField
          label="Auto-Hide on Success"
          name="content.autoHide"
          checked={content.autoHide || false}
          helpText="Automatically hide when threshold is reached"
          onChange={(checked) => updateField("autoHide", checked)}
        />

        {content.autoHide && (
          <TextField
            label="Hide Delay (seconds)"
            name="content.hideDelay"
            value={content.hideDelay?.toString() || "3"}
            placeholder="3"
            helpText="Seconds to wait before hiding"
            onChange={(value) => updateField("hideDelay", parseInt(value) || 3)}
          />
        )}
      </FormGrid>
    </>
  );
}

