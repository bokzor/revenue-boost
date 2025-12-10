/**
 * Unit Tests for Popup Spacing System
 */

import { describe, it, expect } from "vitest";

import {
  POPUP_SPACING,
  getContainerPadding,
  getResponsivePadding,
  marginBottom,
  gap,
  SPACING_GUIDELINES,
} from "~/domains/storefront/popups-new/utils/spacing";

describe("POPUP_SPACING", () => {
  it("should have padding values for all sizes", () => {
    expect(POPUP_SPACING.padding.compact).toBeDefined();
    expect(POPUP_SPACING.padding.medium).toBeDefined();
    expect(POPUP_SPACING.padding.wide).toBeDefined();
    expect(POPUP_SPACING.padding.full).toBeDefined();
  });

  it("should have section spacing values", () => {
    expect(POPUP_SPACING.section.xs).toBe("0.5rem");
    expect(POPUP_SPACING.section.sm).toBe("0.75rem");
    expect(POPUP_SPACING.section.md).toBe("1rem");
    expect(POPUP_SPACING.section.lg).toBe("1.5rem");
    expect(POPUP_SPACING.section.xl).toBe("2rem");
  });

  it("should have gap values", () => {
    expect(POPUP_SPACING.gap.xs).toBe("0.5rem");
    expect(POPUP_SPACING.gap.md).toBe("1rem");
    expect(POPUP_SPACING.gap.xl).toBe("1.5rem");
  });

  it("should have component padding values", () => {
    expect(POPUP_SPACING.component.badge).toBeDefined();
    expect(POPUP_SPACING.component.button).toBeDefined();
    expect(POPUP_SPACING.component.input).toBeDefined();
  });
});

describe("getContainerPadding", () => {
  it("should return medium padding by default", () => {
    expect(getContainerPadding()).toBe(POPUP_SPACING.padding.medium);
    expect(getContainerPadding(undefined)).toBe(POPUP_SPACING.padding.medium);
  });

  it("should map small to compact", () => {
    expect(getContainerPadding("small")).toBe(POPUP_SPACING.padding.compact);
  });

  it("should map large to full", () => {
    expect(getContainerPadding("large")).toBe(POPUP_SPACING.padding.full);
  });

  it("should map fullscreen to full", () => {
    expect(getContainerPadding("fullscreen")).toBe(POPUP_SPACING.padding.full);
  });

  it("should return correct padding for direct size values", () => {
    expect(getContainerPadding("compact")).toBe(POPUP_SPACING.padding.compact);
    expect(getContainerPadding("medium")).toBe(POPUP_SPACING.padding.medium);
    expect(getContainerPadding("wide")).toBe(POPUP_SPACING.padding.wide);
    expect(getContainerPadding("full")).toBe(POPUP_SPACING.padding.full);
  });
});

describe("getResponsivePadding", () => {
  it("should return compact padding for mobile", () => {
    expect(getResponsivePadding("large", true)).toBe(POPUP_SPACING.padding.compact);
    expect(getResponsivePadding("medium", true)).toBe(POPUP_SPACING.padding.compact);
  });

  it("should return size-based padding for desktop", () => {
    expect(getResponsivePadding("large", false)).toBe(POPUP_SPACING.padding.full);
    expect(getResponsivePadding("small", false)).toBe(POPUP_SPACING.padding.compact);
  });
});

describe("marginBottom", () => {
  it("should return correct margin values", () => {
    expect(marginBottom("xs")).toBe("0.5rem");
    expect(marginBottom("sm")).toBe("0.75rem");
    expect(marginBottom("md")).toBe("1rem");
    expect(marginBottom("lg")).toBe("1.5rem");
    expect(marginBottom("xl")).toBe("2rem");
  });
});

describe("gap", () => {
  it("should return correct gap values", () => {
    expect(gap("xs")).toBe("0.5rem");
    expect(gap("sm")).toBe("0.75rem");
    expect(gap("md")).toBe("1rem");
    expect(gap("lg")).toBe("1.25rem");
    expect(gap("xl")).toBe("1.5rem");
  });
});

describe("SPACING_GUIDELINES", () => {
  it("should have guidelines for common sections", () => {
    expect(SPACING_GUIDELINES.afterBadge).toBeDefined();
    expect(SPACING_GUIDELINES.afterHeadline).toBeDefined();
    expect(SPACING_GUIDELINES.afterDescription).toBeDefined();
    expect(SPACING_GUIDELINES.betweenSections).toBeDefined();
    expect(SPACING_GUIDELINES.betweenFields).toBeDefined();
    expect(SPACING_GUIDELINES.beforeCTA).toBeDefined();
  });

  it("should use correct spacing values", () => {
    expect(SPACING_GUIDELINES.afterBadge).toBe(POPUP_SPACING.section.md);
    expect(SPACING_GUIDELINES.afterHeadline).toBe(POPUP_SPACING.section.sm);
    expect(SPACING_GUIDELINES.afterDescription).toBe(POPUP_SPACING.section.xl);
  });
});

