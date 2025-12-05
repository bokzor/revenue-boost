/**
 * useDesignVariables Hook
 *
 * Converts DesignConfig into CSS custom properties (variables) for consistent styling.
 * This approach provides:
 * - Single point of definition (no prop drilling)
 * - Easy extensibility (add new property = add to hook + use in CSS)
 * - Better performance (pure CSS, no React re-renders for style changes)
 * - Easy debugging (visible in browser DevTools)
 *
 * Naming convention: --rb-popup-{category}-{property}
 * Categories: bg, fg, button, input, layout, spacing
 *
 * @example
 * ```tsx
 * const cssVars = useDesignVariables(config);
 * return <div style={cssVars}>...</div>;
 *
 * // In child component CSS:
 * // border-radius: var(--rb-popup-input-radius, 8px);
 * ```
 */

import { useMemo } from "react";
import type { PopupDesignConfig } from "../types";

/**
 * Spacing map for contentSpacing values
 */
const SPACING_MAP = {
  compact: "0.75rem",
  comfortable: "1rem",
  spacious: "1.5rem",
} as const;

/**
 * Convert a value to pixels if it's a number
 */
function toPx(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return `${value}px`;
  return value;
}

/**
 * CSS variable type for style prop
 */
export type CSSVariables = Record<string, string | undefined>;

/**
 * Hook that converts PopupDesignConfig into CSS custom properties
 */
export function useDesignVariables(config: Partial<PopupDesignConfig>): CSSVariables {
  return useMemo(() => {
    const vars: CSSVariables = {
      // ===========================================
      // COLORS
      // ===========================================
      "--rb-popup-bg": config.backgroundColor,
      "--rb-popup-fg": config.textColor,
      "--rb-popup-description-color": config.descriptionColor,
      "--rb-popup-accent": config.accentColor,

      // Button colors
      "--rb-popup-button-bg": config.buttonColor,
      "--rb-popup-button-fg": config.buttonTextColor,
      "--rb-popup-button-secondary-bg": config.secondaryButtonColor,
      "--rb-popup-button-secondary-fg": config.secondaryButtonTextColor,

      // Input colors
      "--rb-popup-input-bg": config.inputBackgroundColor,
      "--rb-popup-input-fg": config.inputTextColor,
      "--rb-popup-input-border": config.inputBorderColor,

      // Overlay
      "--rb-popup-overlay-color": config.overlayColor,
      "--rb-popup-overlay-opacity": config.overlayOpacity?.toString(),

      // ===========================================
      // BORDER RADIUS
      // ===========================================
      "--rb-popup-radius": toPx(config.borderRadius),
      "--rb-popup-button-radius": toPx(config.buttonBorderRadius),
      "--rb-popup-input-radius": toPx(config.inputBorderRadius),
      "--rb-popup-image-radius": toPx(config.imageBorderRadius),

      // ===========================================
      // SHADOWS
      // ===========================================
      "--rb-popup-button-shadow": config.buttonBoxShadow,
      "--rb-popup-input-shadow": config.inputBoxShadow,

      // ===========================================
      // LAYOUT & SPACING
      // ===========================================
      "--rb-popup-text-align": config.textAlign,
      "--rb-popup-gap": config.contentSpacing
        ? SPACING_MAP[config.contentSpacing]
        : undefined,

      // ===========================================
      // TYPOGRAPHY
      // ===========================================
      "--rb-popup-font-family": config.fontFamily,
      "--rb-popup-headline-font": config.headlineFontFamily,
      "--rb-popup-title-size": config.titleFontSize,
      "--rb-popup-title-weight": config.titleFontWeight,
      "--rb-popup-title-shadow": config.titleTextShadow,
      "--rb-popup-description-size": config.descriptionFontSize,
      "--rb-popup-description-weight": config.descriptionFontWeight,

      // ===========================================
      // INPUT FOCUS & STYLING
      // ===========================================
      "--rb-popup-input-border-width": toPx(config.inputBorderWidth),
      "--rb-popup-input-focus-ring-color": config.inputFocusRingColor,
      "--rb-popup-input-focus-ring-width": toPx(config.inputFocusRingWidth),

      // ===========================================
      // BADGE/TAG STYLING
      // ===========================================
      "--rb-popup-badge-bg": config.badgeBackgroundColor,
      "--rb-popup-badge-fg": config.badgeTextColor,
      "--rb-popup-badge-radius": toPx(config.badgeBorderRadius),

      // ===========================================
      // CHECKBOX STYLING
      // ===========================================
      "--rb-popup-checkbox-radius": toPx(config.checkboxBorderRadius),
      "--rb-popup-checkbox-size": toPx(config.checkboxSize),

      // ===========================================
      // IMAGE EFFECTS
      // ===========================================
      "--rb-popup-image-filter": config.imageFilter,

      // ===========================================
      // SCRATCH CARD SPECIFIC
      // ===========================================
      "--rb-popup-scratch-bg": config.scratchCardBackgroundColor,
      "--rb-popup-scratch-fg": config.scratchCardTextColor,
      "--rb-popup-scratch-overlay": config.scratchOverlayColor,
    };

    // Filter out undefined values
    return Object.fromEntries(
      Object.entries(vars).filter(([, value]) => value !== undefined)
    ) as CSSVariables;
  }, [config]);
}

export default useDesignVariables;

