/**
 * useDesignTokens Hook
 *
 * Converts CampaignDesign into CSS custom properties (--rb-*) for styling.
 *
 * Theme Mode Resolution:
 * - "shopify": Uses tokens extracted from the store's Shopify theme
 * - "preset": Uses tokens from a predefined design preset
 * - "custom": Uses manually specified tokens
 *
 * Usage:
 * ```tsx
 * const { tokenStyles, tokens } = useDesignTokens(campaign.designConfig, shopifyTokens);
 * return <div className="rb-popup-container" style={tokenStyles}>...</div>;
 * ```
 */

import { useMemo } from "react";
import {
  type CampaignDesign,
  type DesignTokens,
  resolveDesignTokens,
} from "~/domains/campaigns/types/design-tokens-runtime";

/**
 * CSS variable style object type
 */
export type TokenStyles = React.CSSProperties & Record<string, string>;

/**
 * Result from useDesignTokens hook
 */
export interface UseDesignTokensResult {
  /** Resolved design tokens */
  tokens: DesignTokens;
  /** CSS custom properties as style object (apply to container) */
  tokenStyles: TokenStyles;
  /** CSS string for inline style attribute */
  tokenStyleString: string;
}

/**
 * Hook that resolves design configuration to CSS custom properties.
 *
 * @param design Campaign design configuration
 * @param shopifyTokens Optional tokens from Shopify theme (for themeMode: "shopify")
 * @returns Resolved tokens and style objects
 */
export function useDesignTokens(
  design: CampaignDesign | undefined,
  shopifyTokens?: Partial<DesignTokens>
): UseDesignTokensResult {
  return useMemo(() => {
    // Resolve tokens based on theme mode
    const tokens = resolveDesignTokens(design, shopifyTokens);

    // Convert tokens to CSS custom properties (all 14 tokens)
    const tokenStyles: TokenStyles = {
      // Tier 1: Essential (5 tokens)
      "--rb-background": tokens.background,
      "--rb-foreground": tokens.foreground,
      "--rb-primary": tokens.primary,
      "--rb-muted": tokens.muted || `${tokens.foreground}99`, // 60% opacity fallback
      "--rb-radius": `${tokens.borderRadius}px`,
      // Tier 2: Common (5 tokens)
      "--rb-primary-foreground": tokens.primaryForeground,
      "--rb-surface": tokens.surface || tokens.background,
      "--rb-border": tokens.border || `${tokens.foreground}26`, // 15% opacity fallback
      "--rb-overlay": tokens.overlay || "rgba(0, 0, 0, 0.6)",
      "--rb-font-family": tokens.fontFamily,
      // Tier 3: Advanced (4 tokens)
      "--rb-success": tokens.success || "#10B981",
      "--rb-error": tokens.error || "#EF4444",
      "--rb-ring": tokens.ring || tokens.primary,
      "--rb-heading-font-family": tokens.headingFontFamily || tokens.fontFamily,
      // Structural
      "--rb-popup-radius": `${tokens.popupBorderRadius}px`,
    } as TokenStyles;

    // Generate CSS string for inline use
    const tokenStyleString = Object.entries(tokenStyles)
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");

    return { tokens, tokenStyles, tokenStyleString };
  }, [design, shopifyTokens]);
}

export default useDesignTokens;

