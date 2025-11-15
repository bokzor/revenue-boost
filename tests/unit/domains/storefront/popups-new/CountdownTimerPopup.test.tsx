import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CountdownTimerPopup } from "~/domains/storefront/popups-new/CountdownTimerPopup";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    headline: "Hurry up!",
    subheadline: "Limited time offer",
    colorScheme: "urgent",
    ctaText: "Shop now",
    ctaOpenInNewTab: false,
    position: "top",
    sticky: false,
    showCloseButton: true,
    hideOnExpiry: false,
    backgroundColor: "#111827",
    textColor: "#ffffff",
    buttonColor: "#ffffff",
    buttonTextColor: "#111827",
    countdownDuration: 60,
  };

  return { ...baseConfig, ...overrides };
}

describe("CountdownTimerPopup", () => {
  it("renders headline and CTA button when visible", async () => {
    const config = createConfig();

    render(
      <CountdownTimerPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
      />,
    );

    expect(await screen.findByText(/hurry up!/i)).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /shop now/i,
      }),
    ).toBeTruthy();
  });
});

