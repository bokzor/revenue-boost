/**
 * InventoryDataHook - Pre-loads inventory data for flash sale templates
 *
 * Fetches real-time inventory counts before the popup is displayed,
 * allowing immediate display of stock availability.
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';

export class InventoryDataHook implements PreDisplayHook {
    readonly name = 'inventory';
    readonly runInPreview = false; // Skip in preview mode - use pseudo inventory
    readonly timeoutMs = 4000; // 4 second timeout for inventory API

    async execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
        try {
            const { campaign } = context;
            const contentConfig = campaign.contentConfig as any;
            const inventory = contentConfig.inventory;

            // Check if inventory tracking is enabled
            if (!inventory || inventory.mode === 'pseudo') {
                // Use pseudo inventory or skip
                const pseudoTotal = inventory?.pseudoMax || null;
                return {
                    success: true,
                    data: { total: pseudoTotal, mode: 'pseudo' },
                    hookName: this.name,
                };
            }

            // Fetch real inventory from API
            console.log(`[InventoryDataHook] Fetching real inventory data`);

            const params = new URLSearchParams();

            if (inventory.productIds?.length) {
                params.set('productIds', JSON.stringify(inventory.productIds));
            }
            if (inventory.variantIds?.length) {
                params.set('variantIds', JSON.stringify(inventory.variantIds));
            }
            if (inventory.collectionIds?.length) {
                params.set('collectionIds', JSON.stringify(inventory.collectionIds));
            }

            const url = `/apps/revenue-boost/api/inventory?${params.toString()}`;
            const response = await fetch(url, { credentials: 'same-origin' });

            if (!response.ok) {
                throw new Error(`Inventory fetch failed: ${response.status}`);
            }

            const data = await response.json();

            return {
                success: true,
                data: { total: data.total || 0, mode: 'real' },
                hookName: this.name,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[InventoryDataHook] Failed to fetch inventory:`, errorMessage);

            // Inventory failure is non-critical - popup can still show without stock count
            return {
                success: true, // Mark as success to not block popup
                data: { total: null, mode: 'unavailable', error: errorMessage },
                hookName: this.name,
            };
        }
    }
}
