import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { CartAbandonmentContentSection } from "~/domains/campaigns/components/sections/CartAbandonmentContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("CartAbandonmentContentSection", () => {
  it("renders all collapsible sections", () => {
    const onChange = vi.fn();
    renderWithPolaris(
      <CartAbandonmentContentSection
        content={{}}
        onChange={onChange}
      />,
    );

    // Verify all section headers are rendered
    expect(screen.getByText("Basic Content")).toBeTruthy();
    expect(screen.getByText("Cart Display")).toBeTruthy();
    expect(screen.getByText("Urgency & Scarcity")).toBeTruthy();
    expect(screen.getByText("Call to Action")).toBeTruthy();
    expect(screen.getByText("Email Recovery")).toBeTruthy();
  });
});

