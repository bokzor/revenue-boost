/**
 * TriggerManager Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { TriggerManager } from "../../../../../extensions/storefront-src/core/TriggerManager";

describe("TriggerManager", () => {
  let manager: TriggerManager;

  beforeEach(() => {
    manager = new TriggerManager();
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
        detail: { productId: "123", quantity: 1 },
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
        detail: { productId: "123", quantity: 1 },
      });
      document.dispatchEvent(event);

      const result = await promise;
      const elapsed = Date.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(40);
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

    it("should only resolve cart_value when cart total is within range", async () => {
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

      // Below threshold - should not resolve
      const belowEvent = new CustomEvent("cart:update", {
        detail: { total: 30 },
      });
      document.dispatchEvent(belowEvent);

      // Above threshold - should resolve
      const aboveEvent = new CustomEvent("cart:update", {
        detail: { total: 75 },
      });
      document.dispatchEvent(aboveEvent);

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

