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

  describe("CartJS integration", () => {
    let originalCartJS: any;

    beforeEach(() => {
      originalCartJS = (globalThis as any).CartJS;
    });

    afterEach(() => {
      (globalThis as any).CartJS = originalCartJS;
    });

    it("wires CartJS item:added to add_to_cart events", () => {
      const callback = vi.fn();
      const on = vi.fn();
      const off = vi.fn();
      (globalThis as any).CartJS = { on, off };

      const customListener = new CartEventListener({
        events: ["add_to_cart"],
      });

      customListener.start(callback);

      expect(on).toHaveBeenCalledWith("item:added", expect.any(Function));
      const addCall = on.mock.calls.find((call) => call[0] === "item:added");
      const addHandler = addCall?.[1] as (cart: unknown, item: unknown) => void;
      expect(addHandler).toBeTypeOf("function");

      const fakeCart = { total_price: 12345 };
      const fakeItem = { id: "123" };

      addHandler(fakeCart, fakeItem);

      expect(callback).toHaveBeenCalledWith({
        type: "add_to_cart",
        detail: { cart: fakeCart, item: fakeItem },
      });

      customListener.destroy();
    });

    it("wires CartJS cart:updated to cart_update and computes total in dollars", () => {
      const callback = vi.fn();
      const on = vi.fn();
      const off = vi.fn();
      (globalThis as any).CartJS = { on, off };

      const customListener = new CartEventListener({
        events: ["cart_update"],
        trackCartValue: true,
        minCartValue: 100,
      });

      customListener.start(callback);

      expect(on).toHaveBeenCalledWith("cart:updated", expect.any(Function));
      const updateCall = on.mock.calls.find((call) => call[0] === "cart:updated");
      const updateHandler = updateCall?.[1] as (cart: any) => void;
      expect(updateHandler).toBeTypeOf("function");

      const lowCart = { total_price: 5000 }; // 50.00
      updateHandler(lowCart);
      expect(callback).not.toHaveBeenCalled();

      const highCart = { total_price: 15000 }; // 150.00
      updateHandler(highCart);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: "cart_update",
        detail: {
          total: 150,
          cart: highCart,
        },
      });

      customListener.destroy();
    });

    it("unsubscribes CartJS handlers on destroy", () => {
      const callback = vi.fn();
      const on = vi.fn();
      const off = vi.fn();
      (globalThis as any).CartJS = { on, off };

      const customListener = new CartEventListener({
        events: ["add_to_cart", "cart_update"],
      });

      customListener.start(callback);
      expect(on).toHaveBeenCalled();

      customListener.destroy();

      expect(off).toHaveBeenCalled();
      const offEvents = off.mock.calls.map((call) => call[0]);
      expect(offEvents).toContain("item:added");
      expect(offEvents).toContain("cart:updated");
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

