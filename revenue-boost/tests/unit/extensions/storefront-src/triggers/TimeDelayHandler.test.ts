/**
 * TimeDelayHandler Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TimeDelayHandler } from "../../../../../extensions/storefront-src/triggers/TimeDelayHandler";

describe("TimeDelayHandler", () => {
  let handler: TimeDelayHandler;

  beforeEach(() => {
    handler = new TimeDelayHandler();
  });

  afterEach(() => {
    handler.destroy();
  });

  describe("initialization", () => {
    it("should create handler with default config", () => {
      expect(handler).toBeDefined();
    });

    it("should accept custom delay", () => {
      const customHandler = new TimeDelayHandler({
        delay: 5000,
      });

      expect(customHandler).toBeDefined();
      customHandler.destroy();
    });
  });

  describe("start", () => {
    it("should start timer", () => {
      const callback = vi.fn();
      
      handler.start(callback);

      expect(handler.isActive()).toBe(true);
    });

    it("should not start if already active", () => {
      const callback = vi.fn();
      
      handler.start(callback);
      handler.start(callback); // Second call should be ignored

      expect(handler.isActive()).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop timer", () => {
      const callback = vi.fn();
      
      handler.start(callback);
      handler.stop();

      expect(handler.isActive()).toBe(false);
    });

    it("should cancel pending callback", async () => {
      const callback = vi.fn();
      
      handler.start(callback);
      handler.stop();

      // Wait to ensure callback doesn't fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("delay execution", () => {
    it("should trigger callback after delay", async () => {
      const callback = vi.fn();
      const customHandler = new TimeDelayHandler({
        delay: 50,
      });
      
      customHandler.start(callback);

      // Should not trigger immediately
      expect(callback).not.toHaveBeenCalled();

      // Wait for delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(callback).toHaveBeenCalled();
      customHandler.destroy();
    });

    it("should trigger with minimal delay", async () => {
      const callback = vi.fn();
      const customHandler = new TimeDelayHandler({
        delay: 10,
      });

      customHandler.start(callback);

      // Should not trigger immediately
      expect(callback).not.toHaveBeenCalled();

      // Wait for delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalled();
      customHandler.destroy();
    });

    it("should only trigger once", async () => {
      const callback = vi.fn();
      const customHandler = new TimeDelayHandler({
        delay: 50,
      });
      
      customHandler.start(callback);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(callback).toHaveBeenCalledTimes(1);
      customHandler.destroy();
    });
  });

  describe("pause and resume", () => {
    it("should pause timer", () => {
      const callback = vi.fn();
      
      handler.start(callback);
      handler.pause();

      expect(handler.isPaused()).toBe(true);
    });

    it("should resume timer", async () => {
      const callback = vi.fn();
      const customHandler = new TimeDelayHandler({
        delay: 100,
      });
      
      customHandler.start(callback);
      
      // Pause after 30ms
      await new Promise((resolve) => setTimeout(resolve, 30));
      customHandler.pause();

      // Wait another 100ms (should not trigger)
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(callback).not.toHaveBeenCalled();

      // Resume
      customHandler.resume();

      // Wait for remaining time
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(callback).toHaveBeenCalled();

      customHandler.destroy();
    });
  });

  describe("getRemainingTime", () => {
    it("should return remaining time", async () => {
      const customHandler = new TimeDelayHandler({
        delay: 1000,
      });
      
      customHandler.start(vi.fn());

      const remaining = customHandler.getRemainingTime();

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(1000);

      customHandler.destroy();
    });

    it("should return 0 when not active", () => {
      const remaining = handler.getRemainingTime();

      expect(remaining).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("should cleanup timer", () => {
      const callback = vi.fn();
      
      handler.start(callback);
      
      expect(() => handler.destroy()).not.toThrow();
      expect(handler.isActive()).toBe(false);
    });
  });
});

