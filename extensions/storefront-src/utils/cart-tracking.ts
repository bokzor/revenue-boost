/**
 * Cart Activity Tracking
 *
 * Tracks add-to-cart events for social proof notifications
 */

import type { ApiClient } from '../core/api';


function hasProductId(d: unknown): d is { productId: string | number } {
  return (
    d != null &&
    typeof d === 'object' &&
    'productId' in (d as Record<string, unknown>) &&
    (typeof (d as { productId?: unknown }).productId === 'string' ||
      typeof (d as { productId?: unknown }).productId === 'number')
  );
}

/**
 * Initialize cart activity tracking
 * Listens for Shopify's add-to-cart events and tracks them
 */
export function initCartTracking(api: ApiClient, shopDomain: string): void {
  // Method 1: Listen for Shopify's cart update events
  document.addEventListener('cart:updated', (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (hasProductId(detail)) {
      const productId = String(detail.productId);
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
 * Emit canonical cart add events so all features (triggers, free shipping,
 * social proof, etc.) can rely on the same signal.
 */
function emitCartAddEvents(productId: string): void {
  try {
    const detail = { productId };
    // Legacy / theme-style events listened to by CartEventListener and
    // components like FreeShippingPopup.
    document.dispatchEvent(new CustomEvent('cart:add', { detail }));
    document.dispatchEvent(new CustomEvent('cart:item-added', { detail }));
  } catch {
    // Never let event emission break the storefront.
  }
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
    // Mark that the user added to cart in this session for targeting (Active Shopper)
    try {
      window.sessionStorage.setItem('revenue_boost_added_to_cart', 'true');
    } catch {
      // Ignore storage errors
    }

    // Emit unified cart events used by triggers & free shipping
    emitCartAddEvents(productId);

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

