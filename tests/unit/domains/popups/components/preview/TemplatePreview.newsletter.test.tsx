import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { TemplatePreview } from "~/domains/popups/components/preview/TemplatePreview";
import { TemplateTypeEnum } from "~/domains/campaigns/types/campaign";

function renderNewsletterPreview(overrides: Record<string, any> = {}) {
  const baseConfig: Record<string, any> = {
    headline: "Join Our Newsletter",
    subheadline: "Stay updated",
    ...overrides,
  };

  return render(
    <TemplatePreview
      templateType={TemplateTypeEnum.NEWSLETTER}
      config={baseConfig}
      designConfig={{}}
    />,
  );
}

describe("TemplatePreview Newsletter  consent field wiring", () => {
  it("shows GDPR consent checkbox when consentFieldEnabled is true", async () => {
    renderNewsletterPreview({
      consentFieldEnabled: true,
      consentFieldText: "I agree to marketing terms",
    });

    const consentLabel = await screen.findByText(/marketing terms/i);
    expect(consentLabel).toBeTruthy();
  });

  it("hides GDPR consent checkbox when consentFieldEnabled is false", async () => {
    renderNewsletterPreview({
      consentFieldEnabled: false,
      consentFieldText: "I agree to marketing terms",
    });

    // Popup rendered (sanity)
    await screen.findByText(/join our newsletter/i);

    expect(screen.queryByText(/marketing terms/i)).toBeNull();
  });
});

