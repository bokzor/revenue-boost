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
      onChange={(e) => onChange?.(e.currentTarget.checked)}
    >
      {label}
    </s-checkbox>
  );
}

