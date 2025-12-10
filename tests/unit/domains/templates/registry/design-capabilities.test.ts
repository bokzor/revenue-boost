/**
 * Unit Tests for Design Capabilities Registry
 */

import { describe, it, expect } from "vitest";

import {
  TEMPLATE_DESIGN_CAPABILITIES,
  getDesignCapabilities,
} from "~/domains/templates/registry/design-capabilities";

describe("TEMPLATE_DESIGN_CAPABILITIES", () => {
  it("should have capabilities for NEWSLETTER", () => {
    const caps = TEMPLATE_DESIGN_CAPABILITIES.NEWSLETTER;

    expect(caps.usesButtons).toBe(true);
    expect(caps.usesInputs).toBe(true);
    expect(caps.usesOverlay).toBe(true);
    expect(caps.usesImage).toBe(true);
    expect(caps.supportsPosition).toContain("center");
    expect(caps.supportsSize).toContain("medium");
  });

  it("should have capabilities for FREE_SHIPPING", () => {
    const caps = TEMPLATE_DESIGN_CAPABILITIES.FREE_SHIPPING;

    expect(caps.usesButtons).toBe(false);
    expect(caps.usesInputs).toBe(false);
    expect(caps.usesOverlay).toBe(false);
    expect(caps.usesImage).toBe(false);
    expect(caps.supportsPosition).toEqual(["top", "bottom"]);
    expect(caps.supportsSize).toEqual([]);
  });

  it("should have capabilities for SPIN_TO_WIN", () => {
    const caps = TEMPLATE_DESIGN_CAPABILITIES.SPIN_TO_WIN;

    expect(caps.usesButtons).toBe(true);
    expect(caps.usesInputs).toBe(true);
    expect(caps.usesOverlay).toBe(true);
    expect(caps.supportsPosition).toEqual(["center"]);
    expect(caps.usesLayout).toBe(false);
  });

  it("should have capabilities for FLASH_SALE", () => {
    const caps = TEMPLATE_DESIGN_CAPABILITIES.FLASH_SALE;

    expect(caps.usesButtons).toBe(true);
    expect(caps.usesInputs).toBe(false);
    expect(caps.usesOverlay).toBe(true);
    expect(caps.usesImage).toBe(true);
    expect(caps.supportsDisplayMode).toBe(false);
    expect(caps.supportedImagePositions).toEqual(["full", "none"]);
  });

  it("should have capabilities for SOCIAL_PROOF", () => {
    const caps = TEMPLATE_DESIGN_CAPABILITIES.SOCIAL_PROOF;

    expect(caps.usesButtons).toBe(false);
    expect(caps.usesInputs).toBe(false);
    expect(caps.usesOverlay).toBe(false);
    expect(caps.supportsPosition).toEqual([]);
    expect(caps.supportsSize).toEqual([]);
  });

  it("should have capabilities for COUNTDOWN_TIMER", () => {
    const caps = TEMPLATE_DESIGN_CAPABILITIES.COUNTDOWN_TIMER;

    expect(caps.usesButtons).toBe(true);
    expect(caps.usesOverlay).toBe(true);
    expect(caps.supportsDisplayMode).toBe(true);
    expect(caps.supportsPosition).toContain("center");
    expect(caps.supportsPosition).toContain("top");
    expect(caps.supportsPosition).toContain("bottom");
  });

  it("should have capabilities for all template types", () => {
    const templateTypes = [
      "NEWSLETTER",
      "EXIT_INTENT",
      "FREE_SHIPPING",
      "FLASH_SALE",
      "SPIN_TO_WIN",
      "SCRATCH_CARD",
      "CART_ABANDONMENT",
      "PRODUCT_UPSELL",
      "SOCIAL_PROOF",
      "COUNTDOWN_TIMER",
      "ANNOUNCEMENT",
    ];

    templateTypes.forEach((type) => {
      expect(TEMPLATE_DESIGN_CAPABILITIES[type as keyof typeof TEMPLATE_DESIGN_CAPABILITIES]).toBeDefined();
    });
  });
});

describe("getDesignCapabilities", () => {
  it("should return capabilities for valid template type", () => {
    const caps = getDesignCapabilities("NEWSLETTER");

    expect(caps).toBeDefined();
    expect(caps?.usesButtons).toBe(true);
  });

  it("should return undefined for undefined template type", () => {
    const caps = getDesignCapabilities(undefined);

    expect(caps).toBeUndefined();
  });

  it("should return capabilities for SPIN_TO_WIN", () => {
    const caps = getDesignCapabilities("SPIN_TO_WIN");

    expect(caps).toBeDefined();
    expect(caps?.usesInputs).toBe(true);
    expect(caps?.supportsPosition).toEqual(["center"]);
  });
});

