import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { ScratchCardContentSection } from "~/domains/campaigns/components/sections/ScratchCardContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("ScratchCardContentSection", () => {
  it("initializes default prizes when content has no prizes", async () => {
    let latest: any = {};
    const onChange = vi.fn((partial: any) => {
      latest = { ...latest, ...partial };
    });

    renderWithPolaris(
      <ScratchCardContentSection content={{}} errors={{}} onChange={onChange} />,
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(Array.isArray(latest.prizes)).toBe(true);
    expect(latest.prizes.length).toBeGreaterThan(0);
    expect(latest.prizes[0]).toEqual(
      expect.objectContaining({
        label: "5% OFF",
        discountPercentage: 5,
      }),
    );
  });

});

