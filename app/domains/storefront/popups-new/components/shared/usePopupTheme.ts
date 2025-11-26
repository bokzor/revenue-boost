import { useMemo } from "react";
import type { PopupDesignConfig } from "../../types";

/**
 * Computed theme values derived from PopupDesignConfig
 */
export interface PopupTheme {
  // Core colors
  backgroundColor: string;
  textColor: string;
  descriptionColor: string;
  buttonColor: string;
  buttonTextColor: string;
  accentColor: string;
  successColor: string;
  errorColor: string;

  // Input colors
  inputBackgroundColor: string;
  inputTextColor: string;
  inputBorderColor: string;
  inputPlaceholderColor: string;

  // Overlay colors
  overlayColor: string;
  overlayOpacity: number;
  overlayRgba: string;

  // Image colors
  imageBgColor: string;

  // Typography
  fontFamily: string;
  borderRadius: string;

  // Utility functions
  withOpacity: (color: string, opacity: number) => string;
  getContrastColor: (backgroundColor: string) => string;
}

/**
 * usePopupTheme Hook
 * 
 * Centralizes color and theme calculations from PopupDesignConfig.
 * Provides computed values, fallbacks, and utility functions for color manipulation.
 * 
 * @param config - PopupDesignConfig with color and design properties
 * @returns PopupTheme object with computed colors and utilities
 */
export function usePopupTheme(config: PopupDesignConfig): PopupTheme {
  return useMemo(() => {
    // Core colors with fallbacks
    const backgroundColor = config.backgroundColor || "#ffffff";
    const textColor = config.textColor || "#111827";
    const descriptionColor = config.descriptionColor || "#6b7280";
    const buttonColor = config.buttonColor || "#000000";
    const buttonTextColor = config.buttonTextColor || "#ffffff";
    const accentColor = config.accentColor || "#dbeafe";
    const successColor = config.successColor || "#16a34a";
    const errorColor = "#b91c1c"; // Standard error color

    // Input colors with fallbacks
    const inputBackgroundColor = config.inputBackgroundColor || "#ffffff";
    const inputTextColor = config.inputTextColor || textColor;
    const inputBorderColor = config.inputBorderColor || "#e5e7eb";
    const inputPlaceholderColor = withOpacity(inputTextColor, 0.5);

    // Overlay colors
    const overlayColor = config.overlayColor || "#000000";
    const overlayOpacity = config.overlayOpacity ?? 0.6;
    const overlayRgba = hexToRgba(overlayColor, overlayOpacity);

    // Image colors
    const imageBgColor = config.imageBgColor || "#f3f4f6";

    // Typography
    const fontFamily =
      config.fontFamily ||
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
    const borderRadius =
      typeof config.borderRadius === "number"
        ? `${config.borderRadius}px`
        : config.borderRadius || "12px";

    return {
      // Core colors
      backgroundColor,
      textColor,
      descriptionColor,
      buttonColor,
      buttonTextColor,
      accentColor,
      successColor,
      errorColor,

      // Input colors
      inputBackgroundColor,
      inputTextColor,
      inputBorderColor,
      inputPlaceholderColor,

      // Overlay colors
      overlayColor,
      overlayOpacity,
      overlayRgba,

      // Image colors
      imageBgColor,

      // Typography
      fontFamily,
      borderRadius,

      // Utility functions
      withOpacity,
      getContrastColor,
    };
  }, [config]);
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  // Handle rgba/rgb colors
  if (hex.startsWith("rgba") || hex.startsWith("rgb")) {
    return hex;
  }

  // Parse hex color
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Add opacity to any color (hex or rgba)
 */
function withOpacity(color: string, opacity: number): string {
  return hexToRgba(color, opacity);
}

/**
 * Get contrasting text color (black or white) based on background luminance
 * Uses YIQ formula for better perceived brightness
 */
function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return "#ffffff"; // Fallback to white for invalid colors

  // YIQ formula for perceived brightness
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  // Return dark text for light backgrounds (yiq >= 128), white text for dark backgrounds
  return yiq >= 128 ? "#111827" : "#ffffff";
}

/**
 * Convert hex to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace("#", "");
  const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
  return match
    ? {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      }
    : null;
}

