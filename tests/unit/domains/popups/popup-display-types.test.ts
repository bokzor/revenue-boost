/**
 * Unit Tests for Popup Display Types
 */

import { describe, it, expect } from "vitest";

import {
  DISPLAY_PRESETS,
  getDisplayPreset,
  getMobileDisplayConfig,
} from "~/domains/popups/popup-display-types";
import type {
  DisplayMode,
  DrawerPosition,
  AnimationStyle,
  PopupDisplayConfig,
} from "~/domains/popups/popup-display-types";

describe("DisplayMode", () => {
  it("should support expected display modes", () => {
    const modes: DisplayMode[] = ["popup", "drawer-overlay", "slide-in", "banner"];

    expect(modes).toHaveLength(4);
    expect(modes).toContain("popup");
    expect(modes).toContain("banner");
  });
});

describe("DrawerPosition", () => {
  it("should support expected drawer positions", () => {
    const positions: DrawerPosition[] = ["top", "bottom", "left", "right", "bottom-of-drawer"];

    expect(positions).toHaveLength(5);
    expect(positions).toContain("bottom-of-drawer");
  });
});

describe("AnimationStyle", () => {
  it("should support expected animation styles", () => {
    const styles: AnimationStyle[] = [
      "fade",
      "slide",
      "zoom",
      "bounce",
      "scale",
      "slide-up",
      "slide-down",
    ];

    expect(styles).toHaveLength(7);
    expect(styles).toContain("fade");
    expect(styles).toContain("bounce");
  });
});

describe("DISPLAY_PRESETS", () => {
  it("should have popup presets", () => {
    expect(DISPLAY_PRESETS["popup-center"]).toBeDefined();
    expect(DISPLAY_PRESETS["popup-center"].mode).toBe("popup");
    expect(DISPLAY_PRESETS["popup-center"].animation).toBe("fade");
  });

  it("should have drawer overlay presets", () => {
    expect(DISPLAY_PRESETS["drawer-overlay-top"]).toBeDefined();
    expect(DISPLAY_PRESETS["drawer-overlay-bottom"]).toBeDefined();
    expect(DISPLAY_PRESETS["drawer-overlay-right"]).toBeDefined();
  });

  it("should have slide-in presets", () => {
    expect(DISPLAY_PRESETS["slide-in-bottom-right"]).toBeDefined();
    expect(DISPLAY_PRESETS["slide-in-bottom-right"].position).toBe("bottom-right");
  });

  it("should have banner presets", () => {
    expect(DISPLAY_PRESETS["banner-top"]).toBeDefined();
    expect(DISPLAY_PRESETS["banner-top"].sticky).toBe(true);
  });
});

describe("getDisplayPreset", () => {
  it("should return preset for valid name", () => {
    const preset = getDisplayPreset("popup-center");

    expect(preset).not.toBeNull();
    expect(preset?.mode).toBe("popup");
  });

  it("should return null for invalid name", () => {
    const preset = getDisplayPreset("invalid-preset");

    expect(preset).toBeNull();
  });

  it("should return drawer overlay preset", () => {
    const preset = getDisplayPreset("drawer-overlay-right");

    expect(preset).not.toBeNull();
    expect(preset?.mode).toBe("drawer-overlay");
  });
});

describe("getMobileDisplayConfig", () => {
  it("should reduce overlay opacity for mobile", () => {
    const config: PopupDisplayConfig = {
      mode: "popup",
      overlayOpacity: 0.8,
    };

    const mobileConfig = getMobileDisplayConfig(config);

    expect(mobileConfig.overlayOpacity).toBe(0.5); // Capped at 0.5
  });

  it("should keep overlay opacity if already low", () => {
    const config: PopupDisplayConfig = {
      mode: "popup",
      overlayOpacity: 0.3,
    };

    const mobileConfig = getMobileDisplayConfig(config);

    expect(mobileConfig.overlayOpacity).toBe(0.3);
  });

  it("should ensure minimum animation duration", () => {
    const config: PopupDisplayConfig = {
      mode: "popup",
      animationDuration: 100,
    };

    const mobileConfig = getMobileDisplayConfig(config);

    expect(mobileConfig.animationDuration).toBe(200); // Minimum 200ms
  });

  it("should preserve other config properties", () => {
    const config: PopupDisplayConfig = {
      mode: "popup",
      showCloseButton: true,
      zIndex: 1000,
    };

    const mobileConfig = getMobileDisplayConfig(config);

    expect(mobileConfig.showCloseButton).toBe(true);
    expect(mobileConfig.zIndex).toBe(1000);
  });
});

