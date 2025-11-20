import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { TemplateTypeEnum } from "~/lib/template-types.enum";

function renderCountdownPreview(overrides: Record<string, any> = {}) {
  const baseConfig: Record<string, any> = {
    headline: "Limited Time Offer",
    subheadline: "Hurry!",
    endTime: new Date(Date.now() + 3600_000).toISOString(),
    countdownDuration: 3600,
    ...overrides,
  };

  return render(
    <TemplatePreview
      templateType={TemplateTypeEnum.COUNTDOWN_TIMER}
      config={baseConfig}
      designConfig={{}}
    />,
  );
}

describe("TemplatePreview Countdown Timer  stock counter wiring", () => {
  it("shows stock counter when showStockCounter is true", async () => {
    renderCountdownPreview({
      showStockCounter: true,
      stockCount: 5,
    });

    const stockText = await screen.findByText(/Only 5 left in stock/i);
    expect(stockText).toBeTruthy();
  });

  it("hides stock counter when showStockCounter is false", async () => {
    renderCountdownPreview({
      showStockCounter: false,
      stockCount: 5,
    });

    await screen.findByText(/Limited Time Offer/i);
    expect(screen.queryByText(/Only 5 left in stock/i)).toBeNull();
  });

  it("constrains countdown banner to preview container (no fixed positioning)", () => {
    const { container } = renderCountdownPreview();

    const banner = container.querySelector(".countdown-banner") as HTMLElement | null;
    expect(banner).toBeTruthy();

    const style = banner?.getAttribute("style") || "";
    expect(style).toContain("position: absolute");
    expect(style).not.toContain("position: fixed");
  });
});

