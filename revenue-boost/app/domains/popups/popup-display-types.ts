/**
 * Popup Display Configuration Types
 * 
 * Defines display modes and configurations for popup components
 */

export type DisplayMode = "modal" | "drawer-overlay" | "slide-in" | "banner";
export type DrawerPosition = "top" | "bottom" | "left" | "right" | "bottom-of-drawer";
export type AnimationStyle = "fade" | "slide" | "zoom" | "bounce" | "scale" | "slide-up" | "slide-down";

/**
 * Base display configuration
 */
export interface PopupDisplayConfig {
  mode: DisplayMode;
  animation?: AnimationStyle;
  animationDuration?: number; // milliseconds
  overlayOpacity?: number; // 0-1
  overlayColor?: string;
  overlay?: {
    enabled?: boolean;
    opacity?: number;
    color?: string;
  };
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  zIndex?: number;
  padding?: string | number;
  width?: string | number;
  maxWidth?: string | number;
  height?: string | number;
  maxHeight?: string | number;
}

/**
 * Cart drawer specific display configuration
 */
export interface CartDrawerDisplayConfig extends PopupDisplayConfig {
  mode: "drawer-overlay";
  position: DrawerPosition;
  width?: string | number; // e.g., "400px" or 400
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  padding?: string | number;
  slideDistance?: number; // pixels to slide in from
  showProductImages?: boolean;
  showPrices?: boolean;
  compactMode?: boolean;
}

/**
 * Slide-in specific display configuration
 */
export interface SlideInDisplayConfig extends PopupDisplayConfig {
  mode: "slide-in";
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  width?: string | number;
  height?: string | number;
  offsetX?: number; // pixels from edge
  offsetY?: number; // pixels from edge
}

/**
 * Banner specific display configuration
 */
export interface BannerDisplayConfig extends PopupDisplayConfig {
  mode: "banner";
  position: "top" | "bottom";
  sticky?: boolean;
  height?: string | number;
  fullWidth?: boolean;
}

/**
 * Display preset configurations
 */
export const DISPLAY_PRESETS = {
  // Modal presets
  "modal-center": {
    mode: "modal" as const,
    animation: "fade" as const,
    animationDuration: 300,
    overlayOpacity: 0.6,
    closeOnOverlayClick: true,
    showCloseButton: true,
    zIndex: 1000,
  },
  "modal-zoom": {
    mode: "modal" as const,
    animation: "zoom" as const,
    animationDuration: 400,
    overlayOpacity: 0.7,
    closeOnOverlayClick: true,
    showCloseButton: true,
    zIndex: 1000,
  },
  
  // Drawer overlay presets
  "drawer-overlay-top": {
    mode: "drawer-overlay" as const,
    position: "top" as const,
    animation: "slide" as const,
    animationDuration: 300,
    height: "auto",
    maxHeight: "80vh",
    overlayOpacity: 0.4,
    closeOnOverlayClick: true,
    showCloseButton: true,
    zIndex: 1000,
  },
  "drawer-overlay-bottom": {
    mode: "drawer-overlay" as const,
    position: "bottom" as const,
    animation: "slide" as const,
    animationDuration: 300,
    height: "auto",
    maxHeight: "80vh",
    overlayOpacity: 0.4,
    closeOnOverlayClick: true,
    showCloseButton: true,
    zIndex: 1000,
  },
  "drawer-overlay-right": {
    mode: "drawer-overlay" as const,
    position: "right" as const,
    animation: "slide" as const,
    animationDuration: 300,
    width: 400,
    maxWidth: "90vw",
    overlayOpacity: 0.4,
    closeOnOverlayClick: true,
    showCloseButton: true,
    zIndex: 1000,
  },
  
  // Slide-in presets
  "slide-in-bottom-right": {
    mode: "slide-in" as const,
    position: "bottom-right" as const,
    animation: "slide" as const,
    animationDuration: 300,
    width: 350,
    offsetX: 20,
    offsetY: 20,
    showCloseButton: true,
    zIndex: 999,
  },
  
  // Banner presets
  "banner-top": {
    mode: "banner" as const,
    position: "top" as const,
    animation: "slide" as const,
    animationDuration: 300,
    sticky: true,
    fullWidth: true,
    showCloseButton: true,
    zIndex: 998,
  },
} as const;

export type DisplayPresetName = keyof typeof DISPLAY_PRESETS;

/**
 * Get a display preset by name
 */
export function getDisplayPreset(name: string): PopupDisplayConfig | CartDrawerDisplayConfig | null {
  return DISPLAY_PRESETS[name as DisplayPresetName] || null;
}

/**
 * Get mobile-optimized display configuration
 */
export function getMobileDisplayConfig(config: PopupDisplayConfig): PopupDisplayConfig {
  return {
    ...config,
    overlayOpacity: Math.min(config.overlayOpacity || 0.6, 0.5),
    animationDuration: Math.max(config.animationDuration || 300, 200),
  };
}

