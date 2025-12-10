/**
 * useColorScheme Hook
 *
 * Provides consistent color scheme handling across popups.
 * Supports preset schemes (info, success, urgent) and custom colors.
 *
 * Used by: AnnouncementPopup, CountdownTimerPopup, SocialProofPopup
 */

import { useMemo } from "react";

export type ColorSchemeType = "custom" | "info" | "success" | "urgent";

export interface ColorSchemeColors {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  borderColor?: string;
}

export interface CustomColors {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
}

/**
 * useColorScheme - Get color scheme based on preset or custom colors
 *
 * @param colorScheme - Preset scheme or "custom"
 * @param customColors - Custom colors (used when colorScheme is "custom")
 * @returns Color scheme object with backgroundColor, textColor, accentColor
 *
 * @example
 * ```tsx
 * const colors = useColorScheme("info");
 * // Returns: { backgroundColor: "#3b82f6", textColor: "#ffffff", accentColor: "#2563eb" }
 *
 * const customColors = useColorScheme("custom", {
 *   backgroundColor: "#ff0000",
 *   textColor: "#ffffff",
 * });
 * ```
 */
export function useColorScheme(
  colorScheme: ColorSchemeType = "custom",
  customColors?: CustomColors
): ColorSchemeColors {
  return useMemo(() => {
    // Custom color scheme - use provided colors or CSS variable defaults
    if (colorScheme === "custom") {
      return {
        backgroundColor: customColors?.backgroundColor || "var(--rb-background, #FFFFFF)",
        textColor: customColors?.textColor || "var(--rb-foreground, #1A1A1A)",
        accentColor: customColors?.accentColor || "var(--rb-primary, #007BFF)",
        borderColor: customColors?.borderColor,
      };
    }

    // Preset color schemes
    const schemes: Record<Exclude<ColorSchemeType, "custom">, ColorSchemeColors> = {
      info: {
        backgroundColor: "#3b82f6",
        textColor: "#ffffff",
        accentColor: "#2563eb",
        borderColor: "#1d4ed8",
      },
      success: {
        backgroundColor: "#10b981",
        textColor: "#ffffff",
        accentColor: "#059669",
        borderColor: "#047857",
      },
      urgent: {
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
        accentColor: "#dc2626",
        borderColor: "#b91c1c",
      },
    };

    return schemes[colorScheme] || schemes.info;
  }, [colorScheme, customColors]);
}

/**
 * Helper function to get gradient background for color schemes
 * Some schemes support gradient backgrounds
 */
export function getColorSchemeGradient(colorScheme: ColorSchemeType): string | undefined {
  const gradients: Partial<Record<ColorSchemeType, string>> = {
    info: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    urgent: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
  };

  return gradients[colorScheme];
}

