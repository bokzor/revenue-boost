/**
 * CustomPresetSelector Component
 *
 * Visual grid selector for merchant's custom theme presets.
 * Matches the style of the built-in ThemePresetSelector.
 */

import { useCallback } from "react";
import type { ThemePresetInput } from "~/domains/store/types/theme-preset";
import { expandThemePreset } from "~/domains/store/types/theme-preset";
import type { DesignConfig } from "~/domains/campaigns/types/campaign";
import { loadGoogleFont } from "~/shared/utils/google-fonts";

// ============================================================================
// TYPES
// ============================================================================

export interface CustomPresetSelectorProps {
  /** Available custom presets from store settings */
  presets: ThemePresetInput[];
  /** Currently applied preset ID (if any) */
  appliedPresetId?: string;
  /** Callback when a preset is applied */
  onApplyPreset: (designConfig: Partial<DesignConfig>, presetId: string) => void;
  /** Optional help text */
  helpText?: string;
  /** Optional title */
  title?: string;
  /** Max width of the grid */
  maxWidth?: number | string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a gradient swatch showing background + brand color
 */
function buildSwatchBackground(preset: ThemePresetInput): string {
  const bg = preset.backgroundColor || "#FFFFFF";
  // If the background is itself a gradient, use it directly
  if (bg.startsWith("linear-gradient")) {
    return bg;
  }
  const accent = preset.brandColor || "#007BFF";
  return `linear-gradient(90deg, ${bg} 50%, ${accent} 50%)`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomPresetSelector({
  presets,
  appliedPresetId,
  onApplyPreset,
  helpText,
  title = "Your Custom Themes",
  maxWidth = 560,
}: CustomPresetSelectorProps) {
  const handleSelect = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId);
      if (!preset) return;

      // Load the font if needed
      if (preset.fontFamily) {
        loadGoogleFont(preset.fontFamily);
      }

      // Expand the preset into full design config
      const expandedConfig = expandThemePreset(preset);
      onApplyPreset(expandedConfig, presetId);
    },
    [presets, onApplyPreset]
  );

  // Don't render if no presets available
  if (presets.length === 0) {
    return null;
  }

  return (
    <div>
      {title && <div style={{ marginBottom: 8, fontWeight: 600 }}>{title}</div>}
      {helpText && (
        <div style={{ marginBottom: 8, color: "#6D7175", fontSize: 12 }}>{helpText}</div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
          gap: "12px",
          maxWidth,
        }}
      >
        {presets.map((preset) => {
          const isSelected = appliedPresetId === preset.id;
          const swatchBg = buildSwatchBackground(preset);

          return (
            <div
              key={preset.id}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => handleSelect(preset.id)}
                  aria-label={preset.name}
                  title={preset.description || preset.name}
                  style={{
                    width: 56,
                    height: 40,
                    borderRadius: 8,
                    border: isSelected ? "2px solid #202223" : "1px solid #D2D5D8",
                    background: swatchBg,
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 0 0 2px rgba(32,34,35,0.15)" : "none",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#8C9196";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "#D2D5D8";
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                />
                {isSelected && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      border: "1px solid #202223",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      lineHeight: "12px",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: isSelected ? "#202223" : "#6D7175",
                  fontWeight: isSelected ? 600 : 400,
                  textAlign: "center",
                  maxWidth: 72,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {preset.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

