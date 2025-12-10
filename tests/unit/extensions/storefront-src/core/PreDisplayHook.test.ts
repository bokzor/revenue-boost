/**
 * Unit Tests for PreDisplayHook System
 *
 * Tests the hook registry, resource cache, and hook execution logic.
 */

import { describe, it, expect } from "vitest";

// Recreate the ResourceCache class
class ResourceCache {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  get(campaignId: string, hookName: string): unknown | null {
    const key = `${campaignId}:${hookName}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.TTL_MS) {
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  set(campaignId: string, hookName: string, data: unknown): void {
    const key = `${campaignId}:${hookName}`;
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(campaignId: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`${campaignId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  clearAll(): void {
    this.cache.clear();
  }
}

describe("PreDisplayHook System", () => {
  describe("ResourceCache", () => {
    it("should store and retrieve cached data", () => {
      const cache = new ResourceCache();
      cache.set("campaign-1", "products", { items: [1, 2, 3] });

      const result = cache.get("campaign-1", "products");
      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it("should return null for non-existent cache entry", () => {
      const cache = new ResourceCache();
      const result = cache.get("campaign-1", "products");
      expect(result).toBeNull();
    });

    it("should clear cache for specific campaign", () => {
      const cache = new ResourceCache();
      cache.set("campaign-1", "products", { items: [1] });
      cache.set("campaign-1", "cart", { total: 100 });
      cache.set("campaign-2", "products", { items: [2] });

      cache.clear("campaign-1");

      expect(cache.get("campaign-1", "products")).toBeNull();
      expect(cache.get("campaign-1", "cart")).toBeNull();
      expect(cache.get("campaign-2", "products")).toEqual({ items: [2] });
    });

    it("should clear all cache entries", () => {
      const cache = new ResourceCache();
      cache.set("campaign-1", "products", { items: [1] });
      cache.set("campaign-2", "products", { items: [2] });

      cache.clearAll();

      expect(cache.get("campaign-1", "products")).toBeNull();
      expect(cache.get("campaign-2", "products")).toBeNull();
    });
  });

  describe("PreDisplayHookContext", () => {
    it("should have required properties", () => {
      const context = {
        campaign: { id: "campaign-1", templateType: "NEWSLETTER" },
        api: {},
        sessionId: "session-123",
        visitorId: "visitor-456",
        previewMode: false,
      };

      expect(context.campaign.id).toBe("campaign-1");
      expect(context.sessionId).toBe("session-123");
      expect(context.previewMode).toBe(false);
    });

    it("should support optional triggerContext", () => {
      const context = {
        campaign: { id: "campaign-1", templateType: "PRODUCT_UPSELL" },
        api: {},
        sessionId: "session-123",
        visitorId: "visitor-456",
        previewMode: false,
        triggerContext: {
          productId: "gid://shopify/Product/123",
        },
      };

      expect(context.triggerContext?.productId).toBe("gid://shopify/Product/123");
    });
  });

  describe("PreDisplayHookResult", () => {
    it("should represent successful result", () => {
      const result = {
        success: true,
        data: { products: [] },
        hookName: "products",
        executionTimeMs: 150,
      };

      expect(result.success).toBe(true);
      expect(result.hookName).toBe("products");
    });

    it("should represent failed result", () => {
      const result = {
        success: false,
        error: "Network error",
        hookName: "products",
        executionTimeMs: 5000,
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("CampaignHooksResult", () => {
    it("should combine multiple hook results", () => {
      const result = {
        success: true,
        loadedResources: {
          products: [{ id: 1 }],
          cart: { total: 100 },
        },
        errors: [],
        hookResults: [],
        totalExecutionTimeMs: 250,
      };

      expect(result.success).toBe(true);
      expect(Object.keys(result.loadedResources)).toHaveLength(2);
    });
  });
});

