/**
 * ThemeModeSelector Component
 *
 * Visual selector for choosing theme mode:
 * - shopify: Inherit from store theme (auto-sync)
 * - preset: Use a predefined artistic design
 * - custom: Manual color configuration
 */

import { BlockStack, Text } from "@shopify/polaris";
import type { ThemeMode } from "~/domains/campaigns/types/design-tokens";

interface ThemeModeOption {
  value: ThemeMode;
  label: string;
  description: string;
  icon: string;
}

const THEME_MODE_OPTIONS: ThemeModeOption[] = [
  {
    value: "shopify",
    label: "Store Theme",
    description: "Automatically match your store's colors & fonts",
    icon: "🎨",
  },
  {
    value: "preset",
    label: "Preset Design",
    description: "Use an artistic or seasonal design",
    icon: "✨",
  },
  {
    value: "custom",
    label: "Custom Colors",
    description: "Manually pick your own colors",
    icon: "🎯",
  },
];

export interface ThemeModeSelectorProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  /** Hide preset option (for templates that don't support presets) */
  hidePreset?: boolean;
}

export function ThemeModeSelector({ value, onChange, hidePreset = false }: ThemeModeSelectorProps) {
  const options = hidePreset
    ? THEME_MODE_OPTIONS.filter((o) => o.value !== "preset")
    : THEME_MODE_OPTIONS;

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        Theme Mode
      </Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${options.length}, 1fr)`,
          gap: "12px",
        }}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "16px 12px",
                borderRadius: "12px",
                border: isSelected
                  ? "2px solid var(--p-color-border-interactive)"
                  : "1px solid var(--p-color-border-secondary)",
                backgroundColor: isSelected
                  ? "var(--p-color-bg-surface-secondary-active)"
                  : "var(--p-color-bg-surface)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "0 0 0 2px var(--p-color-border-interactive)" : undefined,
              }}
            >
              <span style={{ fontSize: "24px" }}>{option.icon}</span>
              <Text as="span" variant="bodyMd" fontWeight="semibold">
                {option.label}
              </Text>
              <Text as="span" variant="bodySm" tone="subdued" alignment="center">
                {option.description}
              </Text>
            </button>
          );
        })}
      </div>
    </BlockStack>
  );
}

export default ThemeModeSelector;
