import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { FlashSaleContentSection } from "~/domains/campaigns/components/sections/FlashSaleContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("FlashSaleContentSection", () => {
  it("enables countdown by default and shows default duration when content is empty", () => {
    const { container } = renderWithPolaris(
      <FlashSaleContentSection
        content={{}}
        onChange={() => {}}
      />,
    );

    const countdownCheckbox = container.querySelector(
      's-checkbox[name="content.showCountdown"]',
    );
    expect(countdownCheckbox).toBeTruthy();
    expect(countdownCheckbox?.getAttribute("checked")).toBe("true");

    const durationField = container.querySelector(
      's-text-field[name="content.countdownDuration"]',
    );
    expect(durationField).toBeTruthy();
    expect(durationField?.getAttribute("value")).toBe("3600");
  });
});

