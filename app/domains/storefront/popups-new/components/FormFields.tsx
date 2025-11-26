/**
 * Reusable Form Field Components
 *
 * Provides consistent form inputs across all popup components.
 * Includes accessibility features and validation styling.
 */

import React from "react";
import { useId } from "../hooks/useId";

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
  accentColor = "#4F46E5",
  textColor = "#1F2937",
  backgroundColor = "#FFFFFF",
  placeholderColor,
  className,
}) => {
  // Generate unique ID for scoped placeholder styling (use polyfill for Preact compatibility)
  const inputId = useId();
  const computedPlaceholderColor = placeholderColor || `${textColor}99`;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <style>
        {`
          #${CSS.escape(inputId)}::placeholder {
            color: ${computedPlaceholderColor};
            opacity: 1;
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
            color: textColor,
          }}
        >
          {label}
          {required && <span style={{ color: "#EF4444" }}> *</span>}
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
          padding: "0.75rem",
          fontSize: "1rem",
          border: error ? "2px solid #EF4444" : "1px solid #D1D5DB",
          borderRadius: "0.5rem",
          backgroundColor,
          color: textColor,
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = accentColor;
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = "#D1D5DB";
          }
        }}
      />
      {error && (
        <p
          id="email-error"
          role="alert"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "#EF4444",
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
  placeholderColor?: string;
  className?: string;
}

export const NameInput: React.FC<NameInputProps> = ({
  value,
  onChange,
  placeholder = "Enter your name",
  label = "Name",
  error,
  required = false,
  disabled = false,
  accentColor = "#4F46E5",
  textColor = "#1F2937",
  backgroundColor = "#FFFFFF",
  placeholderColor,
  className,
}) => {
  // Generate unique ID for scoped placeholder styling (use polyfill for Preact compatibility)
  const inputId = useId();
  const computedPlaceholderColor = placeholderColor || `${textColor}99`;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <style>
        {`
          #${CSS.escape(inputId)}::placeholder {
            color: ${computedPlaceholderColor};
            opacity: 1;
          }
        `}
      </style>
      <label
        style={{
          display: "block",
          marginBottom: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          color: textColor,
        }}
      >
        {label}
        {required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
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
          padding: "0.75rem",
          fontSize: "1rem",
          border: error ? "2px solid #EF4444" : "1px solid #D1D5DB",
          borderRadius: "0.5rem",
          backgroundColor,
          color: textColor,
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = accentColor;
          }
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = "#D1D5DB";
          }
        }}
      />
      {error && (
        <p
          id="name-error"
          role="alert"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "#EF4444",
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
}) => {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          cursor: disabled ? "not-allowed" : "pointer",
          gap: "0.5rem",
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? "gdpr-error" : undefined}
          style={{
            marginTop: "0.25rem",
            width: "1rem",
            height: "1rem",
            accentColor,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        />
        <span
          style={{
            fontSize: "0.875rem",
            color: textColor,
            lineHeight: "1.5",
          }}
        >
          {text}
          {required && <span style={{ color: "#EF4444" }}> *</span>}
        </span>
      </label>
      {error && (
        <p
          id="gdpr-error"
          role="alert"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            color: "#EF4444",
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
  accentColor = "#4F46E5",
  textColor = "#FFFFFF",
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

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
          fontSize: "1rem",
          fontWeight: "600",
          color: textColor,
          backgroundColor: isDisabled ? "#9CA3AF" : accentColor,
          border: "none",
          borderRadius: "0.5rem",
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
