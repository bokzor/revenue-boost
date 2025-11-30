/**
 * CartEventListener
 *
 * Listens for Shopify cart events (add to cart, cart drawer open, etc.)
 * Supports multiple Shopify themes and custom implementations
 */

export interface CartEventConfig {
  events?: CartEventType[];
  trackCartValue?: boolean;
  minCartValue?: number;
  maxCartValue?: number;
}

export type CartEventType = "add_to_cart" | "cart_drawer_open" | "cart_update";

export interface CartEventData {
  type: CartEventType;
  detail: unknown;
}

export type CartEventCallback = (data: CartEventData) => void;

function isCartUpdateDetail(v: unknown): v is { total?: number } {
  return v != null && typeof v === "object" && typeof (v as { total?: unknown }).total === "number";
}

/**
 * Check if detail has total_price (Shopify cart format)
 */
function hasShopifyCartTotal(v: unknown): v is { total_price?: number } {
  return v != null && typeof v === "object" && typeof (v as { total_price?: unknown }).total_price === "number";
}

/**
 * Get current cart value from window.Shopify.cart
 * Returns value in dollars (not cents)
 */
function getGlobalCartValue(): number {
  type ShopifyGlobal = { Shopify?: { cart?: { total_price: number } } };
  const w = window as unknown as ShopifyGlobal;

  if (w.Shopify && w.Shopify.cart && typeof w.Shopify.cart.total_price === "number") {
    return w.Shopify.cart.total_price / 100;
  }

  return 0;
}


export class CartEventListener {
  private config: Required<CartEventConfig>;
  private callback: CartEventCallback | null = null;
  private active = false;
  private eventHandlers: Map<string, (e: Event) => void> = new Map();
  private cartJsUnsubscribeFns: Array<() => void> = [];

  // Shopify cart event names (different themes use different events)
  private readonly CART_EVENT_MAPPINGS = {
    // Add to cart events
    add_to_cart: [
      "cart:add",
      "product:add",
      "cart:item-added",
      "theme:cart:add",
    ],
    // Cart drawer open events
    cart_drawer_open: [
      "cart:open",
      "drawer:open",
      "cart:drawer:open",
      "theme:cart:open",
    ],
    // Cart update events
    cart_update: [
      "cart:update",
      "cart:change",
      "cart:updated",
      "theme:cart:update",
    ],
  };

  constructor(config: CartEventConfig = {}) {
    this.config = {
      events: config.events || ["add_to_cart", "cart_drawer_open", "cart_update"],
      trackCartValue: config.trackCartValue || false,
      minCartValue: config.minCartValue || 0,
      maxCartValue: config.maxCartValue || Infinity,
    };
  }

  /**
   * Start listening for cart events
   */
  start(callback: CartEventCallback): void {
    if (this.active) {
      return; // Already active
    }

    this.callback = callback;
    this.active = true;

    // Listen for each configured event type via DOM events
    this.config.events.forEach((eventType) => {
      this.listenForEventType(eventType);
    });

    // Also hook into CartJS (cart.js library) when available
    this.attachCartJsListeners();
  }

  /**
   * Stop listening for cart events
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;

    // Remove all DOM event listeners
    this.eventHandlers.forEach((handler, eventName) => {
      document.removeEventListener(eventName, handler);
    });
    this.eventHandlers.clear();

    // Unsubscribe from CartJS integrations
    this.cartJsUnsubscribeFns.forEach((fn) => fn());
    this.cartJsUnsubscribeFns = [];
  }

  /**
   * Check if listener is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Cleanup and remove all listeners
   */
  destroy(): void {
    this.stop();
    this.callback = null;
  }

  /**
   * Listen for a specific event type
   */
  private listenForEventType(eventType: CartEventType): void {
    const eventNames = this.CART_EVENT_MAPPINGS[eventType];

    eventNames.forEach((eventName) => {
      const handler = (e: Event) => this.handleCartEvent(eventType, e);
      this.eventHandlers.set(eventName, handler);
      document.addEventListener(eventName, handler);
    });
  }

  /**
   * Emit a cart event from a raw detail payload (used by both DOM events and CartJS)
   */
  private emitCartEventFromDetail(eventType: CartEventType, detail: unknown): void {
    if (!this.active || !this.callback) {
      return;
    }

    // Check cart value threshold if tracking is enabled
    if (this.config.trackCartValue && eventType === "cart_update") {
      // Try multiple sources for cart value (in priority order):
      // 1. detail.total (normalized by CartJS handler)
      // 2. detail.total_price (raw Shopify cart format, divide by 100)
      // 3. window.Shopify.cart.total_price (global fallback)
      let cartValue = 0;

      if (isCartUpdateDetail(detail)) {
        cartValue = detail.total ?? 0;
      } else if (hasShopifyCartTotal(detail)) {
        // Handle Shopify cart format (cents -> dollars)
        cartValue = (detail.total_price ?? 0) / 100;
      } else {
        // Fallback: check global Shopify.cart
        cartValue = getGlobalCartValue();
      }

      console.log("[Revenue Boost] CartEventListener checking cart value:", {
        cartValue,
        minCartValue: this.config.minCartValue,
        maxCartValue: this.config.maxCartValue,
      });

      if (cartValue < this.config.minCartValue || cartValue > this.config.maxCartValue) {
        console.log("[Revenue Boost] CartEventListener: cart value outside threshold, ignoring event");
        return; // Don't trigger if outside threshold
      }
    }

    this.callback({
      type: eventType,
      detail,
    });
  }

  /**
   * Handle cart event from DOM CustomEvent
   */
  private handleCartEvent(eventType: CartEventType, e: Event): void {
    const customEvent = e as CustomEvent<unknown>;
    this.emitCartEventFromDetail(eventType, customEvent.detail);
  }

  /**
   * Integrate with CartJS (open-source cart.js library) when present on the page.
   * This captures real cart.js events like `item:added` and `cart:updated`.
   */
  private attachCartJsListeners(): void {
    if (typeof window === "undefined") {
      return;
    }

    const w = window as Window & { CartJS?: { on?: (event: string, handler: (...args: unknown[]) => void) => void; off?: (event: string, handler: (...args: unknown[]) => void) => void } };
    const cartJs = w.CartJS;

    if (!cartJs || typeof cartJs.on !== "function") {
      return;
    }

    // Map add_to_cart -> CartJS "item:added" event
    if (this.config.events.includes("add_to_cart")) {
      const handler = (cart: unknown, item: unknown) => {
        this.emitCartEventFromDetail("add_to_cart", { cart, item });
      };
      cartJs.on("item:added", handler);

      if (typeof cartJs.off === "function") {
        this.cartJsUnsubscribeFns.push(() => cartJs.off!("item:added", handler));
      }
    }

    // Map cart_update -> CartJS "cart:updated" event and derive a numeric total
    if (this.config.events.includes("cart_update")) {
      const handler = (cart: unknown) => {
        const cartObj = cart as { total_price?: number } | null;
        const total =
          cartObj && typeof cartObj.total_price === "number"
            ? cartObj.total_price / 100
            : undefined;

        this.emitCartEventFromDetail("cart_update", {
          total,
          cart,
        });
      };

      cartJs.on("cart:updated", handler);

      if (typeof cartJs.off === "function") {
        this.cartJsUnsubscribeFns.push(() => cartJs.off!("cart:updated", handler));
      }
    }
  }
}


