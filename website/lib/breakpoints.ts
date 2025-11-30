/**
 * Centralized Breakpoints for Website
 *
 * Single source of truth for responsive breakpoints in the marketing website.
 */

export const BREAKPOINTS = {
  /** Mobile devices */
  mobile: 480,
  /** Tablets */
  tablet: 768,
  /** Desktop */
  desktop: 1024,
  /** Wide screens */
  wide: 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

