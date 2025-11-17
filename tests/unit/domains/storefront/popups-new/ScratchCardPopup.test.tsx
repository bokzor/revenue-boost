import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { ScratchCardPopup } from "~/domains/storefront/popups-new/ScratchCardPopup";

function createConfig(overrides: Partial<any> = {}) {
  const baseConfig: any = {
    id: "scratch-test",
    headline: "Scratch & Win",
    subheadline: "Reveal your prize",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    buttonColor: "#000000",
    buttonTextColor: "#ffffff",
    position: "center",
    size: "medium",
    overlayOpacity: 0.5,
    previewMode: true,
  };

  return { ...baseConfig, ...overrides };
}

describe("ScratchCardPopup", () => {
  it("renders headline when visible", async () => {
    const config = createConfig();

    render(
      <ScratchCardPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
      />,
    );

    expect(await screen.findByText(/scratch & win/i)).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const config = createConfig();

    render(
      <ScratchCardPopup
        config={config}
        isVisible={false}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText(/scratch & win/i)).toBeNull();
  });

  it("blocks scratch canvas init when email is required before scratching", async () => {
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype as any, "getContext")
      .mockReturnValue(null);

    const config = createConfig({ emailRequired: true, emailBeforeScratching: true });

    render(
      <ScratchCardPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
      />,
    );

    // Wait a tick for useEffect to run
    await waitFor(() => {
      expect(getContextSpy).not.toHaveBeenCalled();
    });

    getContextSpy.mockRestore();
  });

  it("allows scratch canvas init when email is optional but 'ask before scratching' is on", async () => {
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype as any, "getContext")
      .mockReturnValue(null);

    const config = createConfig({ emailRequired: false, emailBeforeScratching: true });

    render(
      <ScratchCardPopup
        config={config}
        isVisible={true}
        onClose={() => {}}
      />,
    );

    await waitFor(() => {
      expect(getContextSpy).toHaveBeenCalled();
    });

    getContextSpy.mockRestore();
  });

});

