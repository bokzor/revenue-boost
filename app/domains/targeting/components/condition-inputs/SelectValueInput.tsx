/**
 * SelectValueInput - Dropdown selector for condition values
 *
 * Single Responsibility: Handle select dropdown for conditions
 */

import { Select } from "@shopify/polaris";

interface SelectValueInputProps {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

export function SelectValueInput({ value, options, onChange }: SelectValueInputProps) {
  return <Select label="" labelHidden options={options} value={value} onChange={onChange} />;
}
