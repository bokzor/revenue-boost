import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { TemplateTypeEnum } from "~/domains/campaigns/types/campaign";

function renderFreeShippingPreview(overrides: Record<string, any> = {}) {
  const baseConfig: Record<string, any> = {
    threshold: 75,
    currency: "USD",
    previewCartTotal: 0,
    ...overrides,
  };

  return render(
    <TemplatePreview
      templateType={TemplateTypeEnum.FREE_SHIPPING}
      config={baseConfig}
      designConfig={{}}
    />,
  );
}

describe("TemplatePreview Free Shipping  preview cart total wiring", () => {
  it("shows empty message when cart total is 0", async () => {
    renderFreeShippingPreview({ previewCartTotal: 0 });

    const message = await screen.findByText(/Add items to unlock free shipping/i);
    expect(message).toBeTruthy();
  });

  it("shows progress message when cart total is below threshold", async () => {
    renderFreeShippingPreview({ previewCartTotal: 50, threshold: 75 });

    const message = await screen.findByText(/You're USD25.00 away from free shipping/i);
    expect(message).toBeTruthy();
  });

  it("shows unlocked message when cart total meets threshold", async () => {
    renderFreeShippingPreview({ previewCartTotal: 80, threshold: 75 });

    const message = await screen.findByText(/You've unlocked free shipping/i);
    expect(message).toBeTruthy();
  });
});

