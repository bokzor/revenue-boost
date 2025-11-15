import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SpinToWinPopup } from "~/domains/storefront/popups-new/SpinToWinPopup";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "spin-test",
    headline: "Spin & Win",
    subheadline: "Try your luck",
    buttonText: "Spin",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    overlayOpacity: 0.5,
    previewMode: true,
    emailRequired: false,
  };

  return { ...baseConfig, ...overrides };
}

describe("SpinToWinPopup", () => {
  it("renders headline when visible", async () => {
    const config = createConfig();

    render(
      <SpinToWinPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
      />,
    );

    expect(await screen.findByText(/spin & win/i)).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const config = createConfig();

    render(
      <SpinToWinPopup
        config={config}
        isVisible={false}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText(/spin & win/i)).toBeNull();
  });
});

