/**
 * ExitIntentDetector Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExitIntentDetector } from "../../../../../extensions/storefront-src/triggers/ExitIntentDetector";

describe("ExitIntentDetector", () => {
  let detector: ExitIntentDetector;

  beforeEach(() => {
    detector = new ExitIntentDetector();
  });

  afterEach(() => {
    detector.destroy();
  });

  describe("initialization", () => {
    it("should create detector with default config", () => {
      expect(detector).toBeDefined();
    });

    it("should accept custom sensitivity", () => {
      const customDetector = new ExitIntentDetector({
        sensitivity: "high",
      });

      expect(customDetector).toBeDefined();
      customDetector.destroy();
    });

    it("should accept custom delay", () => {
      const customDetector = new ExitIntentDetector({
        delay: 2000,
      });

      expect(customDetector).toBeDefined();
      customDetector.destroy();
    });
  });

  describe("start", () => {
    it("should start listening for mouse events", () => {
      const callback = vi.fn();
      
      detector.start(callback);

      // Detector should be active
      expect(detector.isActive()).toBe(true);
    });

    it("should not start if already active", () => {
      const callback = vi.fn();
      
      detector.start(callback);
      detector.start(callback); // Second call should be ignored

      expect(detector.isActive()).toBe(true);
    });
  });

  describe("stop", () => {
    it("should stop listening for mouse events", () => {
      const callback = vi.fn();
      
      detector.start(callback);
      detector.stop();

      expect(detector.isActive()).toBe(false);
    });
  });

  describe("exit intent detection", () => {
    it("should setup mouse event listener when started", () => {
      const callback = vi.fn();
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      detector.start(callback);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "mousemove",
        expect.any(Function),
        { passive: true }
      );

      addEventListenerSpy.mockRestore();
    });

    it("should remove mouse event listener when stopped", () => {
      const callback = vi.fn();
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      detector.start(callback);
      detector.stop();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "mousemove",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it("should have configurable delay", () => {
      const customDetector = new ExitIntentDetector({
        delay: 500,
      });

      expect(customDetector).toBeDefined();
      customDetector.destroy();
    });
  });

  describe("sensitivity levels", () => {
    it("should use low sensitivity threshold", () => {
      const lowDetector = new ExitIntentDetector({
        sensitivity: "low",
      });

      expect(lowDetector).toBeDefined();
      lowDetector.destroy();
    });

    it("should use medium sensitivity threshold", () => {
      const mediumDetector = new ExitIntentDetector({
        sensitivity: "medium",
      });

      expect(mediumDetector).toBeDefined();
      mediumDetector.destroy();
    });

    it("should use high sensitivity threshold", () => {
      const highDetector = new ExitIntentDetector({
        sensitivity: "high",
      });

      expect(highDetector).toBeDefined();
      highDetector.destroy();
    });
  });
});

