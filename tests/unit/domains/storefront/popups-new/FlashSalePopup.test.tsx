import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import FlashSalePopup from "~/domains/storefront/popups-new/FlashSalePopup";

function renderPopup(overrides: Record<string, any> = {}) {
  const baseConfig: any = {
    id: "fs-test",
    headline: "Flash Sale!",
    subheadline: "Limited time offer",
    buttonText: "Shop Now",
    successMessage: "Success",
    failureMessage: "Failure",
    ctaText: "CTA",
    urgencyMessage: "Hurry! Sale ends soon",
    discountPercentage: 30,
    showCountdown: false,
    hideOnExpiry: false,
    autoHideOnExpire: false,
    showStockCounter: false,
    ctaUrl: "/products",
    // Design essentials (PopupDesignConfig)
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    popupSize: "wide",
    overlayOpacity: 0.5,
    // Preview behavior
    previewMode: true,
    // Defaults for advanced features
    inventory: {
      mode: "pseudo",
      pseudoMax: 5,
      showOnlyXLeft: true,
      showThreshold: 10,
      soldOutBehavior: "hide",
    },
    reserve: {
      enabled: false,
      minutes: 10,
    },
    presentation: {
      placement: "center",
      badgeStyle: "pill",
      showTimer: true,
      showInventory: true,
    },
  };

  const config = {
    ...baseConfig,
    ...overrides,
    inventory: {
      ...baseConfig.inventory,
      ...(overrides.inventory || {}),
    },
    reserve: {
      ...baseConfig.reserve,
      ...(overrides.reserve || {}),
    },
    presentation: {
      ...baseConfig.presentation,
      ...(overrides.presentation || {}),
    },
  };

  return render(
    <FlashSalePopup
      config={config}
      isVisible={true}
      onClose={() => {}}
    />,
  );
}

describe("FlashSalePopup – inventory preview wiring", () => {
  it("shows inventory message when preview pseudo inventory and toggles enabled", async () => {
    renderPopup({
      inventory: {
        mode: "pseudo",
        pseudoMax: 5,
        showOnlyXLeft: true,
        showThreshold: 10,
      },
      presentation: {
        showInventory: true,
      },
    });

    const inventoryText = await screen.findByText(/Only 5 left in stock/i);
    expect(inventoryText).toBeTruthy();
  });

  it("hides inventory when presentation.showInventory is false", async () => {
    renderPopup({
      inventory: {
        mode: "pseudo",
        pseudoMax: 5,
        showOnlyXLeft: true,
        showThreshold: 10,
      },
      presentation: {
        showInventory: false,
      },
    });

    // Popup rendered (sanity)
    await screen.findByText(/Flash Sale!/i);

    expect(screen.queryByText(/Only 5 left in stock/i)).toBeNull();
  });

  it("hides inventory when inventory.showOnlyXLeft is false even if presentation.showInventory is true", async () => {
    renderPopup({
      inventory: {
        mode: "pseudo",
        pseudoMax: 5,
        showOnlyXLeft: false,
        showThreshold: 10,
      },
      presentation: {
        showInventory: true,
      },
    });

    await screen.findByText(/Flash Sale!/i);

    expect(screen.queryByText(/Only 5 left in stock/i)).toBeNull();
  });
});

describe("FlashSalePopup – reservation preview wiring", () => {
  it("shows reservation label when reserve.enabled is true", async () => {
    renderPopup({
      reserve: {
        enabled: true,
        minutes: 10,
        label: "Offer reserved for:",
      },
    });

    const reservation = await screen.findByText(/Offer reserved for:/i);
    expect(reservation).toBeTruthy();
  });

  it("hides reservation label when reserve.enabled is false", async () => {
    renderPopup({
      reserve: {
        enabled: false,
        minutes: 10,
        label: "Offer reserved for:",
      },
    });

    await screen.findByText(/Flash Sale!/i);

    expect(screen.queryByText(/Offer reserved for:/i)).toBeNull();
  });
});

