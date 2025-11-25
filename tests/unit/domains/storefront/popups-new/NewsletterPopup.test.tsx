import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { NewsletterPopup } from "~/domains/storefront/popups-new/NewsletterPopup";

function renderPopup(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "nl-test",
    headline: "Join Our Newsletter",
    subheadline: "Stay updated",
    submitButtonText: "Subscribe now",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    overlayOpacity: 0.5,
    position: "center",
    size: "medium",
    emailRequired: true,
    previewMode: true,
  };

  const config = {
    ...baseConfig,
    ...overrides,
  };

  return render(
    <NewsletterPopup
      config={config}
      isVisible={true}
      onClose={() => {}}
    />,
  );
}

describe("NewsletterPopup", () => {
  it("renders headline and email field when visible", async () => {
    renderPopup();

    expect(await screen.findByText(/join our newsletter/i)).toBeTruthy();
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    expect(emailInput).toBeTruthy();
  });

  it("shows validation error when submitting without email", async () => {
    renderPopup();

    const submitButton = await screen.findByRole("button", {
      name: /subscribe now/i,
    });

    const form = submitButton.closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    expect(await screen.findByText(/email is required/i)).toBeTruthy();
  });
});

