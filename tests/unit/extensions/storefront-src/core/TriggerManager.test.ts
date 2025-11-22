/**
 * TriggerManager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TriggerManager } from "../../../../../extensions/storefront-src/core/TriggerManager";

describe("TriggerManager", () => {
  let manager: TriggerManager;
	  let originalWindow: unknown;

  beforeEach(() => {
	    manager = new TriggerManager();

	    // Ensure a minimal window object exists for tests that rely on it
	    // (happy-dom may not expose window.setTimeout / clearTimeout directly).
	    // We preserve any existing properties from the test environment.
	    // eslint-disable-next-line @typescript-eslint/no-explicit-any
	    const g: any = globalThis as any;
	    originalWindow = g.window;
	    if (!g.window) {
	      g.window = {};
	    }
	    if (typeof g.window.setTimeout !== "function") {
	      g.window.setTimeout = setTimeout;
	    }
	    if (typeof g.window.clearTimeout !== "function") {
	      g.window.clearTimeout = clearTimeout;
	    }
  });

	  afterEach(() => {
	    // Restore original window reference to avoid cross-test pollution
	    // eslint-disable-next-line @typescript-eslint/no-explicit-any
	    (globalThis as any).window = originalWindow as any;
	  });

  describe("evaluateTriggers", () => {
    it("should return true if no triggers are defined", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {},
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(true);
    });

    it("should return true if enhancedTriggers is empty", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {},
        },
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(true);
    });

    it("should evaluate page_load trigger", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 0, // Immediate
            },
          },
        },
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(true);
    });

    it("should wait for page_load delay", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 100, // 100ms delay
            },
          },
        },
      };

      const startTime = Date.now();
      const result = await manager.evaluateTriggers(campaign);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some margin
    });

    it("should ignore page_load if disabled and show campaign when no other triggers", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: false,
              delay: 0,
            },
          },
        },
      };

      const result = await manager.evaluateTriggers(campaign);

      expect(result).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("should cleanup all triggers", () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 1000,
            },
          },
        },
      };

      // Start evaluation (don't await)
      manager.evaluateTriggers(campaign);

      // Cleanup should cancel pending timers
      expect(() => manager.cleanup()).not.toThrow();
    });
  });

  describe("multiple triggers with AND logic", () => {
    it("should require all triggers to pass with AND logic", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 0,
            },
            scroll_depth: {
              enabled: true,
              depth_percentage: 50,
            },
            logic_operator: "AND" as const,
          },
        },
      };

      // Mock scroll depth as not met
      vi.spyOn(manager as unknown as { checkScrollDepth: () => Promise<boolean> }, "checkScrollDepth").mockResolvedValue(false);

      const result = await manager.evaluateTriggers(campaign);

      // Should fail because scroll_depth is not met
      expect(result).toBe(false);
    });
  });

  describe("product_view trigger", () => {
    it("should pass on product page when enabled without specific product_ids", async () => {
      document.body.innerHTML = '<div data-product-id="gid://shopify/Product/123"></div>';

      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            product_view: {
              enabled: true,
            },
          },
        },
      };

      const result = await manager.evaluateTriggers(campaign as any);

      expect(result).toBe(true);
    });

    it("should only pass when current product matches configured product_ids", async () => {
      document.body.innerHTML = '<div data-product-id="gid://shopify/Product/123"></div>';

      const matchingCampaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            product_view: {
              enabled: true,
              product_ids: ["gid://shopify/Product/123"],
            },
          },
        },
      };

      const nonMatchingCampaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            product_view: {
              enabled: true,
              product_ids: ["gid://shopify/Product/999"],
            },
          },
        },
      };

      expect(await manager.evaluateTriggers(matchingCampaign as any)).toBe(true);
      expect(await manager.evaluateTriggers(nonMatchingCampaign as any)).toBe(false);
    });

    it("should return false on non-product pages when product_view is enabled", async () => {
      document.body.innerHTML = "<div>Not a product page</div>";

      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            product_view: {
              enabled: true,
            },
          },
        },
      };

      const result = await manager.evaluateTriggers(campaign as any);

      expect(result).toBe(false);
    });
  });


  describe("multiple triggers with OR logic", () => {
    it("should pass if any trigger passes with OR logic", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            page_load: {
              enabled: true,
              delay: 0,
            },
            scroll_depth: {
              enabled: true,
              depth_percentage: 50,
            },
            logic_operator: "OR" as const,
          },
        },
      };

      // Mock scroll depth as not met
      vi.spyOn(manager as unknown as { checkScrollDepth: () => Promise<boolean> }, "checkScrollDepth").mockResolvedValue(false);

      const result = await manager.evaluateTriggers(campaign);

      // Should pass because page_load is met
      expect(result).toBe(true);
    });
  });

  describe("time_delay trigger", () => {
    it("should wait for configured delay in seconds", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            time_delay: {
              enabled: true,
              delay: 0.05,
              immediate: false,
            },
          },
        },
      };

      const start = Date.now();
      const result = await manager.evaluateTriggers(campaign as any);
      const elapsed = Date.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });
  });

  describe("cart-based triggers", () => {
    it("should resolve when add_to_cart event is dispatched", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            add_to_cart: {
              enabled: true,
            },
          },
        },
      };

      const promise = manager.evaluateTriggers(campaign as any);

      // Simulate Shopify add to cart event
      const event = new CustomEvent("cart:add", {
        detail: { productId: "gid://shopify/Product/123", quantity: 1 },
      });
      document.dispatchEvent(event);

      const result = await promise;
      expect(result).toBe(true);
    });

	    it("should resolve when add_to_cart matches configured collectionIds via REVENUE_BOOST_CONFIG", async () => {
	      // Simulate collection context from theme app extension
	      (globalThis as any).window = {
	        REVENUE_BOOST_CONFIG: {
	          collectionId: "987654321",
	        },
	        location: { pathname: "/collections/test-collection" },
	        document,
	      } as any;

	      const campaign = {
	        id: "test-campaign",
	        clientTriggers: {
	          enhancedTriggers: {
	            add_to_cart: {
	              enabled: true,
	              collectionIds: [
	                "gid://shopify/Collection/987654321",
	              ],
	            },
	          },
	        },
	      };

	      const promise = manager.evaluateTriggers(campaign as any);

	      // Product ID does NOT match configured productIds (none configured),
	      // but collection context does, so trigger should still resolve.
	      const event = new CustomEvent("cart:add", {
	        detail: { productId: "gid://shopify/Product/123", quantity: 1 },
	      });
	      document.dispatchEvent(event);

	      const result = await promise;
	      expect(result).toBe(true);
	    });

	    it("should use OR semantics between productIds and collectionIds for add_to_cart", async () => {
	      // Set collection context that does NOT match configured collectionIds
	      (globalThis as any).window = {
	        REVENUE_BOOST_CONFIG: {
	          collectionId: "111111111",
	        },
	        location: { pathname: "/collections/other-collection" },
	        document,
	      } as any;

	      const campaign = {
	        id: "test-campaign",
	        clientTriggers: {
	          enhancedTriggers: {
	            add_to_cart: {
	              enabled: true,
	              productIds: ["gid://shopify/Product/123"],
	              collectionIds: [
	                "gid://shopify/Collection/987654321",
	              ],
	            },
	          },
	        },
	      };

	      const promise = manager.evaluateTriggers(campaign as any);

	      // Product matches but collection does not; OR semantics mean this
	      // should still resolve.
	      const event = new CustomEvent("cart:add", {
	        detail: { productId: "gid://shopify/Product/123", quantity: 1 },
	      });
	      document.dispatchEvent(event);

	      const result = await promise;
	      expect(result).toBe(true);
	    });


    it("should respect add_to_cart delay when configured", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            add_to_cart: {
              enabled: true,
              delay: 0.05,
            },
          },
        },
      };

      const start = Date.now();
      const promise = manager.evaluateTriggers(campaign as any);

      const event = new CustomEvent("cart:add", {
        detail: { productId: "gid://shopify/Product/123", quantity: 1 },
      });
      document.dispatchEvent(event);

      const result = await promise;
      const elapsed = Date.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(40);
    });

    it("should only resolve when add_to_cart matches configured productIds", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            add_to_cart: {
              enabled: true,
              productIds: ["gid://shopify/Product/111"],
            },
          },
        },
      };

      const promise = manager.evaluateTriggers(campaign as any);

      // Non-matching product should NOT resolve
      const nonMatchEvent = new CustomEvent("cart:add", {
        detail: { productId: "gid://shopify/Product/222", quantity: 1 },
      });
      document.dispatchEvent(nonMatchEvent);

      // Give the listener a small tick to potentially resolve (it shouldn't)
      await new Promise((r) => setTimeout(r, 10));

      // Matching product should resolve
      const matchEvent = new CustomEvent("cart:add", {
        detail: { productId: "gid://shopify/Product/111", quantity: 1 },
      });
      document.dispatchEvent(matchEvent);

      const result = await promise;
      expect(result).toBe(true);
    });

    it("should resolve when cart_drawer_open event is dispatched", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            cart_drawer_open: {
              enabled: true,
            },
          },
        },
      };

      const promise = manager.evaluateTriggers(campaign as any);

      const event = new CustomEvent("cart:open");
      document.dispatchEvent(event);

      const result = await promise;
      expect(result).toBe(true);
    });

    it("should resolve cart_value immediately when current cart value is within range", async () => {
      // Set up window.Shopify.cart with a value within range
      const w = globalThis.window as any;
      w.Shopify = {
        cart: {
          total_price: 7500, // $75.00 in cents
          item_count: 2,
        },
      };

      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            cart_value: {
              enabled: true,
              min_value: 50,
              max_value: 100,
            },
          },
        },
      };

      const result = await manager.evaluateTriggers(campaign as any);
      expect(result).toBe(true);
    });

    it("should wait for cart update event when current cart value is outside range", async () => {
      // Set up window.Shopify.cart with a value below range
      const w = globalThis.window as any;
      w.Shopify = {
        cart: {
          total_price: 3000, // $30.00 in cents (below min of 50)
          item_count: 1,
        },
      };

      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            cart_value: {
              enabled: true,
              min_value: 50,
            },
          },
        },
      };

      const promise = manager.evaluateTriggers(campaign as any);

      // Give it a moment to check current value
      await new Promise((r) => setTimeout(r, 10));

      // Above threshold - should resolve
      const aboveEvent = new CustomEvent("cart:update", {
        detail: { total: 75 },
      });
      document.dispatchEvent(aboveEvent);

      const result = await promise;
      expect(result).toBe(true);
    });

    it("should use polling when check_interval is specified", async () => {
      // Start with cart value outside range
      const w = globalThis.window as any;
      w.Shopify = {
        cart: {
          total_price: 3000, // $30.00 in cents (below min of 50)
          item_count: 1,
        },
      };

      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            cart_value: {
              enabled: true,
              min_value: 50,
              check_interval: 50, // Poll every 50ms
            },
          },
        },
      };

      const promise = manager.evaluateTriggers(campaign as any);

      // Wait a bit, then update cart value
      await new Promise((r) => setTimeout(r, 25));
      w.Shopify.cart.total_price = 7500; // $75.00 in cents

      const result = await promise;
      expect(result).toBe(true);
    });

    it("should respect max_value in cart_value trigger", async () => {
      // Set up window.Shopify.cart with a value above max
      const w = globalThis.window as any;
      w.Shopify = {
        cart: {
          total_price: 15000, // $150.00 in cents (above max of 100)
          item_count: 3,
        },
      };

      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            cart_value: {
              enabled: true,
              min_value: 50,
              max_value: 100,
            },
          },
        },
      };

      const promise = manager.evaluateTriggers(campaign as any);

      // Give it a moment to check current value (should not resolve)
      await new Promise((r) => setTimeout(r, 10));

      // Update to value within range - should resolve
      const withinRangeEvent = new CustomEvent("cart:update", {
        detail: { total: 75 },
      });
      document.dispatchEvent(withinRangeEvent);

      const result = await promise;
      expect(result).toBe(true);
    });
  });

  describe("custom_event trigger", () => {
    it("should resolve when configured custom event is fired", async () => {
      const campaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            custom_event: {
              enabled: true,
              event_name: "rb:popup:show",
            },
          },
        },
      };

      const promise = manager.evaluateTriggers(campaign as any);

      const event = new CustomEvent("rb:popup:show", {
        detail: { source: "test" },
      });
      document.dispatchEvent(event);

      const result = await promise;
      expect(result).toBe(true);
    });
  });

  describe("trigger_combination operator", () => {
    it("should respect trigger_combination.operator when present", async () => {
      const baseTriggers = {
        page_load: {
          enabled: true,
          delay: 0,
        },
        scroll_depth: {
          enabled: true,
          depth_percentage: 50,
        },
      };

      const orCampaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            ...baseTriggers,
            trigger_combination: {
              operator: "OR" as const,
            },
          },
        },
      };

      vi.spyOn(
        manager as unknown as { checkScrollDepth: () => Promise<boolean> },
        "checkScrollDepth",
      ).mockResolvedValue(false);

      const orResult = await manager.evaluateTriggers(orCampaign as any);
      expect(orResult).toBe(true);

      const andCampaign = {
        id: "test-campaign",
        clientTriggers: {
          enhancedTriggers: {
            ...baseTriggers,
            trigger_combination: {
              operator: "AND" as const,
            },
          },
        },
      };

      vi.spyOn(
        manager as unknown as { checkScrollDepth: () => Promise<boolean> },
        "checkScrollDepth",
      ).mockResolvedValue(false);

      const andResult = await manager.evaluateTriggers(andCampaign as any);
      expect(andResult).toBe(false);
    });
  });

});

