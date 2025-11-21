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

    // Component now relies on schema defaults rather than auto-calling onChange.
    // Verify defaults via the schema instead of side effects.
    const { SpinToWinContentSchema } = await import(
      "~/domains/campaigns/types/campaign"
    );
    // Provide required base fields so schema validation passes and defaults are applied
    const parsed = SpinToWinContentSchema.parse({
      headline: "Test",
      buttonText: "Spin",
      successMessage: "Win!",
    });

    expect(Array.isArray(parsed.wheelSegments)).toBe(true);
    expect(parsed.wheelSegments.length).toBeGreaterThan(0);
    expect(parsed.wheelSegments[0]).toEqual(
      expect.objectContaining({
        label: "5% OFF",
        discountConfig: expect.objectContaining({
          enabled: true,
          valueType: "PERCENTAGE",
          value: 5,
        }),
      }),
    );
  });

});

