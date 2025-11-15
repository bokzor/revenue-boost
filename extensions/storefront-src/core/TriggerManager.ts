/**
 * TriggerManager
 *
 * Evaluates client-side triggers for campaigns
 * Handles behavioral triggers like exit intent, scroll depth, time delays, etc.
 */

import { ExitIntentDetector } from "../triggers/ExitIntentDetector";
import { ScrollDepthTracker } from "../triggers/ScrollDepthTracker";
import { TimeDelayHandler } from "../triggers/TimeDelayHandler";
import { IdleTimer } from "../triggers/IdleTimer";
import { CartEventListener } from "../triggers/CartEventListener";
import { CustomEventHandler } from "../triggers/CustomEventHandler";

export interface Campaign {
  id: string;
  clientTriggers?: {
    enhancedTriggers?: EnhancedTriggers;
  };
}

export interface EnhancedTriggers {
  page_load?: PageLoadTrigger;
  exit_intent?: ExitIntentTrigger;
  scroll_depth?: ScrollDepthTrigger;
  idle_timer?: IdleTimerTrigger;
  time_delay?: TimeDelayTrigger;
  add_to_cart?: AddToCartTrigger;
  cart_drawer_open?: CartDrawerOpenTrigger;
  cart_value?: CartValueTrigger;
  product_view?: ProductViewTrigger;
  custom_event?: CustomEventTrigger;
  trigger_combination?: TriggerCombinationConfig;
  /**
   * Legacy field kept for backward compatibility with older configs/tests.
   * New configs should use trigger_combination.operator instead.
   */
  logic_operator?: "AND" | "OR";
  [key: string]: unknown;
}

export interface PageLoadTrigger {
  enabled: boolean;
  delay?: number; // milliseconds
  require_dom_ready?: boolean;
}

export interface ExitIntentTrigger {
  enabled: boolean;
  sensitivity?: "low" | "medium" | "high";
  delay?: number;
  mobile_enabled?: boolean;
}

export interface ScrollDepthTrigger {
  enabled: boolean;
  depth_percentage?: number;
  direction?: "down" | "up";
  debounce_time?: number;
}

export interface IdleTimerTrigger {
  enabled: boolean;
  idle_duration?: number; // seconds
}

export interface TimeDelayTrigger {
  enabled: boolean;
  /**
   * Time to wait in seconds before triggering.
   */
  delay?: number;
  /**
   * If true, ignore delay and trigger immediately when condition is met.
   */
  immediate?: boolean;
}

export interface AddToCartTrigger {
  enabled: boolean;
  /**
   * Time to wait in seconds after add-to-cart before triggering.
   */
  delay?: number;
  immediate?: boolean;
}

export interface CartDrawerOpenTrigger {
  enabled: boolean;
  /**
   * Optional delay in milliseconds before triggering after drawer opens.
   */
  delay?: number;
  max_triggers_per_session?: number;
}

export interface CartValueTrigger {
  enabled: boolean;
  threshold?: number;
  minValue?: number;
  min_value?: number;
  max_value?: number;
  check_interval?: number;
}

export interface ProductViewTrigger {
  enabled: boolean;
  product_ids?: string[];
  time_on_page?: number; // seconds
  require_scroll?: boolean;
}

export interface CustomEventTrigger {
  enabled: boolean;
  event_name?: string;
  event_names?: string[];
  debounce_time?: number;
}

export interface TriggerCombinationConfig {
  operator?: "AND" | "OR";
}

export class TriggerManager {
  private cleanupFunctions: Array<() => void> = [];
  private exitIntentDetector: ExitIntentDetector | null = null;
  private scrollDepthTracker: ScrollDepthTracker | null = null;
  private timeDelayHandler: TimeDelayHandler | null = null;
  private idleTimer: IdleTimer | null = null;
  private cartEventListener: CartEventListener | null = null;
  private customEventHandler: CustomEventHandler | null = null;

