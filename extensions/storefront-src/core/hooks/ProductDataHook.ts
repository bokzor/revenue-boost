/**
 * ProductDataHook - Pre-loads product data for upsell and flash sale templates
 *
 * Fetches product information before the popup is displayed,
 * eliminating loading states and skeleton screens.
 *
 * Enhanced for Smart Recommendations:
 * - Detects current product ID from page context or trigger
 * - Detects trigger type for context-aware recommendations (RELATED vs COMPLEMENTARY)
 * - Fetches cart product IDs for cart-based recommendations
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';

/** Trigger types recognized by the smart recommendations API */
type TriggerType = 'product_view' | 'cart' | 'exit_intent' | 'scroll' | 'add_to_cart';

export class ProductDataHook implements PreDisplayHook {
    readonly name = 'products';
    // Run in preview so we can either load real products or fall back to
    // mocked preview products when none are available.
    readonly runInPreview = true;
    readonly timeoutMs = 5000; // 5 second timeout for API call

    async execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
        const { campaign, triggerContext, previewMode } = context;

        try {
            const templateType = campaign.templateType;

            console.log(`[ProductDataHook] Fetching products for ${templateType}`);

            // Extract product ID from trigger context (if available from add_to_cart trigger)
            const triggerProductId = triggerContext?.productId;
            if (triggerProductId) {
                console.log('[ProductDataHook] Using product ID from trigger context:', triggerProductId);
            }

            // Detect current product from page context (for product pages)
            const pageProductId = this.detectCurrentProductId();
            if (pageProductId) {
                console.log('[ProductDataHook] Detected product from page:', pageProductId);
            }

            // Use trigger product ID if available, otherwise use page product ID
            // Convert null to undefined for type compatibility
            const currentProductId = triggerProductId || pageProductId || undefined;

            // Detect trigger type from campaign's enhanced triggers
            const triggerType = this.detectTriggerType(campaign);
            console.log('[ProductDataHook] Detected trigger type:', triggerType);

            // Get cart product IDs for cart-based recommendations
            const cartProductIds = await this.getCartProductIds();
            if (cartProductIds.length > 0) {
                console.log('[ProductDataHook] Cart products:', cartProductIds.length);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products from API are dynamically typed
            let products: any[] = [];

            // All upsell template types that require product data
            const upsellTemplates = [
                'PRODUCT_UPSELL',
                'CLASSIC_UPSELL',
                'MINIMAL_SLIDE_UP',
                'PREMIUM_FULLSCREEN',
                'BUNDLE_DEAL',
                'COUNTDOWN_URGENCY',
            ];

            if (upsellTemplates.includes(templateType)) {
                // Pass full recommendation context for smart recommendations
                products = await this.fetchUpsellProducts(
                    campaign.id,
                    currentProductId,
                    triggerType,
                    cartProductIds
                );

                // In normal storefront mode, an upsell popup should
                // never render without real products. In preview, however,
                // we fall back to mocked products so merchants can still see
                // what the popup will look like.
                if (!products || products.length === 0) {
                    if (previewMode) {
                        console.warn(
                            `[ProductDataHook][Preview] No products available for ${templateType} campaign ${campaign.id}. Using mocked preview products instead.`,
                        );
                        products = this.buildPreviewMockProducts(campaign);
                    } else {
                        console.warn(
                            `[ProductDataHook] No products available for ${templateType} campaign ${campaign.id}. Popup will not display.`,
                        );
                        return {
                            success: false,
                            error: 'No products available for upsell',
                            hookName: this.name,
                        };
                    }
                }
            } else if (templateType === 'FLASH_SALE') {
                // Flash sale may have product configuration
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- campaign config is dynamically typed
                const contentConfig = campaign.contentConfig as any;
                if (contentConfig.productIds?.length > 0) {
                    products = await this.fetchFlashSaleProducts(campaign.id);
                }
            }

            console.log(`[ProductDataHook] Successfully loaded ${products.length} products`);

            // Preload first 3 product images for instant display
            if (products.length > 0) {
                await this.preloadProductImages(products.slice(0, 3));
            }

            return {
                success: true,
                data: products,
                hookName: this.name,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[ProductDataHook] Failed to fetch products:`, errorMessage);

            // In preview mode, fall back to mocked products even if the
            // network request failed so that the merchant still sees a
            // realistic popup.
            const upsellTemplatesForFallback = [
                'PRODUCT_UPSELL',
                'CLASSIC_UPSELL',
                'MINIMAL_SLIDE_UP',
                'PREMIUM_FULLSCREEN',
                'BUNDLE_DEAL',
                'COUNTDOWN_URGENCY',
            ];
            if (previewMode && upsellTemplatesForFallback.includes(campaign.templateType)) {
                console.warn(
                    '[ProductDataHook][Preview] Falling back to mocked products due to fetch error.',
                );
                const products = this.buildPreviewMockProducts(campaign);
                return {
                    success: true,
                    data: products,
                    hookName: this.name,
                };
            }

            return {
                success: false,
                error: errorMessage,
                hookName: this.name,
            };
        }
    }
    /**
     * Fetch upsell products with full recommendation context
     *
     * @param campaignId - Campaign ID
     * @param currentProductId - Product being viewed or added to cart (for related/complementary recs)
     * @param triggerType - Type of trigger (for intent selection: RELATED vs COMPLEMENTARY)
     * @param cartProductIds - Products in cart (for cart-based recommendations)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products from API are dynamically typed
    private async fetchUpsellProducts(
        campaignId: string,
        currentProductId?: string,
        triggerType?: TriggerType,
        cartProductIds?: string[]
    ): Promise<unknown[]> {
        const params = new URLSearchParams({
            campaignId,
        });

        // Add current product ID for context-aware recommendations
        if (currentProductId) {
            params.append('currentProductId', currentProductId);
            console.log('[ProductDataHook] Smart recommendations: currentProductId =', currentProductId);
        }

        // Add trigger type for intent selection (RELATED vs COMPLEMENTARY)
        if (triggerType) {
            params.append('triggerType', triggerType);
            console.log('[ProductDataHook] Smart recommendations: triggerType =', triggerType);
        }

        // Add cart product IDs for cart-based recommendations and exclusion
        if (cartProductIds && cartProductIds.length > 0) {
            params.append('cartProductIds', cartProductIds.join(','));
            console.log('[ProductDataHook] Smart recommendations: cartProductIds =', cartProductIds.length);
        }

        const url = `/apps/revenue-boost/api/upsell-products?${params.toString()}`;

        const response = await fetch(url, { credentials: 'same-origin' });

        if (!response.ok) {
            throw new Error(`Product fetch failed: ${response.status}`);
        }

        const data = await response.json();

        // Log recommendation source for debugging
        if (data.source) {
            console.log(`[ProductDataHook] Recommendations source: ${data.source} (cached: ${data.cached || false})`);
        }

        return Array.isArray(data.products) ? data.products : [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products from API are dynamically typed
    private async fetchFlashSaleProducts(campaignId: string): Promise<any[]> {
        // Similar to upsell products, but for flash sale
        // This could be a different endpoint or the same one depending on your implementation
        const url = `/apps/revenue-boost/api/flash-sale-products?campaignId=${encodeURIComponent(campaignId)}`;

        const response = await fetch(url, { credentials: 'same-origin' });

        if (!response.ok) {
            // Flash sale products are optional, so failing is OK
            console.warn(`[ProductDataHook] Flash sale products not available`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data.products) ? data.products : [];
    }

    /**
     * Build a small, deterministic set of mocked products for preview.
     *
     * The mock is only used when no real products are returned so that
     * merchants can still see the popup layout in storefront preview.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products are dynamically typed
    private buildPreviewMockProducts(campaign: { contentConfig?: unknown }): any[] {
        const contentConfig = (campaign.contentConfig || {}) as { maxProducts?: number };
        const maxFromConfig =
            typeof contentConfig.maxProducts === 'number' && contentConfig.maxProducts > 0
                ? contentConfig.maxProducts
                : 3;

        const maxProducts = Math.min(maxFromConfig, 4);

        const baseProducts = [
            {
                id: 'preview-product-1',
                variantId: 'preview-variant-1',
                title: 'Preview Hoodie',
                price: '59.00',
                compareAtPrice: '79.00',
                imageUrl:
                    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80',
                handle: 'preview-hoodie',
                rating: 4.8,
                reviewCount: 128,
            },
            {
                id: 'preview-product-2',
                variantId: 'preview-variant-2',
                title: 'Preview Sneakers',
                price: '89.00',
                compareAtPrice: '119.00',
                imageUrl:
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
                handle: 'preview-sneakers',
                rating: 4.9,
                reviewCount: 212,
            },
            {
                id: 'preview-product-3',
                variantId: 'preview-variant-3',
                title: 'Preview Backpack',
                price: '49.00',
                compareAtPrice: '69.00',
                imageUrl:
                    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
                handle: 'preview-backpack',
                rating: 4.6,
                reviewCount: 87,
            },
            {
                id: 'preview-product-4',
                variantId: 'preview-variant-4',
                title: 'Preview Cap',
                price: '24.00',
                compareAtPrice: '29.00',
                imageUrl:
                    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&q=80',
                handle: 'preview-cap',
                rating: 4.5,
                reviewCount: 56,
            },
        ];

        return baseProducts.slice(0, maxProducts);
    }

    /**
     * Detect current product ID from page context
     * Uses multiple sources: REVENUE_BOOST_CONFIG, ShopifyAnalytics, meta tags, etc.
     */
    private detectCurrentProductId(): string | null {
        try {
            type W = typeof window & {
                REVENUE_BOOST_CONFIG?: { productId?: string | number };
                ShopifyAnalytics?: { meta?: { product?: { id?: string | number } } };
                meta?: { product?: { id?: string | number } };
                product?: { id?: string | number };
            };
            const w = window as unknown as W;

            // 1. Check REVENUE_BOOST_CONFIG (set by theme app extension)
            if (w.REVENUE_BOOST_CONFIG?.productId) {
                return this.normalizeProductId(w.REVENUE_BOOST_CONFIG.productId);
            }

            // 2. Check ShopifyAnalytics.meta.product.id
            if (w.ShopifyAnalytics?.meta?.product?.id) {
                return this.normalizeProductId(w.ShopifyAnalytics.meta.product.id);
            }

            // 3. Check window.meta.product.id
            if (w.meta?.product?.id) {
                return this.normalizeProductId(w.meta.product.id);
            }

            // 4. Check window.product.id (older themes)
            if (w.product?.id) {
                return this.normalizeProductId(w.product.id);
            }

            // 5. Check data attribute on product element
            const productEl = document.querySelector('[data-product-id]') as HTMLElement | null;
            if (productEl) {
                const attr = productEl.getAttribute('data-product-id');
                if (attr) {
                    return this.normalizeProductId(attr);
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Normalize product ID to Shopify GID format
     */
    private normalizeProductId(raw: unknown): string | null {
        if (raw == null) return null;
        const idStr = String(raw).trim();
        if (!idStr) return null;

        // Already a GID
        if (idStr.startsWith('gid://shopify/Product/')) {
            return idStr;
        }

        // Numeric ID - convert to GID
        if (/^\d+$/.test(idStr)) {
            return `gid://shopify/Product/${idStr}`;
        }

        return null;
    }

    /**
     * Detect trigger type from campaign's enhanced triggers configuration
     * Maps enabled triggers to our TriggerType enum
     */
    private detectTriggerType(campaign: { clientTriggers?: unknown; targetRules?: unknown }): TriggerType | undefined {
        try {
            // Enhanced triggers can be in clientTriggers or targetRules
            const clientTriggers = campaign.clientTriggers as { enhancedTriggers?: Record<string, { enabled?: boolean }> } | undefined;
            const targetRules = campaign.targetRules as { enhancedTriggers?: Record<string, { enabled?: boolean }> } | undefined;
            const triggers = clientTriggers?.enhancedTriggers || targetRules?.enhancedTriggers;

            if (!triggers) return undefined;

            // Priority order for determining trigger type
            // This determines which trigger is "primary" for intent selection
            if (triggers.add_to_cart?.enabled) return 'add_to_cart';
            if (triggers.product_view?.enabled) return 'product_view';
            if (triggers.exit_intent?.enabled) return 'exit_intent';
            if (triggers.scroll_depth?.enabled) return 'scroll';

            // Check for cart-related triggers
            if (triggers.cart_value?.enabled || triggers.cart_drawer_open?.enabled) return 'cart';

            return undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Get product IDs from the current cart
     * Uses Shopify's /cart.js endpoint
     */
    private async getCartProductIds(): Promise<string[]> {
        try {
            // First check if cart data is already available
            type ShopifyGlobal = { Shopify?: { cart?: { items?: Array<{ product_id?: number }> } } };
            const w = window as unknown as ShopifyGlobal;

            if (w.Shopify?.cart?.items) {
                return w.Shopify.cart.items
                    .map((item) => item.product_id ? `gid://shopify/Product/${item.product_id}` : null)
                    .filter((id): id is string => id !== null);
            }

            // Fetch cart data
            const response = await fetch('/cart.js', { credentials: 'same-origin' });
            if (!response.ok) return [];

            const cart = await response.json() as { items?: Array<{ product_id?: number }> };
            if (!cart.items || !Array.isArray(cart.items)) return [];

            return cart.items
                .map((item) => item.product_id ? `gid://shopify/Product/${item.product_id}` : null)
                .filter((id): id is string => id !== null);
        } catch {
            return [];
        }
    }

    /**
     * Preload product images for instant display
     * Uses Image() constructor to prefetch images into browser cache
     *
     * @param products - Array of products with imageUrl property
     * @returns Promise that resolves when all images are loaded (or failed)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products are dynamically typed
    private async preloadProductImages(products: any[]): Promise<void> {
        const imageUrls = products
            .map((p) => p.imageUrl)
            .filter((url): url is string => typeof url === 'string' && url.length > 0);

        if (imageUrls.length === 0) return;

        console.log(`[ProductDataHook] Preloading ${imageUrls.length} product images`);

        const preloadPromises = imageUrls.map((url) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => {
                    console.log(`[ProductDataHook] Preloaded: ${url.substring(0, 50)}...`);
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`[ProductDataHook] Failed to preload: ${url.substring(0, 50)}...`);
                    resolve(); // Resolve anyway to not block other images
                };
                img.src = url;
            });
        });

        // Wait for all images with a timeout to prevent blocking too long
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 2000));
        await Promise.race([
            Promise.all(preloadPromises),
            timeoutPromise,
        ]);

        console.log('[ProductDataHook] Image preloading complete');
    }
}
