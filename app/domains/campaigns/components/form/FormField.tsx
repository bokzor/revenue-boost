/**
 * FormField Component
 *
 * Reusable form field wrapper with consistent styling and error handling
 * Follows Single Responsibility Principle - handles field rendering and validation display
 */

import type { ReactNode } from "react";

// Type for Shopify web component props
interface ShopifyTextFieldProps {
  label?: string;
  name?: string;
  error?: string;
  details?: string;
  required?: boolean;
  [key: string]: unknown;
}

export interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, name, error, helpText, required, children }: FormFieldProps) {
  const props: ShopifyTextFieldProps = {
    label,
    name,
    error,
    details: helpText,
    required,
  };

  return (
    <div className="form-field">
      <s-text-field {...props}>
        {children}
      </s-text-field>
    </div>
  );
}

/**
 * TextField Component
 * Specialized form field for text input
 */
export interface TextFieldProps {
  label: string;
  name: string;
  value?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  onChange?: (value: string) => void;
}

export function TextField({
  label,
  name,
  value,
  error,
  helpText,
  required,
  placeholder,
  multiline,
  rows,
  onChange,
}: TextFieldProps) {
  const props: ShopifyTextFieldProps = {
    label,
    name,
    value,
    error,
    details: helpText,
    required,
    placeholder,
    multiline,
    rows,
  };

  return (
    <s-text-field
      {...props}
      onChange={(e) => onChange?.(e.currentTarget.value)}
    />
  );
}

/**
 * SelectField Component
 * Specialized form field for select/dropdown input
 */
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  label: string;
  name: string;
  value?: string;
  options: SelectOption[];
  error?: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export function SelectField({
  label,
  name,
  value,
  options,
  error,
  helpText,
  required,
  placeholder,
  onChange,
}: SelectFieldProps) {
  return (
    <s-select
      label={label}
      name={name}
      value={value}
      error={error}
      details={helpText}
      required={required}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.currentTarget.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </s-select>
  );
}

/**
 * CheckboxField Component
 * Specialized form field for checkbox input
 */
export interface CheckboxFieldProps {
  label: string;
  name: string;
  checked?: boolean;
  error?: string;
  helpText?: string;
  onChange?: (checked: boolean) => void;
}

export function CheckboxField({
  label,
  name,
  checked,
  error,
  helpText,
  onChange,
}: CheckboxFieldProps) {
  const props: ShopifyTextFieldProps = {
    name,
    checked,
    error,
    details: helpText,
  };

  return (
    <s-checkbox
      {...props}
      label={label}
      onChange={(e) => onChange?.(e.currentTarget.checked)}
    />
  );
}

/**
 * ColorField Component
 * Specialized form field for color picker input
 */
export interface ColorFieldProps {
  label: string;
  name: string;
  value?: string;
  error?: string;
  helpText?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export function ColorField({
  label,
  name,
  value,
  error,
  helpText,
  placeholder = "#000000",
  onChange,
}: ColorFieldProps) {
  return (
    <div className="color-field">
      <label htmlFor={name} style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {/* Color preview swatch */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "4px",
            border: "1px solid #D1D5DB",
            backgroundColor: value || placeholder,
            cursor: "pointer",
            flexShrink: 0,
          }}
          onClick={() => {
            const input = document.getElementById(`${name}-picker`) as HTMLInputElement;
            input?.click();
          }}
        />

        {/* Hidden native color picker */}
        <input
          id={`${name}-picker`}
          type="color"
          value={value || placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            position: "absolute",
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />

        {/* Text input for hex value */}
        <div style={{ flex: 1 }}>
          <s-text-field
            name={name}
            value={value || ""}
            error={error}
            details={helpText}
            placeholder={placeholder}
            onChange={(e) => onChange?.(e.currentTarget.value)}
          />
        </div>
      </div>
    </div>
  );
}

