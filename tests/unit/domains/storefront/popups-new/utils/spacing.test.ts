/**
 * Unit Tests for Popup Spacing Utilities
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
  it("should have padding options defined", () => {
    expect(POPUP_SPACING.padding.compact).toBeDefined();
    expect(POPUP_SPACING.padding.medium).toBeDefined();
    expect(POPUP_SPACING.padding.wide).toBeDefined();
    expect(POPUP_SPACING.padding.full).toBeDefined();
  });

  it("should have section spacing options defined", () => {
    expect(POPUP_SPACING.section.xs).toBeDefined();
    expect(POPUP_SPACING.section.sm).toBeDefined();
    expect(POPUP_SPACING.section.md).toBeDefined();
    expect(POPUP_SPACING.section.lg).toBeDefined();
    expect(POPUP_SPACING.section.xl).toBeDefined();
  });

  it("should have component padding options defined", () => {
    expect(POPUP_SPACING.component.badge).toBeDefined();
    expect(POPUP_SPACING.component.button).toBeDefined();
    expect(POPUP_SPACING.component.card).toBeDefined();
    expect(POPUP_SPACING.component.input).toBeDefined();
  });

  it("should have gap options defined", () => {
    expect(POPUP_SPACING.gap.xs).toBeDefined();
    expect(POPUP_SPACING.gap.sm).toBeDefined();
    expect(POPUP_SPACING.gap.md).toBeDefined();
    expect(POPUP_SPACING.gap.lg).toBeDefined();
    expect(POPUP_SPACING.gap.xl).toBeDefined();
  });
});

describe("getContainerPadding", () => {
  it("should return medium padding by default", () => {
    expect(getContainerPadding()).toBe(POPUP_SPACING.padding.medium);
  });

  it("should return compact padding for small size", () => {
    expect(getContainerPadding("small")).toBe(POPUP_SPACING.padding.compact);
  });

  it("should return full padding for large size", () => {
    expect(getContainerPadding("large")).toBe(POPUP_SPACING.padding.full);
  });

  it("should return full padding for fullscreen size", () => {
    expect(getContainerPadding("fullscreen")).toBe(POPUP_SPACING.padding.full);
  });

  it("should handle direct size values", () => {
    expect(getContainerPadding("compact")).toBe(POPUP_SPACING.padding.compact);
    expect(getContainerPadding("medium")).toBe(POPUP_SPACING.padding.medium);
    expect(getContainerPadding("wide")).toBe(POPUP_SPACING.padding.wide);
    expect(getContainerPadding("full")).toBe(POPUP_SPACING.padding.full);
  });
});

describe("getResponsivePadding", () => {
  it("should return compact padding for mobile", () => {
    expect(getResponsivePadding("medium", true)).toBe(POPUP_SPACING.padding.compact);
  });

  it("should return size-based padding for desktop", () => {
    expect(getResponsivePadding("medium", false)).toBe(POPUP_SPACING.padding.medium);
    expect(getResponsivePadding("large", false)).toBe(POPUP_SPACING.padding.full);
  });
});

describe("marginBottom", () => {
  it("should return correct section spacing", () => {
    expect(marginBottom("xs")).toBe(POPUP_SPACING.section.xs);
    expect(marginBottom("sm")).toBe(POPUP_SPACING.section.sm);
    expect(marginBottom("md")).toBe(POPUP_SPACING.section.md);
    expect(marginBottom("lg")).toBe(POPUP_SPACING.section.lg);
    expect(marginBottom("xl")).toBe(POPUP_SPACING.section.xl);
  });
});

describe("gap", () => {
  it("should return correct gap spacing", () => {
    expect(gap("xs")).toBe(POPUP_SPACING.gap.xs);
    expect(gap("sm")).toBe(POPUP_SPACING.gap.sm);
    expect(gap("md")).toBe(POPUP_SPACING.gap.md);
    expect(gap("lg")).toBe(POPUP_SPACING.gap.lg);
    expect(gap("xl")).toBe(POPUP_SPACING.gap.xl);
  });
});

describe("SPACING_GUIDELINES", () => {
  it("should have all guideline values defined", () => {
    expect(SPACING_GUIDELINES.afterBadge).toBeDefined();
    expect(SPACING_GUIDELINES.afterHeadline).toBeDefined();
    expect(SPACING_GUIDELINES.afterDescription).toBeDefined();
    expect(SPACING_GUIDELINES.betweenSections).toBeDefined();
    expect(SPACING_GUIDELINES.betweenFields).toBeDefined();
    expect(SPACING_GUIDELINES.betweenButtons).toBeDefined();
    expect(SPACING_GUIDELINES.beforeCTA).toBeDefined();
  });
});

