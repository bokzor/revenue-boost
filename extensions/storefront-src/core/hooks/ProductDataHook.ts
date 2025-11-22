/**
 * ProductDataHook - Pre-loads product data for upsell and flash sale templates
 *
 * Fetches product information before the popup is displayed,
 * eliminating loading states and skeleton screens.
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';

export class ProductDataHook implements PreDisplayHook {
    readonly name = 'products';
    readonly runInPreview = false; // Skip in preview mode
    readonly timeoutMs = 5000; // 5 second timeout for API call

    async execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
        try {
            const { campaign } = context;
            const templateType = campaign.templateType;

            console.log(`[ProductDataHook] Fetching products for ${templateType}`);

            let products: any[] = [];

            if (templateType === 'PRODUCT_UPSELL') {
                products = await this.fetchUpsellProducts(campaign.id);
            } else if (templateType === 'FLASH_SALE') {
                // Flash sale may have product configuration
                const contentConfig = campaign.contentConfig as any;
                if (contentConfig.productIds?.length > 0) {
                    products = await this.fetchFlashSaleProducts(campaign.id);
                }
            }

            return {
                success: true,
                data: products,
                hookName: this.name,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[ProductDataHook] Failed to fetch products:`, errorMessage);

            return {
                success: false,
                error: errorMessage,
                hookName: this.name,
            };
        }
    }

    private async fetchUpsellProducts(campaignId: string): Promise<any[]> {
        const url = `/apps/revenue-boost/api/upsell-products?campaignId=${encodeURIComponent(campaignId)}`;

        const response = await fetch(url, { credentials: 'same-origin' });

        if (!response.ok) {
            throw new Error(`Product fetch failed: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data.products) ? data.products : [];
    }

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
}
