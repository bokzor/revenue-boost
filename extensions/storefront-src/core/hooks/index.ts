/**
 * Hook Registry - Central configuration for pre-display hooks
 *
 * This file registers all hooks with their respective template types.
 * Import this file to initialize the hook system.
 */

import { HookRegistry } from '../PreDisplayHook';
import { ChallengeTokenHook } from './ChallengeTokenHook';
import { BackgroundImageHook } from './BackgroundImageHook';
import { ProductDataHook } from './ProductDataHook';
import { CartDataHook } from './CartDataHook';
import { InventoryDataHook } from './InventoryDataHook';

// Create hook instances
const challengeTokenHook = new ChallengeTokenHook();
const backgroundImageHook = new BackgroundImageHook();
const productDataHook = new ProductDataHook();
const cartDataHook = new CartDataHook();
const inventoryDataHook = new InventoryDataHook();

// Register hooks for NEWSLETTER template
HookRegistry.register('NEWSLETTER', challengeTokenHook);
HookRegistry.register('NEWSLETTER', backgroundImageHook);

// Register hooks for SPIN_TO_WIN template
HookRegistry.register('SPIN_TO_WIN', challengeTokenHook);
HookRegistry.register('SPIN_TO_WIN', backgroundImageHook); // Preload background images

// Register hooks for SCRATCH_CARD template
HookRegistry.register('SCRATCH_CARD', challengeTokenHook);
HookRegistry.register('SCRATCH_CARD', backgroundImageHook); // Preload background images

// Register hooks for PRODUCT_UPSELL template
HookRegistry.register('PRODUCT_UPSELL', challengeTokenHook);
HookRegistry.register('PRODUCT_UPSELL', productDataHook);
HookRegistry.register('PRODUCT_UPSELL', backgroundImageHook); // Preload background images

// Register hooks for CART_ABANDONMENT template
HookRegistry.register('CART_ABANDONMENT', challengeTokenHook);
HookRegistry.register('CART_ABANDONMENT', cartDataHook);
HookRegistry.register('CART_ABANDONMENT', backgroundImageHook); // Preload background images

// Register hooks for FLASH_SALE template
HookRegistry.register('FLASH_SALE', backgroundImageHook);
HookRegistry.register('FLASH_SALE', productDataHook);
HookRegistry.register('FLASH_SALE', inventoryDataHook);

// Register hooks for EXIT_INTENT template (usually similar to newsletter)
HookRegistry.register('EXIT_INTENT', challengeTokenHook);
HookRegistry.register('EXIT_INTENT', backgroundImageHook);

// Register hooks for ANNOUNCEMENT template
HookRegistry.register('ANNOUNCEMENT', backgroundImageHook);

// Register hooks for COUNTDOWN_TIMER template
HookRegistry.register('COUNTDOWN_TIMER', backgroundImageHook);

// Register hooks for FREE_SHIPPING template
// NOTE: Challenge token is NOT pre-loaded for FREE_SHIPPING
// It's lazy-loaded only when needed (threshold reached + email required)
// This prevents unnecessary token requests for banners that just show progress

// Register hooks for SOCIAL_PROOF template
// Social proof typically doesn't need pre-loading, but we can add hooks if needed

console.log('[PreDisplayHook] Hook registry initialized');

// Re-export main functions for convenience
export { executeHooksForCampaign, clearCampaignCache, clearAllCaches } from '../PreDisplayHook';
