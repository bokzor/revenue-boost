/**
 * ScrollDepthTracker Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ScrollDepthTracker } from "../../../../../extensions/storefront-src/triggers/ScrollDepthTracker";

describe("ScrollDepthTracker", () => {
  let tracker: ScrollDepthTracker;

  beforeEach(() => {
    tracker = new ScrollDepthTracker();
  });

  afterEach(() => {
    tracker.destroy();
  });

  describe("initialization", () => {
    it("should create tracker with default config", () => {
      expect(tracker).toBeDefined();
    });

    it("should accept custom depth percentage", () => {
      const customTracker = new ScrollDepthTracker({
        depthPercentage: 75,
      });

      expect(customTracker).toBeDefined();
      customTracker.destroy();
    });

    it("should accept custom direction", () => {
      const customTracker = new ScrollDepthTracker({
        direction: "up",
      });

      expect(customTracker).toBeDefined();
      customTracker.destroy();
    });
  });

  describe("start", () => {
    it("should start listening for scroll events", () => {
      const callback = vi.fn();
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");

      tracker.start(callback);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        expect.any(Object)
      );
      expect(tracker.isActive()).toBe(true);

      addEventListenerSpy.mockRestore();
    });

    it("should not start if already active", () => {
      const callback = vi.fn();

      tracker.start(callback);
      const firstActive = tracker.isActive();

      tracker.start(callback); // Second call should be ignored
      const secondActive = tracker.isActive();

      expect(firstActive).toBe(true);
      expect(secondActive).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop listening for scroll events", () => {
      const callback = vi.fn();
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      tracker.start(callback);
      tracker.stop();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function),
        expect.anything()
      );
      expect(tracker.isActive()).toBe(false);

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("getCurrentScrollDepth", () => {
    it("should calculate scroll depth percentage", () => {
      const depth = tracker.getCurrentScrollDepth();

      expect(depth).toBeGreaterThanOrEqual(0);
      expect(depth).toBeLessThanOrEqual(100);
    });

    it("should return 0 at top of page", () => {
      // Mock scroll position at top
      Object.defineProperty(window, "scrollY", { value: 0, writable: true });
      Object.defineProperty(document.documentElement, "scrollHeight", { value: 1000, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 500, writable: true });

      const depth = tracker.getCurrentScrollDepth();

      expect(depth).toBe(0);
    });

    it("should return 100 at bottom of page", () => {
      // Mock scroll position at bottom
      Object.defineProperty(window, "scrollY", { value: 500, writable: true });
      Object.defineProperty(document.documentElement, "scrollHeight", { value: 1000, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 500, writable: true });

      const depth = tracker.getCurrentScrollDepth();

      expect(depth).toBe(100);
    });

    it("should return 50 at middle of page", () => {
      // Mock scroll position at middle
      Object.defineProperty(window, "scrollY", { value: 250, writable: true });
      Object.defineProperty(document.documentElement, "scrollHeight", { value: 1000, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 500, writable: true });

      const depth = tracker.getCurrentScrollDepth();

      expect(depth).toBe(50);
    });
  });

  describe("hasReachedDepth", () => {
    it("should return true when depth is reached", () => {
      const customTracker = new ScrollDepthTracker({
        depthPercentage: 50,
      });

      // Mock scroll at 60%
      Object.defineProperty(window, "scrollY", { value: 300, writable: true });
      Object.defineProperty(document.documentElement, "scrollHeight", { value: 1000, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 500, writable: true });

      const reached = customTracker.hasReachedDepth();

      expect(reached).toBe(true);
      customTracker.destroy();
    });

    it("should return false when depth is not reached", () => {
      const customTracker = new ScrollDepthTracker({
        depthPercentage: 75,
      });

      // Mock scroll at 50%
      Object.defineProperty(window, "scrollY", { value: 250, writable: true });
      Object.defineProperty(document.documentElement, "scrollHeight", { value: 1000, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 500, writable: true });

      const reached = customTracker.hasReachedDepth();

      expect(reached).toBe(false);
      customTracker.destroy();
    });
  });

  describe("cleanup", () => {
    it("should cleanup all listeners", () => {
      const callback = vi.fn();

      tracker.start(callback);

      expect(() => tracker.destroy()).not.toThrow();
      expect(tracker.isActive()).toBe(false);
    });
  });
});

