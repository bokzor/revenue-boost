import React from "react";
import type { PopupDesignConfig, PopupSize } from "../../types";
import { varsFromDesign } from "./theme";

export interface PopupCardProps extends React.HTMLAttributes<HTMLDivElement> {
  design: PopupDesignConfig;
  size?: PopupSize;
  as?: React.ElementType;
  variant?: "default" | "cart" | "upsell" | "hero" | "spin";
  twoColumn?: boolean;
  "data-testid"?: string;
}

/**
 * PopupCard
 *
 * The main container for modal popups.
 * Handles:
 * - Max-width based on size
 * - Background, text color, border radius
 * - Container query context for responsive children
 *
 * Uses inline styles for Shadow DOM compatibility
 */
export const PopupCard: React.FC<PopupCardProps> = ({
  design,
  size = "medium",
  as: Component = "div",
  className,
  style,
  children,
  variant = "default",
  twoColumn = false,
  "data-testid": testId = "popup-card",
  ...rest
}) => {
  const theme = varsFromDesign(design, size);

  // Adjust max-width for cart variant if needed (per spec analysis)
  const variantStyle = { ...theme.style } as Record<string, string>;
  if (variant === "cart") {
    // Cart often needs a bit more width on medium/large to fit table + sidebar
    if (size === "medium") variantStyle["--rb-popup-max-w"] = "640px";
    if (size === "large") variantStyle["--rb-popup-max-w"] = "840px";
  }

  const cardStyles: React.CSSProperties = {
    // Layout
    boxSizing: "border-box",
    position: "relative",
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "var(--rb-popup-gap)",
    width: "100%",
    maxWidth: "var(--rb-popup-max-w)",

    // Visual
    backgroundColor: "var(--rb-popup-bg)",
    color: "var(--rb-popup-fg)",
    borderRadius: "var(--rb-popup-radius)",
    padding: "var(--rb-popup-padding)",
    fontFamily: "var(--rb-popup-font-family)",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",

    // Container queries via CSS variable
    containerType: "inline-size",
    containerName: "popup-card",

    ...variantStyle,
    ...style,
  };

  return (
    <>
      {/* Inject container query styles for responsive behavior */}
      <style>{`
        [data-popup-card] {
          container-type: inline-size;
          container-name: popup-card;
        }
        
        ${
          twoColumn
            ? `
          @container popup-card (min-width: 480px) {
            [data-popup-card="two-column"] {
              grid-template-columns: 1.1fr 1fr;
            }
          }
        `
            : ""
        }
      `}</style>

      <Component
        data-popup-card={twoColumn ? "two-column" : "standard"}
        className={className}
        style={cardStyles}
        data-size={theme["data-size"]}
        data-testid={testId}
        {...rest}
      >
        {children}
      </Component>
    </>
  );
};
