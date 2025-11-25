/**
 * Popup Spacing System
 * 
 * Based on FlashSale popup's proven spacing patterns.
 * This creates visual hierarchy through consistent spacing:
 * - Tight spacing within components (groups related elements)
 * - Medium spacing between minor sections (creates rhythm)
 * - Large spacing between major sections (creates clear breaks)
 * - Generous padding on containers (prevents cramped feeling)
 */

/**
 * Spacing constants based on FlashSale's system
 */
export const POPUP_SPACING = {
  /**
   * Container padding (outer breathing room)
   * Use based on popup size configuration
   */
  padding: {
    compact: '2rem 1.5rem',      // 32px vertical, 24px horizontal
    medium: '2.5rem 2rem',       // 40px vertical, 32px horizontal (default)
    wide: '3rem',                // 48px all around
    full: '3rem',                // 48px all around
  },

  /**
   * Vertical spacing (margin-bottom)
   * Use to create visual hierarchy between sections
   */
  section: {
    xs: '0.5rem',   // 8px  - Tight grouping (e.g., headline → subheadline)
    sm: '0.75rem',  // 12px - Related elements (e.g., badge → headline)
    md: '1rem',     // 16px - Small breaks (e.g., urgency message, reservation)
    lg: '1.5rem',   // 24px - Major sections (e.g., timer, inventory, discount message)
    xl: '2rem',     // 32px - Large breaks (e.g., supporting text → action area)
  },

  /**
   * Component internal padding
   * Use for buttons, badges, cards, etc.
   */
  component: {
    badge: '0.5rem 1.5rem',           // 8px 24px
    badgeCompact: '0.375rem 1rem',    // 6px 16px
    button: '1rem 2rem',              // 16px 32px
    buttonCompact: '0.75rem 1.5rem',  // 12px 24px
    buttonSecondary: '0.75rem 2rem',  // 12px 32px
    card: '1rem 1.5rem',              // 16px 24px
    cardLarge: '1.5rem 2rem',         // 24px 32px
    input: '0.75rem 1rem',            // 12px 16px
    timerUnit: '1rem 0.75rem',        // 16px 12px
    message: '1rem 1.5rem',           // 16px 24px
    inventory: '0.75rem 1.25rem',     // 12px 20px
  },

  /**
   * Gaps (flex/grid spacing)
   * Use for spacing between items in flex/grid containers
   */
  gap: {
    xs: '0.5rem',   // 8px  - Internal component gaps (e.g., timer unit internal)
    sm: '0.75rem',  // 12px - Between related items (e.g., timer units)
    md: '1rem',     // 16px - Default gap
    lg: '1.25rem',  // 20px - Form fields
    xl: '1.5rem',   // 24px - Major sections
  },
} as const;

/**
 * Get container padding based on popup size
 * Accepts both PopupSize ('small' | 'medium' | 'large') and FlashSale-specific sizes
 */
export function getContainerPadding(
  popupSize?: 'compact' | 'medium' | 'wide' | 'full' | 'small' | 'large'
): string {
  // Map PopupSize to FlashSale size format
  let size: 'compact' | 'medium' | 'wide' | 'full' = 'medium';

  if (popupSize === 'small') {
    size = 'compact';
  } else if (popupSize === 'large') {
    size = 'wide';
  } else if (popupSize === 'compact' || popupSize === 'medium' || popupSize === 'wide' || popupSize === 'full') {
    size = popupSize;
  }

  return POPUP_SPACING.padding[size];
}

/**
 * Get responsive padding that adapts to popup size
 * Useful for components that need to scale with popup size
 */
export function getResponsivePadding(
  popupSize?: 'compact' | 'medium' | 'wide' | 'full' | 'small' | 'large',
  mobile?: boolean
): string {
  if (mobile) {
    return POPUP_SPACING.padding.compact;
  }
  return getContainerPadding(popupSize);
}

/**
 * CSS custom properties for spacing
 * Use this in your style blocks to access spacing values
 */
export const SPACING_CSS_VARS = `
  --popup-padding-compact: ${POPUP_SPACING.padding.compact};
  --popup-padding-medium: ${POPUP_SPACING.padding.medium};
  --popup-padding-wide: ${POPUP_SPACING.padding.wide};
  
  --popup-section-xs: ${POPUP_SPACING.section.xs};
  --popup-section-sm: ${POPUP_SPACING.section.sm};
  --popup-section-md: ${POPUP_SPACING.section.md};
  --popup-section-lg: ${POPUP_SPACING.section.lg};
  --popup-section-xl: ${POPUP_SPACING.section.xl};
  
  --popup-gap-xs: ${POPUP_SPACING.gap.xs};
  --popup-gap-sm: ${POPUP_SPACING.gap.sm};
  --popup-gap-md: ${POPUP_SPACING.gap.md};
  --popup-gap-lg: ${POPUP_SPACING.gap.lg};
  --popup-gap-xl: ${POPUP_SPACING.gap.xl};
`;

/**
 * Helper to generate margin-bottom styles
 */
export function marginBottom(size: keyof typeof POPUP_SPACING.section): string {
  return POPUP_SPACING.section[size];
}

/**
 * Helper to generate gap styles
 */
export function gap(size: keyof typeof POPUP_SPACING.gap): string {
  return POPUP_SPACING.gap[size];
}

/**
 * Spacing guidelines for common popup sections
 */
export const SPACING_GUIDELINES = {
  // After badge/label at top
  afterBadge: POPUP_SPACING.section.md,
  
  // After headline (tight to keep with subheadline)
  afterHeadline: POPUP_SPACING.section.sm,
  
  // After subheadline/description (major break before action area)
  afterDescription: POPUP_SPACING.section.xl,
  
  // Between major sections (timer, inventory, discount message)
  betweenSections: POPUP_SPACING.section.lg,
  
  // Between form fields
  betweenFields: POPUP_SPACING.gap.lg,
  
  // Between buttons
  betweenButtons: POPUP_SPACING.section.sm,
  
  // Before CTA button (from last content element)
  beforeCTA: POPUP_SPACING.section.lg,
} as const;

