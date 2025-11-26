/**
 * usePopupTheme Hook Tests
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePopupTheme } from "~/domains/storefront/popups-new/components/shared/usePopupTheme";
import type { PopupDesignConfig } from "~/domains/storefront/popups-new/types";

describe("usePopupTheme", () => {
  const baseConfig: PopupDesignConfig = {
    id: "test-1",
    backgroundColor: "#ffffff",
    textColor: "#111827",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
  };

  describe("Core Colors", () => {
    it("returns default colors when config has minimal values", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.backgroundColor).toBe("#ffffff");
      expect(result.current.textColor).toBe("#111827");
      expect(result.current.buttonColor).toBe("#000000");
      expect(result.current.buttonTextColor).toBe("#ffffff");
    });

    it("uses fallback for missing backgroundColor", () => {
      const config = { ...baseConfig, backgroundColor: "" };
      const { result } = renderHook(() => usePopupTheme(config as any));

      expect(result.current.backgroundColor).toBe("#ffffff");
    });

    it("uses fallback for missing textColor", () => {
      const config = { ...baseConfig, textColor: "" };
      const { result } = renderHook(() => usePopupTheme(config as any));

      expect(result.current.textColor).toBe("#111827");
    });

    it("uses custom descriptionColor when provided", () => {
      const config = { ...baseConfig, descriptionColor: "#6b7280" };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.descriptionColor).toBe("#6b7280");
    });

    it("uses fallback descriptionColor when not provided", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.descriptionColor).toBe("#6b7280");
    });

    it("uses custom accentColor when provided", () => {
      const config = { ...baseConfig, accentColor: "#3b82f6" };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.accentColor).toBe("#3b82f6");
    });

    it("uses fallback accentColor when not provided", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.accentColor).toBe("#dbeafe");
    });

    it("uses custom successColor when provided", () => {
      const config = { ...baseConfig, successColor: "#10b981" };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.successColor).toBe("#10b981");
    });

    it("uses fallback successColor when not provided", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.successColor).toBe("#16a34a");
    });

    it("always uses standard errorColor", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.errorColor).toBe("#b91c1c");
    });
  });

  describe("Input Colors", () => {
    it("uses custom input colors when provided", () => {
      const config = {
        ...baseConfig,
        inputBackgroundColor: "#f9fafb",
        inputTextColor: "#374151",
        inputBorderColor: "#d1d5db",
      };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.inputBackgroundColor).toBe("#f9fafb");
      expect(result.current.inputTextColor).toBe("#374151");
      expect(result.current.inputBorderColor).toBe("#d1d5db");
    });

    it("uses fallback input colors when not provided", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.inputBackgroundColor).toBe("#ffffff");
      expect(result.current.inputTextColor).toBe("#111827");
      expect(result.current.inputBorderColor).toBe("#e5e7eb");
    });

    it("generates placeholder color with opacity", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.inputPlaceholderColor).toContain("rgba");
      expect(result.current.inputPlaceholderColor).toContain("0.7");
    });
  });

  describe("Overlay Colors", () => {
    it("uses custom overlay color and opacity", () => {
      const config = {
        ...baseConfig,
        overlayColor: "#000000",
        overlayOpacity: 0.8,
      };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.overlayColor).toBe("#000000");
      expect(result.current.overlayOpacity).toBe(0.8);
      expect(result.current.overlayRgba).toBe("rgba(0, 0, 0, 0.8)");
    });

    it("uses fallback overlay values when not provided", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.overlayColor).toBe("#000000");
      expect(result.current.overlayOpacity).toBe(0.6);
      expect(result.current.overlayRgba).toBe("rgba(0, 0, 0, 0.6)");
    });

    it("converts hex overlay color to rgba", () => {
      const config = {
        ...baseConfig,
        overlayColor: "#ffffff",
        overlayOpacity: 0.5,
      };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.overlayRgba).toBe("rgba(255, 255, 255, 0.5)");
    });
  });

  describe("Typography", () => {
    it("uses custom fontFamily when provided", () => {
      const config = {
        ...baseConfig,
        fontFamily: "Inter, sans-serif",
      };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.fontFamily).toBe("Inter, sans-serif");
    });

    it("uses fallback fontFamily when not provided", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.fontFamily).toContain("system-ui");
    });

    it("uses custom borderRadius as string", () => {
      const config = {
        ...baseConfig,
        borderRadius: "8px",
      };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.borderRadius).toBe("8px");
    });

    it("converts numeric borderRadius to px string", () => {
      const config = {
        ...baseConfig,
        borderRadius: 16,
      };
      const { result } = renderHook(() => usePopupTheme(config));

      expect(result.current.borderRadius).toBe("16px");
    });

    it("uses fallback borderRadius when not provided", () => {
      const { result } = renderHook(() => usePopupTheme(baseConfig));

      expect(result.current.borderRadius).toBe("12px");
    });
  });
});

