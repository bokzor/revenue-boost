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
    readonly timeoutMs = 5000; // 5 second timeout for image loading (increased from 3s)

    async execute(context: PreDisplayHookContext): Promise<PreDisplayHookResult> {
        try {
            const { campaign } = context;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- campaign config is dynamically typed from API
            const designConfig = campaign.designConfig as any;

            // Check if there's an image to preload
            const imageUrl = designConfig.imageUrl || designConfig.backgroundImageUrl;

            if (!imageUrl) {
                // No image to preload, return success with null data
                console.log(`[BackgroundImageHook] No image URL found in designConfig`);
                return {
                    success: true,
                    data: null,
                    hookName: this.name,
                };
            }

            console.log(`[BackgroundImageHook] Preloading image: ${imageUrl}`);

            // Preload the image with timeout
            const startTime = Date.now();
            await this.preloadImage(imageUrl);
            const loadTime = Date.now() - startTime;

            console.log(`[BackgroundImageHook] ✅ Image loaded successfully in ${loadTime}ms`);

            return {
                success: true,
                data: { imageUrl, preloaded: true, loadTimeMs: loadTime },
                hookName: this.name,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[BackgroundImageHook] ❌ Failed to preload image:`, errorMessage);

            // Image preloading failure is non-critical - browser will still load it eventually
            // But we log it as an error so developers can see it
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

            // Set up event handlers before setting src
            img.onload = () => {
                console.log(`[BackgroundImageHook] Image onload event fired`);
                resolve();
            };

            img.onerror = (event) => {
                console.error(`[BackgroundImageHook] Image onerror event fired:`, event);
                reject(new Error('Image failed to load'));
            };

            // Add timeout handler in case onload/onerror never fire
            const timeoutId = setTimeout(() => {
                console.error(`[BackgroundImageHook] Image load timeout after 5s`);
                reject(new Error('Image load timeout'));
            }, 5000);

            // Clear timeout when image loads
            img.onload = () => {
                clearTimeout(timeoutId);
                console.log(`[BackgroundImageHook] Image onload event fired`);
                resolve();
            };

            img.onerror = (event) => {
                clearTimeout(timeoutId);
                console.error(`[BackgroundImageHook] Image onerror event fired:`, event);
                reject(new Error('Image failed to load'));
            };

            // Start loading the image
            console.log(`[BackgroundImageHook] Setting img.src to: ${url}`);
            img.src = url;

            // If image is already cached, onload might fire synchronously
            if (img.complete) {
                clearTimeout(timeoutId);
                console.log(`[BackgroundImageHook] Image was already cached`);
                resolve();
            }
        });
    }
}
