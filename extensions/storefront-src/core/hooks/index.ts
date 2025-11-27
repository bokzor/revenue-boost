/**
 * Hook Registry - Central configuration for pre-display hooks
 *
 * This file registers all hooks with their respective template types.
 * Import this file to initialize the hook system.
 *
 * NOTE: Challenge token hooks have been removed. Bot detection is now handled
 * server-side via honeypot fields, timing validation, and impression verification.
 * This eliminates the latency that was previously added by pre-fetching tokens.
 */

import { HookRegistry } from '../PreDisplayHook';
import { BackgroundImageHook } from './BackgroundImageHook';
import { ProductDataHook } from './ProductDataHook';
import { CartDataHook } from './CartDataHook';
import { InventoryDataHook } from './InventoryDataHook';

// Create hook instances
const backgroundImageHook = new BackgroundImageHook();
const productDataHook = new ProductDataHook();
const cartDataHook = new CartDataHook();
const inventoryDataHook = new InventoryDataHook();

// Register hooks for NEWSLETTER template
HookRegistry.register('NEWSLETTER', backgroundImageHook);

// Register hooks for SCRATCH_CARD template
HookRegistry.register('SCRATCH_CARD', backgroundImageHook);

// Register hooks for PRODUCT_UPSELL template
HookRegistry.register('PRODUCT_UPSELL', productDataHook);

// Register hooks for CART_ABANDONMENT template
HookRegistry.register('CART_ABANDONMENT', cartDataHook);

// Register hooks for FLASH_SALE template
HookRegistry.register('FLASH_SALE', productDataHook);
HookRegistry.register('FLASH_SALE', inventoryDataHook);

// Register hooks for EXIT_INTENT template (usually similar to newsletter)
HookRegistry.register('EXIT_INTENT', backgroundImageHook);

// Register hooks for FREE_SHIPPING template
// No pre-loading needed - banners just show progress

// Register hooks for SOCIAL_PROOF template
// Social proof typically doesn't need pre-loading

// SPIN_TO_WIN - no hooks needed, renders immediately

console.log('[PreDisplayHook] Hook registry initialized');

// Re-export main functions for convenience
export { executeHooksForCampaign, clearCampaignCache, clearAllCaches } from '../PreDisplayHook';
