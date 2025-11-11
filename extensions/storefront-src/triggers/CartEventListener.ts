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

export class CartEventListener {
  private config: Required<CartEventConfig>;
  private callback: CartEventCallback | null = null;
  private active = false;
  private eventHandlers: Map<string, (e: Event) => void> = new Map();

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

    // Listen for each configured event type
    this.config.events.forEach((eventType) => {
      this.listenForEventType(eventType);
    });
  }

  /**
   * Stop listening for cart events
   */
  stop(): void {
    if (!this.active) {
      return;
    }

    this.active = false;

    // Remove all event listeners
    this.eventHandlers.forEach((handler, eventName) => {
      document.removeEventListener(eventName, handler);
    });
    this.eventHandlers.clear();
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
   * Handle cart event
   */
  private handleCartEvent(eventType: CartEventType, e: Event): void {
    if (!this.active || !this.callback) {
      return;
    }

    const customEvent = e as CustomEvent;
    const detail = customEvent.detail || {};

    // Check cart value threshold if tracking is enabled
    if (this.config.trackCartValue && eventType === "cart_update") {
      const cartValue = detail.total || 0;

      if (cartValue < this.config.minCartValue || cartValue > this.config.maxCartValue) {
        return; // Don't trigger if outside threshold
      }
    }

    // Trigger callback
    this.callback({
      type: eventType,
      detail,
    });
  }
}

