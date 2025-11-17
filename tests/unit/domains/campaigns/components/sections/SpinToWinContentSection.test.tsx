import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { SpinToWinContentSection } from "~/domains/campaigns/components/sections/SpinToWinContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("SpinToWinContentSection", () => {
  it("initializes default wheelSegments when content has no segments", async () => {
    let latest: any = {};
    const onChange = vi.fn((partial: any) => {
      latest = { ...latest, ...partial };
    });

    renderWithPolaris(
      <SpinToWinContentSection content={{}} errors={{}} onChange={onChange} />, 
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(Array.isArray(latest.wheelSegments)).toBe(true);
    expect(latest.wheelSegments.length).toBeGreaterThan(0);
    expect(latest.wheelSegments[0]).toEqual(
      expect.objectContaining({
        label: "5% OFF",
        discountType: "percentage",
      }),
    );
  });

});

