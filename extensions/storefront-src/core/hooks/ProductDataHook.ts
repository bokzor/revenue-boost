/**
 * ProductDataHook - Pre-loads product data for upsell and flash sale templates
 *
 * Fetches product information before the popup is displayed,
 * eliminating loading states and skeleton screens.
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';

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

            // Extract product ID from trigger context (if available)
            const triggerProductId = triggerContext?.productId;
            if (triggerProductId) {
                console.log('[ProductDataHook] Using product ID from trigger context:', triggerProductId);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products from API are dynamically typed
            let products: any[] = [];

            if (templateType === 'PRODUCT_UPSELL') {
                // Pass trigger product ID to exclude it from recommendations
                products = await this.fetchUpsellProducts(campaign.id, triggerProductId);

                // In normal storefront mode, a Product Upsell popup should
                // never render without real products. In preview, however,
                // we fall back to mocked products so merchants can still see
                // what the popup will look like.
                if (!products || products.length === 0) {
                    if (previewMode) {
                        console.warn(
                            `[ProductDataHook][Preview] No products available for Product Upsell campaign ${campaign.id}. Using mocked preview products instead.`,
                        );
                        products = this.buildPreviewMockProducts(campaign);
                    } else {
                        console.warn(
                            `[ProductDataHook] No products available for Product Upsell campaign ${campaign.id}. Popup will not display.`,
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
            if (previewMode && campaign.templateType === 'PRODUCT_UPSELL') {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- products from API are dynamically typed
    private async fetchUpsellProducts(campaignId: string, triggerProductId?: string): Promise<any[]> {
        const params = new URLSearchParams({
            campaignId,
        });

        // Add trigger product ID to exclude it from recommendations
        if (triggerProductId) {
            params.append('cartProductIds', triggerProductId);
            console.log('[ProductDataHook] Excluding trigger product from recommendations:', triggerProductId);
        }

        const url = `/apps/revenue-boost/api/upsell-products?${params.toString()}`;

        const response = await fetch(url, { credentials: 'same-origin' });

        if (!response.ok) {
            throw new Error(`Product fetch failed: ${response.status}`);
        }

        const data = await response.json();
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
                    'https://images.pexels.com/photos/7671166/pexels-photo-7671166.jpeg?auto=compress&cs=tinysrgb&w=400',
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
                    'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
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
                    'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
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
                    'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=400',
                handle: 'preview-cap',
                rating: 4.5,
                reviewCount: 56,
            },
        ];

        return baseProducts.slice(0, maxProducts);
    }
}
