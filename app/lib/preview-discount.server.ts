/**
 * Preview Discount Code Generator
 *
 * Generates realistic-looking fake discount codes for preview mode.
 * These codes are NOT real - they're just for testing the UI/UX flow.
 *
 * Used by:
 * - /api/leads/submit (newsletter signups)
 * - /api/discounts.issue (discount issuance)
 * - /api/popups/spin-win (spin to win)
 * - /api/popups/scratch-card (scratch card)
 */

/**
 * Discount configuration for preview code generation
 */
export interface PreviewDiscountConfig {
  enabled?: boolean;
  valueType?: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value?: number;
  prefix?: string;
  // Legacy fields (from older content configs)
  type?: "percentage" | "fixed_amount" | "free_shipping";
  percentage?: number;
}

/**
 * Generate a realistic preview discount code based on discount configuration
 *
 * @param discountConfig - The discount configuration from the campaign
 * @returns A fake discount code string, or undefined if discounts are disabled
 *
 * @example
 * // 15% off -> "PREVIEW-15OFF"
 * // $10 off -> "PREVIEW-$10"
 * // Free shipping -> "PREVIEW-FREESHIP"
 * // No config -> "PREVIEW-SAVE"
 */
export function generatePreviewDiscountCode(
  discountConfig?: PreviewDiscountConfig | null
): string | undefined {
  // If discount is explicitly disabled, return undefined
  if (discountConfig?.enabled === false) {
    return undefined;
  }

  // Default prefix
  const prefix = discountConfig?.prefix || "PREVIEW";

  // Determine value type (handle both new and legacy field names)
  const valueType =
    discountConfig?.valueType ||
    (discountConfig?.type === "percentage"
      ? "PERCENTAGE"
      : discountConfig?.type === "fixed_amount"
        ? "FIXED_AMOUNT"
        : discountConfig?.type === "free_shipping"
          ? "FREE_SHIPPING"
          : undefined);

  // Determine value (handle both new and legacy field names)
  const value = discountConfig?.value ?? discountConfig?.percentage;

  // Generate code based on type
  switch (valueType) {
    case "PERCENTAGE": {
      const pct = typeof value === "number" ? Math.round(value) : 10;
      return `${prefix}-${pct}OFF`;
    }

    case "FIXED_AMOUNT": {
      const amount = typeof value === "number" ? Math.round(value) : 10;
      return `${prefix}-$${amount}`;
    }

    case "FREE_SHIPPING": {
      return `${prefix}-FREESHIP`;
    }

    default: {
      // Default: assume percentage if value is provided
      if (typeof value === "number" && value > 0) {
        return `${prefix}-${Math.round(value)}OFF`;
      }
      // Fallback generic code
      return `${prefix}-SAVE`;
    }
  }
}

/**
 * Check if a campaign ID indicates preview mode
 */
export function isPreviewCampaign(campaignId: string | null | undefined): boolean {
  return typeof campaignId === "string" && campaignId.startsWith("preview-");
}

