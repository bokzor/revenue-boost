/**
 * CartDataHook - Pre-loads cart data for cart abandonment templates
 *
 * Fetches current cart contents before the popup is displayed,
 * allowing immediate display of cart items and totals.
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';

/** Raw cart item from Shopify's /cart.js endpoint */
interface ShopifyCartItem {
    id: number; // Line item ID
    product_id: number;
    variant_id: number;
    title: string;
    price: number; // In cents
    quantity: number;
    image?: string;
    handle?: string;
}

/** Normalized cart item for popup components */
interface NormalizedCartItem {
    id: string;
    productId: string; // Shopify Product GID
    variantId: string; // Shopify Variant GID
    title: string;
    price: string;
    quantity: number;
    imageUrl: string;
    handle?: string;
}

/**
 * Normalize Shopify cart items to the format expected by popup components
 */
function normalizeCartItems(items: ShopifyCartItem[]): NormalizedCartItem[] {
    return items.map((item) => ({
        id: String(item.id),
        productId: `gid://shopify/Product/${item.product_id}`,
        variantId: `gid://shopify/ProductVariant/${item.variant_id}`,
        title: item.title,
        price: (item.price / 100).toFixed(2),
        quantity: item.quantity,
        imageUrl: item.image || '',
        handle: item.handle,
    }));
}

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

            // Normalize cart data with proper product IDs for cart-scoped discounts
            const cartData = {
                items: normalizeCartItems(cart.items || []),
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
