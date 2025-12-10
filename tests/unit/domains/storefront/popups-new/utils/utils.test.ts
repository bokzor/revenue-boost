/**
 * Unit Tests for Storefront Popup Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  isColorDark,
  getDerivedColors,
  getAdaptiveMutedColor,
  getSizeDimensions,
  getPositionStyles,
  getAnimationClass,
  validateEmail,
  formatCurrency,
  calculateTimeRemaining,
  formatTimeRemaining,
  getBackgroundStyles,
} from "~/domains/storefront/popups-new/utils/utils";

describe("isColorDark", () => {
  it("should return true for black", () => {
    expect(isColorDark("#000000")).toBe(true);
  });

  it("should return false for white", () => {
    expect(isColorDark("#ffffff")).toBe(false);
  });

  it("should handle shorthand hex", () => {
    expect(isColorDark("#fff")).toBe(false);
    expect(isColorDark("#000")).toBe(true);
  });

  it("should handle colors without hash", () => {
    expect(isColorDark("000000")).toBe(true);
    expect(isColorDark("ffffff")).toBe(false);
  });
});

describe("getDerivedColors", () => {
  it("should return light theme colors for dark background", () => {
    const colors = getDerivedColors("#000000");
    expect(colors.isDark).toBe(true);
    expect(colors.muted).toContain("255");
  });

  it("should return dark theme colors for light background", () => {
    const colors = getDerivedColors("#ffffff");
    expect(colors.isDark).toBe(false);
    expect(colors.muted).toContain("0");
  });
});

describe("getAdaptiveMutedColor", () => {
  it("should return muted color for light background", () => {
    const color = getAdaptiveMutedColor("#ffffff");
    expect(color).toContain("0");
  });

  it("should use fallback when no background provided", () => {
    const color = getAdaptiveMutedColor();
    expect(color).toBeDefined();
  });
});

describe("getSizeDimensions", () => {
  it("should return small dimensions", () => {
    const dims = getSizeDimensions("small");
    expect(dims.maxWidth).toBe("420px");
  });

  it("should return medium dimensions", () => {
    const dims = getSizeDimensions("medium");
    expect(dims.maxWidth).toBe("520px");
  });

  it("should return large dimensions", () => {
    const dims = getSizeDimensions("large");
    expect(dims.maxWidth).toBe("680px");
  });

  it("should return fullscreen dimensions", () => {
    const dims = getSizeDimensions("fullscreen");
    expect(dims.maxWidth).toBe("100%");
  });
});

describe("getPositionStyles", () => {
  it("should return center position styles", () => {
    const styles = getPositionStyles("center");
    expect(styles.top).toBe("50%");
    expect(styles.left).toBe("50%");
  });

  it("should return top position styles", () => {
    const styles = getPositionStyles("top");
    expect(styles.top).toBe("20px");
  });

  it("should return bottom position styles", () => {
    const styles = getPositionStyles("bottom");
    expect(styles.bottom).toBe("20px");
  });
});

describe("getAnimationClass", () => {
  it("should return empty string for none animation", () => {
    expect(getAnimationClass("none")).toBe("");
  });

  it("should return enter class for fade animation", () => {
    expect(getAnimationClass("fade")).toBe("popup-enter-fade");
  });

  it("should return exit class when exiting", () => {
    expect(getAnimationClass("fade", true)).toBe("popup-exit-fade");
  });
});

describe("validateEmail", () => {
  it("should return true for valid email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
  });

  it("should return false for invalid email", () => {
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
  });
});

describe("formatCurrency", () => {
  it("should format USD currency", () => {
    expect(formatCurrency(10, "USD")).toContain("10");
    expect(formatCurrency(10, "USD")).toContain("$");
  });

  it("should handle symbol input", () => {
    expect(formatCurrency(10, "$")).toContain("$");
  });
});

describe("calculateTimeRemaining", () => {
  it("should return zeros for past date", () => {
    const past = new Date(Date.now() - 1000);
    const result = calculateTimeRemaining(past);
    expect(result.total).toBe(0);
  });
});

describe("getBackgroundStyles", () => {
  it("should return backgroundColor for solid color", () => {
    const styles = getBackgroundStyles("#ff0000");
    expect(styles.backgroundColor).toBe("#ff0000");
  });

  it("should return backgroundImage for gradient", () => {
    const gradient = "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
    const styles = getBackgroundStyles(gradient);
    expect(styles.backgroundImage).toBe(gradient);
  });
});

