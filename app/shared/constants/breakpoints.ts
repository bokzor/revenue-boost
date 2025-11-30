/**
 * Centralized Breakpoints System
 *
 * Single source of truth for all responsive breakpoints across the app.
 * Use these constants instead of hardcoding pixel values.
 *
 * @example
 * ```tsx
 * // In CSS-in-JS template strings
 * import { BREAKPOINTS, mq, cq } from '~/shared/constants/breakpoints';
 *
 * const styles = `
 *   @media ${mq.mobile} { ... }
 *   @container ${cq.tablet} { ... }
 * `;
 *
 * // In JS for runtime checks
 * if (window.innerWidth <= BREAKPOINTS.mobile) { ... }
 * ```
 */

// =============================================================================
// BREAKPOINT VALUES (pixels)
// =============================================================================

/**
 * Core breakpoint values in pixels.
 * These define the boundaries between device size categories.
 */
export const BREAKPOINTS = {
  /** Extra small - very small phones (360-379px) */
  xs: 380,
  /** Small mobile - standard phones in portrait (380-479px) */
  sm: 480,
  /** Medium mobile - large phones, small tablets (480-639px) */
  md: 640,
  /** Tablet - tablets in portrait, small laptops (640-767px) */
  tablet: 768,
  /** Desktop - standard desktop screens (768-1023px) */
  desktop: 1024,
  /** Wide - large desktop screens (1024px+) */
  wide: 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// =============================================================================
// CONTAINER QUERY BREAKPOINTS (for popup components)
// =============================================================================

/**
 * Container query breakpoints for popup components.
 * These are used for intrinsic sizing based on the popup container width,
 * not the viewport width. This allows popups to respond to their own size.
 */
export const CONTAINER_BREAKPOINTS = {
  /** Compact popups, mobile-first (< 400px container) */
  compact: 400,
  /** Small popups (400-519px container) */
  small: 520,
  /** Medium popups (520-639px container) */
  medium: 640,
  /** Large popups (640-699px container) */
  large: 700,
  /** Extra large popups (700px+ container) */
  xl: 800,
} as const;

export type ContainerBreakpointKey = keyof typeof CONTAINER_BREAKPOINTS;

// =============================================================================
// MEDIA QUERY HELPERS
// =============================================================================

/**
 * Generate a media query string for a given breakpoint.
 *
 * @param breakpoint - The breakpoint key or custom pixel value
 * @param type - 'max' for mobile-first (max-width), 'min' for desktop-first (min-width)
 * @returns CSS media query condition string (without @media prefix)
 *
 * @example
 * ```tsx
 * `@media ${mediaQuery('mobile')}` // => "@media (max-width: 480px)"
 * `@media ${mediaQuery('tablet', 'min')}` // => "@media (min-width: 769px)"
 * ```
 */
export function mediaQuery(
  breakpoint: BreakpointKey | number,
  type: 'max' | 'min' = 'max'
): string {
  const px = typeof breakpoint === 'number' ? breakpoint : BREAKPOINTS[breakpoint];
  return type === 'max' ? `(max-width: ${px}px)` : `(min-width: ${px + 1}px)`;
}

/**
 * Pre-built media query strings for common breakpoints.
 * Use these directly in template strings.
 *
 * @example
 * ```tsx
 * const styles = `
 *   @media ${mq.mobile} {
 *     .popup { width: 100%; }
 *   }
 * `;
 * ```
 */
export const mq = {
  /** max-width: 380px */
  xs: mediaQuery('xs'),
  /** max-width: 480px */
  sm: mediaQuery('sm'),
  /** max-width: 640px */
  md: mediaQuery('md'),
  /** max-width: 768px - most common for tablet/mobile split */
  tablet: mediaQuery('tablet'),
  /** max-width: 1024px */
  desktop: mediaQuery('desktop'),
  /** min-width: 1025px */
  wide: mediaQuery('desktop', 'min'),

  // Aliases for common usage
  /** Alias for sm - max-width: 480px */
  mobile: mediaQuery('sm'),
} as const;

// =============================================================================
// CONTAINER QUERY HELPERS
// =============================================================================

/**
 * Generate a container query string for a given breakpoint.
 *
 * @param breakpoint - The container breakpoint key or custom pixel value
 * @param type - 'max' for small containers, 'min' for large containers
 * @returns CSS container query condition string (without @container prefix)
 */
export function containerQuery(
  breakpoint: ContainerBreakpointKey | number,
  type: 'max' | 'min' = 'max'
): string {
  const px = typeof breakpoint === 'number' ? breakpoint : CONTAINER_BREAKPOINTS[breakpoint];
  return type === 'max' ? `(max-width: ${px}px)` : `(min-width: ${px + 1}px)`;
}

/**
 * Pre-built container query strings for popup components.
 *
 * @example
 * ```tsx
 * const styles = `
 *   @container popup ${cq.compact} {
 *     .content { padding: 1rem; }
 *   }
 * `;
 * ```
 */
export const cq = {
  /** max-width: 400px container */
  compact: containerQuery('compact'),
  /** max-width: 520px container */
  small: containerQuery('small'),
  /** max-width: 640px container */
  medium: containerQuery('medium'),
  /** min-width: 641px container */
  mediumUp: containerQuery('medium', 'min'),
  /** max-width: 700px container */
  large: containerQuery('large'),
  /** min-width: 701px container */
  largeUp: containerQuery('large', 'min'),
  /** min-width: 801px container */
  xlUp: containerQuery('xl', 'min'),
} as const;

