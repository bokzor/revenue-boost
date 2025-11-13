import React from "react";
import { NEWSLETTER_THEMES, type NewsletterThemeKey } from "~/config/color-presets";

export interface ThemePresetSelectorProps {
  selected?: NewsletterThemeKey;
  onSelect: (theme: NewsletterThemeKey) => void;
  maxWidth?: number | string;
  title?: string;
  helpText?: string;
}

function buildSwatchBackground(themeKey: NewsletterThemeKey): string {
  const t = NEWSLETTER_THEMES[themeKey];
  const bg = t.background || "#FFFFFF";
  // If the theme background is itself a gradient, use it directly for the swatch
  if (bg.startsWith("linear-gradient")) {
    return bg;
  }
  const left = bg || t.secondary || "#FFFFFF";
  const right = t.ctaBg || t.primary || t.accent || "#007BFF";
  return `linear-gradient(90deg, ${left} 50%, ${right} 50%)`;
}

export const ThemePresetSelector: React.FC<ThemePresetSelectorProps> = ({
  selected = "modern",
  onSelect,
  maxWidth = 560,
  title,
  helpText,
}) => {
  return (
    <div>
      {title && <div style={{ marginBottom: 8, fontWeight: 600 }}>{title}</div>}
      {helpText && (
        <div style={{ marginBottom: 8, color: "#6D7175", fontSize: 12 }}>{helpText}</div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))",
          gap: "10px",
          maxWidth,
        }}
      >
        {(Object.keys(NEWSLETTER_THEMES) as NewsletterThemeKey[]).map((key) => {
          const isSelected = selected === key;
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          const swatchBg = buildSwatchBackground(key);
          return (
            <div
              key={key}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-label={label}
                  title={label}
                  style={{
                    width: 52,
                    height: 36,
                    borderRadius: 8,
                    border: isSelected ? "2px solid #202223" : "1px solid #D2D5D8",
                    background: swatchBg,
                    cursor: "pointer",
                    boxShadow: isSelected ? "0 0 0 2px rgba(32,34,35,0.15)" : "none",
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
              <span style={{ fontSize: 12, color: "#6D7175" }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

