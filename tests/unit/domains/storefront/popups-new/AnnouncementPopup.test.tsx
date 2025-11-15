import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { AnnouncementPopup } from "~/domains/storefront/popups-new/AnnouncementPopup";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    headline: "Big announcement",
    subheadline: "Important update",
    icon: "525",
    position: "top",
    sticky: false,
    colorScheme: "info",
    ctaText: "Learn more",
    ctaOpenInNewTab: false,
    backgroundColor: "#2563EB",
    textColor: "#FFFFFF",
    buttonColor: "#FFFFFF",
    buttonTextColor: "#2563EB",
    borderRadius: 6,
  };

  return { ...baseConfig, ...overrides };
}

describe("AnnouncementPopup", () => {
  it("renders headline and CTA button when visible", async () => {
    const config = createConfig();

    render(
      <AnnouncementPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
      />,
    );

    expect(await screen.findByText(/big announcement/i)).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: /learn more/i,
      }),
    ).toBeTruthy();
  });

  it("calls onClose when close button is clicked", async () => {
    const config = createConfig();
    const onClose = vi.fn();

    render(
      <AnnouncementPopup
        config={config}
        isVisible={true}
        onClose={onClose}
      />,
    );

    const closeButton = await screen.findByRole("button", {
      name: /close announcement/i,
    });

    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });
});

