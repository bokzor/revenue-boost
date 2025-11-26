/**
 * CartDataHook - Pre-loads cart data for cart abandonment templates
 *
 * Fetches current cart contents before the popup is displayed,
 * allowing immediate display of cart items and totals.
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';

export class CartDataHook implements PreDisplayHook {
    readonly name = 'cart';
    readonly runInPreview = false; // Skip in preview mode
    readonly timeoutMs = 3000; // 3 second timeout for cart API

    async execute(_context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
        try {
            console.log(`[CartDataHook] Fetching cart data`);

            const response = await fetch('/cart.js', { credentials: 'same-origin' });

            if (!response.ok) {
                throw new Error(`Cart fetch failed: ${response.status}`);
            }

            const cart = await response.json();

            // Normalize cart data
            const cartData = {
                items: cart.items || [],
                total: cart.total_price ? cart.total_price / 100 : 0,
                itemCount: cart.item_count || 0,
                currency: cart.currency,
            };

            return {
                success: true,
                data: cartData,
                hookName: this.name,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[CartDataHook] Failed to fetch cart:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
                hookName: this.name,
            };
        }
    }
}
