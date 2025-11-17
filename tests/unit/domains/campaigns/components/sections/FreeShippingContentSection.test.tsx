import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { FreeShippingContentSection } from "~/domains/campaigns/components/sections/FreeShippingContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("FreeShippingContentSection", () => {
  it("normalizes barPosition to 'top' when missing and persists via onChange", async () => {
    let latest: any = {};
    const onChange = vi.fn((partial: any) => {
      latest = { ...latest, ...partial };
    });

    renderWithPolaris(
      <FreeShippingContentSection content={{}} onChange={onChange} />,
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(latest.barPosition).toBe("top");
  });
});

