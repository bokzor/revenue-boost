import type { PopupDesignConfig, PopupSize } from "../../types";

export function varsFromDesign(
  design: PopupDesignConfig,
  size: PopupSize | undefined
): { style: React.CSSProperties; "data-size": string } {
  const actualSize = size || "medium";

  // Use CSS variables as fallbacks - they're defined in design-tokens.css
  // This ensures consistency with the single source of truth for default colors
  const style: React.CSSProperties = {
    // Colors - fallback to CSS variables which have defaults in design-tokens.css
    "--rb-popup-bg": design.backgroundColor || "var(--rb-background, #FFFFFF)",
    "--rb-popup-fg": design.textColor || "var(--rb-foreground, #1A1A1A)",
    "--rb-popup-description-fg": design.descriptionColor || "var(--rb-muted, rgba(26, 26, 26, 0.6))",
    "--rb-popup-primary-bg": design.buttonColor || "var(--rb-primary, #007BFF)",
    "--rb-popup-primary-fg": design.buttonTextColor || "var(--rb-primary-foreground, #FFFFFF)",
    "--rb-popup-accent": design.accentColor || "var(--rb-primary, #007BFF)",
    "--rb-popup-success": design.successColor || "var(--rb-success, #10B981)",
    "--rb-popup-error": "var(--rb-error, #EF4444)",
    "--rb-popup-input-bg": design.inputBackgroundColor || "var(--rb-background, #FFFFFF)",
    "--rb-popup-input-fg": design.inputTextColor || design.textColor || "var(--rb-foreground, #1A1A1A)",
    "--rb-popup-input-border": design.inputBorderColor || "var(--rb-border, rgba(26, 26, 26, 0.15))",

    // Dimensions & Shape
    "--rb-popup-radius":
      typeof design.borderRadius === "number"
        ? `${design.borderRadius}px`
        : design.borderRadius || "12px",
    "--rb-popup-font-family":
      design.fontFamily ||
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",

    // Max widths based on size (matches spec)
    // small: ~400px, medium: ~560-600px, large: ~720-800px
    "--rb-popup-max-w":
      actualSize === "large" ? "800px" : actualSize === "medium" ? "600px" : "400px",

    // Padding based on size
    "--rb-popup-padding":
      actualSize === "large" ? "2rem" : actualSize === "medium" ? "1.5rem" : "1.25rem",

    // Gap
    "--rb-popup-gap": "1.5rem",
  } as React.CSSProperties;

  return { style, "data-size": actualSize };
}
