import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CartAbandonmentPopup } from "~/domains/storefront/popups-new/CartAbandonmentPopup";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "cart-test",
    headline: "You left items in your cart",
    subheadline: "Complete your order now",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    overlayOpacity: 0.5,
    currency: "USD",
    showCartItems: true,
    showCartTotal: true,
    previewMode: true,
  };

  return { ...baseConfig, ...overrides };
}

describe("CartAbandonmentPopup", () => {
  it("renders cart items and total when visible", async () => {
    const config = createConfig();
    const cartItems = [
      {
        id: "item-1",
        title: "Test Product",
        quantity: 2,
        price: 49.99,
        imageUrl: "https://example.com/product.jpg",
      },
    ];

    render(
      <CartAbandonmentPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        cartItems={cartItems}
        cartTotal={99.98}
      />,
    );

    expect(await screen.findByText(/test product/i)).toBeTruthy();
    expect(screen.getByText(/qty: 2/i)).toBeTruthy();
    expect(screen.getByText(/total:/i)).toBeTruthy();
  });
});

