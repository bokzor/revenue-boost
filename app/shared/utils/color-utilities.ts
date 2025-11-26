/**
 * Color Utilities
 *
 * Utility functions for color manipulation, validation, and accessibility
 */

import type {
  ExtendedColorConfig,
  ColorValidationResult,
} from "~/domains/popups/color-customization.types";

/**
 * Validate a hex color string
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate all colors in a configuration
 */
export function validateColors(colors: ExtendedColorConfig): ColorValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contrastRatios: {
    textOnBackground: number;
    buttonTextOnButton: number;
    [key: string]: number;
  } = {
    textOnBackground: 0,
    buttonTextOnButton: 0,
  };

  // Validate hex colors
  const colorKeys: (keyof ExtendedColorConfig)[] = [
    "backgroundColor",
    "textColor",
    "buttonColor",
    "buttonTextColor",
  ];

  for (const key of colorKeys) {
    const value = colors[key];
    if (value && typeof value === "string" && !isValidHexColor(value)) {
      errors.push(`Invalid hex color for ${key}: ${value}`);
    }
  }

  // Check contrast ratios
  if (colors.backgroundColor && colors.textColor) {
    const ratio = calculateContrastRatio(colors.backgroundColor, colors.textColor);
    contrastRatios.textOnBackground = ratio;
    if (ratio < 4.5) {
      warnings.push(`Low contrast ratio (${ratio.toFixed(2)}) between text and background`);
    }
  }

  if (colors.buttonColor && colors.buttonTextColor) {
    const ratio = calculateContrastRatio(colors.buttonColor, colors.buttonTextColor);
    contrastRatios.buttonTextOnButton = ratio;
    if (ratio < 4.5) {
      warnings.push(`Low contrast ratio (${ratio.toFixed(2)}) between button text and button`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    contrastRatios,
  };
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get contrasting text color (black or white) based on background luminance
 * Uses YIQ formula for better perceived brightness
 *
 * @param backgroundColor - Hex color string (e.g., "#FFFFFF")
 * @returns "#111827" for light backgrounds, "#FFFFFF" for dark backgrounds
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return "#FFFFFF"; // Fallback to white for invalid colors

  // YIQ formula for perceived brightness
  // This gives better results than simple RGB averaging
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  // Return dark text for light backgrounds (yiq >= 128), white text for dark backgrounds
  return yiq >= 128 ? "#111827" : "#FFFFFF";
}
