import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { CartAbandonmentContentSection } from "~/domains/campaigns/components/sections/CartAbandonmentContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("CartAbandonmentContentSection", () => {
  it("shows cart items, cart total and urgency as enabled by default", () => {
    const { container } = renderWithPolaris(
      <CartAbandonmentContentSection
        content={{}}
        onChange={() => {}}
      />,
    );

    const showItems = container.querySelector(
      's-checkbox[name="content.showCartItems"]',
    );
    const showTotal = container.querySelector(
      's-checkbox[name="content.showCartTotal"]',
    );
    const showUrgency = container.querySelector(
      's-checkbox[name="content.showUrgency"]',
    );

    expect(showItems?.getAttribute("checked")).toBe("true");
    expect(showTotal?.getAttribute("checked")).toBe("true");
    expect(showUrgency?.getAttribute("checked")).toBe("true");
  });
});

