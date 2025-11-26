import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AppProvider } from "@shopify/polaris";
import en from "@shopify/polaris/locales/en.json";

// Mock the file upload hook
vi.mock("~/shared/hooks/useShopifyFileUpload", () => ({
  useShopifyFileUpload: () => ({
    uploadFile: vi.fn().mockResolvedValue("https://example.com/image.jpg"),
    isUploading: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

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

