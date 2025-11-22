/**
 * BackgroundImageHook - Pre-loads background images for popups
 *
 * Ensures background images are fully loaded before the popup is displayed,
 * eliminating loading flicker and improving perceived performance.
 */

import type { PreDisplayHook, PreDisplayHookContext, PreDisplayHookResult } from '../PreDisplayHook';

export class BackgroundImageHook implements PreDisplayHook {
    readonly name = 'backgroundImage';
    readonly runInPreview = true; // Run in preview to show images
    readonly timeoutMs = 3000; // 3 second timeout for image loading

    async execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
        try {
            const { campaign } = context;
            const designConfig = campaign.designConfig as any;

            // Check if there's an image to preload
            const imageUrl = designConfig.imageUrl || designConfig.backgroundImageUrl;

            if (!imageUrl) {
                // No image to preload, return success with null data
                return {
                    success: true,
                    data: null,
                    hookName: this.name,
                };
            }

            console.log(`[BackgroundImageHook] Preloading image: ${imageUrl}`);

            // Preload the image
            await this.preloadImage(imageUrl);

            return {
                success: true,
                data: { imageUrl, preloaded: true },
                hookName: this.name,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[BackgroundImageHook] Failed to preload image:`, errorMessage);

            // Image preloading failure is non-critical - browser will still load it eventually
            return {
                success: true, // Mark as success to not block popup
                data: { preloaded: false, error: errorMessage },
                hookName: this.name,
            };
        }
    }

    private preloadImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                console.log(`[BackgroundImageHook] Image loaded successfully`);
                resolve();
            };

            img.onerror = () => {
                reject(new Error('Image failed to load'));
            };

            img.src = url;
        });
    }
}
