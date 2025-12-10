import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { TemplateTypeEnum } from "~/domains/campaigns/types/campaign";

function renderScratchCardPreview(overrides: Record<string, any> = {}) {
  const baseConfig: Record<string, any> = {
    headline: "Scratch & Win",
    subheadline: "Reveal your prize",
    prizes: [
      {
        id: "prize-10",
        label: "10% OFF",
        probability: 1,
        discountType: "percentage",
        discountValue: 10,
        discountCode: "SCRATCH10",
      },
    ],
    ...overrides,
  };

  return render(
    <TemplatePreview
      templateType={TemplateTypeEnum.SCRATCH_CARD}
      config={baseConfig}
      designConfig={{}}
    />,
  );
}

describe("TemplatePreview Scratch Card  email gate wiring", () => {
  it("shows email form before scratching when emailBeforeScratching is true", async () => {
    renderScratchCardPreview({
      emailRequired: true,
      emailBeforeScratching: true,
    });

    const emailInput = await screen.findByPlaceholderText(/enter your email/i);
    expect(emailInput).toBeTruthy();
  });

  it("does not show email form before scratching when emailBeforeScratching is false", async () => {
    renderScratchCardPreview({
      emailRequired: true,
      emailBeforeScratching: false,
    });

    await screen.findByText(/scratch & win/i);
    expect(screen.queryByPlaceholderText(/enter your email/i)).toBeNull();
  });

  it("submits email in preview without requiring a campaignId secure submission", async () => {
    renderScratchCardPreview({
      emailRequired: true,
      emailBeforeScratching: true,
      buttonText: "Unlock Scratch Card",
    });

    const emailInput = await screen.findByPlaceholderText(/enter your email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = await screen.findByRole("button", {
      name: /unlock scratch card/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/missing campaignid for secure submission/i)
      ).toBeNull();
    });
  });
});

