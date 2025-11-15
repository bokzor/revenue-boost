import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProductUpsellPopup } from "~/domains/storefront/popups-new/ProductUpsellPopup";
import type { Product } from "~/domains/storefront/popups-new/types";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "upsell-test",
    headline: "You may also like",
    subheadline: "Recommended products",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    overlayOpacity: 0.5,
    previewMode: true,
  };

  return { ...baseConfig, ...overrides };
}

describe("ProductUpsellPopup", () => {
  it("renders headline and product title when visible", async () => {
    const config = createConfig();
    const products: Product[] = [
      {
        id: "p1",
        title: "Upsell Product",
        price: "29.00",
        compareAtPrice: "39.00",
        imageUrl: "https://example.com/product.jpg",
        variantId: "v1",
        handle: "upsell-product",
      },
    ];

    render(
      <ProductUpsellPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
        products={products}
      />,
    );

    expect(await screen.findByText(/you may also like/i)).toBeTruthy();
    expect(screen.getByText(/upsell product/i)).toBeTruthy();
  });
});

