/**
 * Unit Tests for Wheel Canvas Utilities
 */

import { describe, it, expect, beforeEach } from "vitest";

import { WheelRenderer } from "~/domains/storefront/popups-new/utils/wheel-canvas";

describe("WheelRenderer", () => {
  let canvas: HTMLCanvasElement;
  let renderer: WheelRenderer;

  beforeEach(() => {
    canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    renderer = new WheelRenderer(canvas);
  });

  it("should create renderer with canvas", () => {
    expect(renderer).toBeDefined();
  });

  it("should render wheel with segments", () => {
    const segments = [
      { id: "1", label: "10% OFF", probability: 0.3, color: "#FF6B6B" },
      { id: "2", label: "20% OFF", probability: 0.2, color: "#4ECDC4" },
      { id: "3", label: "5% OFF", probability: 0.5, color: "#45B7D1" },
    ];

    const options = {
      wheelSize: 400,
      rotation: 0,
      accentColor: "#3B82F6",
      wheelBorderColor: "#1E3A8A",
      wheelBorderWidth: 4,
      hasSpun: false,
      wonPrize: null,
    };

    expect(() => renderer.render(segments, options)).not.toThrow();
  });

  it("should render wheel with winning segment highlighted", () => {
    const segments = [
      { id: "1", label: "10% OFF", probability: 0.3, color: "#FF6B6B" },
      { id: "2", label: "20% OFF", probability: 0.2, color: "#4ECDC4" },
    ];

    const options = {
      wheelSize: 400,
      rotation: 45,
      accentColor: "#3B82F6",
      wheelBorderColor: "#1E3A8A",
      wheelBorderWidth: 4,
      hasSpun: true,
      wonPrize: segments[0],
    };

    expect(() => renderer.render(segments, options)).not.toThrow();
  });

  it("should render wheel with glow enabled", () => {
    const segments = [
      { id: "1", label: "Prize 1", probability: 0.5, color: "#FF6B6B" },
      { id: "2", label: "Prize 2", probability: 0.5, color: "#4ECDC4" },
    ];

    const options = {
      wheelSize: 400,
      rotation: 0,
      accentColor: "#FFD700",
      wheelBorderColor: "#B8860B",
      wheelBorderWidth: 4,
      hasSpun: false,
      wonPrize: null,
      wheelGlowEnabled: true,
      wheelGlowColor: "#FFD700",
    };

    expect(() => renderer.render(segments, options)).not.toThrow();
  });

  it("should render wheel with gradient center style", () => {
    const segments = [
      { id: "1", label: "Prize", probability: 1, color: "#3B82F6" },
    ];

    const options = {
      wheelSize: 400,
      rotation: 0,
      accentColor: "#3B82F6",
      wheelBorderColor: "#1E3A8A",
      wheelBorderWidth: 4,
      hasSpun: false,
      wonPrize: null,
      wheelCenterStyle: "gradient" as const,
    };

    expect(() => renderer.render(segments, options)).not.toThrow();
  });

  it("should render wheel with metallic center style", () => {
    const segments = [
      { id: "1", label: "Prize", probability: 1, color: "#FFD700" },
    ];

    const options = {
      wheelSize: 400,
      rotation: 0,
      accentColor: "#FFD700",
      wheelBorderColor: "#B8860B",
      wheelBorderWidth: 4,
      hasSpun: false,
      wonPrize: null,
      wheelCenterStyle: "metallic" as const,
    };

    expect(() => renderer.render(segments, options)).not.toThrow();
  });

  it("should handle empty segments array", () => {
    const options = {
      wheelSize: 400,
      rotation: 0,
      accentColor: "#3B82F6",
      wheelBorderColor: "#1E3A8A",
      wheelBorderWidth: 4,
      hasSpun: false,
      wonPrize: null,
    };

    expect(() => renderer.render([], options)).not.toThrow();
  });

  it("should handle rotation values", () => {
    const segments = [
      { id: "1", label: "Prize", probability: 1, color: "#3B82F6" },
    ];

    const options = {
      wheelSize: 400,
      rotation: 720, // Multiple rotations
      accentColor: "#3B82F6",
      wheelBorderColor: "#1E3A8A",
      wheelBorderWidth: 4,
      hasSpun: true,
      wonPrize: segments[0],
    };

    expect(() => renderer.render(segments, options)).not.toThrow();
  });

  it("should handle segments with long labels", () => {
    const segments = [
      { id: "1", label: "Super Long Prize Label That Needs Wrapping", probability: 0.5, color: "#FF6B6B" },
      { id: "2", label: "Another Very Long Label", probability: 0.5, color: "#4ECDC4" },
    ];

    const options = {
      wheelSize: 400,
      rotation: 0,
      accentColor: "#3B82F6",
      wheelBorderColor: "#1E3A8A",
      wheelBorderWidth: 4,
      hasSpun: false,
      wonPrize: null,
    };

    expect(() => renderer.render(segments, options)).not.toThrow();
  });
});

