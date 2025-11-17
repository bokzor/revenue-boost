import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { SocialProofContentSection } from "~/domains/campaigns/components/sections/SocialProofContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("SocialProofContentSection", () => {
  it("uses sane defaults for enabled notification types and position when content is empty", () => {
    const { container } = renderWithPolaris(
      <SocialProofContentSection
        content={{}}
        onChange={() => {}}
      />,
    );

    const purchaseCheckbox = container.querySelector(
      's-checkbox[name="content.enablePurchaseNotifications"]',
    );
    const visitorCheckbox = container.querySelector(
      's-checkbox[name="content.enableVisitorNotifications"]',
    );
    const reviewCheckbox = container.querySelector(
      's-checkbox[name="content.enableReviewNotifications"]',
    );

    expect(purchaseCheckbox?.getAttribute("checked")).toBe("true");
    expect(visitorCheckbox?.getAttribute("checked")).toBe("true");
    expect(reviewCheckbox?.getAttribute("checked")).toBe("false");

    const positionSelect = container.querySelector(
      's-select[name="content.cornerPosition"]',
    );
    expect(positionSelect).toBeTruthy();
    expect(positionSelect?.getAttribute("value")).toBe("bottom-left");
  });
});

