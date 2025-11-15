import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { TemplateTypeEnum } from "~/lib/template-types.enum";

function renderSpinToWinPreview(overrides: Record<string, any> = {}) {
  const baseConfig: Record<string, any> = {
    headline: "Spin to Win!",
    subheadline: "Try your luck",
    wheelSegments: [
      {
        id: "prize-10",
        label: "10% OFF",
        probability: 1,
        discountType: "percentage",
        discountValue: 10,
        discountCode: "SPIN10",
      },
    ],
    ...overrides,
  };

  return render(
    <TemplatePreview
      templateType={TemplateTypeEnum.SPIN_TO_WIN}
      config={baseConfig}
      designConfig={{}}
    />,
  );
}

describe("TemplatePreview Spin-to-Win  emailRequired wiring", () => {
  it("shows email input when emailRequired is true", async () => {
    renderSpinToWinPreview({
      emailRequired: true,
    });

    const emailInput = await screen.findByPlaceholderText(/enter your email/i);
    expect(emailInput).toBeTruthy();
  });

  it("hides email input when emailRequired is false", async () => {
    renderSpinToWinPreview({
      emailRequired: false,
    });

    // Popup rendered (sanity)
    await screen.findByRole("dialog", { name: /spin to win/i });

    expect(screen.queryByPlaceholderText(/enter your email/i)).toBeNull();
  });
});

