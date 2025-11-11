/**
 * Cart Activity Tracking
 *
 * Tracks add-to-cart events for social proof notifications
 */

import type { ApiClient } from '../core/api';

/**
 * Initialize cart activity tracking
 * Listens for Shopify's add-to-cart events and tracks them
 */
export function initCartTracking(api: ApiClient, shopDomain: string): void {
  // Method 1: Listen for Shopify's cart update events
  document.addEventListener('cart:updated', (event: Event) => {
    const productId = (event as CustomEvent).detail?.productId;
    if (productId) {
      trackAddToCart(api, shopDomain, productId);
    }
  });

  // Method 2: Intercept fetch requests to /cart/add.js
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    const urlString = typeof url === 'string' ? url : url.toString();

    // Check if this is an add-to-cart request
    if (urlString.includes('/cart/add') && options?.method === 'POST') {
      try {
        const response = await originalFetch.apply(this, args);

        // Clone response to read body without consuming it
        const clone = response.clone();
        const data = await clone.json();

        // Extract product ID from response
        if (data.id || data.product_id) {
          const productId = `gid://shopify/Product/${data.product_id || data.id}`;
          trackAddToCart(api, shopDomain, productId);
        }

        return response;
      } catch (error) {
        // If parsing fails, just return the original response
        return originalFetch.apply(this, args);
      }
    }

    return originalFetch.apply(this, args);
  };

  // Method 3: Listen for form submissions to /cart/add
  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;

    if (form.action && form.action.includes('/cart/add')) {
      const formData = new FormData(form);
      const productId = formData.get('id');

      if (productId) {
        const gid = `gid://shopify/Product/${productId}`;
        trackAddToCart(api, shopDomain, gid);
      }
    }
  });

  console.log('[Revenue Boost] 🛒 Cart tracking initialized');
}

/**
 * Track an add-to-cart event
 */
async function trackAddToCart(
  api: ApiClient,
  shopDomain: string,
  productId: string
): Promise<void> {
  try {
    await api.trackSocialProofEvent({
      eventType: 'add_to_cart',
      productId,
      shop: shopDomain,
    });

    console.log('[Revenue Boost] 🛒 Tracked add-to-cart:', productId);
  } catch (error) {
    // Silent fail - don't break the user experience
    console.debug('[Revenue Boost] Failed to track add-to-cart:', error);
  }
}

