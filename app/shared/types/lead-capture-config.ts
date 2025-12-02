/**
 * Lead Capture Configuration - Single Source of Truth
 *
 * This interface defines ALL fields for lead capture forms (email, name, consent).
 * It is the CONTRACT between:
 *
 * 1. Zod Schema (campaign.ts) - validates data going into the database
 * 2. Admin Form (LeadCaptureFormSection.tsx) - exposes fields for editing
 * 3. Storefront Component (LeadCaptureForm.tsx) - renders the form
 *
 * If you add/remove/rename a field here, TypeScript will enforce updates everywhere.
 *
 * @example
 * ```typescript
 * // In Zod schema
 * const schema = z.object({
 *   ...LeadCaptureConfigZodShape,
 * });
 *
 * // In LeadCaptureForm
 * function mapConfigToProps(config: LeadCaptureConfig): LeadCaptureFormProps { ... }
 *
 * // In LeadCaptureFormSection
 * interface Props extends LeadCaptureConfig { ... }
 * ```
 */

// =============================================================================
// CORE INTERFACE - The Single Source of Truth
// =============================================================================

export interface LeadCaptureConfig {
  // ─────────────────────────────────────────────────────────────────────────
  // Email Field
  // ─────────────────────────────────────────────────────────────────────────
  /** Whether email is required (default: true) */
  emailRequired?: boolean;
  /** Label shown above email input (e.g., "Email Address") */
  emailLabel?: string;
  /** Placeholder text inside email input */
  emailPlaceholder?: string;
  /** Custom error message for invalid email */
  emailErrorMessage?: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Name Field
  // ─────────────────────────────────────────────────────────────────────────
  /** Whether to show the name field */
  nameFieldEnabled?: boolean;
  /** Whether name is required when shown */
  nameFieldRequired?: boolean;
  /** Label shown above name input (e.g., "Your Name") */
  nameFieldLabel?: string;
  /** Placeholder text inside name input */
  nameFieldPlaceholder?: string;

  // ─────────────────────────────────────────────────────────────────────────
  // Consent/GDPR Field
  // ─────────────────────────────────────────────────────────────────────────
  /** Whether to show the consent checkbox */
  consentFieldEnabled?: boolean;
  /** Whether consent is required when shown */
  consentFieldRequired?: boolean;
  /** Text shown next to the checkbox */
  consentFieldText?: string;
  /** URL to privacy policy (for GDPR compliance) */
  privacyPolicyUrl?: string;
}

// =============================================================================
// FIELD KEYS - For iteration and validation
// =============================================================================

/**
 * All field keys in LeadCaptureConfig.
 * Use this to iterate over fields or validate completeness.
 */
export const LEAD_CAPTURE_CONFIG_KEYS: (keyof LeadCaptureConfig)[] = [
  // Email
  "emailRequired",
  "emailLabel",
  "emailPlaceholder",
  "emailErrorMessage",
  // Name
  "nameFieldEnabled",
  "nameFieldRequired",
  "nameFieldLabel",
  "nameFieldPlaceholder",
  // Consent
  "consentFieldEnabled",
  "consentFieldRequired",
  "consentFieldText",
  "privacyPolicyUrl",
];

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default values for LeadCaptureConfig.
 * Used when creating new campaigns or when values are not provided.
 */
export const LEAD_CAPTURE_DEFAULTS: Required<LeadCaptureConfig> = {
  // Email
  emailRequired: true,
  emailLabel: "",
  emailPlaceholder: "Enter your email",
  emailErrorMessage: "Please enter a valid email address",
  // Name
  nameFieldEnabled: false,
  nameFieldRequired: false,
  nameFieldLabel: "",
  nameFieldPlaceholder: "Your name",
  // Consent
  consentFieldEnabled: false,
  consentFieldRequired: false,
  consentFieldText: "I agree to receive marketing emails and accept the privacy policy",
  privacyPolicyUrl: "",
};

// =============================================================================
// MAPPING TO LEAD CAPTURE FORM PROPS
// =============================================================================

/**
 * Props expected by LeadCaptureForm component.
 * This subset is what the storefront component needs.
 */
export interface LeadCaptureFormConfigProps {
  showName?: boolean;
  nameRequired?: boolean;
  showGdpr?: boolean;
  gdprRequired?: boolean;
  emailRequired?: boolean;
  labels?: {
    email?: string;
    name?: string;
    gdpr?: string;
  };
  placeholders?: {
    email?: string;
    name?: string;
  };
  privacyPolicyUrl?: string;
}

/**
 * Maps LeadCaptureConfig to LeadCaptureForm props.
 * Use this in popup components to convert admin config to form props.
 *
 * @example
 * ```tsx
 * const formProps = mapLeadCaptureConfigToFormProps(config);
 * <LeadCaptureForm {...formProps} />
 * ```
 */
export function mapLeadCaptureConfigToFormProps(
  config: Partial<LeadCaptureConfig>
): LeadCaptureFormConfigProps {
  return {
    showName: config.nameFieldEnabled,
    nameRequired: config.nameFieldRequired,
    showGdpr: config.consentFieldEnabled,
    gdprRequired: config.consentFieldRequired,
    emailRequired: config.emailRequired,
    labels: {
      email: config.emailLabel,
      name: config.nameFieldLabel,
      gdpr: config.consentFieldText,
    },
    placeholders: {
      email: config.emailPlaceholder,
      name: config.nameFieldPlaceholder,
    },
    privacyPolicyUrl: config.privacyPolicyUrl,
  };
}

