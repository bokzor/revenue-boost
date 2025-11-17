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
  it("uses 'custom' color scheme by default when content is empty", () => {
    const { container } = renderWithPolaris(
      <AnnouncementContentSection
        content={{}}
        errors={{}}
        onChange={() => {}}
      />,
    );

    const colorSchemeSelect = container.querySelector(
      's-select[name="content.colorScheme"]',
    );
    expect(colorSchemeSelect).toBeTruthy();
    expect(colorSchemeSelect?.getAttribute("value")).toBe("custom");
  });
});

