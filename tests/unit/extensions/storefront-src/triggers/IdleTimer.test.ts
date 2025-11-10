/**
 * IdleTimer Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IdleTimer } from "../../../../../extensions/storefront-src/triggers/IdleTimer";

describe("IdleTimer", () => {
  let timer: IdleTimer;

  beforeEach(() => {
    timer = new IdleTimer();
  });

  afterEach(() => {
    timer.destroy();
  });

  describe("initialization", () => {
    it("should create timer with default config", () => {
      expect(timer).toBeDefined();
    });

    it("should accept custom idle duration", () => {
      const customTimer = new IdleTimer({
        idleDuration: 10000,
      });

      expect(customTimer).toBeDefined();
      customTimer.destroy();
    });

    it("should accept custom events to track", () => {
      const customTimer = new IdleTimer({
        events: ["click", "scroll"],
      });

      expect(customTimer).toBeDefined();
      customTimer.destroy();
    });
  });

  describe("start", () => {
    it("should start listening for activity events", () => {
      const callback = vi.fn();
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      
      timer.start(callback);

      // Should listen for multiple events
      expect(addEventListenerSpy).toHaveBeenCalled();
      expect(timer.isActive()).toBe(true);

      addEventListenerSpy.mockRestore();
    });

    it("should not start if already active", () => {
      const callback = vi.fn();
      
      timer.start(callback);
      timer.start(callback); // Second call should be ignored

      expect(timer.isActive()).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop listening for activity events", () => {
      const callback = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      
      timer.start(callback);
      timer.stop();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(timer.isActive()).toBe(false);

      removeEventListenerSpy.mockRestore();
    });
  });

  describe("idle detection", () => {
    it("should trigger callback after idle duration", async () => {
      const callback = vi.fn();
      const customTimer = new IdleTimer({
        idleDuration: 100,
      });
      
      customTimer.start(callback);

      // Wait for idle duration
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(callback).toHaveBeenCalled();
      customTimer.destroy();
    });

    it("should reset timer on user activity", async () => {
      const callback = vi.fn();
      const customTimer = new IdleTimer({
        idleDuration: 100,
        events: ["mousemove"],
      });
      
      customTimer.start(callback);

      // Wait 50ms
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Simulate user activity
      const event = new MouseEvent("mousemove");
      document.dispatchEvent(event);

      // Wait another 80ms (total 130ms, but timer was reset at 50ms)
      await new Promise((resolve) => setTimeout(resolve, 80));

      // Should not have triggered yet (only 80ms since reset)
      expect(callback).not.toHaveBeenCalled();

      customTimer.destroy();
    });

    it("should only trigger once", async () => {
      const callback = vi.fn();
      const customTimer = new IdleTimer({
        idleDuration: 50,
      });
      
      customTimer.start(callback);

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(callback).toHaveBeenCalledTimes(1);
      customTimer.destroy();
    });
  });

  describe("getIdleTime", () => {
    it("should return current idle time", async () => {
      const customTimer = new IdleTimer({
        idleDuration: 1000,
      });
      
      customTimer.start(vi.fn());

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const idleTime = customTimer.getIdleTime();

      expect(idleTime).toBeGreaterThan(0);
      expect(idleTime).toBeLessThanOrEqual(200); // Allow some margin

      customTimer.destroy();
    });

    it("should return 0 when not active", () => {
      const idleTime = timer.getIdleTime();

      expect(idleTime).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should cleanup all listeners", () => {
      const callback = vi.fn();
      
      timer.start(callback);
      
      expect(() => timer.destroy()).not.toThrow();
      expect(timer.isActive()).toBe(false);
    });
  });
});

