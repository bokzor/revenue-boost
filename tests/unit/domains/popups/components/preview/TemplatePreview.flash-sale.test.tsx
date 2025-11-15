import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { TemplateTypeEnum } from "~/lib/template-types.enum";

function renderFlashSalePreview(overrides: Record<string, any> = {}) {
  const baseConfig: Record<string, any> = {
    headline: "Flash Sale!",
    subheadline: "Limited time offer",
    urgencyMessage: "Hurry!",
    discountPercentage: 30,
    showCountdown: true,
    countdownDuration: 3600,
    ...overrides,
  };

  return render(
    <TemplatePreview
      templateType={TemplateTypeEnum.FLASH_SALE}
      config={baseConfig}
      designConfig={{}}
    />,
  );
}

describe("TemplatePreview Flash Sale  inventory wiring", () => {
  it("shows inventory when contentConfig enables inventory and presentation.showInventory", async () => {
    renderFlashSalePreview({
      inventory: {
        mode: "pseudo",
        pseudoMax: 5,
        showOnlyXLeft: true,
        showThreshold: 10,
      },
      presentation: {
        placement: "center",
        badgeStyle: "pill",
        showTimer: true,
        showInventory: true,
      },
    });

    const inventory = await screen.findByText(/Only 5 left in stock/i);
    expect(inventory).toBeTruthy();
  });

  it("hides inventory when presentation.showInventory is false", async () => {
    renderFlashSalePreview({
      inventory: {
        mode: "pseudo",
        pseudoMax: 5,
        showOnlyXLeft: true,
        showThreshold: 10,
      },
      presentation: {
        placement: "center",
        badgeStyle: "pill",
        showTimer: true,
        showInventory: false,
      },
    });

    await screen.findByText(/Flash Sale!/i);
    expect(screen.queryByText(/Only 5 left in stock/i)).toBeNull();
  });

  it("hides inventory when inventory.showOnlyXLeft is false even if presentation.showInventory is true", async () => {
    renderFlashSalePreview({
      inventory: {
        mode: "pseudo",
        pseudoMax: 5,
        showOnlyXLeft: false,
        showThreshold: 10,
      },
      presentation: {
        placement: "center",
        badgeStyle: "pill",
        showTimer: true,
        showInventory: true,
      },
    });

    await screen.findByText(/Flash Sale!/i);
    expect(screen.queryByText(/Only 5 left in stock/i)).toBeNull();
  });
});

describe("TemplatePreview Flash Sale  reservation wiring", () => {
  it("shows reservation label when reserve.enabled is true in contentConfig", async () => {
    renderFlashSalePreview({
      reserve: {
        enabled: true,
        minutes: 10,
        label: "Offer reserved for:",
      },
    });

    const reservation = await screen.findByText(/Offer reserved for:/i);
    expect(reservation).toBeTruthy();
  });

  it("hides reservation label when reserve.enabled is false in contentConfig", async () => {
    renderFlashSalePreview({
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

describe("TemplatePreview Flash Sale  previewMode safety", () => {
  it("does not call inventory API when inventory.mode is real in preview", async () => {
    const origFetch = global.fetch as any;
    global.fetch = vi.fn();

    try {
      renderFlashSalePreview({
        inventory: {
          mode: "real",
          productIds: ["gid://shopify/Product/1"],
        },
      });

      await screen.findByText(/Flash Sale!/i);
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      global.fetch = origFetch;
    }
  });
});

