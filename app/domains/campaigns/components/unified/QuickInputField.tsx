/**
 * QuickInputField Component
 *
 * Renders form inputs for recipe quick configuration.
 * Supports: discount_percentage, discount_amount, currency_amount,
 * duration_hours, text, select, datetime, product_picker, collection_picker
 */

import { Text, TextField, Select, RangeSlider, BlockStack } from "@shopify/polaris";
import type { QuickInput } from "../../recipes/styled-recipe-types";
import {
  ProductPicker,
  type ProductPickerSelection,
} from "../../components/form/ProductPicker";

/** Value structure for product/collection picker inputs */
export interface PickerValue {
  ids: string[];
  selections?: ProductPickerSelection[];
}

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
    case "collection_picker": {
      const pickerMode = input.type === "product_picker" ? "product" : "collection";
      const pickerValue = value as PickerValue | undefined;
      const selectedIds = pickerValue?.ids || [];

      return (
        <BlockStack gap="200">
          <Text as="span" variant="bodyMd">
            {input.label}
          </Text>
          <ProductPicker
            mode={pickerMode}
            selectionType="multiple"
            selectedIds={selectedIds}
            onSelect={(selections: ProductPickerSelection[]) => {
              const ids = selections.map((s) => s.id);
              onChange({ ids, selections } satisfies PickerValue);
            }}
            buttonLabel={`Select ${pickerMode === "product" ? "products" : "collections"}`}
            showSelected={true}
          />
        </BlockStack>
      );
    }

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

