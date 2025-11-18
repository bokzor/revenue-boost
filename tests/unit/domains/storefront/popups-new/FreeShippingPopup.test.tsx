import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { FreeShippingPopup } from "~/domains/storefront/popups-new/FreeShippingPopup";

function renderPopup(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "fs-test",
    threshold: 75,
    currency: "$",
    emptyMessage: "Add items to unlock free shipping",
    progressMessage: "You're {remaining} away from free shipping",
    unlockedMessage: "You've unlocked free shipping! ",
    nearMissThreshold: 10,
    // Design essentials (PopupDesignConfig)
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "top",
    size: "small",
    barPosition: "top",
    previewMode: false,
  };

  const config = {
    ...baseConfig,
    ...overrides,
  };

  return render(
    <FreeShippingPopup
      config={config}
      isVisible={true}
      onClose={() => {}}
    />,
  );
}

describe("FreeShippingPopup – cart total initialization", () => {
  it("always syncs from /cart.js so existing cart items are included", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ subtotal_price: 5000 }),
    } as any);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      renderPopup({ currentCartTotal: 0 });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/cart.js", {
          credentials: "same-origin",
        });
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

