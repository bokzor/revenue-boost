/**
 * QuickInputField Component
 *
 * Renders form inputs for recipe quick configuration.
 * Supports: discount_percentage, discount_amount, currency_amount,
 * duration_hours, text, select, datetime, product_picker, collection_picker
 */

import { Text, TextField, Select, RangeSlider } from "@shopify/polaris";
import type { QuickInput } from "../../recipes/styled-recipe-types";

export interface QuickInputFieldProps {
  input: QuickInput;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function QuickInputField({ input, value, onChange }: QuickInputFieldProps) {
  const defaultValue = "defaultValue" in input ? input.defaultValue : undefined;

  switch (input.type) {
    case "discount_percentage":
      return (
        <RangeSlider
          label={input.label}
          value={typeof value === "number" ? value : (defaultValue as number) || 10}
          min={5}
          max={50}
          step={5}
          suffix={<Text as="span">{typeof value === "number" ? value : defaultValue}%</Text>}
          output
          onChange={(v) => onChange(v)}
        />
      );

    case "currency_amount":
    case "discount_amount":
      return (
        <TextField
          label={input.label}
          type="number"
          value={String(value ?? defaultValue ?? 50)}
          onChange={(v) => onChange(Number(v))}
          prefix="$"
          autoComplete="off"
        />
      );

    case "duration_hours":
      return (
        <TextField
          label={input.label}
          type="number"
          value={String(value ?? defaultValue ?? 24)}
          onChange={(v) => onChange(Number(v))}
          suffix="hours"
          autoComplete="off"
        />
      );

    case "text":
      return (
        <TextField
          label={input.label}
          value={String(value ?? defaultValue ?? "")}
          onChange={(v) => onChange(v)}
          autoComplete="off"
        />
      );

    case "select":
      if ("options" in input) {
        return (
          <Select
            label={input.label}
            options={input.options.map((opt) => ({
              label: opt.label,
              value: opt.value,
            }))}
            value={String(value ?? defaultValue ?? input.options[0]?.value)}
            onChange={(v) => onChange(v)}
          />
        );
      }
      return null;

    case "product_picker":
    case "collection_picker":
      // Product/collection pickers require App Bridge context
      // For now, show a placeholder - full implementation would use ProductPicker component
      return (
        <TextField
          label={input.label}
          value=""
          onChange={() => {}}
          placeholder="Product selection available in full editor"
          disabled
          autoComplete="off"
        />
      );

    case "datetime":
      return (
        <TextField
          label={input.label}
          type="datetime-local"
          value={String(value ?? "")}
          onChange={(v) => onChange(v)}
          autoComplete="off"
        />
      );

    default:
      return null;
  }
}

