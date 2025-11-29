import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { TemplateTypeEnum } from "~/lib/template-types.enum";

function renderCountdownPreview(
  configOverrides: Record<string, any> = {},
  designConfigOverrides: Record<string, any> = {}
) {
  const baseConfig: Record<string, any> = {
    headline: "Limited Time Offer",
    subheadline: "Hurry!",
    endTime: new Date(Date.now() + 3600_000).toISOString(),
    countdownDuration: 3600,
    buttonText: "Shop Now",
    ...configOverrides,
  };

  const baseDesignConfig: Record<string, any> = {
    displayMode: "banner",
    position: "top",
    showCloseButton: true,
    backgroundColor: "#FFFFFF",
    textColor: "#1A1A1A",
    buttonColor: "#007BFF",
    ...designConfigOverrides,
  };

  return render(
    <TemplatePreview
      templateType={TemplateTypeEnum.COUNTDOWN_TIMER}
      config={baseConfig}
      designConfig={baseDesignConfig}
    />,
  );
}

describe("TemplatePreview Countdown Timer  stock counter wiring", () => {
  it("shows stock counter when showStockCounter is true", async () => {
    renderCountdownPreview({
      showStockCounter: true,
      stockCount: 5,
    });

    const stockText = await screen.findByText(/Only 5 left in stock/i);
    expect(stockText).toBeTruthy();
  });

  it("hides stock counter when showStockCounter is false", async () => {
    renderCountdownPreview({
      showStockCounter: false,
      stockCount: 5,
    });

    await screen.findByText(/Limited Time Offer/i);
    expect(screen.queryByText(/Only 5 left in stock/i)).toBeNull();
  });

  it("constrains countdown banner to preview container (no fixed positioning)", () => {
    const { container } = renderCountdownPreview();

    const banner = container.querySelector(".countdown-banner") as HTMLElement | null;
    expect(banner).toBeTruthy();

    const style = banner?.getAttribute("style") || "";
    expect(style).toContain("position: absolute");
    expect(style).not.toContain("position: fixed");
  });
});

/**
 * Form-to-Preview Bridge Tests for CountdownTimer
 *
 * These tests verify that admin form configuration changes are correctly
 * reflected in the preview component.
 */
describe("TemplatePreview CountdownTimer form-to-preview bridge", () => {
  describe("displayMode toggle", () => {
    it("renders as banner when displayMode is banner (default)", async () => {
      renderCountdownPreview({}, { displayMode: "banner" });

      await screen.findByText(/Limited Time Offer/i);
      await waitFor(() => {
        const bannerContainer = document.querySelector('.countdown-banner');
        expect(bannerContainer).toBeTruthy();
      });
    });

    it("renders as popup when displayMode is popup", async () => {
      renderCountdownPreview({}, { displayMode: "popup" });

      await screen.findByText(/Limited Time Offer/i);
      await waitFor(() => {
        const popupDialog = document.querySelector('[role="dialog"]');
        // Component uses countdown-modal class for popup display mode
        const popupContent = document.querySelector('.countdown-modal');
        expect(popupDialog).toBeTruthy();
        expect(popupContent).toBeTruthy();
      });
    });
  });

  describe("showCloseButton toggle", () => {
    it("shows close button when showCloseButton is true", async () => {
      renderCountdownPreview({}, { showCloseButton: true });

      await screen.findByText(/Limited Time Offer/i);
      await waitFor(() => {
        const closeButton = document.querySelector('[aria-label*="close" i], [class*="close"]');
        expect(closeButton).toBeTruthy();
      });
    });

    it("hides close button when showCloseButton is false", async () => {
      renderCountdownPreview({}, { showCloseButton: false });

      await screen.findByText(/Limited Time Offer/i);
      await waitFor(() => {
        // Close button should not be present
        const closeButton = document.querySelector('[aria-label="Close popup"], .countdown-banner-close, .countdown-modal-close');
        expect(closeButton).toBeNull();
      });
    });
  });

  describe("position toggle (banner mode)", () => {
    it("positions at top when position is top", async () => {
      const { container } = renderCountdownPreview({}, { displayMode: "banner", position: "top" });

      await screen.findByText(/Limited Time Offer/i);
      const banner = container.querySelector('.countdown-banner');
      const style = banner?.getAttribute("style") || "";
      expect(style).toContain("top:");
    });

    it("positions at bottom when position is bottom", async () => {
      const { container } = renderCountdownPreview({}, { displayMode: "banner", position: "bottom" });

      await screen.findByText(/Limited Time Offer/i);
      const banner = container.querySelector('.countdown-banner');
      const style = banner?.getAttribute("style") || "";
      expect(style).toContain("bottom:");
    });
  });

  describe("content fields", () => {
    it("displays custom headline from config", async () => {
      renderCountdownPreview({ headline: "Custom Countdown Headline!" });

      const headline = await screen.findByText(/Custom Countdown Headline!/i);
      expect(headline).toBeTruthy();
    });

    it("displays custom subheadline from config", async () => {
      renderCountdownPreview({ subheadline: "Don't miss this deal!" });

      const subheadline = await screen.findByText(/Don't miss this deal!/i);
      expect(subheadline).toBeTruthy();
    });

    it("displays custom button text from config", async () => {
      renderCountdownPreview({ buttonText: "Get Deal Now!" });

      const button = await screen.findByText(/Get Deal Now!/i);
      expect(button).toBeTruthy();
    });
  });

  describe("stock counter", () => {
    it("shows stock count when showStockCounter is true", async () => {
      renderCountdownPreview({ showStockCounter: true, stockCount: 10 });

      const stockText = await screen.findByText(/Only 10 left in stock/i);
      expect(stockText).toBeTruthy();
    });

    it("hides stock count when showStockCounter is false", async () => {
      renderCountdownPreview({ showStockCounter: false, stockCount: 10 });

      await screen.findByText(/Limited Time Offer/i);
      expect(screen.queryByText(/Only 10 left in stock/i)).toBeNull();
    });
  });
});
