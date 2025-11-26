import React from "react";
import { EmailInput, NameInput, GdprCheckbox, SubmitButton } from "../FormFields";
import type { PopupFormData, PopupFormErrors } from "../../hooks/usePopupForm";

/**
 * LeadCaptureForm Component
 *
 * A reusable form component for capturing lead information (email, name, GDPR consent).
 * Composes existing FormFields components and integrates with the usePopupForm hook.
 * Supports optional fields and custom labels/placeholders.
 *
 * @example
 * ```tsx
 * // Basic email-only form
 * const { formState, setEmail, errors, handleSubmit, isSubmitting } = usePopupForm({
 *   onSubmit: async (data) => { ... }
 * });
 *
 * <LeadCaptureForm
 *   data={formState}
 *   errors={errors}
 *   onEmailChange={setEmail}
 *   onNameChange={() => {}}
 *   onGdprChange={() => {}}
 *   onSubmit={handleSubmit}
 *   isSubmitting={isSubmitting}
 * />
 *
 * // With name and GDPR fields
 * <LeadCaptureForm
 *   data={formState}
 *   errors={errors}
 *   onEmailChange={setEmail}
 *   onNameChange={setName}
 *   onGdprChange={setGdprConsent}
 *   onSubmit={handleSubmit}
 *   isSubmitting={isSubmitting}
 *   showName={true}
 *   nameRequired={true}
 *   showGdpr={true}
 *   gdprRequired={true}
 * />
 *
 * // Custom labels and placeholders
 * <LeadCaptureForm
 *   {...props}
 *   labels={{
 *     email: "Email Address",
 *     name: "Full Name",
 *     gdpr: "I agree to receive marketing emails",
 *     submit: "Subscribe Now"
 *   }}
 *   placeholders={{
 *     email: "you@example.com",
 *     name: "John Doe"
 *   }}
 * />
 *
 * // With extra fields (template-specific)
 * <LeadCaptureForm
 *   {...props}
 *   extraFields={
 *     <input
 *       type="tel"
 *       placeholder="Phone number"
 *       value={phone}
 *       onChange={(e) => setPhone(e.target.value)}
 *     />
 *   }
 * />
 * ```
 *
 * @component
 * @category Shared Components
 * @subcategory Phase 2 - Core Components
 */
export interface LeadCaptureFormProps {
  /**
   * Form data (email, name, gdprConsent)
   */
  data: PopupFormData;
  /**
   * Form validation errors
   */
  errors: PopupFormErrors;
  /**
   * Email change handler
   */
  onEmailChange: (value: string) => void;
  /**
   * Name change handler
   */
  onNameChange: (value: string) => void;
  /**
   * GDPR consent change handler
   */
  onGdprChange: (checked: boolean) => void;
  /**
   * Form submit handler
   */
  onSubmit: (e?: React.FormEvent) => void | Promise<unknown>;
  /**
   * Whether the form is currently submitting
   */
  isSubmitting: boolean;
  /**
   * Whether to show the name field
   * @default false
   */
  showName?: boolean;
  /**
   * Whether the name field is required
   * @default false
   */
  nameRequired?: boolean;
  /**
   * Whether to show the GDPR checkbox
   * @default false
   */
  showGdpr?: boolean;
  /**
   * Whether the GDPR checkbox is required
   * @default false
   */
  gdprRequired?: boolean;
  /**
   * Whether email is required
   * @default true
   */
  emailRequired?: boolean;
  /**
   * Custom labels for form fields
   */
  labels?: {
    email?: string;
    name?: string;
    gdpr?: string;
    submit?: string;
  };
  /**
   * Custom placeholders for form fields
   */
  placeholders?: {
    email?: string;
    name?: string;
  };
  /**
   * Accent color for inputs and button
   * @default "#4F46E5"
   */
  accentColor?: string;
  /**
   * Text color for labels and text
   * @default "#1F2937"
   */
  textColor?: string;
  /**
   * Background color for inputs
   * @default "#FFFFFF"
   */
  backgroundColor?: string;
  /**
   * Button text color
   * @default "#FFFFFF"
   */
  buttonTextColor?: string;
  /**
   * Optional extra fields to render between inputs and submit button
   * Useful for template-specific fields (e.g., phone number, custom questions)
   */
  extraFields?: React.ReactNode;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
  /**
   * Layout mode: 'vertical' (default) or 'inline' (email + button on same line)
   * @default 'vertical'
   */
  layout?: "vertical" | "inline";
}

