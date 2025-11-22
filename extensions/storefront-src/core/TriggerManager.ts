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

export interface SessionCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin";
  value: string | number | boolean | string[];
}

export interface SessionRulesConfig {
  enabled?: boolean;
  conditions?: SessionCondition[];
  logicOperator?: "AND" | "OR";
}

export interface Campaign {
  id: string;
  clientTriggers?: {
    enhancedTriggers?: EnhancedTriggers;
    sessionRules?: SessionRulesConfig;
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
  /**
   * If true, ignore delay and trigger immediately when condition is met.
   */
  immediate?: boolean;
  /**
   * Optional list of Shopify Product GIDs that should trigger the popup when
   * added to cart. If empty/undefined, any product will match.
   *
   * Mirrors EnhancedTriggersConfig.add_to_cart.productIds on the server.
   */
  productIds?: string[];
  /**
	   * Optional list of Shopify Collection GIDs configured in the UI.
	   *
	   * Behaviour on the storefront:
	   * - If one or more collectionIds are configured, the trigger will only
	   *   fire when the add-to-cart happens while the shopper is viewing a
	   *   matching collection page.
	   * - Matching is based on the current collection context, derived from
	   *   `window.REVENUE_BOOST_CONFIG.collectionId` (set by the theme app
	   *   extension) or, as a fallback, from `ShopifyAnalytics.meta.collection.id`
	   *   when available.
	   * - Product and collection filters are combined with OR semantics:
	   *   the trigger will pass if EITHER the added product matches productIds
	   *   OR the current collection context matches collectionIds (or both).
   */
  collectionIds?: string[];
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

    // If trigger evaluation failed, no need to check session rules
    if (!finalResult) {
      console.log("[Revenue Boost] ❌ Campaign will not show - trigger conditions failed");
      return false;
    }

    // Evaluate session-level rules (SessionTrigger) on live client context
    const sessionRules = campaign.clientTriggers?.sessionRules;
    if (sessionRules && sessionRules.enabled && sessionRules.conditions && sessionRules.conditions.length > 0) {
      const sessionOk = this.evaluateSessionRules(sessionRules);
      console.log(
        `[Revenue Boost] ${sessionOk ? "✅" : "❌"} Session rules ` +
          `${sessionOk ? "passed" : "failed"} for campaign ${campaign.id}`,
      );
      if (!sessionOk) {
        return false;
      }
    }

    console.log(
      `[Revenue Boost] ✅ CAMPAIGN WILL SHOW - Final result: triggers + session rules passed for ${campaign.id}`,
    );

    return true;
  }

  /**
   * Evaluate session-level rules (SessionTrigger) using live client context.
   * This mirrors AudienceTargetingConfig.sessionRules on the server.
   */
  private evaluateSessionRules(sessionRules: SessionRulesConfig): boolean {
    const conditions = sessionRules.conditions || [];
    if (!sessionRules.enabled || conditions.length === 0) {
      console.log("[Revenue Boost] ℹ️ Session rules disabled or empty, skipping session evaluation");
      return true;
    }

    const ctx = this.buildRuntimeContext();
    const op = sessionRules.logicOperator || "AND";

    console.log("[Revenue Boost] 🧩 Evaluating session rules", {
      logicOperator: op,
      conditions,
      runtimeContext: ctx,
    });

    const results = conditions.map((cond) => this.evaluateSessionCondition(cond, ctx));

    console.log("[Revenue Boost] 🧩 Session rule results", results);

    if (op === "OR") {
      return results.some(Boolean);
    }
    return results.every(Boolean);
  }

