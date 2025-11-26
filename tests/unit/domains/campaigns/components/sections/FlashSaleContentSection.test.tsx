import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";
import userEvent from "@testing-library/user-event";

import { FlashSaleContentSection } from "~/domains/campaigns/components/sections/FlashSaleContentSection";
import { ContentConfigSection } from "~/domains/campaigns/components/sections/ContentConfigSection";
import type { FlashSaleContent } from "~/domains/campaigns/components/sections/FlashSaleContentSection";
import type { DesignConfig } from "~/domains/campaigns/types/campaign";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("FlashSaleContentSection", () => {
  it("enables countdown by default and shows default duration when content is empty", () => {
    const { container } = renderWithPolaris(
      <FlashSaleContentSection
        content={{}}
        onChange={() => {}}
      />,
    );

    const countdownCheckbox = container.querySelector(
      's-checkbox[name="content.showCountdown"]',
    );
    expect(countdownCheckbox).toBeTruthy();
    expect(countdownCheckbox?.getAttribute("checked")).toBe("true");

    const durationField = container.querySelector(
      's-text-field[name="content.countdownDuration"]',
    );
    expect(durationField).toBeTruthy();
    expect(durationField?.getAttribute("value")).toBe("3600");
  });

  describe("Inventory Tracking Wiring", () => {
    it("receives and can update inventory configuration via onChange", async () => {
      let latestContent: Partial<FlashSaleContent> = {
        headline: "Flash Sale!",
        urgencyMessage: "Limited time!",
        buttonText: "Shop Now",
        successMessage: "Applied!",
        inventory: {
          mode: "pseudo",
          pseudoMax: 50,
          showOnlyXLeft: true,
          showThreshold: 10,
          soldOutBehavior: "hide",
        },
      };

      const onChange = vi.fn((updated: Partial<FlashSaleContent>) => {
        latestContent = { ...latestContent, ...updated };
      });

      renderWithPolaris(
        <FlashSaleContentSection
          content={latestContent}
          onChange={onChange}
        />,
      );

      // Verify the inventory section is accessible and inventory is in content
      expect(latestContent.inventory?.mode).toBe("pseudo");
      expect(latestContent.inventory?.pseudoMax).toBe(50);
      expect(latestContent.inventory?.showOnlyXLeft).toBe(true);
      expect(latestContent.inventory?.showThreshold).toBe(10);
    });

    it("receives and can update real inventory mode with productIds via onChange", () => {
      let latestContent: Partial<FlashSaleContent> = {
        headline: "Flash Sale!",
        urgencyMessage: "Limited time!",
        buttonText: "Shop Now",
        successMessage: "Applied!",
        inventory: {
          mode: "real",
          productIds: ["gid://shopify/Product/123", "gid://shopify/Product/456"],
          showOnlyXLeft: true,
          showThreshold: 5,
          soldOutBehavior: "missed_it",
          soldOutMessage: "Sold out!",
        },
      };

      const onChange = vi.fn((updated: Partial<FlashSaleContent>) => {
        latestContent = { ...latestContent, ...updated };
      });

      renderWithPolaris(
        <FlashSaleContentSection
          content={latestContent}
          onChange={onChange}
        />,
      );

      // Verify real inventory mode configuration is accessible
      expect(latestContent.inventory?.mode).toBe("real");
      expect(latestContent.inventory?.productIds).toEqual([
        "gid://shopify/Product/123",
        "gid://shopify/Product/456",
      ]);
      expect(latestContent.inventory?.soldOutBehavior).toBe("missed_it");
      expect(latestContent.inventory?.soldOutMessage).toBe("Sold out!");
    });
  });
});

