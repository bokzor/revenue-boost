/**
 * SimplifiedColorPicker Component
 *
 * A minimal 4-color picker for custom theme mode.
 * Only shows the essential colors: background, foreground, primary, primaryForeground
 */

import { useCallback } from "react";
import { BlockStack, Text } from "@shopify/polaris";
import { ColorField } from "../../form";
import type { DesignTokens } from "~/domains/campaigns/types/design-tokens";

interface ColorInput {
  id: keyof Pick<DesignTokens, "background" | "foreground" | "primary" | "primaryForeground">;
  label: string;
  helpText: string;
}

const COLOR_INPUTS: ColorInput[] = [
  {
    id: "background",
    label: "Background",
    helpText: "Popup background color",
  },
  {
    id: "foreground",
    label: "Text",
    helpText: "Main text color",
  },
  {
    id: "primary",
    label: "Button",
    helpText: "Primary button background",
  },
  {
    id: "primaryForeground",
    label: "Button Text",
    helpText: "Text on primary buttons",
  },
];

export interface SimplifiedColorPickerProps {
  tokens: Partial<DesignTokens>;
  onChange: (tokens: Partial<DesignTokens>) => void;
}

export function SimplifiedColorPicker({ tokens, onChange }: SimplifiedColorPickerProps) {
  const handleColorChange = useCallback(
    (colorId: ColorInput["id"], value: string) => {
      onChange({ ...tokens, [colorId]: value });
    },
    [tokens, onChange]
  );

  return (
    <BlockStack gap="400">
      <Text as="h3" variant="headingSm">
        Custom Colors
      </Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
        }}
      >
        {COLOR_INPUTS.map((input) => (
          <ColorField
            key={input.id}
            label={input.label}
            name={`design.tokens.${input.id}`}
            value={tokens[input.id] || "#000000"}
            onChange={(value) => handleColorChange(input.id, value)}
            helpText={input.helpText}
          />
        ))}
      </div>

      {/* Color Preview */}
      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          backgroundColor: tokens.background || "#ffffff",
          border: "1px solid var(--p-color-border-secondary)",
        }}
      >
        <div
          style={{
            color: tokens.foreground || "#1a1a1a",
            marginBottom: "12px",
          }}
        >
          <Text as="p" variant="bodyMd">
            Preview text with your colors
          </Text>
        </div>
        <button
          type="button"
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            backgroundColor: tokens.primary || "#000000",
            color: tokens.primaryForeground || "#ffffff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Button Preview
        </button>
      </div>
    </BlockStack>
  );
}

export default SimplifiedColorPicker;
