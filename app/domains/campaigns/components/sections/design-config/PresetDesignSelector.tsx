/**
 * PresetDesignSelector Component
 *
 * Visual picker for predefined design presets.
 * Shows color swatches and names for each preset.
 */

import React from "react";
import { BlockStack, Text, Tooltip } from "@shopify/polaris";
import { PRESET_DESIGNS, type PresetDesign } from "~/domains/campaigns/types/design-tokens";

export interface PresetDesignSelectorProps {
  value?: string;
  onChange: (presetId: string) => void;
  /** Filter presets by category (optional) */
  category?: "newsletter" | "seasonal" | "spin-to-win" | "all";
}

/** Group presets by category for display */
const PRESET_CATEGORIES: Record<string, string[]> = {
  newsletter: ["bold-energy", "active-life", "spa-serenity", "fresh-organic", "elegant-luxe"],
  seasonal: ["black-friday", "cyber-monday", "holiday-festive", "summer-vibes"],
  "spin-to-win": ["neon-nights", "retro-arcade"],
};

function getPresetsForCategory(category: string): [string, PresetDesign][] {
  if (category === "all") {
    return Object.entries(PRESET_DESIGNS);
  }
  const presetIds = PRESET_CATEGORIES[category] || [];
  return presetIds.map((id) => [id, PRESET_DESIGNS[id]] as [string, PresetDesign]).filter(([, preset]) => preset);
}

function buildSwatchGradient(preset: PresetDesign): string {
  const bg = preset.backgroundGradient || preset.background;
  const primary = preset.primary;
  // Create a split swatch showing both background and primary color
  if (bg.startsWith("linear-gradient")) {
    return bg;
  }
  return `linear-gradient(135deg, ${bg} 50%, ${primary} 50%)`;
}

export function PresetDesignSelector({
  value,
  onChange,
  category = "all",
}: PresetDesignSelectorProps) {
  const presets = getPresetsForCategory(category);

  return (
    <BlockStack gap="300">
      <Text as="h3" variant="headingSm">
        Preset Design
      </Text>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
          gap: "12px",
        }}
      >
        {presets.map(([presetId, preset]) => {
          const isSelected = value === presetId;
          const swatch = buildSwatchGradient(preset);

          return (
            <Tooltip key={presetId} content={preset.presetName}>
              <button
                type="button"
                onClick={() => onChange(presetId)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px",
                  borderRadius: "12px",
                  border: isSelected
                    ? "2px solid var(--p-color-border-interactive)"
                    : "1px solid var(--p-color-border-secondary)",
                  backgroundColor: "var(--p-color-bg-surface)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 0 0 2px var(--p-color-border-interactive)" : undefined,
                }}
              >
                {/* Color swatch */}
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "8px",
                    background: swatch,
                    border: "1px solid var(--p-color-border-secondary)",
                  }}
                />
                {/* Name */}
                <Text as="span" variant="bodySm" truncate>
                  {preset.presetName}
                </Text>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </BlockStack>
  );
}

export default PresetDesignSelector;

