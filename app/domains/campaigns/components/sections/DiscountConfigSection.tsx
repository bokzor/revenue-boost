/**
 * Discount Configuration Section
 *
 * Form section for configuring campaign discount settings
 */

import { CheckboxField, TextField, SelectField, FormGrid } from "../form";
import type { DiscountConfig } from "../../types/campaign";
import { useFieldUpdater } from "~/shared/hooks/useFieldUpdater";

export interface DiscountConfigSectionProps {
  discount: Partial<DiscountConfig>;
  errors?: Record<string, string>;
  onChange: (discount: Partial<DiscountConfig>) => void;
}

export function DiscountConfigSection({
  discount,
  errors,
  onChange,
}: DiscountConfigSectionProps) {
  const updateField = useFieldUpdater(discount, onChange);

  return (
    <>
      <CheckboxField
        label="Enable Discount"
        name="discount.enabled"
        checked={discount.enabled || false}
        helpText="Offer a discount code with this campaign"
        onChange={(checked) => updateField("enabled", checked)}
      />

      {discount.enabled && (
        <>
          <FormGrid columns={2}>
            <SelectField
              label="Discount Type"
              name="discount.valueType"
              value={discount.valueType || "PERCENTAGE"}
              options={[
                { label: "Percentage Off", value: "PERCENTAGE" },
                { label: "Fixed Amount Off", value: "FIXED_AMOUNT" },
                { label: "Free Shipping", value: "FREE_SHIPPING" },
              ]}
              required
              onChange={(value) =>
                updateField("valueType", value as DiscountConfig["valueType"])
              }
            />

            {discount.valueType !== "FREE_SHIPPING" && (
              <TextField
                label="Discount Value"
                name="discount.value"
                value={discount.value?.toString() || ""}
                error={errors?.value}
                required
                placeholder={discount.valueType === "PERCENTAGE" ? "10" : "5.00"}
                helpText={
                  discount.valueType === "PERCENTAGE"
                    ? "Percentage (e.g., 10 for 10%)"
                    : "Amount in currency (e.g., 5.00)"
                }
                onChange={(value) =>
                  updateField("value", parseFloat(value) || undefined)
                }
              />
            )}
          </FormGrid>

          {/* HIDDEN: Static discount codes disabled for accurate attribution
          <TextField
            label="Discount Code"
            name="discount.code"
            value={discount.code || ""}
            error={errors?.code}
            placeholder="WELCOME10"
            helpText="The discount code customers will use (leave empty for auto-generation)"
            onChange={(value) => updateField("code", value || undefined)}
          />
          */}

          <SelectField
            label="Delivery Mode"
            name="discount.deliveryMode"
            value={discount.deliveryMode || "auto_apply_only"}
            options={[
              {
                label: "Auto-apply only",
                value: "auto_apply_only",
              },
              {
                label: "Show code with fallback",
                value: "show_code_fallback",
              },
              {
                label: "Always show code",
                value: "show_code_always",
              },
            ]}
            helpText="How the discount should be delivered to customers"
            onChange={(value) =>
              updateField("deliveryMode", value as DiscountConfig["deliveryMode"])
            }
          />

          <FormGrid columns={2}>
            <TextField
              label="Expiry Days"
              name="discount.expiryDays"
              value={discount.expiryDays?.toString() || ""}
              placeholder="30"
              helpText="Number of days until discount expires (optional)"
              onChange={(value) =>
                updateField("expiryDays", parseInt(value) || undefined)
              }
            />

            <TextField
              label="Minimum Purchase Amount"
              name="discount.minimumAmount"
              value={discount.minimumAmount?.toString() || ""}
              placeholder="25.00"
              helpText="Minimum order value required (optional)"
              onChange={(value) =>
                updateField("minimumAmount", parseFloat(value) || undefined)
              }
            />
          </FormGrid>

          <TextField
            label="Description"
            name="discount.description"
            value={discount.description || ""}
            placeholder="Get 10% off your first order"
            helpText="Internal description for this discount (optional)"
            multiline
            rows={2}
            onChange={(value) => updateField("description", value || undefined)}
          />
        </>
      )}
    </>
  );
}

