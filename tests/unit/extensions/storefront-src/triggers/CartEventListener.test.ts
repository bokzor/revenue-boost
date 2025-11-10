/**
 * CartEventListener Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CartEventListener } from "../../../../../extensions/storefront-src/triggers/CartEventListener";

describe("CartEventListener", () => {
  let listener: CartEventListener;

  beforeEach(() => {
    listener = new CartEventListener();
  });

  afterEach(() => {
    listener.destroy();
  });

  describe("initialization", () => {
    it("should create listener with default config", () => {
      expect(listener).toBeDefined();
    });

    it("should accept custom event types", () => {
      const customListener = new CartEventListener({
        events: ["add_to_cart"],
      });

      expect(customListener).toBeDefined();
      customListener.destroy();
    });
  });

  describe("start", () => {
    it("should start listening for cart events", () => {
      const callback = vi.fn();
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      
      listener.start(callback);

      expect(addEventListenerSpy).toHaveBeenCalled();
      expect(listener.isActive()).toBe(true);

      addEventListenerSpy.mockRestore();
    });

    it("should not start if already active", () => {
      const callback = vi.fn();
      
      listener.start(callback);
      listener.start(callback); // Second call should be ignored

      expect(listener.isActive()).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop listening for cart events", () => {
      const callback = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      
      listener.start(callback);
      listener.stop();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(listener.isActive()).toBe(false);

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("cart event detection", () => {
    it("should detect add to cart event", () => {
      const callback = vi.fn();
      
      listener.start(callback);

      // Simulate Shopify add to cart event
      const event = new CustomEvent("cart:add", {
        detail: { productId: "123", quantity: 1 },
      });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith({
        type: "add_to_cart",
        detail: expect.any(Object),
      });
    });

    it("should detect cart drawer open event", () => {
      const callback = vi.fn();
      
      listener.start(callback);

      // Simulate cart drawer open
      const event = new CustomEvent("cart:open");
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith({
        type: "cart_drawer_open",
        detail: expect.any(Object),
      });
    });

    it("should detect cart update event", () => {
      const callback = vi.fn();
      
      listener.start(callback);

      // Simulate cart update
      const event = new CustomEvent("cart:update", {
        detail: { itemCount: 3, total: 99.99 },
      });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith({
        type: "cart_update",
        detail: expect.any(Object),
      });
    });
  });

  describe("cart value tracking", () => {
    it("should track cart value changes", () => {
      const callback = vi.fn();
      const customListener = new CartEventListener({
        trackCartValue: true,
        minCartValue: 50,
      });
      
      customListener.start(callback);

      // Simulate cart update with value above threshold
      const event = new CustomEvent("cart:update", {
        detail: { total: 75.00 },
      });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
      customListener.destroy();
    });

    it("should not trigger if cart value below threshold", () => {
      const callback = vi.fn();
      const customListener = new CartEventListener({
        trackCartValue: true,
        minCartValue: 100,
      });
      
      customListener.start(callback);

      // Simulate cart update with value below threshold
      const event = new CustomEvent("cart:update", {
        detail: { total: 50.00 },
      });
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
      customListener.destroy();
    });
  });

  describe("cleanup", () => {
    it("should cleanup all listeners", () => {
      const callback = vi.fn();
      
      listener.start(callback);
      
      expect(() => listener.destroy()).not.toThrow();
      expect(listener.isActive()).toBe(false);
    });
  });
});

