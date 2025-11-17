import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { ProductUpsellContentSection } from "~/domains/campaigns/components/sections/ProductUpsellContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("ProductUpsellContentSection", () => {
  it("normalizes selection method and layout when content is empty", async () => {
    let latest: any = {};
    const onChange = vi.fn((partial: any) => {
      latest = { ...latest, ...partial };
    });

    renderWithPolaris(
      <ProductUpsellContentSection content={{}} errors={{}} onChange={onChange} />,
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(latest.productSelectionMethod).toBe("ai");
    expect(latest.layout).toBe("grid");
  });
});

