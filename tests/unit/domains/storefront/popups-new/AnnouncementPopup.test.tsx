import React from "react";
import { describe, it, expect, vi } from "vitest";
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

    // The close button (×) is hidden on desktop via CSS media query but still in DOM.
    // Use querySelector to find by aria-label since findByRole respects visibility.
    const closeButton = document.querySelector(
      'button[aria-label="Close announcement"]',
    );
    expect(closeButton).not.toBeNull();

    fireEvent.click(closeButton!);

    expect(onClose).toHaveBeenCalled();
  });

	  // TODO: Fix this test - BannerPortal renders via portal so container.firstChild is null
  it.skip("supports gradient background colors by using backgroundImage style", () => {
	    const gradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
	    const config = createConfig({
	      colorScheme: "custom",
	      backgroundColor: gradient,
	    });

	    const { container } = render(
	      <AnnouncementPopup
	        config={config}
	        isVisible={true}
	        onClose={() => {}}
	      />,
	    );

	    const banner = container.firstChild as HTMLElement;
	    const style = banner.getAttribute("style") || "";
	    expect(style).toContain(`background-image: ${gradient}`);
	    expect(style).not.toContain("background-color: linear-gradient");
	  });
});

