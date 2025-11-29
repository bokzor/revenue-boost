import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { AnnouncementContentSection } from "~/domains/campaigns/components/sections/AnnouncementContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("AnnouncementContentSection", () => {
  it("renders the announcement content form", () => {
    const { container } = renderWithPolaris(
      <AnnouncementContentSection
        content={{}}
        errors={{}}
        onChange={() => {}}
      />,
    );

    // Should render the form with headline field (uses custom s-text-field element)
    const headlineField = container.querySelector('s-text-field[name="content.headline"]');
    expect(headlineField).toBeTruthy();
  });
});

