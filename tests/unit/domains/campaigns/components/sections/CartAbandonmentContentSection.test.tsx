/**
 * Unit Tests for Cart Abandonment Content Section
 *
 * NOTE: Most fields are inside Polaris Collapsible components that are closed by default.
 * Only the "Basic Content" section is open by default.
 * Testing collapsed sections would require mocking/expanding them first.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { CartAbandonmentContentSection } from "~/domains/campaigns/components/sections/CartAbandonmentContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("CartAbandonmentContentSection", () => {
  // ========== SECTION HEADERS ==========

  describe("Section Headers", () => {
    it("renders all collapsible section headers", () => {
      const onChange = vi.fn();
      renderWithPolaris(<CartAbandonmentContentSection content={{}} onChange={onChange} />);

      expect(screen.getByText("Basic Content")).toBeTruthy();
      expect(screen.getByText("Cart Display")).toBeTruthy();
      expect(screen.getByText("Urgency & Scarcity")).toBeTruthy();
      expect(screen.getByText("Call to Action")).toBeTruthy();
      expect(screen.getByText("Email Recovery")).toBeTruthy();
    });
  });

  // ========== BASIC CONTENT (open by default) ==========

  describe("Basic Content (visible by default)", () => {
    it("renders headline field", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <CartAbandonmentContentSection
          content={{ headline: "Don't forget!" }}
          onChange={onChange}
        />
      );

      const field = container.querySelector('s-text-field[name="content.headline"]');
      expect(field).toBeTruthy();
      expect(field?.getAttribute("value")).toBe("Don't forget!");
    });

    it("renders subheadline field", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <CartAbandonmentContentSection
          content={{ subheadline: "Complete your purchase" }}
          onChange={onChange}
        />
      );

      const field = container.querySelector('s-text-field[name="content.subheadline"]');
      expect(field).toBeTruthy();
      expect(field?.getAttribute("value")).toBe("Complete your purchase");
    });
  });

  // ========== SCHEMA VALIDATION ==========

  describe("Schema Validation", () => {
    it("validates cart abandonment content with defaults", async () => {
      const { CartAbandonmentContentSchema } = await import("~/domains/campaigns/types/campaign");

      const parsed = CartAbandonmentContentSchema.parse({
        headline: "Don't leave yet!",
        buttonText: "Complete Purchase",
      });

      // Verify defaults from schema
      expect(parsed.showCartItems).toBe(true);
      expect(parsed.showCartTotal).toBe(true);
      expect(parsed.showUrgency).toBe(true);
      expect(parsed.maxItemsToShow).toBe(3);
      expect(parsed.urgencyTimer).toBe(300);
      expect(parsed.showStockWarnings).toBe(false);
      expect(parsed.enableEmailRecovery).toBe(false);
      expect(parsed.successMessage).toBe("Thank you!");
    });

    it("validates cart abandonment content with custom values", async () => {
      const { CartAbandonmentContentSchema } = await import("~/domains/campaigns/types/campaign");

      const parsed = CartAbandonmentContentSchema.parse({
        headline: "Your cart is waiting",
        buttonText: "Checkout Now",
        showCartItems: false,
        showUrgency: false,
        maxItemsToShow: 5,
        showStockWarnings: true,
        enableEmailRecovery: true,
      });

      expect(parsed.showCartItems).toBe(false);
      expect(parsed.showUrgency).toBe(false);
      expect(parsed.maxItemsToShow).toBe(5);
      expect(parsed.showStockWarnings).toBe(true);
      expect(parsed.enableEmailRecovery).toBe(true);
    });
  });

  // ========== INTEGRATION ==========

  describe("Integration", () => {
    it("handles full content without errors", () => {
      const onChange = vi.fn();

      renderWithPolaris(
        <CartAbandonmentContentSection
          content={{
            headline: "Your cart is waiting",
            subheadline: "Complete your purchase",
            buttonText: "Return to Cart",
            showCartItems: true,
            maxItemsToShow: 4,
            showCartTotal: true,
            showUrgency: true,
            urgencyTimer: 1200,
            showStockWarnings: true,
            enableEmailRecovery: true,
            emailPlaceholder: "Enter your email",
          }}
          onChange={onChange}
        />
      );

      // Renders without crashing
      expect(screen.getByText("Basic Content")).toBeTruthy();
    });
  });
});
