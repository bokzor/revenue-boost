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
      onChange={(val) => {
        // Allow empty string to clear field; only convert to number when value is provided
        if (val === "") {
          onChange(0);
        } else {
          const num = Number(val);
          if (!isNaN(num)) {
            onChange(num);
          }
        }
      }}
      autoComplete="off"
      min={0}
    />
  );
}