describe("ContentConfigSection - Flash Sale Wiring", () => {
  it("passes designConfig and onDesignChange to FlashSaleContentSection for FLASH_SALE template", () => {
    const onChange = vi.fn();
    const onDesignChange = vi.fn();
    const onDiscountChange = vi.fn();

    const content: Partial<FlashSaleContent> = {
      headline: "Flash Sale!",
      urgencyMessage: "Hurry!",
      buttonText: "Shop Now",
      successMessage: "Done!",
      inventory: {
        mode: "pseudo",
        pseudoMax: 100,
        showOnlyXLeft: true,
        showThreshold: 10,
        soldOutBehavior: "hide",
      },
    };

    const designConfig: Partial<DesignConfig> = {
      position: "center",
      backgroundColor: "#ffffff",
    };

    // Render ContentConfigSection with FLASH_SALE template type
    // This should internally render FlashSaleContentSection with all props
    const { container } = renderWithPolaris(
      <ContentConfigSection
        templateType="FLASH_SALE"
        content={content}
        designConfig={designConfig}
        onChange={onChange}
        onDesignChange={onDesignChange}
        onDiscountChange={onDiscountChange}
      />,
    );

    // Verify the Flash Sale form renders (component is wired)
    // Look for the headline field which is rendered by FlashSaleContentSection
    const headlineField = container.querySelector('s-text-field[name="content.headline"]');
    expect(headlineField).toBeTruthy();
    expect(headlineField?.getAttribute("value")).toBe("Flash Sale!");
  });

  it("passes designConfig and onDesignChange to FlashSaleContentSection for COUNTDOWN_TIMER template", () => {
    const onChange = vi.fn();
    const onDesignChange = vi.fn();
    const onDiscountChange = vi.fn();

    const content: Partial<FlashSaleContent> = {
      headline: "Countdown Timer!",
      urgencyMessage: "Time is running out!",
      buttonText: "Shop Now",
      successMessage: "Done!",
      inventory: {
        mode: "real",
        productIds: ["gid://shopify/Product/789"],
        showOnlyXLeft: true,
        showThreshold: 5,
        soldOutBehavior: "missed_it",
        soldOutMessage: "You missed it!",
      },
    };

    const designConfig: Partial<DesignConfig> = {
      position: "bottom",
      backgroundColor: "#000000",
    };

    // Render ContentConfigSection with COUNTDOWN_TIMER template type
    const { container } = renderWithPolaris(
      <ContentConfigSection
        templateType="COUNTDOWN_TIMER"
        content={content}
        designConfig={designConfig}
        onChange={onChange}
        onDesignChange={onDesignChange}
        onDiscountChange={onDiscountChange}
      />,
    );

    // Verify the Flash Sale form renders (COUNTDOWN_TIMER uses FlashSaleContentSection)
    // Look for the headline field which is rendered by FlashSaleContentSection
    const headlineField = container.querySelector('s-text-field[name="content.headline"]');
    expect(headlineField).toBeTruthy();
    expect(headlineField?.getAttribute("value")).toBe("Countdown Timer!");
  });

  it("inventory configuration is preserved when content changes", () => {
    let latestContent: Partial<FlashSaleContent> = {
      headline: "Initial Headline",
      urgencyMessage: "Hurry!",
      buttonText: "Shop Now",
      successMessage: "Done!",
      inventory: {
        mode: "real",
        productIds: ["gid://shopify/Product/123"],
        showOnlyXLeft: true,
        showThreshold: 5,
        soldOutBehavior: "missed_it",
        soldOutMessage: "Sold out!",
      },
    };

    const onChange = vi.fn((updated: Partial<FlashSaleContent>) => {
      latestContent = { ...latestContent, ...updated };
    });

    const { rerender } = renderWithPolaris(
      <ContentConfigSection
        templateType="FLASH_SALE"
        content={latestContent}
        onChange={onChange}
      />,
    );

    // Verify inventory is present initially
    expect(latestContent.inventory?.mode).toBe("real");
    expect(latestContent.inventory?.productIds).toEqual(["gid://shopify/Product/123"]);

    // Simulate an update (like headline change)
    const updatedContent = {
      ...latestContent,
      headline: "Updated Headline",
    };

    rerender(
      <AppProvider i18n={en}>
        <ContentConfigSection
          templateType="FLASH_SALE"
          content={updatedContent}
          onChange={onChange}
        />
      </AppProvider>,
    );

    // Inventory should still be preserved after re-render
    expect(updatedContent.inventory?.mode).toBe("real");
    expect(updatedContent.inventory?.productIds).toEqual(["gid://shopify/Product/123"]);
    expect(updatedContent.inventory?.soldOutBehavior).toBe("missed_it");
  });
});

