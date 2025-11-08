/**
 * NumberValueInput - Number input for condition values
 * 
 * Single Responsibility: Handle number input for conditions
 */

import { TextField } from "@shopify/polaris";

interface NumberValueInputProps {
  value: string | number;
  onChange: (value: number) => void;
}

export function NumberValueInput({ value, onChange }: NumberValueInputProps) {
  return (
    <TextField
      label=""
      labelHidden
      type="number"
      value={String(value)}
      onChange={(val) => onChange(Number(val) || 0)}
      autoComplete="off"
      min={0}
    />
  );
}

