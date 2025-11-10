/**
 * TextValueInput - Text input for condition values
 * 
 * Single Responsibility: Handle text input for conditions
 */

import { TextField } from "@shopify/polaris";

interface TextValueInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextValueInput({ value, onChange }: TextValueInputProps) {
  return (
    <TextField
      label=""
      labelHidden
      type="text"
      value={String(value)}
      onChange={onChange}
      autoComplete="off"
      placeholder="Enter value"
    />
  );
}

