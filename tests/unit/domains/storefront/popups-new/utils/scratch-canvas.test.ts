/**
 * Unit Tests for Scratch Canvas Utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  adjustBrightness,
  ScratchCardRenderer,
} from "~/domains/storefront/popups-new/utils/scratch-canvas";

describe("adjustBrightness", () => {
  it("should lighten a color with positive percent", () => {
    const result = adjustBrightness("#000000", 50);
    expect(result).not.toBe("#000000");
    expect(result).toMatch(/^#[a-f0-9]{6}$/i);
  });

  it("should darken a color with negative percent", () => {
    const result = adjustBrightness("#FFFFFF", -50);
    expect(result).not.toBe("#FFFFFF");
    expect(result).toMatch(/^#[a-f0-9]{6}$/i);
  });

  it("should return rgb string unchanged", () => {
    const rgb = "rgb(100, 100, 100)";
    expect(adjustBrightness(rgb, 50)).toBe(rgb);
  });

  it("should handle hex without hash", () => {
    const result = adjustBrightness("FF0000", 10);
    expect(result).toMatch(/^#[a-f0-9]{6}$/i);
  });

  it("should clamp values to 0-255 range", () => {
    const lightened = adjustBrightness("#FFFFFF", 100);
    expect(lightened).toBe("#ffffff");

    const darkened = adjustBrightness("#000000", -100);
    expect(darkened).toBe("#000000");
  });
});

describe("ScratchCardRenderer", () => {
  let overlayCanvas: HTMLCanvasElement;
  let prizeCanvas: HTMLCanvasElement;
  let renderer: ScratchCardRenderer;

  beforeEach(() => {
    overlayCanvas = document.createElement("canvas");
    overlayCanvas.width = 300;
    overlayCanvas.height = 150;

    prizeCanvas = document.createElement("canvas");
    prizeCanvas.width = 300;
    prizeCanvas.height = 150;

    renderer = new ScratchCardRenderer(overlayCanvas, prizeCanvas, 300, 150);
  });

  it("should create renderer with canvases", () => {
    expect(renderer).toBeDefined();
  });

  it("should render prize layer with prize", () => {
    const prize = { id: "1", label: "10% OFF", probability: 0.5 };
    const options = {
      width: 300,
      height: 150,
      accentColor: "#3B82F6",
    };

    // Should not throw
    expect(() => renderer.renderPrizeLayer(prize, options)).not.toThrow();
  });

  it("should render prize layer without prize (loading)", () => {
    const options = {
      width: 300,
      height: 150,
      accentColor: "#3B82F6",
    };

    expect(() => renderer.renderPrizeLayer(null, options)).not.toThrow();
  });

  it("should render overlay layer with metallic effect", () => {
    const options = {
      width: 300,
      height: 150,
      accentColor: "#3B82F6",
      enableMetallic: true,
    };

    expect(() => renderer.renderOverlayLayer(options)).not.toThrow();
  });

  it("should render overlay layer without metallic effect", () => {
    const options = {
      width: 300,
      height: 150,
      accentColor: "#3B82F6",
      enableMetallic: false,
    };

    expect(() => renderer.renderOverlayLayer(options)).not.toThrow();
  });

  it("should perform scratch operation", () => {
    const options = {
      width: 300,
      height: 150,
      accentColor: "#3B82F6",
    };
    renderer.renderOverlayLayer(options);

    expect(() => renderer.scratch(150, 75, { radius: 25 })).not.toThrow();
  });

  it("should calculate scratch percentage", () => {
    const options = {
      width: 300,
      height: 150,
      accentColor: "#3B82F6",
    };
    renderer.renderOverlayLayer(options);

    const percentage = renderer.calculateScratchPercentage();
    expect(typeof percentage).toBe("number");
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  it("should update dimensions", () => {
    expect(() => renderer.setDimensions(400, 200)).not.toThrow();
  });
});