  /**
   * Evaluate all triggers for a campaign
   * Returns true if campaign should be shown
   */
  async evaluateTriggers(campaign: Campaign): Promise<boolean> {
    const triggers = campaign.clientTriggers?.enhancedTriggers;

    console.log("[Revenue Boost] 🎯 Evaluating triggers for campaign:", campaign.id);

    // If no triggers defined, show immediately
    if (!triggers || Object.keys(triggers).length === 0) {
      console.log("[Revenue Boost] ✅ No triggers defined, showing campaign immediately");
      return true;
    }

    // Get logic operator (default: AND)
    const logicOperator =
      triggers.trigger_combination?.operator ||
      triggers.logic_operator ||
      "AND";
    console.log("[Revenue Boost] 🔗 Trigger logic operator:", logicOperator);

    // Evaluate each trigger (only enabled ones participate in logic)
    const results: boolean[] = [];
    const triggerResults: Record<string, boolean> = {};

    // Page Load Trigger
    if (triggers.page_load !== undefined) {
      if (triggers.page_load.enabled) {
        console.log("[Revenue Boost] 📄 Checking page_load trigger:", triggers.page_load);
        const result = await this.checkPageLoad(triggers.page_load);
        triggerResults.page_load = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} page_load trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ page_load trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Time Delay Trigger
    if (triggers.time_delay !== undefined) {
      if (triggers.time_delay.enabled) {
        console.log("[Revenue Boost] ⏳ Checking time_delay trigger:", triggers.time_delay);
        const result = await this.checkTimeDelay(triggers.time_delay);
        triggerResults.time_delay = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} time_delay trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ time_delay trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Scroll Depth Trigger
    if (triggers.scroll_depth !== undefined) {
      if (triggers.scroll_depth.enabled) {
        console.log("[Revenue Boost] 📜 Checking scroll_depth trigger:", triggers.scroll_depth);
        const result = await this.checkScrollDepth(triggers.scroll_depth);
        triggerResults.scroll_depth = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} scroll_depth trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ scroll_depth trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Exit Intent Trigger
    if (triggers.exit_intent !== undefined) {
      if (triggers.exit_intent.enabled) {
        console.log("[Revenue Boost] 🚪 Checking exit_intent trigger:", triggers.exit_intent);
        const result = await this.checkExitIntent(triggers.exit_intent);
        triggerResults.exit_intent = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} exit_intent trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ exit_intent trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Idle Timer Trigger
    if (triggers.idle_timer !== undefined) {
      if (triggers.idle_timer.enabled) {
        console.log("[Revenue Boost] ⏱️ Checking idle_timer trigger:", triggers.idle_timer);
        const result = await this.checkIdleTimer(triggers.idle_timer);
        triggerResults.idle_timer = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} idle_timer trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ idle_timer trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Add to Cart Trigger
    if (triggers.add_to_cart !== undefined) {
      if (triggers.add_to_cart.enabled) {
        console.log("[Revenue Boost] 🛒 Checking add_to_cart trigger:", triggers.add_to_cart);
        const result = await this.checkAddToCart(triggers.add_to_cart);
        triggerResults.add_to_cart = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} add_to_cart trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ add_to_cart trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Cart Drawer Open Trigger
    if (triggers.cart_drawer_open !== undefined) {
      if (triggers.cart_drawer_open.enabled) {
        console.log(
          "[Revenue Boost] 🧺 Checking cart_drawer_open trigger:",
          triggers.cart_drawer_open,
        );
        const result = await this.checkCartDrawerOpen(triggers.cart_drawer_open);
        triggerResults.cart_drawer_open = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} cart_drawer_open trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ cart_drawer_open trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Cart Value Trigger
    if (triggers.cart_value !== undefined) {
      if (triggers.cart_value.enabled) {
        console.log("[Revenue Boost] 💰 Checking cart_value trigger:", triggers.cart_value);
        const result = await this.checkCartValue(triggers.cart_value);
        triggerResults.cart_value = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} cart_value trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ cart_value trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Product View Trigger
    if (triggers.product_view !== undefined) {
      if (triggers.product_view.enabled) {
        console.log("[Revenue Boost] 🛍️ Checking product_view trigger:", triggers.product_view);
        const result = await this.checkProductView(triggers.product_view);
        triggerResults.product_view = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} product_view trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ product_view trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // Custom Event Trigger
    if (triggers.custom_event !== undefined) {
      if (triggers.custom_event.enabled) {
        console.log("[Revenue Boost] 🎯 Checking custom_event trigger:", triggers.custom_event);
        const result = await this.checkCustomEvent(triggers.custom_event);
        triggerResults.custom_event = result;
        results.push(result);
        console.log(
          `[Revenue Boost] ${result ? "✅" : "❌"} custom_event trigger ${
            result ? "passed" : "failed"
          }`,
        );
      } else {
        console.log(
          "[Revenue Boost] ⏭️ custom_event trigger is disabled and will be ignored in evaluation",
        );
      }
    }

    // If no enabled triggers, show immediately
    if (results.length === 0) {
      console.log("[Revenue Boost] ⚠️ No enabled triggers found, showing campaign immediately");
      return true;
    }

    // Combine results based on logic operator
    let finalResult: boolean;
    if (logicOperator === "OR") {
      finalResult = results.some((r) => r === true);
      console.log("[Revenue Boost] 🔀 OR logic: At least one trigger must pass");
    } else {
      // AND logic
      finalResult = results.every((r) => r === true);
      console.log("[Revenue Boost] 🔗 AND logic: All triggers must pass");
    }

    console.log("[Revenue Boost] 📊 Trigger evaluation summary:", triggerResults);
    console.log(`[Revenue Boost] ${finalResult ? "✅ CAMPAIGN WILL SHOW" : "❌ CAMPAIGN WILL NOT SHOW"} - Final result: ${finalResult}`);

    return finalResult;
  }

  /**
   * Check page load trigger
   */
  private async checkPageLoad(trigger: PageLoadTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ page_load trigger is disabled");
      return false;
    }

    const delay = trigger.delay || 0;
    console.log(`[Revenue Boost] ⏳ page_load trigger waiting ${delay}ms before showing`);

    if (delay > 0) {
      await this.delay(delay);
    }

    console.log("[Revenue Boost] ✅ page_load trigger delay completed");
    return true;

  }


  /**
   * Check time delay trigger
   */
  private async checkTimeDelay(trigger: TimeDelayTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ time_delay trigger is disabled");
      return false;
    }

    const delaySeconds = trigger.delay ?? 0;
    const immediate = trigger.immediate ?? false;

    if (immediate || delaySeconds <= 0) {
      console.log("[Revenue Boost] ✅ time_delay trigger passed immediately (no delay configured)");
      return true;
    }

    const delayMs = delaySeconds * 1000;
    console.log(
      `[Revenue Boost] ⏳ time_delay trigger waiting ${delaySeconds}s (${delayMs}ms) before showing`,
    );

    return new Promise((resolve) => {
      this.timeDelayHandler = new TimeDelayHandler({
        delay: delayMs,
      });

      this.timeDelayHandler.start(() => {
        console.log("[Revenue Boost] ✅ time_delay trigger delay completed");
        resolve(true);
      });
    });
  }

  /**
   * Check scroll depth trigger
   */
  private async checkScrollDepth(trigger: ScrollDepthTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ scroll_depth trigger is disabled");
      return false;
    }

    const depthPercentage = trigger.depth_percentage || 50;
    const direction = trigger.direction || "down";
    const debounceTime = trigger.debounce_time ?? 100;
    console.log(
      `[Revenue Boost] 📏 scroll_depth trigger waiting for ${depthPercentage}% scroll ${direction} (debounce=${debounceTime}ms)`,
    );

    return new Promise((resolve) => {
      this.scrollDepthTracker = new ScrollDepthTracker({
        depthPercentage,
        direction,
        debounceTime,
      });

      this.scrollDepthTracker.start(() => {
        console.log(`[Revenue Boost] ✅ scroll_depth trigger detected: User scrolled ${depthPercentage}% ${direction}`);
        resolve(true);
      });

      // Check if already at depth
      if (this.scrollDepthTracker.hasReachedDepth()) {
        console.log(`[Revenue Boost] ✅ scroll_depth trigger already met: User already at ${depthPercentage}% depth`);
        this.scrollDepthTracker.destroy();
        resolve(true);
      }
    });
  }

  /**
   * Check exit intent trigger
   */
  private async checkExitIntent(trigger: ExitIntentTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ exit_intent trigger is disabled");
      return false;
    }

    const sensitivity = trigger.sensitivity || "medium";
    const delay = trigger.delay || 1000;
    const mobileEnabled = trigger.mobile_enabled ?? false;
    console.log(
      `[Revenue Boost] 🚪 exit_intent trigger waiting for exit intent (sensitivity: ${sensitivity}, delay: ${delay}ms, mobileEnabled=${mobileEnabled})`,
    );

    return new Promise((resolve) => {
      this.exitIntentDetector = new ExitIntentDetector({
        sensitivity,
        delay,
        mobileEnabled,
      });

      this.exitIntentDetector.start(() => {
        console.log("[Revenue Boost] ✅ exit_intent trigger detected: User showed exit intent");
        resolve(true);
      });
    });
  }

  /**
   * Check product view trigger
   * - Ensures we are on a product page
   * - Optionally matches against configured product_ids (Shopify GIDs)
   * - Supports time on page and scroll interaction requirements
   */
  private async checkProductView(trigger: ProductViewTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ product_view trigger is disabled");
      return false;
    }

    const { isProductPage, productId } = this.getProductContext();

    if (!isProductPage) {
      console.log("[Revenue Boost] ⏭️ product_view trigger skipped: not a product page");
      return false;
    }

    const configuredIds = Array.isArray(trigger.product_ids) ? trigger.product_ids : [];

    if (configuredIds.length > 0) {
      if (!productId) {
        console.log(
          "[Revenue Boost] ❌ product_view trigger failed: product_ids configured but current product ID is unknown",
        );
        return false;
      }

      if (!configuredIds.includes(productId)) {
        console.log(
          "[Revenue Boost] ❌ product_view trigger failed: current product not in configured product_ids",
        );
        return false;
      }
    }

    const timeOnPageSeconds = trigger.time_on_page ?? 0;
    const requireScroll = trigger.require_scroll ?? false;

    const needsTimer = timeOnPageSeconds > 0;
    const needsScroll = requireScroll;

    if (!needsTimer && !needsScroll) {
      console.log("[Revenue Boost] ✅ product_view trigger passed immediately (no extra conditions)");
      return true;
    }

    console.log(
      `[Revenue Boost] ⏱️ product_view trigger waiting: ${timeOnPageSeconds}s on page, requireScroll=${requireScroll}`,
    );

    return new Promise((resolve) => {
      let timerMet = !needsTimer;
      let scrollMet = !needsScroll;

      const checkAndResolve = () => {
        if (timerMet && scrollMet) {
          console.log("[Revenue Boost] ✅ product_view trigger conditions met");
          resolve(true);
        }
      };

      if (needsTimer) {
        const timeout = window.setTimeout(() => {
          timerMet = true;
          checkAndResolve();
        }, timeOnPageSeconds * 1000);
        this.cleanupFunctions.push(() => window.clearTimeout(timeout));
      }

      if (needsScroll) {
        const onScroll = () => {
          scrollMet = true;
          window.removeEventListener("scroll", onScroll);
          checkAndResolve();
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        this.cleanupFunctions.push(() => window.removeEventListener("scroll", onScroll));
      }
    });
  }

  /**
   * Get basic product context for the current page
   * Attempts to detect both page type and Shopify product ID
   */
  private getProductContext(): { isProductPage: boolean; productId: string | null } {
    const body = document.body;
    const pathname = window.location.pathname || "";

    let productId: string | null = null;

    // 1) Look for common data attribute used in themes and app blocks
    const productEl = document.querySelector("[data-product-id]") as HTMLElement | null;
    if (productEl) {
      const attr =
        productEl.getAttribute("data-product-id") ||
        (productEl as HTMLElement & { dataset?: DOMStringMap }).dataset?.productId ||
        null;
      const normalized = this.normalizeProductId(attr);
      if (normalized) productId = normalized;
    }

    const win = window as any;

    // 2) ShopifyAnalytics meta
    if (!productId && win.ShopifyAnalytics?.meta?.product?.id) {
      const normalized = this.normalizeProductId(win.ShopifyAnalytics.meta.product.id);
      if (normalized) productId = normalized;
    }

    // 3) window.meta.product (common pattern)
    if (!productId && win.meta?.product?.id) {
      const normalized = this.normalizeProductId(win.meta.product.id);
      if (normalized) productId = normalized;
    }

    // 4) window.product.id (older themes)
    if (!productId && win.product?.id) {
      const normalized = this.normalizeProductId(win.product.id);
      if (normalized) productId = normalized;
    }

    const isProductPage =
      pathname.includes("/products/") ||
      body.classList.contains("template-product") ||
      Boolean(productEl) ||
      Boolean(win.product) ||
      Boolean(win.meta?.product) ||
      Boolean(win.ShopifyAnalytics?.meta?.product);

    return { isProductPage, productId };
  }

  /**
   * Normalize various product ID formats to a Shopify Product GID
   */
  private normalizeProductId(raw: unknown): string | null {
    if (raw == null) return null;
    const idStr = String(raw).trim();
    if (!idStr) return null;

    // Already a GID
    if (idStr.startsWith("gid://")) {
      return idStr;
    }

    // Numeric ID -> convert to GID
    if (/^\d+$/.test(idStr)) {
      return `gid://shopify/Product/${idStr}`;
    }

    return null;
  }

  /**
   * Check idle timer trigger
   */
  private async checkIdleTimer(trigger: IdleTimerTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ idle_timer trigger is disabled");
      return false;
    }

    const idleDuration = trigger.idle_duration || 30;
    console.log(`[Revenue Boost] ⏱️ idle_timer trigger waiting for ${idleDuration}s of inactivity`);

    return new Promise((resolve) => {
      this.idleTimer = new IdleTimer({
        idleDuration: idleDuration * 1000, // Convert seconds to ms
      });

      this.idleTimer.start(() => {
        console.log(`[Revenue Boost] ✅ idle_timer trigger detected: User was idle for ${idleDuration}s`);
        resolve(true);
      });
    });
  }

  /**
   * Check add_to_cart trigger
   * Waits for a Shopify cart add event before firing.
   */
  private async checkAddToCart(trigger: AddToCartTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ add_to_cart trigger is disabled");
      return false;
    }

    const delaySeconds = trigger.delay ?? 0;
    const immediate = trigger.immediate ?? false;

    console.log(
      `[Revenue Boost] 🛒 add_to_cart trigger listening for add-to-cart events (delay=${delaySeconds}s, immediate=${immediate})`,
    );

    return new Promise((resolve) => {
      this.cartEventListener = new CartEventListener({
        events: ["add_to_cart"],
      });

      this.cartEventListener.start(() => {
        if (!immediate && delaySeconds > 0) {
          const delayMs = delaySeconds * 1000;
          console.log(
            `[Revenue Boost] 🛒 add_to_cart detected, waiting additional ${delaySeconds}s before showing`,
          );
          const timeout = window.setTimeout(() => {
            console.log("[Revenue Boost] ✅ add_to_cart trigger conditions met");
            resolve(true);
          }, delayMs);
          this.cleanupFunctions.push(() => window.clearTimeout(timeout));
        } else {
          console.log("[Revenue Boost] ✅ add_to_cart trigger conditions met");
          resolve(true);
        }
      });
    });
  }

  /**
   * Check cart_drawer_open trigger
   */
  private async checkCartDrawerOpen(trigger: CartDrawerOpenTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ cart_drawer_open trigger is disabled");
      return false;
    }

    const delayMs = trigger.delay ?? 0;

    console.log(
      `[Revenue Boost] 🧺 cart_drawer_open trigger listening for cart drawer events (delay=${delayMs}ms)`,
    );

    return new Promise((resolve) => {
      this.cartEventListener = new CartEventListener({
        events: ["cart_drawer_open"],
      });

      this.cartEventListener.start(() => {
        if (delayMs > 0) {
          console.log(
            `[Revenue Boost] 🧺 cart_drawer_open detected, waiting ${delayMs}ms before showing`,
          );
          const timeout = window.setTimeout(() => {
            console.log("[Revenue Boost] ✅ cart_drawer_open trigger conditions met");
            resolve(true);
          }, delayMs);
          this.cleanupFunctions.push(() => window.clearTimeout(timeout));
        } else {
          console.log("[Revenue Boost] ✅ cart_drawer_open trigger conditions met");
          resolve(true);
        }
      });
    });
  }

  /**
   * Check cart_value trigger
   * Uses CartEventListener in cart_update mode with value thresholds.
   */
  private async checkCartValue(trigger: CartValueTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ cart_value trigger is disabled");
      return false;
    }

    const minCartValue =
      trigger.min_value ??
      trigger.minValue ??
      trigger.threshold ??
      0;
    const maxCartValue = trigger.max_value ?? Infinity;

    console.log(
      `[Revenue Boost] 💰 cart_value trigger waiting for cart total between ${minCartValue} and ${maxCartValue}`,
    );

    return new Promise((resolve) => {
      this.cartEventListener = new CartEventListener({
        events: ["cart_update"],
        trackCartValue: true,
        minCartValue,
        maxCartValue,
      });

      this.cartEventListener.start((event) => {
        if (event.type !== "cart_update") return;
        console.log("[Revenue Boost] ✅ cart_value trigger conditions met");
        resolve(true);
      });
    });
  }

  /**
   * Check custom_event trigger
   * Allows merchants to fire popups via custom DOM events.
   */
  private async checkCustomEvent(trigger: CustomEventTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ custom_event trigger is disabled");
      return false;
    }

    const eventNames =
      (Array.isArray(trigger.event_names) && trigger.event_names.length > 0
        ? trigger.event_names
        : trigger.event_name
        ? [trigger.event_name]
        : []);

    if (eventNames.length === 0) {
      console.log(
        "[Revenue Boost] ⏭️ custom_event trigger skipped: no event_name or event_names configured",
      );
      return false;
    }

    console.log("[Revenue Boost] 🎯 custom_event trigger listening for events:", eventNames);

    return new Promise((resolve) => {
      this.customEventHandler = new CustomEventHandler({
        eventNames,
      });

      this.customEventHandler.start((event) => {
        console.log(
          `[Revenue Boost] ✅ custom_event trigger fired from event "${event.eventName}"`,
        );
        resolve(true);
      });
    });
  }


  /**
   * Helper: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, ms);
      this.cleanupFunctions.push(() => clearTimeout(timeout));
    });
  }

  /**
   * Cleanup all triggers
   */
  cleanup(): void {
    this.cleanupFunctions.forEach((fn) => fn());
    this.cleanupFunctions = [];

    // Cleanup all trigger instances
    if (this.exitIntentDetector) {
      this.exitIntentDetector.destroy();
      this.exitIntentDetector = null;
    }
    if (this.scrollDepthTracker) {
      this.scrollDepthTracker.destroy();
      this.scrollDepthTracker = null;
    }
    if (this.timeDelayHandler) {
      this.timeDelayHandler.destroy();
      this.timeDelayHandler = null;
    }
    if (this.idleTimer) {
      this.idleTimer.destroy();
      this.idleTimer = null;
    }
    if (this.cartEventListener) {
      this.cartEventListener.destroy();
      this.cartEventListener = null;
    }
    if (this.customEventHandler) {
      this.customEventHandler.destroy();
      this.customEventHandler = null;
    }
  }
}