  /**
   * Minimal runtime context available on the storefront for session rules.
   * Currently supports cartValue and cartItemCount via Shopify global cart.
   */
  private buildRuntimeContext(): { cartValue?: number; cartItemCount?: number } {
    const ctx: { cartValue?: number; cartItemCount?: number } = {};

    type ShopifyGlobal = { Shopify?: { cart?: { total_price: number; item_count: number } } };
    const w = window as unknown as ShopifyGlobal;
    if (w.Shopify && w.Shopify.cart) {
      const cart = w.Shopify.cart;
      ctx.cartValue = typeof cart.total_price === "number" ? cart.total_price / 100 : undefined;
      ctx.cartItemCount = typeof cart.item_count === "number" ? cart.item_count : undefined;
    }

    return ctx;
  }

  /**
   * Evaluate a single session condition against the runtime context.
   */
  private evaluateSessionCondition(
    condition: SessionCondition,
    ctx: { cartValue?: number; cartItemCount?: number },
  ): boolean {
    const field = condition.field;

    let value: unknown;
    switch (field) {
      case "cart-item-count":
      case "cartItemCount": {
        value = ctx.cartItemCount;
        break;
      }
      case "cart-value":
      case "cartValue": {
        value = ctx.cartValue;
        break;
      }
      default: {
        console.log(
          "[Revenue Boost] ⚠️ Unknown session rule field, skipping condition:",
          field,
        );
        return true; // Fail-open for unknown fields to avoid breaking campaigns
      }
    }

    const op = condition.operator;
    const target = condition.value;

    console.log("[Revenue Boost] 🔍 Evaluating session condition", {
      field,
      operator: op,
      target,
      runtimeValue: value,
    });

    if (value == null) {
      console.log("[Revenue Boost] ❌ Session condition failed: runtime value is null/undefined");
      return false;
    }

    // Numeric comparison helpers
    const asNumber = (v: unknown): number => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const parsed = parseFloat(v);
        return Number.isNaN(parsed) ? NaN : parsed;
      }
      return NaN;
    };

    const valNum = asNumber(value);
    const targetNum = asNumber(target);

    let result: boolean;

    switch (op) {
      case "gt":
        result = valNum > targetNum;
        break;
      case "gte":
        result = valNum >= targetNum;
        break;
      case "lt":
        result = valNum < targetNum;
        break;
      case "lte":
        result = valNum <= targetNum;
        break;
      case "eq":
        result = value === target;
        break;
      case "ne":
        result = value !== target;
        break;
      case "in": {
        const arr = Array.isArray(target) ? target : [target];
        result = arr.includes(value as any);
        break;
      }
      case "nin": {
        const arr = Array.isArray(target) ? target : [target];
        result = !arr.includes(value as any);
        break;
      }
      default:
        result = true;
        break;
    }

    console.log("[Revenue Boost] 🔍 Session condition result", {
      field,
      operator: op,
      target,
      runtimeValue: value,
      result,
    });

    return result;
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
	   * Get current collection context (numeric Shopify collection ID as string
	   * when available).
	   *
	   * Sources (in order):
	   * - window.REVENUE_BOOST_CONFIG.collectionId (set by popup-init.liquid on
	   *   collection templates)
	   * - ShopifyAnalytics.meta.collection.id (when themes expose it)
	   */
	  private getCollectionIdFromContext(): string | null {
	    if (typeof window === "undefined") {
	      return null;
	    }

	    // REVENUE_BOOST_CONFIG path ( Theme App Extension snippet )
	    type W = typeof window & {
	      REVENUE_BOOST_CONFIG?: {
	        collectionId?: string | number;
	      };
	      ShopifyAnalytics?: {
	        meta?: {
	          // Some themes expose collection context here
	          collection?: { id?: string | number };
	        };
	      };
	    };
	    const w = window as unknown as W;

	    let raw: string | number | undefined | null = w.REVENUE_BOOST_CONFIG?.collectionId;
	    if (raw == null && w.ShopifyAnalytics?.meta?.collection?.id != null) {
	      raw = w.ShopifyAnalytics.meta.collection.id;
	    }

	    if (raw == null) {
	      return null;
	    }

	    const idStr = String(raw).trim();
	    if (!idStr) return null;

	    // If a GID is provided, return the numeric segment
	    if (idStr.startsWith("gid://")) {
	      const parts = idStr.split("/");
	      return parts[parts.length - 1] || null;
	    }

	    return idStr;
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
	   *
	   * Behaviour:
	   * - Listens for unified cart add events emitted by CartEventListener
	   *   (backed by `cart:add`, `cart:item-added`, CartJS, etc.).
	   * - If `productIds` are configured, only resolves when the added product
	   *   matches one of those Shopify Product GIDs.
	   * - If `collectionIds` are configured, only resolves when the add-to-cart
	   *   happens while the shopper is viewing a matching collection page
	   *   (collection context is derived from REVENUE_BOOST_CONFIG or, as a
	   *   fallback, ShopifyAnalytics meta).
	   * - When both productIds and collectionIds are configured, they are
	   *   combined with OR semantics: the trigger will pass if either filter
	   *   matches for a given add-to-cart event.
	   */
  private async checkAddToCart(trigger: AddToCartTrigger): Promise<boolean> {
    if (!trigger.enabled) {
      console.log("[Revenue Boost] ⏭️ add_to_cart trigger is disabled");
      return false;
    }

    const delaySeconds = trigger.delay ?? 0;
    const immediate = trigger.immediate ?? false;

	    // Normalize configured product IDs (Shopify Product GIDs)
	    const configuredProductIds = Array.isArray(trigger.productIds)
	      ? trigger.productIds.filter((id) => typeof id === "string" && id.trim() !== "")
	      : [];

	    // Normalize configured collection IDs to their numeric component so they
	    // can be compared against REVENUE_BOOST_CONFIG.collectionId which stores
	    // the numeric ID (mirrors PageTargeting behaviour on the server).
	    const configuredCollectionNumericIds: string[] = Array.isArray(trigger.collectionIds)
	      ? trigger.collectionIds
	          .filter((id) => typeof id === "string" && id.trim() !== "")
	          .map((gid) => {
	            const parts = gid.split("/");
	            return parts[parts.length - 1] || "";
	          })
	          .filter((id) => id !== "")
	      : [];

	    const hasProductFilter = configuredProductIds.length > 0;
	    const hasCollectionFilter = configuredCollectionNumericIds.length > 0;

    console.log(
      `[Revenue Boost] 🛒 add_to_cart trigger listening for add-to-cart events (delay=${delaySeconds}s, immediate=${immediate})`,
    );

    return new Promise((resolve) => {
      this.cartEventListener = new CartEventListener({
        events: ["add_to_cart"],
      });

      this.cartEventListener.start((event) => {
	        const detail = event?.detail as unknown;

	        // Evaluate productId filter (if configured)
	        let passesProductFilter = !hasProductFilter;
	        let eventProductId: string | null = null;

	        if (hasProductFilter) {
	          // Our unified cart tracking emits `{ productId }`
	          if (
	            detail &&
	            typeof detail === "object" &&
	            "productId" in (detail as Record<string, unknown>)
	          ) {
	            eventProductId = this.normalizeProductId(
	              (detail as { productId?: unknown }).productId,
	            );
	          }

	          // CartJS path: detail may be `{ cart, item }` where item has `product_id`
	          if (!eventProductId && detail && typeof detail === "object") {
	            const d = detail as { item?: unknown };
	            const item = d.item as
	              | { product_id?: unknown; productId?: unknown; id?: unknown }
	              | undefined;
	            if (item) {
	              const rawProductId =
	                (item as any).product_id ?? (item as any).productId ?? null;
	              eventProductId = this.normalizeProductId(rawProductId);
	            }
	          }

	          if (!eventProductId) {
	            console.log(
	              "[Revenue Boost] ❌ add_to_cart trigger: productIds configured but event productId is unknown; ignoring event",
	            );
	            passesProductFilter = false;
	          } else if (!configuredProductIds.includes(eventProductId)) {
	            console.log(
	              "[Revenue Boost] ❌ add_to_cart trigger: event productId not in configured productIds; ignoring event",
	              { eventProductId, configuredProductIds },
	            );
	            passesProductFilter = false;
	          } else {
	            console.log(
	              "[Revenue Boost] ✅ add_to_cart trigger: matched configured productId",
	              { eventProductId },
	            );
	            passesProductFilter = true;
	          }
	        }

	        // Evaluate collection filter (if configured)
	        let passesCollectionFilter = !hasCollectionFilter;
	        if (hasCollectionFilter) {
	          const ctxCollectionId = this.getCollectionIdFromContext();
	          if (!ctxCollectionId) {
	            console.log(
	              "[Revenue Boost] ❌ add_to_cart trigger: collectionIds configured but no collection context available; ignoring event for collection filter",
	            );
	            passesCollectionFilter = false;
	          } else {
	            const collectionMatch = configuredCollectionNumericIds.includes(
	              ctxCollectionId,
	            );
	            if (!collectionMatch) {
	              console.log(
	                "[Revenue Boost] ❌ add_to_cart trigger: current collection does not match configured collectionIds; ignoring event for collection filter",
	                { ctxCollectionId, configuredCollectionNumericIds },
	              );
	              passesCollectionFilter = false;
	            } else {
	              console.log(
	                "[Revenue Boost] ✅ add_to_cart trigger: matched configured collectionId",
	                { ctxCollectionId },
	              );
	              passesCollectionFilter = true;
	            }
	          }
	        }

	        // If neither filter matches, ignore this add_to_cart event and wait for another
	        if (!passesProductFilter && !passesCollectionFilter) {
	          return;
	        }

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
   * First checks current cart value, then listens for cart updates if needed.
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
      `[Revenue Boost] 💰 Checking cart_value trigger: cart total must be between ${minCartValue} and ${maxCartValue}`,
    );

    // First, check the current cart value
    const currentCartValue = this.getCurrentCartValue();
    console.log(`[Revenue Boost] 💰 Current cart value: ${currentCartValue}`);

    // If current cart value meets the criteria, resolve immediately
    if (currentCartValue >= minCartValue && currentCartValue <= maxCartValue) {
      console.log("[Revenue Boost] ✅ cart_value trigger conditions met (current cart value)");
      return true;
    }

    // If check_interval is specified, poll the cart value periodically
    const checkInterval = trigger.check_interval;
    if (checkInterval && checkInterval > 0) {
      console.log(
        `[Revenue Boost] 💰 cart_value trigger will poll every ${checkInterval}ms for cart value changes`,
      );

      return new Promise((resolve) => {
        const intervalId = window.setInterval(() => {
          const cartValue = this.getCurrentCartValue();
          console.log(`[Revenue Boost] 💰 Polling cart value: ${cartValue}`);

          if (cartValue >= minCartValue && cartValue <= maxCartValue) {
            console.log("[Revenue Boost] ✅ cart_value trigger conditions met (polling)");
            window.clearInterval(intervalId);
            resolve(true);
          }
        }, checkInterval);

        // Store cleanup function
        this.cleanupFunctions.push(() => window.clearInterval(intervalId));
      });
    }

    // Otherwise, wait for cart update events
    console.log(
      `[Revenue Boost] 💰 cart_value trigger waiting for cart update events (current value ${currentCartValue} is outside range)`,
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
        console.log("[Revenue Boost] ✅ cart_value trigger conditions met (cart update event)");
        resolve(true);
      });
    });
  }

  /**
   * Get the current cart value from window.Shopify.cart
   */
  private getCurrentCartValue(): number {
    type ShopifyGlobal = { Shopify?: { cart?: { total_price: number } } };
    const w = window as unknown as ShopifyGlobal;

    if (w.Shopify && w.Shopify.cart && typeof w.Shopify.cart.total_price === "number") {
      // Convert from cents to dollars
      return w.Shopify.cart.total_price / 100;
    }

    return 0;
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

