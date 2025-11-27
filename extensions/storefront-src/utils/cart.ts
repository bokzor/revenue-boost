/**
 * Cart Utilities for Storefront
 *
 * Centralized cart operations including:
 * - Cart drawer refresh (Dawn theme + legacy themes)
 * - Section Rendering API integration
 * - Add to cart operations
 */

import { getShopifyRoot } from "./shopify";

// Type definitions for cart drawer elements
interface CartDrawerElement extends Element {
  renderContents?: (payload: { sections?: Record<string, string>; [key: string]: unknown }) => void;
  getSectionsToRender?: () => Array<{ id: string; section?: string; selector?: string }>;
}

interface CartNotificationElement extends Element {
  renderContents?: (payload: { sections?: Record<string, string>; [key: string]: unknown }) => void;
  getSectionsToRender?: () => Array<{ id: string; section?: string; selector?: string }>;
}

interface WindowWithTheme {
  Shopify?: {
    theme?: {
      cart?: { getCart?: () => void; refresh?: () => void };
      sections?: { load?: (section: string) => void };
    };
  };
  theme?: { cart?: { getCart?: () => void; refresh?: () => void } };
  cart?: { refresh?: () => void };
}

/**
 * Detect which sections to request for cart drawer refresh.
 * Dawn theme and similar themes use cart-drawer and cart-icon-bubble.
 */
export function getSectionsToRender(): string[] {
  const sections: string[] = [];

  const cartDrawer = document.querySelector("cart-drawer") as CartDrawerElement | null;
  if (cartDrawer?.getSectionsToRender) {
    cartDrawer.getSectionsToRender().forEach((s) => {
      if (s.id && !sections.includes(s.id)) sections.push(s.id);
    });
  }

  const cartNotification = document.querySelector("cart-notification") as CartNotificationElement | null;
  if (cartNotification?.getSectionsToRender) {
    cartNotification.getSectionsToRender().forEach((s) => {
      if (s.id && !sections.includes(s.id)) sections.push(s.id);
    });
  }

  if (sections.length === 0) {
    sections.push("cart-drawer", "cart-icon-bubble");
  }

  return sections;
}

/** Dispatch cart update events for various themes */
function dispatchCartEvents(cartData: Record<string, unknown>): void {
  const eventDetail = { data: cartData, ...cartData };
  const events = [
    "cart:updated", "cart.requestUpdate", "cart:update", "cart:change",
    "theme:cart:update", "cart:item-added", "cart:add", "cart:refresh"
  ];
  events.forEach((e) => document.dispatchEvent(new CustomEvent(e, { detail: eventDetail })));
}

/** Update cart count in header */
function updateCartCount(itemCount: number): void {
  const el = document.querySelector(".cart-count, [data-cart-count], .cart__count, #cart-icon-bubble span");
  if (el) el.textContent = String(itemCount);
}

/** Refresh Dawn theme cart drawer using renderContents */
function refreshDawnCartDrawer(cartData: { sections?: Record<string, string>; [key: string]: unknown }): void {
  try {
    const cartDrawer = document.querySelector("cart-drawer") as CartDrawerElement | null;
    if (cartDrawer?.renderContents) {
      console.log("[Cart] Refreshing Dawn cart-drawer");
      cartDrawer.renderContents(cartData);
    }
    const cartNotification = document.querySelector("cart-notification") as CartNotificationElement | null;
    if (cartNotification?.renderContents) {
      console.log("[Cart] Refreshing Dawn cart-notification");
      cartNotification.renderContents(cartData);
    }
  } catch (e) {
    console.debug("[Cart] Error using renderContents:", e);
  }
}

/** Refresh legacy theme carts */
function refreshLegacyThemeCarts(): void {
  try {
    const w = window as WindowWithTheme;
    w.Shopify?.theme?.cart?.getCart?.();
    w.theme?.cart?.getCart?.();
    w.theme?.cart?.refresh?.();
    w.cart?.refresh?.();
    w.Shopify?.theme?.sections?.load?.("cart-drawer");
  } catch (e) {
    console.debug("[Cart] Legacy theme refresh not available:", e);
  }
}

/**
 * Refresh cart drawer after adding items to cart.
 * Uses Section Rendering API response to properly update Dawn theme and similar themes.
 */
export async function refreshCartDrawer(
  cartData: { sections?: Record<string, string>; item_count?: number; [key: string]: unknown },
  root?: string
): Promise<void> {
  dispatchCartEvents(cartData);

  if (cartData.item_count !== undefined) {
    updateCartCount(cartData.item_count);
  }

  if (cartData.sections) {
    refreshDawnCartDrawer(cartData);
  } else {
    // Fallback: fetch sections separately
    try {
      const shopifyRoot = root || getShopifyRoot();
      const sectionsParam = getSectionsToRender().join(",");
      const res = await fetch(`${shopifyRoot}cart.js?sections=${sectionsParam}`);
      if (res.ok) {
        const data = (await res.json()) as { sections?: Record<string, string>; item_count?: number };
        if (data.item_count !== undefined) updateCartCount(data.item_count);
        if (data.sections) refreshDawnCartDrawer(data);
      }
    } catch (e) {
      console.debug("[Cart] Fallback section fetch failed:", e);
    }
  }

  refreshLegacyThemeCarts();
}

/**
 * Add items to cart using Shopify's Cart API with Section Rendering
 */
export async function addToCart(
  items: Array<{ id: string; quantity: number }>,
  options?: { refreshDrawer?: boolean }
): Promise<{ success: boolean; cartData?: Record<string, unknown>; error?: string }> {
  if (!items?.length) return { success: false, error: "No items to add" };

  try {
    const root = getShopifyRoot();
    const response = await fetch(`${root}cart/add.js`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        sections: getSectionsToRender(),
        sections_url: window.location.pathname,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Cart] Failed to add to cart:", errorText);
      return { success: false, error: errorText };
    }

    const cartData = await response.json();
    console.log("[Cart] Items added successfully");

    if (options?.refreshDrawer !== false) {
      await refreshCartDrawer(cartData, root);
    }

    return { success: true, cartData };
  } catch (error) {
    console.error("[Cart] Error adding to cart:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get current cart data
 */
export async function getCart(): Promise<{
  success: boolean;
  cart?: { item_count: number; total_price: number; items: Array<unknown>; [key: string]: unknown };
  error?: string;
}> {
  try {
    const root = getShopifyRoot();
    const response = await fetch(`${root}cart.js`);
    if (!response.ok) return { success: false, error: "Failed to fetch cart" };
    return { success: true, cart: await response.json() };
  } catch (error) {
    console.error("[Cart] Error fetching cart:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
