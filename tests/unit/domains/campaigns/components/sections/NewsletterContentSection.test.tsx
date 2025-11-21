import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

import { NewsletterContentSection } from "~/domains/campaigns/components/sections/NewsletterContentSection";

function renderWithPolaris(ui: React.ReactNode) {
  return render(<AppProvider i18n={en}>{ui}</AppProvider>);
}

describe("NewsletterContentSection", () => {
  it("uses sane defaults for button text and emailRequired when content is empty", () => {
    const { container } = renderWithPolaris(
      <NewsletterContentSection
        content={{}}
        onChange={() => {}}
      />,
    );

    const buttonField = container.querySelector(
      's-text-field[name="content.buttonText"]',
    );
    expect(buttonField).toBeTruthy();
    expect(buttonField?.getAttribute("value")).toBe("Subscribe");

    const emailRequiredCheckbox = container.querySelector(
      's-checkbox[name="emailRequired"]',
    );
    expect(emailRequiredCheckbox).toBeTruthy();
    expect(emailRequiredCheckbox?.getAttribute("checked")).toBe("true");
  });
});

