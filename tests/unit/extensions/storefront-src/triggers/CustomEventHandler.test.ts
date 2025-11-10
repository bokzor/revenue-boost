/**
 * CustomEventHandler Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CustomEventHandler } from "../../../../../extensions/storefront-src/triggers/CustomEventHandler";

describe("CustomEventHandler", () => {
  let handler: CustomEventHandler;

  beforeEach(() => {
    handler = new CustomEventHandler();
  });

  afterEach(() => {
    handler.destroy();
  });

  describe("initialization", () => {
    it("should create handler with default config", () => {
      expect(handler).toBeDefined();
    });

    it("should accept custom event names", () => {
      const customHandler = new CustomEventHandler({
        eventNames: ["custom:event1", "custom:event2"],
      });

      expect(customHandler).toBeDefined();
      customHandler.destroy();
    });
  });

  describe("start", () => {
    it("should start listening for custom events", () => {
      const callback = vi.fn();
      const customHandler = new CustomEventHandler({
        eventNames: ["test:event"],
      });
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      customHandler.start(callback);

      expect(addEventListenerSpy).toHaveBeenCalled();
      expect(customHandler.isActive()).toBe(true);

      addEventListenerSpy.mockRestore();
      customHandler.destroy();
    });

    it("should not start if already active", () => {
      const callback = vi.fn();
      
      handler.start(callback);
      handler.start(callback); // Second call should be ignored

      expect(handler.isActive()).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop listening for custom events", () => {
      const callback = vi.fn();
      const customHandler = new CustomEventHandler({
        eventNames: ["test:event"],
      });
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      customHandler.start(callback);
      customHandler.stop();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(customHandler.isActive()).toBe(false);

      removeEventListenerSpy.mockRestore();
      customHandler.destroy();
    });
  });

  describe("custom event detection", () => {
    it("should detect custom event", () => {
      const callback = vi.fn();
      const customHandler = new CustomEventHandler({
        eventNames: ["my:custom:event"],
      });
      
      customHandler.start(callback);

      // Dispatch custom event
      const event = new CustomEvent("my:custom:event", {
        detail: { data: "test" },
      });
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith({
        eventName: "my:custom:event",
        detail: { data: "test" },
      });

      customHandler.destroy();
    });

    it("should detect multiple custom events", () => {
      const callback = vi.fn();
      const customHandler = new CustomEventHandler({
        eventNames: ["event1", "event2"],
      });
      
      customHandler.start(callback);

      // Dispatch first event
      const event1 = new CustomEvent("event1");
      document.dispatchEvent(event1);

      // Dispatch second event
      const event2 = new CustomEvent("event2");
      document.dispatchEvent(event2);

      expect(callback).toHaveBeenCalledTimes(2);
      customHandler.destroy();
    });

    it("should ignore events not in config", () => {
      const callback = vi.fn();
      const customHandler = new CustomEventHandler({
        eventNames: ["allowed:event"],
      });
      
      customHandler.start(callback);

      // Dispatch event not in config
      const event = new CustomEvent("not:allowed:event");
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
      customHandler.destroy();
    });
  });

  describe("addEventName", () => {
    it("should add new event name dynamically", () => {
      const callback = vi.fn();
      
      handler.start(callback);
      handler.addEventName("dynamic:event");

      // Dispatch dynamic event
      const event = new CustomEvent("dynamic:event");
      document.dispatchEvent(event);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe("removeEventName", () => {
    it("should remove event name dynamically", () => {
      const callback = vi.fn();
      const customHandler = new CustomEventHandler({
        eventNames: ["removable:event"],
      });
      
      customHandler.start(callback);
      customHandler.removeEventName("removable:event");

      // Dispatch removed event
      const event = new CustomEvent("removable:event");
      document.dispatchEvent(event);

      expect(callback).not.toHaveBeenCalled();
      customHandler.destroy();
    });
  });

  describe("cleanup", () => {
    it("should cleanup all listeners", () => {
      const callback = vi.fn();
      
      handler.start(callback);
      
      expect(() => handler.destroy()).not.toThrow();
      expect(handler.isActive()).toBe(false);
    });
  });
});

