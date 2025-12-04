import React from "react";

/**
 * PopupHeader Component
 *
 * A reusable component for displaying popup headlines and subheadlines.
 * Supports flexible typography, alignment, and spacing options.
 * Used across all popup templates for consistent header styling.
 *
 * @example
 * ```tsx
 * // Basic headline only
 * <PopupHeader headline="Join Our Newsletter" />
 *
 * // With subheadline
 * <PopupHeader
 *   headline="Join Our Newsletter"
 *   subheadline="Subscribe to get special offers and updates"
 * />
 *
 * // Custom alignment
 * <PopupHeader
 *   headline="Limited Time Offer"
 *   subheadline="Don't miss out!"
 *   align="left"
 * />
 *
 * // Custom typography
 * <PopupHeader
 *   headline="Flash Sale!"
 *   subheadline="50% off everything"
 *   headlineFontSize="2.5rem"
 *   headlineFontWeight="900"
 *   subheadlineFontSize="1.25rem"
 *   textColor="#ff0000"
 * />
 *
 * // Custom spacing
 * <PopupHeader
 *   headline="Welcome"
 *   subheadline="Get started today"
 *   spacing="1rem"
 *   marginBottom="2rem"
 * />
 *
 * // Different description color
 * <PopupHeader
 *   headline="Special Offer"
 *   subheadline="Limited time only"
 *   textColor="#000000"
 *   descriptionColor="#666666"
 * />
 * ```
 *
 * @component
 * @category Shared Components
 * @subcategory Phase 2 - Core Components
 */
export interface PopupHeaderProps {
  /**
   * Main headline text
   */
  headline: string;
  /**
   * Optional subheadline/description text
   */
  subheadline?: string;
  /**
   * Text color for headline and subheadline
   * @default "#111827"
   */
  textColor?: string;
  /**
   * Description color (if different from textColor)
   * Falls back to textColor with reduced opacity
   */
  descriptionColor?: string;
  /**
   * Font size for headline
   * @default "1.875rem" (28px)
   */
  headlineFontSize?: string;
  /**
   * Font size for subheadline
   * @default "1rem" (16px)
   */
  subheadlineFontSize?: string;
  /**
   * Font weight for headline
   * @default "700"
   */
  headlineFontWeight?: string | number;
  /**
   * Font weight for subheadline
   * @default "400"
   */
  subheadlineFontWeight?: string | number;
  /**
   * Font family for headline (e.g., "Georgia, serif")
   */
  headlineFontFamily?: string;
  /**
   * Text alignment
   * @default "center"
   */
  align?: "left" | "center" | "right";
  /**
   * Spacing between headline and subheadline
   * @default "0.75rem"
   */
  spacing?: string;
  /**
   * Bottom margin after the entire header
   * @default "1.5rem"
   */
  marginBottom?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
}

/**
 * PopupHeader Component
 * 
 * Displays a headline and optional subheadline with consistent styling.
 * Used across multiple popup types for consistent header presentation.
 * Supports flexible typography, alignment, and spacing options.
 * 
 * @example
 * ```tsx
 * <PopupHeader
 *   headline="Join Our Newsletter"
 *   subheadline="Subscribe to get special offers and exclusive deals."
 *   textColor="#111827"
 *   align="center"
 * />
 * ```
 */
export const PopupHeader: React.FC<PopupHeaderProps> = ({
  headline,
  subheadline,
  textColor = "#111827",
  descriptionColor,
  headlineFontSize = "1.875rem",
  subheadlineFontSize = "1rem",
  headlineFontWeight = "700",
  subheadlineFontWeight = "400",
  headlineFontFamily,
  align = "center",
  spacing = "0.75rem",
  marginBottom = "1.5rem",
  className,
  style,
}) => {
  const containerStyles: React.CSSProperties = {
    textAlign: align,
    marginBottom,
    ...style,
  };

  const headlineStyles: React.CSSProperties = {
    margin: 0,
    fontSize: headlineFontSize,
    fontWeight: headlineFontWeight,
    fontFamily: headlineFontFamily || "var(--rb-popup-headline-font, inherit)",
    color: textColor,
    lineHeight: 1.2,
    marginBottom: subheadline ? spacing : 0,
  };

  const subheadlineStyles: React.CSSProperties = {
    margin: 0,
    fontSize: subheadlineFontSize,
    fontWeight: subheadlineFontWeight,
    color: descriptionColor || textColor,
    opacity: descriptionColor ? 1 : 0.85,
    lineHeight: 1.6,
  };

  return (
    <div className={className} style={containerStyles}>
      <h2 style={headlineStyles}>{headline}</h2>
      {subheadline && <p style={subheadlineStyles}>{subheadline}</p>}
    </div>
  );
};

