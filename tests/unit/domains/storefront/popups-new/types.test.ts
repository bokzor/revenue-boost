/**
 * Unit Tests for Storefront Popup Types
 *
 * Tests the type definitions and interfaces for popup components.
 */

import { describe, it, expect } from "vitest";

import type {
  PopupPosition,
  PopupSize,
  PopupAnimation,
  DisplayMode,
  DesktopLayout,
  MobileLayout,
  LayoutConfig,
  PopupDesignConfig,
  PopupConfig,
  PopupCallbacks,
  BasePopupProps,
  DiscountConfig,
  Product,
  CartItem,
  Prize,
  ValidationRule,
  FormField,
} from "~/domains/storefront/popups-new/types";

describe("Storefront Popup Types", () => {
  describe("PopupPosition", () => {
    it("should allow valid position values", () => {
      const positions: PopupPosition[] = ["center", "top", "bottom", "left", "right"];
      expect(positions).toHaveLength(5);
    });
  });

  describe("PopupSize", () => {
    it("should allow valid size values", () => {
      const sizes: PopupSize[] = ["small", "medium", "large", "fullscreen"];
      expect(sizes).toHaveLength(4);
    });
  });

  describe("PopupAnimation", () => {
    it("should allow valid animation values", () => {
      const animations: PopupAnimation[] = ["fade", "slide", "bounce", "none"];
      expect(animations).toHaveLength(4);
    });
  });

  describe("DisplayMode", () => {
    it("should allow valid display mode values", () => {
      const modes: DisplayMode[] = ["popup", "banner", "slide-in", "inline"];
      expect(modes).toHaveLength(4);
    });
  });

  describe("DesktopLayout", () => {
    it("should allow valid desktop layout values", () => {
      const layouts: DesktopLayout[] = ["split-left", "split-right", "stacked", "overlay", "content-only"];
      expect(layouts).toHaveLength(5);
    });
  });

  describe("MobileLayout", () => {
    it("should allow valid mobile layout values", () => {
      const layouts: MobileLayout[] = ["stacked", "overlay", "fullscreen", "content-only"];
      expect(layouts).toHaveLength(4);
    });
  });

  describe("LayoutConfig", () => {
    it("should allow valid layout config", () => {
      const config: LayoutConfig = {
        desktop: "split-left",
        mobile: "stacked",
        visualSizeDesktop: "50%",
        visualSizeMobile: "40%",
        contentOverlap: "-2rem",
        visualGradient: true,
      };

      expect(config.desktop).toBe("split-left");
      expect(config.mobile).toBe("stacked");
    });
  });

  describe("PopupDesignConfig", () => {
    it("should allow valid design config", () => {
      const config: PopupDesignConfig = {
        id: "popup-123",
        campaignId: "campaign-456",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#007bff",
        buttonTextColor: "#ffffff",
        position: "center",
        size: "medium",
      };

      expect(config.id).toBe("popup-123");
      expect(config.position).toBe("center");
    });
  });

  describe("DiscountConfig", () => {
    it("should allow valid discount config", () => {
      const config: DiscountConfig = {
        enabled: true,
        code: "SAVE10",
        value: 10,
        type: "percentage",
        behavior: "SHOW_CODE_AND_AUTO_APPLY",
      };

      expect(config.enabled).toBe(true);
      expect(config.type).toBe("percentage");
    });
  });

  describe("Product", () => {
    it("should allow valid product structure", () => {
      const product: Product = {
        id: "prod-123",
        title: "Test Product",
        price: "$29.99",
        imageUrl: "https://example.com/image.jpg",
        variantId: "var-456",
        handle: "test-product",
        compareAtPrice: "$39.99",
        rating: 4.5,
        reviewCount: 100,
        savingsPercent: 25,
      };

      expect(product.id).toBe("prod-123");
      expect(product.savingsPercent).toBe(25);
    });
  });

  describe("CartItem", () => {
    it("should allow valid cart item structure", () => {
      const item: CartItem = {
        id: "item-123",
        title: "Test Item",
        price: "$19.99",
        quantity: 2,
        imageUrl: "https://example.com/item.jpg",
        variantId: "var-789",
        productId: "gid://shopify/Product/123",
        handle: "test-item",
      };

      expect(item.quantity).toBe(2);
      expect(item.productId).toBe("gid://shopify/Product/123");
    });
  });

  describe("Prize", () => {
    it("should allow valid prize structure", () => {
      const prize: Prize = {
        id: "prize-1",
        label: "10% Off",
        probability: 0.3,
        color: "#ff0000",
        discountCode: "WIN10",
      };

      expect(prize.probability).toBe(0.3);
      expect(prize.discountCode).toBe("WIN10");
    });
  });
});

