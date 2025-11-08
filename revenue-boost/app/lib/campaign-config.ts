/**
 * Campaign configuration utilities
 */

export type EditorConfig = Record<string, unknown>;

interface WizardState {
  designConfig?: {
    popupDesign?: Record<string, unknown>;
  };
  contentConfig?: {
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaLabel?: string;
  };
  discountConfig?: {
    enabled?: boolean;
    prefix?: string;
    value?: number;
    valueType?: string;
  };
}

/**
 * Derive initial editor config from wizard state
 */
export function deriveInitialConfig(wizardState: WizardState): Partial<EditorConfig> {
  const content = wizardState?.contentConfig;
  const discount = wizardState?.discountConfig;

  return {
    ...(wizardState?.designConfig?.popupDesign ?? {}),
    ...(content ?? {}),

    // Map content fields
    ...(content?.headline && { title: content.headline }),
    ...(content?.subheadline && { description: content.subheadline }),
    ...((content?.ctaText || content?.ctaLabel) && { buttonText: content.ctaText || content.ctaLabel }),

    // Map discount fields
    ...(discount?.enabled !== undefined && { discountEnabled: discount.enabled }),
    ...(discount?.prefix && discount?.value && { discountCode: `${discount.prefix}${discount.value}` }),
    ...(discount?.value !== undefined && { discountValue: discount.value }),
    ...(discount?.valueType && { discountType: discount.valueType.toLowerCase() }),
    ...(discount?.valueType === "PERCENTAGE" && discount?.value !== undefined && { discountPercentage: discount.value }),
  };
}
