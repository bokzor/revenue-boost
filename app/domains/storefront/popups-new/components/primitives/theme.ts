import type { PopupDesignConfig, PopupSize } from "../../types";

export function varsFromDesign(
  design: PopupDesignConfig,
  size: PopupSize | undefined
): { style: React.CSSProperties; "data-size": string } {
  const actualSize = size || "medium";

  const style: React.CSSProperties = {
    // Colors
    "--rb-popup-bg": design.backgroundColor || "#ffffff",
    "--rb-popup-fg": design.textColor || "#111827",
    "--rb-popup-description-fg": design.descriptionColor || "#6b7280",
    "--rb-popup-primary-bg": design.buttonColor || "#000000",
    "--rb-popup-primary-fg": design.buttonTextColor || "#ffffff",
    "--rb-popup-accent": design.accentColor || "#dbeafe",
    "--rb-popup-success": design.successColor || "#16a34a",
    "--rb-popup-error": "#b91c1c", // Standard error color
    "--rb-popup-input-bg": design.inputBackgroundColor || "#ffffff",
    "--rb-popup-input-fg": design.inputTextColor || design.textColor || "#111827",
    "--rb-popup-input-border": design.inputBorderColor || "#e5e7eb",

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
  } as any;

  return { style, "data-size": actualSize };
}
