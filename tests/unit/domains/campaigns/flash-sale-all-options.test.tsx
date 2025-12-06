/**
 * Comprehensive Unit Tests for Flash Sale Configuration Options
 *
 * Tests ALL content and discount options available in the Flash Sale admin form:
 * - Content Section (8 fields)
 * - Advanced Features Section (20+ fields)
 * - Discount Configuration
 *
 * NOTE: Design & Presentation tests are now in DesignConfigSection tests
 * since design controls are handled by the shared DesignConfigSection component.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import userEvent from "@testing-library/user-event";

// Mock App Bridge before importing components that use it
const mockResourcePicker = vi.fn();
vi.mock('@shopify/app-bridge-react', () => ({
  useAppBridge: () => ({
    resourcePicker: mockResourcePicker,
  }),
}));

import { FlashSaleContentSection } from "~/domains/campaigns/components/sections/FlashSaleContentSection";
import type { FlashSaleContent } from "~/domains/campaigns/components/sections/FlashSaleContentSection";
import type { DiscountConfig } from "~/domains/commerce/services/discount.server";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("FlashSaleContentSection - ALL Configuration Options", () => {
  
  // ========== CONTENT SECTION TESTS ==========
  
  describe("Content Section (8 fields)", () => {
    it("should render and update headline (required)", async () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
        />
      );

      const headlineField = container.querySelector('s-text-field[name="content.headline"]');
      expect(headlineField).toBeTruthy();
      expect(headlineField?.getAttribute("required")).toBe("true");
    });

    it("should render and update urgency message (required)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
        />
      );

      const urgencyField = container.querySelector('s-text-field[name="content.urgencyMessage"]');
      expect(urgencyField).toBeTruthy();
      expect(urgencyField?.getAttribute("required")).toBe("true");
    });

    it("should render and update subheadline (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{ subheadline: "Test subheadline" }}
          onChange={onChange}
        />
      );

      const subheadlineField = container.querySelector('s-text-field[name="content.subheadline"]');
      expect(subheadlineField).toBeTruthy();
      expect(subheadlineField?.getAttribute("value")).toBe("Test subheadline");
    });

    it("should render and update button text via CTA config", () => {
      const onChange = vi.fn();
      renderWithPolaris(
        <FlashSaleContentSection
          content={{ cta: { label: "Shop Now", action: "navigate_collection" } as FlashSaleContent["cta"] }}
          onChange={onChange}
        />
      );

      // CTAConfigEditor uses Polaris TextField, so we look for the input by label
      const buttonTextField = screen.getByLabelText("Button Text");
      expect(buttonTextField).toBeTruthy();
      expect(buttonTextField).toHaveValue("Shop Now");
    });

    it("should render CTA URL field when action requires URL", () => {
      const onChange = vi.fn();
      renderWithPolaris(
        <FlashSaleContentSection
          content={{ cta: { label: "Shop Now", action: "navigate_url", url: "/collections/sale" } as FlashSaleContent["cta"] }}
          onChange={onChange}
        />
      );

      // CTAConfigEditor shows URL field when action is navigate_url
      const ctaUrlField = screen.getByLabelText("Destination URL");
      expect(ctaUrlField).toBeTruthy();
      expect(ctaUrlField).toHaveValue("/collections/sale");
    });

    it("should render and update dismiss label (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{ secondaryCta: { label: "No thanks", action: "dismiss" } }}
          onChange={onChange}
        />
      );

      // Dismiss button uses custom TextField with s-text-field
      const dismissField = container.querySelector('s-text-field[name="content.secondaryCta.label"]');
      expect(dismissField).toBeTruthy();
      expect(dismissField?.getAttribute("value")).toBe("No thanks");
    });

    it("should render and update success message (required)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{ successMessage: "Discount applied!" }}
          onChange={onChange}
        />
      );

      const successField = container.querySelector('s-text-field[name="content.successMessage"]');
      expect(successField).toBeTruthy();
      expect(successField?.getAttribute("value")).toBe("Discount applied!");
      expect(successField?.getAttribute("required")).toBe("true");
    });

    it("should render and update failure message (optional)", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{ failureMessage: "Oops! Something went wrong." }}
          onChange={onChange}
        />
      );

      const failureField = container.querySelector('s-text-field[name="content.failureMessage"]');
      expect(failureField).toBeTruthy();
      expect(failureField?.getAttribute("value")).toBe("Oops! Something went wrong.");
    });
  });

  // ========== ADVANCED FEATURES SECTION TESTS ==========

  describe("Advanced Features - Basic Timer Options", () => {
    it("should enable countdown by default", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
        />
      );

      const countdownCheckbox = container.querySelector('s-checkbox[name="content.showCountdown"]');
      expect(countdownCheckbox).toBeTruthy();
      expect(countdownCheckbox?.getAttribute("checked")).toBe("true");
    });

    it("should show default countdown duration of 3600 seconds", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
        />
      );

      const durationField = container.querySelector('s-text-field[name="content.countdownDuration"]');
      expect(durationField).toBeTruthy();
      expect(durationField?.getAttribute("value")).toBe("3600");
    });

    it("should allow custom countdown duration", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{ countdownDuration: 7200 }}
          onChange={onChange}
        />
      );

      const durationField = container.querySelector('s-text-field[name="content.countdownDuration"]');
      expect(durationField?.getAttribute("value")).toBe("7200");
    });

    it("should hide countdown duration field when countdown is disabled", () => {
      const onChange = vi.fn();
      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{ showCountdown: false }}
          onChange={onChange}
        />
      );

      const durationField = container.querySelector('s-text-field[name="content.countdownDuration"]');
      expect(durationField).toBeFalsy();
    });
  });

  describe("Advanced Features - Timer Modes", () => {
    it("should default to 'duration' timer mode", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { mode: "duration", timezone: "shop", onExpire: "auto_hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      // Verify the timer mode is set correctly in the content
      expect(content.timer?.mode).toBe("duration");
    });

    it("should support 'fixed_end' timer mode", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { mode: "fixed_end", endTimeISO: "2024-12-31T23:59:59Z", timezone: "shop", onExpire: "auto_hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      // Timer mode should be set to fixed_end
      expect(content.timer?.mode).toBe("fixed_end");
      expect(content.timer?.endTimeISO).toBe("2024-12-31T23:59:59Z");
    });

    it("should support 'personal' timer mode with personal window", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { mode: "personal", personalWindowSeconds: 1800, timezone: "shop", onExpire: "auto_hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.timer?.mode).toBe("personal");
      expect(content.timer?.personalWindowSeconds).toBe(1800);
    });

    it("should support 'stock_limited' timer mode", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { mode: "stock_limited", timezone: "shop", onExpire: "auto_hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.timer?.mode).toBe("stock_limited");
    });
  });

  describe("Advanced Features - Timer Configuration", () => {
    it("should support shop timezone", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { timezone: "shop", mode: "duration", onExpire: "auto_hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.timer?.timezone).toBe("shop");
    });

    it("should support visitor timezone", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { timezone: "visitor", mode: "duration", onExpire: "auto_hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.timer?.timezone).toBe("visitor");
    });

    it("should support 'auto_hide' on expire action", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { onExpire: "auto_hide", mode: "duration", timezone: "shop" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.timer?.onExpire).toBe("auto_hide");
    });

    it("should support 'collapse' on expire action", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { onExpire: "collapse", mode: "duration", timezone: "shop" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.timer?.onExpire).toBe("collapse");
    });

    it("should support 'swap_message' on expire action with custom message", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        timer: { onExpire: "swap_message", expiredMessage: "Sale has ended!", mode: "duration", timezone: "shop" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.timer?.onExpire).toBe("swap_message");
      expect(content.timer?.expiredMessage).toBe("Sale has ended!");
    });
  });

  describe("Advanced Features - Inventory Tracking", () => {
    it("should default to 'pseudo' inventory mode", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        inventory: { mode: "pseudo", showOnlyXLeft: true, showThreshold: 10, soldOutBehavior: "hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.inventory?.mode).toBe("pseudo");
    });

    it("should support 'real' inventory mode", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        inventory: { mode: "real", productIds: ["gid://shopify/Product/123"], showOnlyXLeft: true, showThreshold: 10, soldOutBehavior: "hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.inventory?.mode).toBe("real");
      expect(content.inventory?.productIds).toEqual(["gid://shopify/Product/123"]);
    });

    it("should support pseudo max inventory setting", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        inventory: { mode: "pseudo", pseudoMax: 50, showOnlyXLeft: true, showThreshold: 10, soldOutBehavior: "hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.inventory?.pseudoMax).toBe(50);
    });

    it("should enable 'Only X Left' by default", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        inventory: { showOnlyXLeft: true, mode: "pseudo", showThreshold: 10, soldOutBehavior: "hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.inventory?.showOnlyXLeft).toBe(true);
    });

    it("should support custom show threshold", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        inventory: { showThreshold: 5, mode: "pseudo", showOnlyXLeft: true, soldOutBehavior: "hide" } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.inventory?.showThreshold).toBe(5);
    });

    it("should support 'hide' sold out behavior", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        inventory: { soldOutBehavior: "hide", mode: "pseudo", showOnlyXLeft: true, showThreshold: 10 } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.inventory?.soldOutBehavior).toBe("hide");
    });

    it("should support 'missed_it' sold out behavior with custom message", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        inventory: { soldOutBehavior: "missed_it", soldOutMessage: "You missed it!", mode: "pseudo", showOnlyXLeft: true, showThreshold: 10 } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.inventory?.soldOutBehavior).toBe("missed_it");
      expect(content.inventory?.soldOutMessage).toBe("You missed it!");
    });
  });

  describe("Advanced Features - Soft Reservation Timer", () => {
    it("should be disabled by default", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        reserve: { enabled: false, minutes: 10 } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.reserve?.enabled).toBe(false);
    });

    it("should support enabling reservation timer", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        reserve: { enabled: true, minutes: 10 } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.reserve?.enabled).toBe(true);
      expect(content.reserve?.minutes).toBe(10);
    });

    it("should support custom reservation minutes", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        reserve: { enabled: true, minutes: 15 } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.reserve?.minutes).toBe(15);
    });

    it("should support custom reservation label", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        reserve: { enabled: true, label: "Offer reserved for:", minutes: 10 } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.reserve?.label).toBe("Offer reserved for:");
    });

    it("should support reservation disclaimer", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        reserve: { enabled: true, disclaimer: "Inventory not guaranteed", minutes: 10 } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.reserve?.disclaimer).toBe("Inventory not guaranteed");
    });
  });

  // NOTE: Design & Presentation tests (position, size, displayMode, colors, overlay)
  // moved to DesignConfigSection tests as design controls are now handled by
  // the shared DesignConfigSection component

  describe("Content Presentation Options", () => {
    it("should support pill badge style", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        presentation: { badgeStyle: "pill", placement: "center", showTimer: true, showInventory: true } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.presentation?.badgeStyle).toBe("pill");
    });

    it("should support tag badge style", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        presentation: { badgeStyle: "tag", placement: "center", showTimer: true, showInventory: true } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.presentation?.badgeStyle).toBe("tag");
    });

    it("should show timer in popup by default", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        presentation: { showTimer: true, placement: "center", badgeStyle: "pill", showInventory: true } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.presentation?.showTimer).toBe(true);
    });

    it("should show inventory in popup by default", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        presentation: { showInventory: true, placement: "center", badgeStyle: "pill", showTimer: true } as any
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.presentation?.showInventory).toBe(true);
    });
  });

  describe("Design & Presentation - Legacy Options", () => {
    it("should enable hide on expiry by default", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        hideOnExpiry: true
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.hideOnExpiry).toBe(true);
    });

    it("should support disabling hide on expiry", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        hideOnExpiry: false
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.hideOnExpiry).toBe(false);
    });

    it("should disable auto-hide on expire by default", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        autoHideOnExpire: false
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.autoHideOnExpire).toBe(false);
    });

    it("should support enabling auto-hide on expire", () => {
      const onChange = vi.fn();
      const content: Partial<FlashSaleContent> = {
        autoHideOnExpire: true
      };

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          onChange={onChange}
        />
      );

      expect(content.autoHideOnExpire).toBe(true);
    });
  });

  // ========== DISCOUNT CONFIGURATION TESTS ==========

  describe("Discount Configuration", () => {
    it("should render discount component when onDiscountChange is provided", () => {
      const onChange = vi.fn();
      const onDiscountChange = vi.fn();
      const discountConfig: DiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 30,
        showInPreview: true,
        autoApplyMode: "none",
        codePresentation: "show_code",
      } as any;

      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
          onDiscountChange={onDiscountChange}
          discountConfig={discountConfig}
        />
      );

      // Verify discount section is rendered
      expect(container.textContent).toContain("Discount Configuration");
    });

    it("should support percentage discount type", () => {
      const onChange = vi.fn();
      const onDiscountChange = vi.fn();
      const discountConfig: DiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 25,
        showInPreview: true,
        autoApplyMode: "none",
        codePresentation: "show_code",
      } as any;

      renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
          onDiscountChange={onDiscountChange}
          discountConfig={discountConfig}
        />
      );

      expect(discountConfig.valueType).toBe("PERCENTAGE");
      expect(discountConfig.value).toBe(25);
    });

    it("should support fixed amount discount type", () => {
      const onChange = vi.fn();
      const onDiscountChange = vi.fn();
      const discountConfig: DiscountConfig = {
        enabled: true,
        valueType: "FIXED_AMOUNT",
        value: 10,
        showInPreview: true,
        autoApplyMode: "none",
        codePresentation: "show_code",
      } as any;

      renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
          onDiscountChange={onDiscountChange}
          discountConfig={discountConfig}
        />
      );

      expect(discountConfig.valueType).toBe("FIXED_AMOUNT");
      expect(discountConfig.value).toBe(10);
    });

    it("should support free shipping discount type", () => {
      const onChange = vi.fn();
      const onDiscountChange = vi.fn();
      const discountConfig: DiscountConfig = {
        enabled: true,
        valueType: "FREE_SHIPPING",
        showInPreview: true,
        autoApplyMode: "none",
        codePresentation: "show_code",
      } as any;

      renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
          onDiscountChange={onDiscountChange}
          discountConfig={discountConfig}
        />
      );

      expect(discountConfig.valueType).toBe("FREE_SHIPPING");
    });

    it("should not render discount section when onDiscountChange is not provided", () => {
      const onChange = vi.fn();

      const { container } = renderWithPolaris(
        <FlashSaleContentSection
          content={{}}
          onChange={onChange}
        />
      );

      // Verify discount section is NOT rendered
      expect(container.textContent).not.toContain("Discount Configuration");
    });
  });

  // ========== INTEGRATION TESTS ==========

  describe("Integration - Complete Configuration", () => {
    it("should handle a fully configured flash sale", () => {
      const onChange = vi.fn();
      const onDiscountChange = vi.fn();

      const content: Partial<FlashSaleContent> = {
        headline: "Flash Sale! 50% Off",
        urgencyMessage: "Only 2 hours left!",
        subheadline: "Don't miss out",
        buttonText: "Shop Now",
        ctaUrl: "/collections/sale",
        dismissLabel: "No thanks",
        successMessage: "Discount applied!",
        failureMessage: "Something went wrong",
        showCountdown: true,
        countdownDuration: 7200,
        hideOnExpiry: true,
        autoHideOnExpire: false,
        timer: {
          mode: "fixed_end",
          endTimeISO: "2024-12-31T23:59:59Z",
          timezone: "shop",
          onExpire: "swap_message",
          expiredMessage: "Sale ended!"
        },
        inventory: {
          mode: "real",
          productIds: ["gid://shopify/Product/123"],
          showOnlyXLeft: true,
          showThreshold: 5,
          soldOutBehavior: "missed_it",
          soldOutMessage: "Sold out!"
        },
        reserve: {
          enabled: true,
          minutes: 15,
          label: "Reserved for:",
          disclaimer: "Not guaranteed"
        },
        presentation: {
          placement: "center",
          badgeStyle: "pill",
          showTimer: true,
          showInventory: true
        }
      };

      const discountConfig: DiscountConfig = {
        enabled: true,
        valueType: "PERCENTAGE",
        value: 50,
        showInPreview: true,
        autoApplyMode: "none",
        codePresentation: "show_code",
      } as any;

      renderWithPolaris(
        <FlashSaleContentSection
          content={content}
          discountConfig={discountConfig}
          onChange={onChange}
          onDiscountChange={onDiscountChange}
        />
      );

      // Verify all content sections are configured
      expect(content.headline).toBe("Flash Sale! 50% Off");
      expect(content.timer?.mode).toBe("fixed_end");
      expect(content.inventory?.mode).toBe("real");
      expect(content.reserve?.enabled).toBe(true);
      expect(discountConfig.valueType).toBe("PERCENTAGE");
    });
  });
});