/**
 * LeadCaptureForm Component
 * 
 * Reusable form component for capturing leads (email, name, GDPR consent).
 * Composes existing FormFields components with consistent styling and validation.
 * Integrates seamlessly with the usePopupForm hook.
 * 
 * @example
 * ```tsx
 * const {
 *   formState,
 *   setEmail,
 *   setName,
 *   setGdprConsent,
 *   errors,
 *   handleSubmit,
 *   isSubmitting,
 * } = usePopupForm({ config });
 * 
 * <LeadCaptureForm
 *   data={formState}
 *   errors={errors}
 *   onEmailChange={setEmail}
 *   onNameChange={setName}
 *   onGdprChange={setGdprConsent}
 *   onSubmit={handleSubmit}
 *   isSubmitting={isSubmitting}
 *   showName={true}
 *   showGdpr={true}
 *   labels={{ submit: "Subscribe Now" }}
 * />
 * ```
 */
export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({
  data,
  errors,
  onEmailChange,
  onNameChange,
  onGdprChange,
  onSubmit,
  isSubmitting,
  showName = false,
  nameRequired = false,
  showGdpr = false,
  gdprRequired = false,
  emailRequired = true,
  labels,
  placeholders,
  accentColor = "#4F46E5",
  textColor = "#1F2937",
  backgroundColor = "#FFFFFF",
  buttonTextColor = "#FFFFFF",
  extraFields,
  className,
  style,
  layout = "vertical",
}) => {
  const isInline = layout === "inline";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      className={className}
      style={style}
    >
      {isInline ? (
        // Inline layout: email + button on same line (responsive with CSS Grid)
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "0.5rem",
            alignItems: "end",
          }}
        >
          <EmailInput
            value={data.email}
            onChange={onEmailChange}
            placeholder={placeholders?.email || "Enter your email"}
            label={labels?.email}
            error={errors.email}
            required={emailRequired}
            disabled={isSubmitting}
            accentColor={accentColor}
            textColor={textColor}
            backgroundColor={backgroundColor}
          />
          <div style={{ marginBottom: "1rem" }}>
            <SubmitButton
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              accentColor={accentColor}
              textColor={buttonTextColor}
              fullWidth={false}
            >
              {labels?.submit || "Submit"}
            </SubmitButton>
          </div>
        </div>
      ) : (
        // Vertical layout (default)
        <>
          {/* Email Input */}
          <EmailInput
            value={data.email}
            onChange={onEmailChange}
            placeholder={placeholders?.email || "Enter your email"}
            label={labels?.email}
            error={errors.email}
            required={emailRequired}
            disabled={isSubmitting}
            accentColor={accentColor}
            textColor={textColor}
            backgroundColor={backgroundColor}
          />

          {/* Name Input (optional) */}
          {showName && (
            <NameInput
              value={data.name || ""}
              onChange={onNameChange}
              placeholder={placeholders?.name || "Enter your name"}
              label={labels?.name || "Name"}
              error={errors.name}
              required={nameRequired}
              disabled={isSubmitting}
              accentColor={accentColor}
              textColor={textColor}
              backgroundColor={backgroundColor}
            />
          )}

          {/* Extra Fields Slot */}
          {extraFields}

          {/* GDPR Checkbox (optional) */}
          {showGdpr && (
            <GdprCheckbox
              checked={data.gdprConsent}
              onChange={onGdprChange}
              text={labels?.gdpr || "I agree to receive marketing emails"}
              error={errors.gdpr}
              required={gdprRequired}
              disabled={isSubmitting}
              accentColor={accentColor}
              textColor={textColor}
            />
          )}

          {/* Submit Button */}
          <SubmitButton
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
            accentColor={accentColor}
            textColor={buttonTextColor}
            fullWidth
          >
            {labels?.submit || "Submit"}
          </SubmitButton>
        </>
      )}
    </form>
  );
};

