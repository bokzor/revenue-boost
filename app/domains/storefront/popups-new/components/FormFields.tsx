/**
 * Reusable Form Field Components
 *
 * Provides consistent form inputs across all popup components.
 * Includes accessibility features and validation styling.
 */

import React from "react";
import { useId } from "../hooks/useId";
import { StyledCheckbox } from "./shared/StyledCheckbox";

// Polyfill for CSS.escape (not available in Node.js SSR)
const cssEscape = (value: string): string => {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return CSS.escape(value);
  }
  // Simple fallback for SSR - escape special chars
  return value.replace(/([^\w-])/g, "\\$1");
};

export interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  placeholderColor?: string;
  className?: string;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your email",
  label,
  error,
  required = true,
  disabled = false,
  accentColor,
  textColor,
  backgroundColor,
  borderColor,
  placeholderColor,
  className,
}) => {
  // Generate unique ID for scoped placeholder styling (use polyfill for Preact compatibility)
  const inputId = useId();
  // Use CSS variable with fallback to prop value for design token integration
  const resolvedTextColor = textColor || "var(--rb-foreground, #1F2937)";
  const resolvedBgColor = backgroundColor || "var(--rb-surface, #FFFFFF)";
  const resolvedBorderColor = borderColor || "var(--rb-border, #D1D5DB)";
  const resolvedAccentColor = accentColor || "var(--rb-primary, #4F46E5)";
  const computedPlaceholderColor = placeholderColor || "var(--rb-muted, rgba(0,0,0,0.5))";

  return (
    <div>
      <style>
        {`
          #${cssEscape(inputId)}::placeholder {
            color: ${computedPlaceholderColor};
            opacity: 1;
          }
          #${cssEscape(inputId)}:focus {
            border-color: ${resolvedAccentColor};
            box-shadow: 0 0 0 var(--rb-popup-input-focus-ring-width, 2px)
                        var(--rb-popup-input-focus-ring-color, rgba(0,0,0,0.1));
          }
          #${cssEscape(inputId)}:not(:focus):hover:not(:disabled) {
            border-color: var(--rb-primary, ${resolvedBorderColor});
            opacity: 0.8;
          }
        `}
      </style>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: resolvedTextColor,
            fontFamily: "var(--rb-font-family, inherit)",
          }}
        >
          {label}
          {required && <span style={{ color: "var(--rb-error, #EF4444)" }}> *</span>}
        </label>
      )}
      <input
        id={inputId}
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : undefined}
        className={className}
        style={{
          width: "100%",
          padding: "0.875rem 1rem",
          fontFamily: "var(--rb-font-family, inherit)",
          fontSize: "1rem",
          border: error
            ? "2px solid var(--rb-error, #EF4444)"
            : `var(--rb-popup-input-border-width, 1px) solid ${resolvedBorderColor}`,
          borderRadius: "var(--rb-radius, 0.75rem)",
          backgroundColor: resolvedBgColor,
          color: resolvedTextColor,
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: "var(--rb-popup-input-shadow, none)",
        }}
      />
      {error && (
        <p
          id="email-error"
          role="alert"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "var(--rb-error, #EF4444)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  placeholderColor?: string;
  className?: string;
}

export const NameInput: React.FC<NameInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your name",
  label,
  error,
  required = false,
  disabled = false,
  accentColor,
  textColor,
  backgroundColor,
  borderColor,
  placeholderColor,
  className,
}) => {
  // Generate unique ID for scoped placeholder styling (use polyfill for Preact compatibility)
  const inputId = useId();
  // Use CSS variable with fallback to prop value for design token integration
  const resolvedTextColor = textColor || "var(--rb-foreground, #1F2937)";
  const resolvedBgColor = backgroundColor || "var(--rb-surface, #FFFFFF)";
  const resolvedBorderColor = borderColor || "var(--rb-border, #D1D5DB)";
  const resolvedAccentColor = accentColor || "var(--rb-primary, #4F46E5)";
  const computedPlaceholderColor = placeholderColor || "var(--rb-muted, rgba(0,0,0,0.5))";

  return (
    <div>
      <style>
        {`
          #${cssEscape(inputId)}::placeholder {
            color: ${computedPlaceholderColor};
            opacity: 1;
          }
          #${cssEscape(inputId)}:focus {
            border-color: ${resolvedAccentColor};
            box-shadow: 0 0 0 var(--rb-popup-input-focus-ring-width, 2px)
                        var(--rb-popup-input-focus-ring-color, rgba(0,0,0,0.1));
          }
          #${cssEscape(inputId)}:not(:focus):hover:not(:disabled) {
            border-color: var(--rb-primary, ${resolvedBorderColor});
            opacity: 0.8;
          }
        `}
      </style>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            color: resolvedTextColor,
            fontFamily: "var(--rb-font-family, inherit)",
          }}
        >
          {label}
          {required && <span style={{ color: "var(--rb-error, #EF4444)" }}> *</span>}
        </label>
      )}
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? "name-error" : undefined}
        className={className}
        style={{
          width: "100%",
          padding: "0.875rem 1rem",
          fontFamily: "var(--rb-font-family, inherit)",
          fontSize: "1rem",
          border: error
            ? "2px solid var(--rb-error, #EF4444)"
            : `var(--rb-popup-input-border-width, 1px) solid ${resolvedBorderColor}`,
          borderRadius: "var(--rb-radius, 0.75rem)",
          backgroundColor: resolvedBgColor,
          color: resolvedTextColor,
          outline: "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: "var(--rb-popup-input-shadow, none)",
        }}
      />
      {error && (
        <p
          id="name-error"
          role="alert"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "var(--rb-error, #EF4444)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export interface GdprCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  text?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  accentColor?: string;
  textColor?: string;
  /** GDPR: URL to privacy policy page */
  privacyPolicyUrl?: string;
  /** GDPR: Custom text for privacy policy link (default: "Privacy Policy") */
  privacyPolicyLinkText?: string;
}

export const GdprCheckbox: React.FC<GdprCheckboxProps> = ({
  checked,
  onChange,
  text = "I agree to receive marketing emails",
  error,
  required = false,
  disabled = false,
  accentColor = "#4F46E5",
  textColor = "#1F2937",
  privacyPolicyUrl,
  privacyPolicyLinkText = "Privacy Policy",
}) => {
  // Build the display text with optional privacy policy link
  const renderConsentText = () => {
    if (!privacyPolicyUrl) {
      return text;
    }

    // If the text contains {privacyPolicy}, replace it with the link
    if (text.includes("{privacyPolicy}")) {
      const parts = text.split("{privacyPolicy}");
      return (
        <>
          {parts[0]}
          <a
            href={privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: accentColor,
              textDecoration: "underline",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {privacyPolicyLinkText}
          </a>
          {parts[1]}
        </>
      );
    }

    // Otherwise, append the privacy policy link
    return (
      <>
        {text}{" "}
        <a
          href={privacyPolicyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: accentColor,
            textDecoration: "underline",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {privacyPolicyLinkText}
        </a>
      </>
    );
  };

  return (
    <div>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          cursor: disabled ? "not-allowed" : "pointer",
          gap: "0.75rem",
        }}
      >
        <div style={{ marginTop: "0.125rem" }}>
          <StyledCheckbox
            checked={checked}
            onChange={onChange}
            required={required}
            disabled={disabled}
            accentColor={accentColor}
            hasError={!!error}
            ariaLabel={text}
          />
        </div>
        <span
          style={{
            fontSize: "0.875rem",
            color: textColor,
            lineHeight: "1.5",
          }}
        >
          {renderConsentText()}
          {required && <span style={{ color: accentColor, marginLeft: "0.25rem" }}>*</span>}
        </span>
      </label>
      {error && (
        <p
          id="gdpr-error"
          role="alert"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "var(--rb-error, #EF4444)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};

export interface SubmitButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  /**
   * Button background color (preferred over accentColor)
   */
  buttonColor?: string;
  /**
   * @deprecated Use buttonColor instead. Kept for backward compatibility.
   */
  accentColor?: string;
  textColor?: string;
  fullWidth?: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  onClick,
  type = "submit",
  disabled = false,
  loading = false,
  buttonColor,
  accentColor,
  textColor,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;
  // Use CSS variable with fallback to prop value for design token integration
  // Prefer buttonColor over accentColor for button background
  const resolvedBgColor = buttonColor || accentColor || "var(--rb-primary, #4F46E5)";
  const resolvedTextColor = textColor || "var(--rb-primary-foreground, #FFFFFF)";

  return (
    <>
      {/* Inject spin animation keyframe */}
      <style>
        {`
          @keyframes submit-button-spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <button
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        style={{
          width: fullWidth ? "100%" : "auto",
          padding: "0.875rem 1.5rem",
          fontFamily: "var(--rb-font-family, inherit)",
          fontSize: "1rem",
          fontWeight: "600",
          color: resolvedTextColor,
          backgroundColor: isDisabled ? "#9CA3AF" : resolvedBgColor,
          border: "none",
          borderRadius: "var(--rb-radius, 0.5rem)",
          boxShadow: "var(--rb-popup-button-shadow, none)",
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          opacity: isDisabled ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {loading && (
          <svg
            style={{
              animation: "submit-button-spin 1s linear infinite",
              width: "1rem",
              height: "1rem",
            }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    </>
  );
};
