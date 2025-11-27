/**
 * Discount Utilities for Storefront
 *
 * Centralized discount logic for applying discount codes to cart,
 * checking auto-apply behavior, and Shopify cart integration.
 *
 * These utilities only work on the storefront (not admin) because they
 * use Shopify's Cart AJAX API and window.Shopify globals.
 */

import { getShopifyRoot } from "./shopify";

/**
 * Check if discount should be auto-applied based on behavior config
 */
export function shouldAutoApply(behavior: string | undefined): boolean {
  return behavior === "SHOW_CODE_AND_AUTO_APPLY";
}

/**
 * Save discount code to localStorage for later use
 */
export function saveDiscountToStorage(code: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("rb_discount_code", code);
  } catch {
    // Storage might be blocked
  }
}

/**
 * Apply discount code via Shopify Cart AJAX API
 *
 * Uses POST /cart/update.js with the `discount` parameter
 * Docs: https://shopify.dev/docs/api/ajax/reference/cart#update-discounts-in-the-cart
 *
 * @param code - The discount code to apply
 * @param source - Optional source identifier for logging
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function applyDiscountToCart(
  code: string,
  source: string = "Popup"
): Promise<boolean> {
  if (!code) {
    console.warn(`[${source}] Cannot apply discount: no code provided`);
    return false;
  }

  console.log(`[${source}] 🎟️ Applying discount code via AJAX:`, code);

  try {
    const root = getShopifyRoot();
    const url = `${root}cart/update.js`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ discount: code }),
    });

    if (!response.ok) {
      let message = "";
      try { message = await response.text(); } catch { /* ignore */ }
      console.error(`[${source}] ❌ Failed to apply discount:`, {
        status: response.status,
        message: message || "(no message)",
        code,
      });
      return false;
    }

    try {
      const cart = await response.json();
      console.log(`[${source}] ✅ Discount applied successfully:`, {
        code,
        itemCount: cart?.item_count,
        totalDiscount: cart?.total_discount,
      });
      if (cart) {
        document.dispatchEvent(new CustomEvent("cart:refresh", { detail: cart }));
      }
    } catch {
      console.warn(`[${source}] ⚠️ Discount may have been applied, but failed to parse response`);
    }

    document.dispatchEvent(new CustomEvent("cart:discount-applied", { detail: { code } }));
    document.dispatchEvent(new CustomEvent("cart:updated"));
    return true;
  } catch (error) {
    console.error(`[${source}] ❌ Error applying discount:`, error);
    return false;
  }
}

/**
 * Auto-apply discount if behavior is configured for it
 * Combines saveDiscountToStorage and applyDiscountToCart
 */
export async function handleDiscountAutoApply(
  code: string,
  autoApply: boolean,
  source: string = "Popup"
): Promise<void> {
  if (!autoApply || !code || typeof window === "undefined") return;

  saveDiscountToStorage(code);
  void applyDiscountToCart(code, source);
}

